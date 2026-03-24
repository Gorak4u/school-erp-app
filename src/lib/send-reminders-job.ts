import crypto from 'crypto';
import { createCronJobResult } from '@/lib/cron/job-contract';
import { sendSchoolEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { schoolPrisma } from '@/lib/prisma';

const FEE_BATCH_SIZE = 250;
const STUDENT_BATCH_SIZE = 250;
const MAX_DURATION_MS = 10 * 60 * 1000;
const FEE_LOOKAHEAD_DAYS = 7;
const ATTENDANCE_LOOKBACK_DAYS = 30;
const ATTENDANCE_MIN_RECORDS = 10;
const ATTENDANCE_THRESHOLD = 75;
const STALE_DISPATCH_LEASE_MS = 30 * 60 * 1000;

type ReminderStats = {
  feeStudents: number;
  feeRecipientsAttempted: number;
  feeSent: number;
  feeFailed: number;
  feeSkipped: number;
  attendanceStudents: number;
  attendanceRecipientsAttempted: number;
  attendanceSent: number;
  attendanceFailed: number;
  attendanceSkipped: number;
  errors: number;
};

type StudentContact = {
  id: string;
  name: string;
  schoolId: string | null;
  email: string | null;
  fatherEmail: string | null;
  motherEmail: string | null;
  parentEmail: string | null;
};

type FeeRecordRow = {
  id: string;
  studentId: string;
  amount: number;
  paidAmount: number;
  discount: number;
  pendingAmount: number;
  dueDate: string;
  status: string;
  feeStructure: { name: string | null; category: string | null } | null;
  student: StudentContact | null;
};

type FeeGroup = {
  student: StudentContact;
  fees: FeeRecordRow[];
};

type EmailResult = {
  success: boolean;
  skipped?: boolean;
  devMode?: boolean;
  error?: string;
  reason?: string;
};

function nowIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function deadlineExceeded(deadline: number) {
  return Date.now() >= deadline;
}

function normalizeEmails(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const email = (value || '').trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(email);
  }

  return result;
}

function formatMoney(amount: number) {
  return `₹${Math.max(0, amount).toLocaleString('en-IN')}`;
}

function getOutstandingAmount(fee: {
  amount?: number | null;
  paidAmount?: number | null;
  discount?: number | null;
  pendingAmount?: number | null;
}) {
  if (typeof fee.pendingAmount === 'number') {
    return Math.max(0, fee.pendingAmount);
  }

  return Math.max(0, Number(fee.amount || 0) - Number(fee.paidAmount || 0) - Number(fee.discount || 0));
}

function hashParts(parts: Array<string | number | null | undefined>) {
  const value = parts
    .map((part) => (part === null || part === undefined ? '' : String(part)))
    .join('|');
  return crypto.createHash('sha1').update(value).digest('hex');
}

function buildFeeReminderSubject(studentName: string, fees: FeeRecordRow[], totalDue: number, overdueCount: number) {
  const prefix = overdueCount > 0 ? 'Overdue Fee Reminder' : 'Fee Reminder';
  return `${prefix} – ${studentName} (${fees.length} pending, ${formatMoney(totalDue)})`;
}

