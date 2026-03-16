// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;

    const student = await (schoolPrisma as any).student.findFirst({
      where: { id, ...tenantWhere(ctx) },
      select: { id: true, name: true, admissionNo: true }
    });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const arrears = await (schoolPrisma as any).feeArrears.findMany({
      where: { studentId: id, schoolId: ctx.schoolId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
    });

    const totalPending = arrears.reduce((sum: number, a: any) => sum + (a.pendingAmount || 0), 0);
    const totalPaid = arrears.reduce((sum: number, a: any) => sum + (a.paidAmount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        student,
        arrears,
        summary: {
          total: arrears.length,
          pending: arrears.filter((a: any) => a.status !== 'paid').length,
          totalPendingAmount: totalPending,
          totalPaidAmount: totalPaid
        }
      }
    });
  } catch (err: any) {
    console.error('GET /api/students/[id]/arrears:', err);
    return NextResponse.json({ error: 'Failed to fetch arrears' }, { status: 500 });
  }
}
