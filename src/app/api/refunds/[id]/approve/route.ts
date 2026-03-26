import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { sendRefundStatusNotification } from '@/lib/refundNotifications';

// PUT /api/refunds/[id]/approve - Approve or reject refund
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const { action, comments, adminFee } = await request.json();

    if (!action || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action must be either "approved" or "rejected"' 
      }, { status: 400 });
    }

    const refund = await (schoolPrisma as any).RefundRequest.findFirst({
      where: { 
        id, 
        schoolId: ctx.schoolId,
        status: 'pending'
      }
    });

    if (!refund) {
      return NextResponse.json({ 
        error: 'Refund not found or not in pending status' 
      }, { status: 404 });
    }

    // Update admin fee if provided and action is approved
    let updatedAdminFee = refund.adminFee;
    let updatedNetAmount = refund.netAmount;
    
    if (action === 'approved' && adminFee !== undefined) {
      updatedAdminFee = adminFee;
      updatedNetAmount = refund.amount - adminFee;
    }

    const updatedRefund = await (schoolPrisma as any).RefundRequest.update({
      where: { id },
      data: {
        status: action === 'approved' ? 'approved' : 'rejected',
        approvedBy: ctx.userId,
        approvedAt: new Date(),
        rejectionReason: action === 'rejected' ? comments : null,
        adminFee: updatedAdminFee,
        netAmount: updatedNetAmount,
        updatedAt: new Date()
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
        }
      }
    });

    // Create approval record
    await (schoolPrisma as any).RefundApproval.create({
      data: {
        refundId: id,
        approverId: ctx.userId,
        approverRole: ctx.role || 'user',
        action,
        comments
      }
    });

    // Send notification about status change
    await sendRefundStatusNotification(id, action === 'approved' ? 'approved' : 'rejected');

    return NextResponse.json({ refund: updatedRefund });
  } catch (error) {
    console.error('PUT /api/refunds/[id]/approve:', error);
    return NextResponse.json({ error: 'Failed to update refund' }, { status: 500 });
  }
}
