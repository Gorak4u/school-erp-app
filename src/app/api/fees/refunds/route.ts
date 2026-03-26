import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/fees/refunds - Fee-related refunds
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const status = searchParams.get('status');
    const feeRecordId = searchParams.get('feeRecordId');

    const where: any = { 
      schoolId: ctx.schoolId,
      type: 'academic_fee'
    };
    
    if (status) where.status = status;
    if (feeRecordId) where.sourceId = feeRecordId;

    const [refunds, total] = await Promise.all([
      (schoolPrisma as any).RefundRequest.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              admissionNo: true,
              class: true,
              section: true
            }
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).RefundRequest.count({ where })
    ]);

    // Calculate fee-specific statistics
    const stats = await (schoolPrisma as any).RefundRequest.aggregate({
      where: { schoolId: ctx.schoolId, type: 'academic_fee' },
      _sum: { amount: true, netAmount: true },
      _count: true
    });

    return NextResponse.json({
      refunds,
      total,
      stats: {
        totalRefunds: stats._count,
        totalAmount: stats._sum.amount || 0,
        totalNetAmount: stats._sum.netAmount || 0
      },
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GET /api/fees/refunds:', error);
    return NextResponse.json({ error: 'Failed to fetch fee refunds' }, { status: 500 });
  }
}
