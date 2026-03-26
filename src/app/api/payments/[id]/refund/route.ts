import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// POST /api/payments/[id]/refund - Refund specific payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id: paymentId } = await params;
    const {
      amount,
      adminFee = 0,
      reason,
      refundMethod,
      bankDetails
    } = await request.json();

    if (!amount || !reason || !refundMethod) {
      return NextResponse.json({
        error: 'amount, reason, and refundMethod are required'
      }, { status: 400 });
    }

    // Get the payment and related fee record
    const payment = await (schoolPrisma as any).Payment.findFirst({
      where: { id: paymentId },
      include: {
        feeRecord: {
          include: {
            student: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment belongs to school
    const student = payment.feeRecord?.student;
    if (!student || student.schoolId !== ctx.schoolId) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment has already been refunded
    if (payment.refundId) {
      return NextResponse.json({ error: 'Payment already refunded' }, { status: 400 });
    }

    // Validate refund amount doesn't exceed payment amount
    if (amount > payment.amount) {
      return NextResponse.json({
        error: `Refund amount cannot exceed payment amount of ₹${payment.amount}`
      }, { status: 400 });
    }

    const netAmount = amount - adminFee;
    
    // Auto-approval logic for amounts < 1000
    const isAutoApproved = netAmount < 1000;
    const status = isAutoApproved ? 'approved' : 'pending';
    const approvedBy = isAutoApproved ? 'system' : null;
    const approvedAt = isAutoApproved ? new Date() : null;
    const priority = netAmount >= 5000 ? 'high' : netAmount >= 1000 ? 'normal' : 'low';

    // Create refund request
    const refund = await (schoolPrisma as any).RefundRequest.create({
      data: {
        schoolId: ctx.schoolId,
        studentId: student.id,
        type: 'academic_fee',
        sourceId: payment.feeRecordId,
        sourceType: 'FeeRecord',
        amount,
        adminFee,
        netAmount,
        reason,
        status,
        priority,
        refundMethod,
        bankDetails,
        approvedBy,
        approvedAt,
        metadata: {
          originalPaymentId: payment.id,
          originalReceiptNumber: payment.receiptNumber,
          originalPaymentDate: payment.paymentDate
        },
        createdBy: ctx.userId
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

    // Create approval record for auto-approved refunds
    if (isAutoApproved) {
      await (schoolPrisma as any).RefundApproval.create({
        data: {
          refundId: refund.id,
          approverId: 'system',
          approverRole: 'system',
          action: 'approved',
          comments: 'Auto-approved: Amount < ₹1000'
        }
      });
    }

    // Update payment with refund reference
    await (schoolPrisma as any).Payment.update({
      where: { id: paymentId },
      data: {
        refundId: refund.id,
        refundAmount: amount
      }
    });

    return NextResponse.json({ refund }, { status: 201 });
  } catch (error) {
    console.error('POST /api/payments/[id]/refund:', error);
    return NextResponse.json({ error: 'Failed to create refund request' }, { status: 500 });
  }
}

// GET /api/payments/[id]/refund - Get refund status for payment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id: paymentId } = await params;

    const payment = await (schoolPrisma as any).Payment.findFirst({
      where: { id: paymentId },
      include: {
        feeRecord: {
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
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment belongs to school
    if (payment.feeRecord?.student?.schoolId !== ctx.schoolId) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    let refund = null;
    if (payment.refundId) {
      refund = await (schoolPrisma as any).RefundRequest.findFirst({
        where: { id: payment.refundId },
        include: {
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
          },
          transactions: true
        }
      });
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        amount: payment.amount,
        receiptNumber: payment.receiptNumber,
        paymentDate: payment.paymentDate,
        refundAmount: payment.refundAmount,
        isRefunded: !!payment.refundId
      },
      refund
    });
  } catch (error) {
    console.error('GET /api/payments/[id]/refund:', error);
    return NextResponse.json({ error: 'Failed to fetch refund status' }, { status: 500 });
  }
}
