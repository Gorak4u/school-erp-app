import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// Helper function to generate receipt numbers
function generateReceiptNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `RCPT-${timestamp}-${random}`;
}

// POST /api/fines/[id]/pay - Record fine payment
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await context.params;
    const body = await request.json();
    const {
      amount,
      paymentMethod,
      remarks,
      // Razorpay fields for online payments
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = body;

    // Validation
    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { 
          success: false,
          error: 'amount and paymentMethod are required' 
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment amount must be greater than 0' 
        },
        { status: 400 }
      );
    }

    // Check if fine exists and belongs to school
    const fine = await (schoolPrisma as any).Fine.findFirst({
      where: {
        id,
        ...(ctx.schoolId && { schoolId: ctx.schoolId })
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
        payments: {
          select: {
            id: true,
            amount: true,
            receiptNumber: true
          }
        }
      }
    });

    if (!fine) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine not found' 
        },
        { status: 404 }
      );
    }

    // Check if fine is already paid
    if (fine.status === 'paid') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Fine is already paid' 
        },
        { status: 400 }
      );
    }

    // Check payment amount doesn't exceed pending amount
    const pendingAmount = fine.amount - fine.paidAmount - fine.waivedAmount;
    if (amount > pendingAmount) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Payment amount exceeds pending amount',
          details: `Pending amount: ₹${pendingAmount}, Attempted payment: ₹${amount}`
        },
        { status: 400 }
      );
    }

    // Generate unique receipt number
    const receiptNumber = generateReceiptNumber();
    
    // Check for duplicate receipt number (very unlikely but safe)
    const existingReceipt = await schoolPrisma.finePayment.findFirst({
      where: { receiptNumber }
    });

    if (existingReceipt) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Receipt number conflict. Please try again.' 
        },
        { status: 409 }
      );
    }

    // Create payment record
    const payment = await schoolPrisma.finePayment.create({
      data: {
        fineId: id,
        amount,
        paymentMethod,
        receiptNumber,
        collectedBy: ctx.email,
        remarks,
        ...(razorpayOrderId && { razorpayOrderId }),
        ...(razorpayPaymentId && { razorpayPaymentId }),
        ...(razorpaySignature && { razorpaySignature })
      }
    });

    // Update fine status and amounts
    const newPaidAmount = fine.paidAmount + amount;
    const newPendingAmount = fine.amount - newPaidAmount - fine.waivedAmount;
    let newStatus = fine.status;

    if (newPendingAmount <= 0) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }

    const updatedFine = await (schoolPrisma as any).Fine.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        pendingAmount: Math.max(0, newPendingAmount),
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date() : fine.paidAt
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            class: true,
            section: true,
            rollNo: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // TODO: Send payment confirmation notification
    // await sendPaymentConfirmation(updatedFine, payment);

    return NextResponse.json({
      success: true,
      payment,
      fine: updatedFine,
      message: `Payment of ₹${amount} recorded successfully`
    });

  } catch (error) {
    console.error('POST /api/fines/[id]/pay:', error);
    
    // Handle Prisma specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Receipt number already exists' 
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid reference to fine or school' 
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to record payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
