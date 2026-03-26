import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma-server';

// POST /api/refunds/bulk - Bulk operations for refunds
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { refundIds, action } = await request.json();

    if (!refundIds || !Array.isArray(refundIds) || !action) {
      return NextResponse.json({
        error: 'refundIds (array) and action are required'
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        error: 'action must be either "approve" or "reject"'
      }, { status: 400 });
    }

    const results = await Promise.allSettled(
      refundIds.map(async (refundId) => {
        const refund = await (schoolPrisma as any).RefundRequest.findFirst({
          where: { id: refundId, schoolId: ctx.schoolId }
        });

        if (!refund) {
          throw new Error(`Refund ${refundId} not found`);
        }

        if (refund.status !== 'pending') {
          throw new Error(`Refund ${refundId} is not in pending status`);
        }

        // Create approval record
        await (schoolPrisma as any).RefundApproval.create({
          data: {
            refundId,
            approverId: ctx.userId,
            approverRole: 'admin',
            action: action === 'approve' ? 'approved' : 'rejected',
            comments: `Bulk ${action} via admin panel`
          }
        });

        // Update refund status
        await (schoolPrisma as any).RefundRequest.update({
          where: { id: refundId },
          data: {
            status: action === 'approve' ? 'approved' : 'rejected',
            approvedBy: ctx.userId,
            approvedAt: new Date()
          }
        });

        return { refundId, success: true };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      successful,
      failed,
      total: refundIds.length,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    });
  } catch (error) {
    console.error('POST /api/refunds/bulk:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process bulk operation' 
    }, { status: 500 });
  }
}
