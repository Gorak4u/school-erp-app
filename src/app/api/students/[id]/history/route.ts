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
      select: { id: true, name: true, admissionNo: true, class: true, section: true, academicYear: true }
    });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const [promotions, arrears, feeRecords] = await Promise.all([
      (schoolPrisma as any).studentPromotion.findMany({
        where: { studentId: id, schoolId: ctx.schoolId },
        orderBy: { promotionDate: 'desc' }
      }),
      (schoolPrisma as any).feeArrears.findMany({
        where: { studentId: id, schoolId: ctx.schoolId },
        orderBy: { createdAt: 'desc' }
      }),
      (schoolPrisma as any).feeRecord.groupBy({
        by: ['academicYear'],
        where: { studentId: id },
        _sum: { amount: true, paidAmount: true },
        orderBy: { academicYear: 'desc' }
      })
    ]);

    const feeHistory = feeRecords.map((f: any) => ({
      academicYear: f.academicYear,
      totalFees: f._sum.amount || 0,
      paidFees: f._sum.paidAmount || 0,
      pendingFees: (f._sum.amount || 0) - (f._sum.paidAmount || 0)
    }));

    return NextResponse.json({
      success: true,
      data: {
        student,
        promotions,
        arrears,
        feeHistory,
        summary: {
          totalPromotions: promotions.length,
          currentClass: student.class,
          currentYear: student.academicYear,
          totalArrears: arrears.reduce((sum: number, a: any) => sum + (a.pendingAmount || 0), 0)
        }
      }
    });
  } catch (err: any) {
    console.error('GET /api/students/[id]/history:', err);
    return NextResponse.json({ error: 'Failed to fetch student history' }, { status: 500 });
  }
}
