import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// POST /api/refunds/calculate/academic - Academic fee proration calculation
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const {
      feeRecordId,
      reason,
      adminFee = 0,
      metadata
    } = await request.json();

    if (!feeRecordId || !reason) {
      return NextResponse.json({
        error: 'feeRecordId and reason are required'
      }, { status: 400 });
    }

    const feeRecord = await (schoolPrisma as any).FeeRecord.findFirst({
      where: { id: feeRecordId, schoolId: ctx.schoolId },
      include: { feeStructure: true }
    });

    if (!feeRecord) {
      return NextResponse.json({ error: 'Fee record not found' }, { status: 404 });
    }

    const originalAmount = feeRecord.amount;
    const paidAmount = feeRecord.paidAmount;
    
    // Academic fee proration logic
    let refundableAmount = 0;
    let prorationDetails = {};

    const now = new Date();
    const academicYearStart = new Date('2024-04-01'); // Assuming academic year starts April 1
    const academicYearEnd = new Date('2025-03-31');
    
    const totalDays = Math.ceil((academicYearEnd.getTime() - academicYearStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - academicYearStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    
    const refundPercentage = daysRemaining / totalDays;
    refundableAmount = paidAmount * refundPercentage;

    // Special cases based on reason
    if (reason === 'student_withdrawal') {
      // Full refund if withdrawal within first month
      if (daysElapsed <= 30) {
        refundableAmount = paidAmount;
      }
    } else if (reason === 'course_cancellation') {
      // Full refund for course cancellation
      refundableAmount = paidAmount;
    } else if (reason === 'overpayment') {
      // Full refund for overpayment
      refundableAmount = paidAmount - feeRecord.amount;
    }

    prorationDetails = {
      totalDays,
      daysElapsed,
      daysRemaining,
      refundPercentage: refundPercentage * 100,
      specialReason: reason,
      academicYearStart,
      academicYearEnd,
      currentDate: now
    };

    const netAmount = Math.max(0, refundableAmount - adminFee);

    const calculation = {
      originalAmount: paidAmount,
      refundableAmount,
      adminFee,
      netAmount,
      breakdown: {
        feeType: feeRecord.feeStructure?.name || 'Academic Fee',
        category: feeRecord.feeStructure?.category || 'academic',
        academicYear: feeRecord.academicYear,
        feeStructureId: feeRecord.feeStructureId
      },
      prorationDetails,
      eligibility: {
        canRefund: refundableAmount > 0,
        timeEligible: daysRemaining > 0,
        amountEligible: netAmount > 0
      }
    };

    return NextResponse.json({ calculation });
  } catch (error) {
    console.error('POST /api/refunds/calculate/academic:', error);
    return NextResponse.json({ error: 'Failed to calculate academic fee refund' }, { status: 500 });
  }
}
