import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { sendRefundStatusNotification } from '@/lib/refundNotifications';

// PUT /api/refunds/[id]/cancel - Cancel refund request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const { reason, adminOverride = false } = await request.json();

    if (!reason) {
      return NextResponse.json({ 
        error: 'Cancellation reason is required' 
      }, { status: 400 });
    }

    const refund = await (schoolPrisma as any).RefundRequest.findFirst({
      where: { 
        id, 
        schoolId: ctx.schoolId
      },
      include: {
        student: true,
        transactions: true
      }
    });

    if (!refund) {
      return NextResponse.json({ 
        error: 'Refund not found' 
      }, { status: 404 });
    }

    // Check if refund can be cancelled
    if (refund.status === 'processed') {
      return NextResponse.json({ 
        error: 'Cannot cancel processed refund. Contact administrator.' 
      }, { status: 400 });
    }

    if (refund.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Refund is already cancelled' 
      }, { status: 400 });
    }

    // Check if user has permission to cancel
    const canCancel = refund.createdBy === ctx.userId || adminOverride || ctx.role === 'admin';
    
    if (!canCancel) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to cancel this refund' 
      }, { status: 403 });
    }

    // Check if refund has been approved (requires admin override)
    if (refund.status === 'approved' && !adminOverride && ctx.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Approved refunds can only be cancelled by administrators' 
      }, { status: 403 });
    }

    // Cancel the refund
    const updatedRefund = await (schoolPrisma as any).RefundRequest.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledBy: ctx.userId,
        cancelledAt: new Date(),
        cancellationReason: reason,
        metadata: {
          ...refund.metadata,
          cancelledAt: new Date().toISOString(),
          cancelledBy: ctx.userId,
          cancellationReason: reason
        }
      },
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
        approvals: true,
        transactions: true
      }
    });

    // If refund was approved, reverse any transactions
    if (refund.status === 'approved' && refund.transactions.length > 0) {
      await (schoolPrisma as any).RefundTransaction.updateMany({
        where: { refundId: id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          notes: `Refund cancelled: ${reason}`
        }
      });
    }

    // Create audit record
    await (schoolPrisma as any).RefundApproval.create({
      data: {
        refundId: id,
        approverId: ctx.userId,
        approverRole: ctx.role || 'user',
        action: 'cancelled',
        comments: reason
      }
    });

    // Send notification about cancellation
    await sendRefundStatusNotification(id, 'cancelled');

    return NextResponse.json({ 
      refund: updatedRefund,
      message: 'Refund cancelled successfully'
    });
  } catch (error) {
    console.error('PUT /api/refunds/[id]/cancel:', error);
    return NextResponse.json({ error: 'Failed to cancel refund' }, { status: 500 });
  }
}
