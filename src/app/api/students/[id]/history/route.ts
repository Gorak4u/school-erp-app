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

    const [promotions, arrears, feeRecords, finesHistory] = await Promise.all([
      (schoolPrisma as any).StudentPromotion.findMany({
        where: { studentId: id, schoolId: ctx.schoolId },
        orderBy: { promotionDate: 'desc' }
      }),
      (schoolPrisma as any).FeeArrears.findMany({
        where: { studentId: id, schoolId: ctx.schoolId },
        orderBy: { createdAt: 'desc' }
      }),
      (schoolPrisma as any).FeeRecord.groupBy({
        by: ['academicYear'],
        where: { studentId: id },
        _sum: { amount: true, paidAmount: true },
        orderBy: { academicYear: 'desc' }
      }),
      // Add fines history grouped by academic year
      (schoolPrisma as any).Fine.groupBy({
        by: ['createdAt'], // Use createdAt as a proxy for academic year grouping
        where: { studentId: id, schoolId: ctx.schoolId },
        _sum: { amount: true, paidAmount: true, waivedAmount: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const feeHistory = feeRecords.map((f: any) => ({
      academicYear: f.academicYear,
      totalFees: f._sum.amount || 0,
      paidFees: f._sum.paidAmount || 0,
      pendingFees: (f._sum.amount || 0) - (f._sum.paidAmount || 0)
    }));

    // Process fines history
    const finesHistoryData = finesHistory.map((f: any) => ({
      period: new Date(f.createdAt).getFullYear(), // Group by year as proxy for academic year
      totalFines: f._sum.amount || 0,
      paidFines: f._sum.paidAmount || 0,
      waivedFines: f._sum.waivedAmount || 0,
      pendingFines: (f._sum.amount || 0) - (f._sum.paidAmount || 0) - (f._sum.waivedAmount || 0)
    }));

    // Calculate combined totals
    const totalRegularFees = feeHistory.reduce((sum, f) => sum + f.totalFees, 0);
    const totalFines = finesHistoryData.reduce((sum, f) => sum + f.totalFines, 0);
    const totalPaidRegularFees = feeHistory.reduce((sum, f) => sum + f.paidFees, 0);
    const totalPaidFines = finesHistoryData.reduce((sum, f) => sum + f.paidFines, 0);
    const totalPendingRegularFees = feeHistory.reduce((sum, f) => sum + f.pendingFees, 0);
    const totalPendingFines = finesHistoryData.reduce((sum, f) => sum + f.pendingFines, 0);

    return NextResponse.json({
      success: true,
      data: {
        student,
        promotions,
        arrears,
        feeHistory,
        finesHistory: finesHistoryData,
        summary: {
          totalPromotions: promotions.length,
          currentClass: student.class,
          currentYear: student.academicYear,
          totalArrears: arrears.reduce((sum: number, a: any) => sum + (a.pendingAmount || 0), 0),
          // Combined financial summary
          financialSummary: {
            regularFees: {
              total: totalRegularFees,
              paid: totalPaidRegularFees,
              pending: totalPendingRegularFees
            },
            fines: {
              total: totalFines,
              paid: totalPaidFines,
              pending: totalPendingFines,
              waived: finesHistoryData.reduce((sum, f) => sum + f.waivedFines, 0)
            },
            combined: {
              total: totalRegularFees + totalFines,
              paid: totalPaidRegularFees + totalPaidFines,
              pending: totalPendingRegularFees + totalPendingFines
            }
          }
        }
      }
    });
  } catch (err: any) {
    console.error('GET /api/students/[id]/history:', err);
    return NextResponse.json({ error: 'Failed to fetch student history' }, { status: 500 });
  }
}
