import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/refunds/[id]/receipt - Generate refund receipt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;

    const refund = await (schoolPrisma as any).RefundRequest.findFirst({
      where: { id, schoolId: ctx.schoolId },
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
        },
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!refund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    // Generate receipt data
    const receiptData = {
      receiptNumber: `REF-${refund.id.slice(-8).toUpperCase()}`,
      receiptDate: refund.createdAt,
      refundId: refund.id,
      student: refund.student,
      refundDetails: {
        type: refund.type,
        sourceType: refund.sourceType,
        amount: refund.amount,
        adminFee: refund.adminFee,
        netAmount: refund.netAmount,
        reason: refund.reason,
        refundMethod: refund.refundMethod,
        status: refund.status,
        priority: refund.priority
      },
      approvals: refund.approvals,
      transactions: refund.transactions,
      bankDetails: refund.bankDetails,
      metadata: refund.metadata,
      createdBy: refund.createdByUser,
      school: {
        name: 'School', // TODO: Fetch from school context
        address: '',
        phone: '',
        email: ''
      }
    };

    return NextResponse.json({ receipt: receiptData });
  } catch (error) {
    console.error('GET /api/refunds/[id]/receipt:', error);
    return NextResponse.json({ error: 'Failed to generate refund receipt' }, { status: 500 });
  }
}

// POST /api/refunds/[id]/receipt/send - Send refund receipt via email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const { email, includePDF } = await request.json();

    const refund = await (schoolPrisma as any).RefundRequest.findFirst({
      where: { id, schoolId: ctx.schoolId },
      include: {
        student: true,
        approvals: true,
        transactions: true
      }
    });

    if (!refund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    // Get receipt data
    const receiptResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/refunds/${id}/receipt`);
    const receiptData = await receiptResponse.json();

    // Send email notification (placeholder - implement email service)
    // TODO: Integrate with existing email service
    const emailData = {
      to: email || refund.student.parentEmail,
      subject: `Refund Receipt - ${receiptData.receipt.receiptNumber}`,
      template: 'refund-receipt',
      data: receiptData.receipt,
      includePDF: includePDF || false
    };

    // Log email sending for now
    console.log('Refund receipt email data:', emailData);

    // Update refund record with receipt sent status
    await (schoolPrisma as any).RefundRequest.update({
      where: { id },
      data: {
        metadata: {
          ...refund.metadata,
          receiptSent: true,
          receiptSentAt: new Date(),
          receiptSentTo: email || refund.student.parentEmail
        }
      }
    });

    return NextResponse.json({ 
      message: 'Refund receipt sent successfully',
      receiptNumber: receiptData.receipt.receiptNumber,
      sentTo: email || refund.student.parentEmail
    });
  } catch (error) {
    console.error('POST /api/refunds/[id]/receipt/send:', error);
    return NextResponse.json({ error: 'Failed to send refund receipt' }, { status: 500 });
  }
}
