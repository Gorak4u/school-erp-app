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

    const [arrears, pendingFines] = await Promise.all([
      (schoolPrisma as any).FeeArrears.findMany({
        where: { studentId: id, schoolId: ctx.schoolId },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
      }),
      // Add pending fines to arrears calculation
      (schoolPrisma as any).Fine.findMany({
        where: { 
          studentId: id, 
          schoolId: ctx.schoolId,
          pendingAmount: { gt: 0 } // Only include unpaid fines
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const totalPendingArrears = arrears.reduce((sum: number, a: any) => sum + (a.pendingAmount || 0), 0);
    const totalPaidArrears = arrears.reduce((sum: number, a: any) => sum + (a.paidAmount || 0), 0);
    const totalPendingFines = pendingFines.reduce((sum: number, f: any) => sum + (f.pendingAmount || 0), 0);
    const totalPaidFines = pendingFines.reduce((sum: number, f: any) => sum + (f.paidAmount || 0), 0);

    // Combine arrears and pending fines
    const totalCombinedPending = totalPendingArrears + totalPendingFines;
    const totalCombinedPaid = totalPaidArrears + totalPaidFines;

    return NextResponse.json({
      success: true,
      data: {
        student,
        arrears,
        pendingFines,
        summary: {
          // Regular arrears summary
          arrears: {
            total: arrears.length,
            pending: arrears.filter((a: any) => a.status !== 'paid').length,
            totalPendingAmount: totalPendingArrears,
            totalPaidAmount: totalPaidArrears
          },
          // Fines summary  
          fines: {
            total: pendingFines.length,
            pending: pendingFines.filter((f: any) => f.pendingAmount > 0).length,
            totalPendingAmount: totalPendingFines,
            totalPaidAmount: totalPaidFines
          },
          // Combined summary
          combined: {
            totalItems: arrears.length + pendingFines.length,
            totalPendingAmount: totalCombinedPending,
            totalPaidAmount: totalCombinedPaid,
            pendingItems: arrears.filter((a: any) => a.status !== 'paid').length + pendingFines.filter((f: any) => f.pendingAmount > 0).length
          }
        }
      }
    });
  } catch (err: any) {
    console.error('GET /api/students/[id]/arrears:', err);
    return NextResponse.json({ error: 'Failed to fetch arrears' }, { status: 500 });
  }
}
