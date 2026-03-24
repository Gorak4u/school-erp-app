import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { queueCommunicationOutbox } from '@/lib/communicationOutbox';

/**
 * Batch sizes – tuned for 10M-record scale
 * Processing is cursor-based so it never loads the whole table into memory.
 * Each batch yields control back to the event loop between iterations.
 */
const FEE_BATCH_SIZE = 500;
const STUDENT_BATCH_SIZE = 200;
const ATTENDANCE_BATCH_SIZE = 300;
const MAX_DURATION_MS = 10 * 60 * 1000; // Hard stop after 10 min

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Send Reminders - Cron Job Handler
 * Sends fee payment reminders and other notifications
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deadline = Date.now() + MAX_DURATION_MS;
  const stats = { feeReminders: 0, attendanceAlerts: 0, errors: 0 };

  // ── 1. Fee reminders ─────────────────────────────────────────────────────
  // Strategy: cursor-based pagination over FeeRecord sorted by id.
  // Fees are grouped per student so each student gets ONE consolidated email.
  try {
    const sevenDaysISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    let cursor: string | undefined;
    // Map studentId → {student, fees[]} built within each batch
    const studentFeeMap = new Map<string, { student: any; fees: any[] }>();

    outer: while (Date.now() < deadline) {
      const batch = await schoolPrisma.feeRecord.findMany({
        take: FEE_BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        where: { status: 'pending', dueDate: { lte: sevenDaysISO } },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          studentId: true,
          amount: true,
          discount: true,
          dueDate: true,
          feeStructure: { select: { name: true } },
          student: {
            select: {
              id: true, name: true, schoolId: true,
              email: true, fatherEmail: true, motherEmail: true,
            },
          },
        },
      });

      if (!batch.length) break;
      cursor = batch[batch.length - 1].id;

      for (const fee of batch) {
        if (!fee.student) continue;
        if (!studentFeeMap.has(fee.studentId)) {
          studentFeeMap.set(fee.studentId, { student: fee.student, fees: [] });
        }
        studentFeeMap.get(fee.studentId)!.fees.push(fee);
      }

      // Flush consolidated emails after each batch to avoid huge in-memory map
      if (batch.length < FEE_BATCH_SIZE) break; // last page reached

      // Flush & clear map every batch to keep memory bounded
      for (const [, entry] of studentFeeMap) {
        if (Date.now() >= deadline) break outer;
        await sendConsolidatedFeeEmail(entry.student, entry.fees);
        stats.feeReminders++;
      }
      studentFeeMap.clear();
      await sleep(50); // yield – avoid starving other async work
    }

    // Flush remaining
    for (const [, entry] of studentFeeMap) {
      if (Date.now() >= deadline) break;
      await sendConsolidatedFeeEmail(entry.student, entry.fees);
      stats.feeReminders++;
    }
  } catch (err) {
    console.error('[send-reminders] fee section error:', err);
    stats.errors++;
  }

  // ── 2. Low-attendance alerts ──────────────────────────────────────────────
  // Strategy: cursor over Student, compute attendance via aggregation query per student.
  try {
    const thirtyDaysISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    let cursor: string | undefined;

    while (Date.now() < deadline) {
      const batch = await schoolPrisma.student.findMany({
        take: STUDENT_BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        where: { status: 'active' },
        orderBy: { id: 'asc' },
        select: {
          id: true, name: true, schoolId: true,
          email: true, fatherEmail: true, motherEmail: true,
        },
      });

      if (!batch.length) break;
      cursor = batch[batch.length - 1].id;

      // Use groupBy per student to avoid N+1 per record
      const studentIds = batch.map((s: any) => s.id);
      const grouped = await schoolPrisma.attendanceRecord.groupBy({
        by: ['studentId', 'status'],
        where: { studentId: { in: studentIds }, date: { gte: thirtyDaysISO } },
        _count: { status: true },
      });

      // Build attendance map
      const attendanceMap = new Map<string, { total: number; present: number }>();
      for (const row of grouped) {
        if (!attendanceMap.has(row.studentId)) {
          attendanceMap.set(row.studentId, { total: 0, present: 0 });
        }
        const entry = attendanceMap.get(row.studentId)!;
        entry.total += row._count.status;
        if (row.status === 'present') entry.present += row._count.status;
      }

      for (const student of batch) {
        if (Date.now() >= deadline) break;
        const att = attendanceMap.get(student.id);
        if (!att || att.total < 10) continue;
        const rate = (att.present / att.total) * 100;
        if (rate >= 75) continue;

        const emails = [student.email, student.fatherEmail, student.motherEmail].filter(Boolean);
        for (const email of emails) {
          if (!email) continue;
          await queueCommunicationOutbox({
            email: {
              to: email,
              subject: `Low Attendance Alert – ${student.name} (${rate.toFixed(0)}%)`,
              html: buildAttendanceEmail(student.name, att.present, att.total, rate),
              schoolId: student.schoolId || undefined,
            },
          });
          stats.attendanceAlerts++;
        }
      }

      if (batch.length < STUDENT_BATCH_SIZE) break;
      await sleep(50);
    }
  } catch (err) {
    console.error('[send-reminders] attendance section error:', err);
    stats.errors++;
  }

  return NextResponse.json({
    success: true,
    processed: stats.feeReminders + stats.attendanceAlerts,
    stats,
    timestamp: new Date().toISOString(),
  });
}

