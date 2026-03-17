// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canManageStudentLifecycleAccess } from '@/lib/permissions';

// GET /api/students/exit?class=10&section=A  → preview students eligible for exit
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!canManageStudentLifecycleAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cls = searchParams.get('class');
    const section = searchParams.get('section');
    const studentIds = searchParams.get('studentIds');

    const where: any = { ...tenantWhere(ctx), status: 'active' };
    if (cls) where.class = cls;
    if (section) where.section = section;
    if (studentIds) where.id = { in: studentIds.split(',') };

    const students = await schoolPrisma.student.findMany({
      where,
      select: {
        id: true, name: true, admissionNo: true, class: true,
        section: true, academicYear: true, status: true,
        feeRecords: {
          select: { amount: true, paidAmount: true, discount: true, status: true },
        },
        arrears: {
          where: { status: { not: 'paid' } },
          select: { amount: true, paidAmount: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = students.map(s => {
      const feeTotal = s.feeRecords.reduce((sum, f) => sum + (f.amount || 0), 0);
      const feePaid = s.feeRecords.reduce((sum, f) => sum + (f.paidAmount || 0) + (f.discount || 0), 0);
      const arrearsTotal = s.arrears.reduce((sum, a) => sum + (a.amount || 0) - (a.paidAmount || 0), 0);
      const pendingDues = Math.max(0, feeTotal - feePaid) + Math.max(0, arrearsTotal);
      return {
        id: s.id,
        name: s.name,
        admissionNo: s.admissionNo,
        class: s.class,
        section: s.section,
        academicYear: s.academicYear,
        status: s.status,
        pendingDues,
        canExit: true,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length,
      totalDues: result.reduce((sum, s) => sum + s.pendingDues, 0),
    });
  } catch (error: any) {
    console.error('GET /api/students/exit:', error);
    return NextResponse.json({ error: 'Failed to fetch students for exit preview' }, { status: 500 });
  }
}

// POST /api/students/exit → process student exit
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!canManageStudentLifecycleAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      studentIds,
      exitReason,
      exitDate,
      tcNumber,
      exitRemarks,
      feeAction,
    } = body;

    if (!studentIds?.length) {
      return NextResponse.json({ error: 'studentIds is required' }, { status: 400 });
    }
    if (!exitReason) {
      return NextResponse.json({ error: 'exitReason is required' }, { status: 400 });
    }
    if (!exitDate) {
      return NextResponse.json({ error: 'exitDate is required' }, { status: 400 });
    }

    const statusMapping: Record<string, string> = {
      graduated: 'graduated',
      transferred: 'transferred',
      withdrawn: 'exit',
      expelled: 'exit',
      suspended: 'suspended',
    };

    const newStatus = statusMapping[exitReason] || 'exit';
    const processed: any[] = [];
    const failed: any[] = [];

    for (const studentId of studentIds) {
      try {
        const student = await schoolPrisma.student.findFirst({
          where: { id: studentId, ...tenantWhere(ctx) },
          include: {
            feeRecords: { select: { id: true, amount: true, paidAmount: true, discount: true, status: true } },
            arrears: { where: { status: { not: 'paid' } }, select: { id: true, amount: true, paidAmount: true } },
          },
        });

        if (!student) {
          failed.push({ studentId, reason: 'Student not found' });
          continue;
        }

        const feeTotal = student.feeRecords.reduce((sum, f) => sum + (f.amount || 0), 0);
        const feePaid = student.feeRecords.reduce((sum, f) => sum + (f.paidAmount || 0) + (f.discount || 0), 0);
        const arrearsTotal = student.arrears.reduce((sum, a) => sum + (a.amount || 0) - (a.paidAmount || 0), 0);
        const pendingDues = Math.max(0, feeTotal - feePaid) + Math.max(0, arrearsTotal);

        if (feeAction === 'write_off' && pendingDues > 0) {
          await schoolPrisma.feeRecord.updateMany({
            where: { studentId, status: { not: 'paid' } },
            data: { status: 'waived' },
          });
          await schoolPrisma.feeArrears.updateMany({
            where: { studentId, status: { not: 'paid' } },
            data: { status: 'waived' },
          });
        } else if (feeAction === 'create_arrears' && pendingDues > 0) {
          const firstUnpaidFee = student.feeRecords.find(f => f.status !== 'paid');
          if (firstUnpaidFee) {
            await schoolPrisma.feeArrears.create({
              data: {
                schoolId: ctx.schoolId!,
                studentId,
                originalFeeRecordId: firstUnpaidFee.id,
                amount: pendingDues,
                paidAmount: 0,
                pendingAmount: pendingDues,
                fromAcademicYear: student.academicYear,
                toAcademicYear: student.academicYear,
                dueDate: exitDate,
                status: 'pending',
                remarks: `Exit arrears — ${exitReason} on ${exitDate}`,
              },
            });
          }
        }

        await schoolPrisma.student.update({
          where: { id: studentId },
          data: {
            status: newStatus,
            exitDate,
            exitReason,
            tcNumber: tcNumber || null,
            exitRemarks: exitRemarks || null,
          },
        });

        processed.push({
          studentId,
          studentName: student.name,
          exitReason,
          pendingDues,
          status: newStatus,
        });
      } catch (err: any) {
        console.error(`Failed to exit student ${studentId}:`, err);
        failed.push({ studentId, reason: err.message || 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalRequested: studentIds.length,
        processed: processed.length,
        failed: failed.length,
        processedStudents: processed,
        failedStudents: failed,
      },
      message: `${processed.length} student(s) exited successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}.`,
    });
  } catch (error: any) {
    console.error('POST /api/students/exit:', error);
    return NextResponse.json({ error: 'Failed to process student exit' }, { status: 500 });
  }
}
