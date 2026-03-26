import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { notifyStakeholdersOnRefundCompletion } from '@/lib/refundNotifications';

// PUT /api/refunds/[id]/process - Process approved refund
export async function PUT(
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
    console.error('PUT /api/refunds/[id]/process:', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}

// POST /api/refunds/[id]/process/complete - Complete refund processing and notify stakeholders
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;

    // Notify stakeholders about refund completion
    await notifyStakeholdersOnRefundCompletion(id);

    return NextResponse.json({ message: 'Refund completion notifications sent successfully' });
  } catch (error) {
    console.error('POST /api/refunds/[id]/process/complete:', error);
    return NextResponse.json({ error: 'Failed to send completion notifications' }, { status: 500 });
  }
}
