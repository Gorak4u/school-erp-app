import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/refunds/[id] - Get refund details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;

    const refund = await (schoolPrisma as any).RefundRequest.findFirst({
      where: { 
        id, 
        schoolId: ctx.schoolId 
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            class: true,
            section: true,
            parentName: true,
            parentEmail: true,
            parentPhone: true
          }
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!refund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    return NextResponse.json({ refund });
  } catch (error) {
    console.error('GET /api/refunds/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch refund' }, { status: 500 });
  }
}

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

    return NextResponse.json({ refund: updatedRefund });
  } catch (error) {
    console.error('PUT /api/refunds/[id]:', error);
    return NextResponse.json({ error: 'Failed to update refund' }, { status: 500 });
  }
}

// PUT /api/refunds/[id]/process - Process approved refund
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const { method, transactionId, notes } = await request.json();

    if (!method || !['bank_transfer', 'credit_future', 'cash'].includes(method)) {
      return NextResponse.json({ 
        error: 'Valid refund method is required' 
      }, { status: 400 });
    }

    const refund = await (schoolPrisma as any).RefundRequest.findFirst({
      where: { 
        id, 
        schoolId: ctx.schoolId,
        status: 'approved'
      }
    });

    if (!refund) {
      return NextResponse.json({ 
        error: 'Refund not found or not approved' 
      }, { status: 404 });
    }

    // Create refund transaction
    const transaction = await (schoolPrisma as any).RefundTransaction.create({
      data: {
        refundId: id,
        amount: refund.netAmount,
        method,
        transactionId,
        status: 'completed',
        processedBy: ctx.userId,
        processedAt: new Date()
      }
    });

    // Update refund status
    const updatedRefund = await (schoolPrisma as any).RefundRequest.update({
      where: { id },
      data: {
        status: 'processed',
        processedBy: ctx.userId,
        processedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update source records with refund amount
    if (refund.sourceId && refund.sourceType) {
      switch (refund.sourceType) {
        case 'FeeRecord':
          await (schoolPrisma as any).FeeRecord.update({
            where: { id: refund.sourceId },
            data: {
              refundAmount: {
                increment: refund.netAmount
              },
              paidAmount: {
                decrement: refund.netAmount
              },
              pendingAmount: {
                increment: refund.netAmount
              }
            }
          });
          break;
        
        case 'StudentTransport':
          await (schoolPrisma as any).StudentTransport.update({
            where: { id: refund.sourceId },
            data: {
              refundAmount: {
                increment: refund.netAmount
              }
            }
          });
          break;
      }
    }

    // Update payment records if applicable
    if (refund.sourceType === 'FeeRecord') {
      await (schoolPrisma as any).Payment.updateMany({
        where: { feeRecordId: refund.sourceId },
        data: {
          refundId: id,
          refundAmount: refund.netAmount
        }
      });
    } else if (refund.sourceType === 'Fine') {
      await (schoolPrisma as any).FinePayment.updateMany({
        where: { fineId: refund.sourceId },
        data: {
          refundId: id,
          refundAmount: refund.netAmount
        }
      });
    }

    return NextResponse.json({ 
      refund: updatedRefund,
      transaction 
    });
  } catch (error) {
    console.error('PATCH /api/refunds/[id]:', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}

// DELETE /api/refunds/[id] - Cancel refund request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;

    const refund = await (schoolPrisma as any).RefundRequest.findFirst({
      where: { 
        id, 
        schoolId: ctx.schoolId,
        status: 'pending'
      }
    });

    if (!refund) {
      return NextResponse.json({ 
        error: 'Refund not found or cannot be cancelled' 
      }, { status: 404 });
    }

    await (schoolPrisma as any).RefundRequest.update({
      where: { id },
      data: {
        status: 'cancelled',
        rejectionReason: 'Cancelled by user',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ message: 'Refund cancelled successfully' });
  } catch (error) {
    console.error('DELETE /api/refunds/[id]:', error);
    return NextResponse.json({ error: 'Failed to cancel refund' }, { status: 500 });
  }
}
