import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/transport/refunds/debug - Debug endpoint to check refund requests
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    console.log('🔍 Debug: Checking RefundRequest records for school:', ctx.schoolId);

    // Check all refund requests for this school
    const allRefunds = await (schoolPrisma as any).RefundRequest.findMany({
      where: { schoolId: ctx.schoolId },
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        netAmount: true,
        createdAt: true,
        student: {
          select: {
            name: true,
            admissionNo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('🔍 Debug: Found refund requests:', allRefunds.length);

    // Check transport-related specifically
    const transportRefunds = await (schoolPrisma as any).RefundRequest.findMany({
      where: { 
        schoolId: ctx.schoolId,
        type: { in: ['transport_fee', 'transport_fee_waiver'] }
      },
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        netAmount: true,
        createdAt: true,
        student: {
          select: {
            name: true,
            admissionNo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('🔍 Debug: Found transport refunds:', transportRefunds.length);

    return NextResponse.json({
      success: true,
      schoolId: ctx.schoolId,
      totalRefunds: allRefunds.length,
      transportRefunds: transportRefunds.length,
      allRefunds: allRefunds.map(r => ({
        id: r.id,
        type: r.type,
        status: r.status,
        amount: r.amount,
        netAmount: r.netAmount,
        student: r.student?.name || 'Unknown',
        createdAt: r.createdAt
      })),
      transportRefundsList: transportRefunds.map(r => ({
        id: r.id,
        type: r.type,
        status: r.status,
        amount: r.amount,
        netAmount: r.netAmount,
        student: r.student?.name || 'Unknown',
        createdAt: r.createdAt
      }))
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
