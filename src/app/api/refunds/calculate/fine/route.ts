import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// POST /api/refunds/calculate/fine - Fine refund calculation
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const {
      fineId,
      reason,
      adminFee = 0,
      metadata
    } = await request.json();

    if (!fineId || !reason) {
      return NextResponse.json({
        error: 'fineId and reason are required'
      }, { status: 400 });
    }

    const fine = await (schoolPrisma as any).Fine.findFirst({
      where: { id: fineId, schoolId: ctx.schoolId }
    });

    if (!fine) {
      return NextResponse.json({ error: 'Fine not found' }, { status: 404 });
    }

    const paidAmount = fine.paidAmount;
    let refundableAmount = 0;

    // Fine refund logic - fines are generally non-refundable except in specific cases
    if (reason === 'fine_applied_in_error') {
      // Full refund if fine was applied in error
      refundableAmount = paidAmount;
    } else if (reason === 'appeal_approved') {
      // 50% refund for approved appeals
      refundableAmount = paidAmount * 0.5;
    } else if (reason === 'duplicate_payment') {
      // Full refund for duplicate payments
      refundableAmount = paidAmount;
    } else if (reason === 'system_error') {
      // Full refund for system errors
      refundableAmount = paidAmount;
    }

    const netAmount = Math.max(0, refundableAmount - adminFee);

    const calculation = {
      originalAmount: fine.amount,
      refundableAmount,
      adminFee,
      netAmount,
      breakdown: {
        fineType: fine.type,
        category: fine.category,
        description: fine.description,
        fineNumber: fine.fineNumber,
        issueDate: fine.createdAt,
        dueDate: fine.dueDate
      },
      prorationDetails: {
        reason,
        originalFineAmount: fine.amount,
        paidAmount,
        waivedAmount: fine.waivedAmount,
        remainingAmount: fine.amount - paidAmount - fine.waivedAmount,
        refundPolicy: {
          applied_in_error: 'Full refund',
          appeal_approved: '50% refund',
          duplicate_payment: 'Full refund',
          system_error: 'Full refund',
          other: 'No refund'
        }
      },
      eligibility: {
        canRefund: refundableAmount > 0,
        hasPaidAmount: paidAmount > 0,
        validReason: ['fine_applied_in_error', 'appeal_approved', 'duplicate_payment', 'system_error'].includes(reason),
        amountEligible: netAmount > 0
      }
    };

    return NextResponse.json({ calculation });
  } catch (error) {
    console.error('POST /api/refunds/calculate/fine:', error);
    return NextResponse.json({ error: 'Failed to calculate fine refund' }, { status: 500 });
  }
}