function buildFeeReminderHtml(studentName: string, fees: FeeRecordRow[]) {
  const sortedFees = [...fees].sort((a, b) => {
    const dueCompare = a.dueDate.localeCompare(b.dueDate);
    if (dueCompare !== 0) return dueCompare;
    return a.id.localeCompare(b.id);
  });

  const totalDue = sortedFees.reduce((sum, fee) => sum + getOutstandingAmount(fee), 0);
  const overdueCount = sortedFees.filter((fee) => fee.dueDate < nowIsoDate()).length;
  const dueSoonCount = sortedFees.length - overdueCount;
  const statusText = overdueCount > 0 ? 'overdue fee(s)' : 'fee(s) due soon';

  const rows = sortedFees
    .map((fee) => {
      const original = Number(fee.amount || 0);
      const paid = Number(fee.paidAmount || 0);
      const discount = Number(fee.discount || 0);
      const outstanding = getOutstandingAmount(fee);
      const isOverdue = fee.dueDate < nowIsoDate();
      const dueLabel = isOverdue ? 'Overdue' : 'Due Soon';

      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b">
          <div style="font-weight:600">${fee.feeStructure?.name ?? 'Fee'}</div>
          <div style="font-size:12px;color:#64748b">${fee.feeStructure?.category ?? 'general'} · ${dueLabel}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;text-align:center">${fee.dueDate}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;color:#dc2626;text-align:right">
          ${paid > 0 || discount > 0 ? `<span style="color:#94a3b8;font-weight:400">Total ${formatMoney(original)}${paid > 0 ? ` • Paid ${formatMoney(paid)}` : ''}${discount > 0 ? ` • Discount ${formatMoney(discount)}` : ''}</span><br>` : ''}${formatMoney(outstanding)}
        </td>
      </tr>`;
    })
    .join('');

  const summaryLine = overdueCount > 0
    ? `${overdueCount} overdue and ${dueSoonCount} upcoming fee record(s)`
    : `${dueSoonCount} upcoming fee record(s)`;

  return {
    totalDue,
    overdueCount,
    html: `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#0f172a;color:white;padding:24px;border-radius:16px 16px 0 0;">
        <div style="font-size:13px;opacity:.8;margin-bottom:8px;">School Fee Reminder</div>
        <h1 style="margin:0;font-size:24px;">${studentName}</h1>
        <p style="margin:12px 0 0;color:#cbd5e1;">${summaryLine}</p>
      </div>
      <div style="background:white;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 16px 16px;">
        <p style="margin:0 0 16px;color:#475569;">Dear Parent/Guardian,</p>
        <p style="margin:0 0 20px;color:#64748b;line-height:1.6;">
          This is a reminder that <strong style="color:#1e293b">${studentName}</strong> has <strong style="color:#dc2626">${fees.length} ${statusText}</strong> requiring payment.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#475569;">Fee Type</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px;color:#475569;">Due Date</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#475569;">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#0f172a;">
              <td colspan="2" style="padding:12px;color:white;font-weight:600;">Total Due</td>
              <td style="padding:12px;color:white;font-weight:700;font-size:16px;text-align:right;">${formatMoney(totalDue)}</td>
            </tr>
          </tfoot>
        </table>
        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
          Please contact the school office if you need payment assistance or a clarification of the dues.
        </p>
        <p style="margin:20px 0 0;color:#475569;font-size:14px;">Best regards,<br><strong>School Administration</strong></p>
      </div>
    </div>
  </body>
</html>`,
  };
}

function buildAttendanceEmail(name: string, present: number, total: number, rate: number) {
  const color = rate < 50 ? '#dc2626' : '#f59e0b';
  const label = rate < 50 ? 'Critical' : 'Below Average';

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:${color};color:white;padding:24px;border-radius:16px 16px 0 0;">
        <div style="font-size:13px;opacity:.85;margin-bottom:8px;">Attendance Alert</div>
        <h1 style="margin:0;font-size:24px;">${name}</h1>
        <p style="margin:12px 0 0;color:#fff7ed;">${label} attendance over the last ${ATTENDANCE_LOOKBACK_DAYS} days</p>
      </div>
      <div style="background:white;border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 16px 16px;">
        <p style="margin:0 0 16px;color:#475569;">Dear Parent/Guardian,</p>
        <p style="margin:0 0 20px;color:#64748b;line-height:1.6;">
          <strong style="color:#1e293b">${name}</strong>'s attendance for the last ${ATTENDANCE_LOOKBACK_DAYS} days is <strong style="color:${color}">${rate.toFixed(1)}%</strong>.
        </p>
        <div style="background:#f8fafc;padding:16px;border-radius:12px;margin:16px 0;text-align:center;">
          <span style="font-size:32px;font-weight:700;color:${color}">${rate.toFixed(0)}%</span><br>
          <span style="color:#64748b;font-size:14px">${present} present out of ${total} days</span>
        </div>
        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
          Regular attendance is essential for academic progress. Please contact the school if you need assistance.
        </p>
        <p style="margin:20px 0 0;color:#475569;font-size:14px;">Best regards,<br><strong>School Administration</strong></p>
      </div>
    </div>
  </body>
</html>`;
}

async function registerDispatchAttempt(params: {
  channel: string;
  dedupeKey: string;
  schoolId: string | null;
  recipientAddress: string;
  templateKey: string;
  payload: Record<string, unknown>;
}) {
  try {
    const existing = await (schoolPrisma as any).communicationOutbox.findFirst({
      where: {
        channel: params.channel,
        dedupeKey: params.dedupeKey,
      },
      select: {
        id: true,
        status: true,
        attemptCount: true,
        updatedAt: true,
      },
    });

    if (existing?.status === 'sent') {
      return { logId: null, attemptCount: existing.attemptCount || 0, skip: true, reason: 'already_sent' };
    }

    if (existing?.status === 'processing') {
      const isStale = Date.now() - new Date(existing.updatedAt).getTime() > STALE_DISPATCH_LEASE_MS;
      if (!isStale) {
        return { logId: null, attemptCount: existing.attemptCount || 0, skip: true, reason: 'already_processing' };
      }

      logger.warn('Taking over stale reminder dispatch lease', {
        channel: params.channel,
        dedupeKey: params.dedupeKey,
        staleForMs: Date.now() - new Date(existing.updatedAt).getTime(),
      });
    }

    if (existing?.status === 'processing' && Date.now() - new Date(existing.updatedAt).getTime() <= STALE_DISPATCH_LEASE_MS) {
      return { logId: null, attemptCount: existing.attemptCount || 0, skip: true, reason: 'already_processing' };
    }

    const data = {
      schoolId: params.schoolId,
      channel: params.channel,
      templateKey: params.templateKey,
      recipientUserId: null,
      recipientAddress: params.recipientAddress,
      payloadJson: JSON.stringify(params.payload),
      dedupeKey: params.dedupeKey,
      status: 'processing',
      attemptCount: existing?.attemptCount || 0,
      nextAttemptAt: null,
      lastError: null,
    };

    if (existing) {
      await (schoolPrisma as any).communicationOutbox.update({
        where: { id: existing.id },
        data,
      });
      return { logId: existing.id, attemptCount: existing.attemptCount || 0, skip: false };
    }

    const created = await (schoolPrisma as any).communicationOutbox.create({
      data,
    });
    return { logId: created.id, attemptCount: created.attemptCount || 0, skip: false };
  } catch (error) {
    logger.warn('Reminder dispatch ledger unavailable', {
      error,
      channel: params.channel,
      dedupeKey: params.dedupeKey,
      schoolId: params.schoolId,
      recipientAddress: params.recipientAddress,
    });
    return { logId: null, attemptCount: 0, skip: false };
  }
}

async function finalizeDispatchAttempt(params: {
  logId: string | null;
  attemptCount: number;
  status: 'sent' | 'failed' | 'skipped';
  errorMessage?: string | null;
}) {
  if (!params.logId) return;

  try {
    await (schoolPrisma as any).communicationOutbox.update({
      where: { id: params.logId },
      data: {
        status: params.status,
        attemptCount: params.attemptCount + 1,
        nextAttemptAt: null,
        lastError: params.errorMessage || null,
      },
    });
  } catch (error) {
    logger.warn('Failed to finalize reminder dispatch ledger', {
      error,
      logId: params.logId,
      status: params.status,
      errorMessage: params.errorMessage,
    });
  }
}

async function sendLoggedEmail(params: {
  channel: string;
  dedupeKey: string;
  schoolId: string | null;
  recipientAddress: string;
  templateKey: string;
  subject: string;
  html: string;
  payload: Record<string, unknown>;
}) {
  const lease = await registerDispatchAttempt({
    channel: params.channel,
    dedupeKey: params.dedupeKey,
    schoolId: params.schoolId,
    recipientAddress: params.recipientAddress,
    templateKey: params.templateKey,
    payload: params.payload,
  });

  if (lease.skip) {
    return { status: 'skipped' as const, reason: lease.reason || 'deduped' };
  }

  try {
    const result = (await sendSchoolEmail({
      to: params.recipientAddress,
      subject: params.subject,
      html: params.html,
      schoolId: params.schoolId || undefined,
    })) as EmailResult;

    if (result.skipped) {
      await finalizeDispatchAttempt({
        logId: lease.logId,
        attemptCount: lease.attemptCount,
        status: 'skipped',
        errorMessage: result.reason || 'Email notifications disabled',
      });
      return { status: 'skipped' as const, reason: result.reason || 'Email notifications disabled' };
    }

    if (result.devMode) {
      await finalizeDispatchAttempt({
        logId: lease.logId,
        attemptCount: lease.attemptCount,
        status: 'failed',
        errorMessage: 'School SMTP is not configured',
      });
      return { status: 'failed' as const, error: 'School SMTP is not configured' };
    }

    if (!result.success) {
      await finalizeDispatchAttempt({
        logId: lease.logId,
        attemptCount: lease.attemptCount,
        status: 'failed',
        errorMessage: result.error || 'Email delivery failed',
      });
      return { status: 'failed' as const, error: result.error || 'Email delivery failed' };
    }

    await finalizeDispatchAttempt({
      logId: lease.logId,
      attemptCount: lease.attemptCount,
      status: 'sent',
    });
    return { status: 'sent' as const };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown email delivery error';
    await finalizeDispatchAttempt({
      logId: lease.logId,
      attemptCount: lease.attemptCount,
      status: 'failed',
      errorMessage,
    });
    return { status: 'failed' as const, error: errorMessage };
  }
}

function recipientList(student: StudentContact) {
  return normalizeEmails([student.email, student.fatherEmail, student.motherEmail, student.parentEmail]);
}

async function flushFeeGroup(group: FeeGroup, deadline: number, runDate: string, stats: ReminderStats) {
  if (deadlineExceeded(deadline)) return false;

  stats.feeStudents += 1;

  const recipients = recipientList(group.student);
  if (!recipients.length) {
    stats.feeSkipped += 1;
    logger.warn('Fee reminder skipped: no recipient emails found', {
      studentId: group.student.id,
      studentName: group.student.name,
      schoolId: group.student.schoolId,
    });
    return true;
  }

  const { totalDue, overdueCount, html } = buildFeeReminderHtml(group.student.name, group.fees);
  const subject = buildFeeReminderSubject(group.student.name, group.fees, totalDue, overdueCount);
  const feeSignature = hashParts(group.fees.map((fee) => `${fee.id}:${fee.pendingAmount}:${fee.dueDate}`));

  for (const recipient of recipients) {
    if (deadlineExceeded(deadline)) return false;

    stats.feeRecipientsAttempted += 1;
    const result = await sendLoggedEmail({
      channel: 'fee_reminder_direct',
      dedupeKey: `fee-reminder:${runDate}:${group.student.id}:${recipient.toLowerCase()}:${feeSignature}`,
      schoolId: group.student.schoolId,
      recipientAddress: recipient,
      templateKey: 'fee_reminder',
      subject,
      html,
      payload: {
        kind: 'fee_reminder',
        studentId: group.student.id,
        studentName: group.student.name,
        schoolId: group.student.schoolId,
        runDate,
        totalDue,
        overdueCount,
        feeCount: group.fees.length,
        recipient,
        feeIds: group.fees.map((fee) => fee.id),
      },
    });

    if (result.status === 'sent') stats.feeSent += 1;
    else if (result.status === 'skipped') stats.feeSkipped += 1;
    else stats.feeFailed += 1;
  }

  return true;
}

async function processFeeReminders(deadline: number, stats: ReminderStats) {
  const runDate = nowIsoDate();
  const cutoffDate = new Date(Date.now() + FEE_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  let cursor: string | undefined;
  let currentGroup: FeeGroup | null = null;

  while (!deadlineExceeded(deadline)) {
    const batch = await (schoolPrisma as any).feeRecord.findMany({
      take: FEE_BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: {
        dueDate: { lte: cutoffDate },
        pendingAmount: { gt: 0 },
        status: { notIn: ['paid', 'waived'] },
      },
      orderBy: [{ studentId: 'asc' }, { dueDate: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        studentId: true,
        amount: true,
        paidAmount: true,
        discount: true,
        pendingAmount: true,
        dueDate: true,
        status: true,
        feeStructure: { select: { name: true, category: true } },
        student: {
          select: {
            id: true,
            name: true,
            schoolId: true,
            email: true,
            fatherEmail: true,
            motherEmail: true,
            parentEmail: true,
          },
        },
      },
    });

    if (!batch.length) break;

    for (const fee of batch as FeeRecordRow[]) {
      cursor = fee.id;
      if (!fee.student) continue;
      if (!fee.student.schoolId && !fee.student.email && !fee.student.fatherEmail && !fee.student.motherEmail && !fee.student.parentEmail) {
        continue;
      }

      if (!currentGroup) {
        currentGroup = { student: fee.student, fees: [fee] };
        continue;
      }

      if (currentGroup.student.id === fee.student.id) {
        currentGroup.fees.push(fee);
        continue;
      }

      const continued = await flushFeeGroup(currentGroup, deadline, runDate, stats);
      if (!continued) return;
      currentGroup = { student: fee.student, fees: [fee] };
    }

    if (batch.length < FEE_BATCH_SIZE) break;
  }

  if (currentGroup) {
    await flushFeeGroup(currentGroup, deadline, runDate, stats);
  }
}

async function processAttendanceAlerts(deadline: number, stats: ReminderStats) {
  const runDate = nowIsoDate();
  const thirtyDaysAgo = new Date(Date.now() - ATTENDANCE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  let cursor: string | undefined;

  while (!deadlineExceeded(deadline)) {
    const batch = await (schoolPrisma as any).student.findMany({
      take: STUDENT_BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: { status: 'active' },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        schoolId: true,
        email: true,
        fatherEmail: true,
        motherEmail: true,
        parentEmail: true,
      },
    });

    if (!batch.length) break;

    const studentIds = (batch as StudentContact[]).map((student) => student.id);
    const grouped = await (schoolPrisma as any).attendanceRecord.groupBy({
      by: ['studentId', 'status'],
      where: {
        studentId: { in: studentIds },
        date: { gte: thirtyDaysAgo },
      },
      _count: { status: true },
    });

    const attendanceMap = new Map<string, { total: number; present: number }>();
    for (const row of grouped) {
      if (!attendanceMap.has(row.studentId)) {
        attendanceMap.set(row.studentId, { total: 0, present: 0 });
      }
      const entry = attendanceMap.get(row.studentId)!;
      entry.total += row._count.status;
      if (row.status === 'present') {
        entry.present += row._count.status;
      }
    }

    for (const student of batch as StudentContact[]) {
      cursor = student.id;
      if (deadlineExceeded(deadline)) return;

      const attendance = attendanceMap.get(student.id);
      if (!attendance || attendance.total < ATTENDANCE_MIN_RECORDS) continue;

      const rate = (attendance.present / attendance.total) * 100;
      if (rate >= ATTENDANCE_THRESHOLD) continue;

      const recipients = recipientList(student);
      if (!recipients.length) {
        stats.attendanceSkipped += 1;
        logger.warn('Attendance alert skipped: no recipient emails found', {
          studentId: student.id,
          studentName: student.name,
          schoolId: student.schoolId,
        });
        continue;
      }

      stats.attendanceStudents += 1;
      const html = buildAttendanceEmail(student.name, attendance.present, attendance.total, rate);
      const subject = `Low Attendance Alert – ${student.name} (${rate.toFixed(0)}%)`;
      const attendanceSignature = hashParts([
        student.id,
        attendance.present,
        attendance.total,
        Math.round(rate),
      ]);

      for (const recipient of recipients) {
        if (deadlineExceeded(deadline)) return;
        stats.attendanceRecipientsAttempted += 1;

        const result = await sendLoggedEmail({
          channel: 'attendance_alert_direct',
          dedupeKey: `attendance-alert:${runDate}:${student.id}:${recipient.toLowerCase()}:${attendanceSignature}`,
          schoolId: student.schoolId,
          recipientAddress: recipient,
          templateKey: 'attendance_alert',
          subject,
          html,
          payload: {
            kind: 'attendance_alert',
            studentId: student.id,
            studentName: student.name,
            schoolId: student.schoolId,
            runDate,
            recipient,
            attendanceRate: rate,
            totalDays: attendance.total,
            presentDays: attendance.present,
          },
        });

        if (result.status === 'sent') stats.attendanceSent += 1;
        else if (result.status === 'skipped') stats.attendanceSkipped += 1;
        else stats.attendanceFailed += 1;
      }

    }

    if (batch.length < STUDENT_BATCH_SIZE) break;
  }
}

export async function runSendRemindersJob() {
  const deadline = Date.now() + MAX_DURATION_MS;
  const stats: ReminderStats = {
    feeStudents: 0,
    feeRecipientsAttempted: 0,
    feeSent: 0,
    feeFailed: 0,
    feeSkipped: 0,
    attendanceStudents: 0,
    attendanceRecipientsAttempted: 0,
    attendanceSent: 0,
    attendanceFailed: 0,
    attendanceSkipped: 0,
    errors: 0,
  };

  try {
    await processFeeReminders(deadline, stats);
  } catch (error) {
    stats.errors += 1;
    logger.error('Fee reminder job failed', { error });
  }

  try {
    await processAttendanceAlerts(deadline, stats);
  } catch (error) {
    stats.errors += 1;
    logger.error('Attendance alert job failed', { error });
  }

  const attempted = stats.feeRecipientsAttempted + stats.attendanceRecipientsAttempted;
  const delivered = stats.feeSent + stats.attendanceSent;
  const skipped = stats.feeSkipped + stats.attendanceSkipped;
  const failed = stats.feeFailed + stats.attendanceFailed;
  const success = stats.errors === 0 && failed === 0 && (delivered > 0 || attempted === 0);

  return createCronJobResult({
    success,
    jobName: 'send-reminders',
    scope: 'school',
    message: attempted === 0
      ? 'No reminder emails were due'
      : success
        ? `Delivered ${delivered} reminder email(s)`
        : 'No reminder emails were delivered',
    attempted,
    delivered,
    skipped,
    failed,
    stats: stats as unknown as Record<string, unknown>,
    processed: stats.feeSent + stats.feeSkipped + stats.feeFailed + stats.attendanceSent + stats.attendanceSkipped + stats.attendanceFailed,
    errors: success ? [] : ['One or more reminder emails failed or were skipped'],
  });
}