// ─── Email builders ───────────────────────────────────────────────────────────

async function sendConsolidatedFeeEmail(student: any, fees: any[]) {
  const emails = [student.email, student.fatherEmail, student.motherEmail].filter(Boolean);
  if (!emails.length) return;

  const totalDue = fees.reduce((sum, f) => {
    return sum + Math.max(0, Number(f.amount) - Number(f.discount));
  }, 0);

  const rows = fees
    .map((f) => {
      const orig = Number(f.amount);
      const disc = Number(f.discount);
      const final = Math.max(0, orig - disc);
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b">${f.feeStructure?.name ?? 'Fee'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;text-align:center">${f.dueDate}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:#dc2626;text-align:right">
          ${disc > 0 ? `<s style="color:#94a3b8;font-weight:400">₹${orig}</s><br>` : ''}₹${final}
        </td>
      </tr>`;
    })
    .join('');

  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#1e293b;padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:white;margin:0;font-size:20px">💳 Fee Payment Reminder</h2>
  </div>
  <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
    <p style="color:#475569;margin:0 0 16px 0">Dear Parent/Guardian,</p>
    <p style="color:#64748b;margin:0 0 20px 0">
      This is a reminder that <strong style="color:#1e293b">${student.name}</strong> has <strong style="color:#dc2626">${fees.length} pending fee(s)</strong> due soon.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead><tr style="background:#f8fafc">
        <th style="padding:10px 12px;text-align:left;font-size:13px;color:#475569">Fee Type</th>
        <th style="padding:10px 12px;text-align:center;font-size:13px;color:#475569">Due Date</th>
        <th style="padding:10px 12px;text-align:right;font-size:13px;color:#475569">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr style="background:#1e293b">
        <td colspan="2" style="padding:12px;color:white;font-weight:600">Total Due</td>
        <td style="padding:12px;color:white;font-weight:700;font-size:16px;text-align:right">₹${totalDue}</td>
      </tr></tfoot>
    </table>
    <p style="color:#64748b;font-size:13px">Please contact the school office for payment assistance.</p>
    <p style="color:#475569;font-size:14px;margin-top:20px">Best regards,<br><strong>School Administration</strong></p>
  </div>
</div>`;

  for (const email of emails) {
    await queueCommunicationOutbox({
      email: { to: email, subject: `Fee Reminder – ${student.name} (${fees.length} pending)`, html, schoolId: student.schoolId || undefined },
    });
  }
}

function buildAttendanceEmail(name: string, present: number, total: number, rate: number) {
  const color = rate < 50 ? '#dc2626' : '#f59e0b';
  const label = rate < 50 ? 'Critical' : 'Below Average';
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:${color};padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:white;margin:0;font-size:20px">⚠️ Low Attendance Alert</h2>
  </div>
  <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
    <p style="color:#475569">Dear Parent/Guardian,</p>
    <p style="color:#64748b">
      <strong style="color:#1e293b">${name}</strong>'s attendance for the last 30 days is 
      <strong style="color:${color}">${rate.toFixed(1)}% (${label})</strong>.
    </p>
    <div style="background:#f8fafc;padding:16px;border-radius:6px;margin:16px 0;text-align:center">
      <span style="font-size:32px;font-weight:700;color:${color}">${rate.toFixed(0)}%</span><br>
      <span style="color:#64748b;font-size:14px">${present} present out of ${total} days</span>
    </div>
    <p style="color:#64748b;font-size:13px">Regular attendance is essential for academic progress. Please contact the school if you need assistance.</p>
    <p style="color:#475569;font-size:14px;margin-top:20px">Best regards,<br><strong>School Administration</strong></p>
  </div>
</div>`;
}
