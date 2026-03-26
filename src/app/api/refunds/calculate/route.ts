import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// POST /api/refunds/calculate - Calculate refund amount
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const {
      type,
      sourceId,
      sourceType,
      reason,
      adminFee = 0,
      metadata
    } = await request.json();

    if (!type || !sourceId || !sourceType) {
      return NextResponse.json({
        error: 'type, sourceId, and sourceType are required'
      }, { status: 400 });
    }

    // Ensure all required parameters are strings (not null)
    const safeSourceId = sourceId || '';
    const safeSourceType = sourceType || '';
    const safeReason = reason || '';
    const safeSchoolId = ctx.schoolId || '';

    let calculation = {
      originalAmount: 0,
      refundableAmount: 0,
      adminFee: 0,
      netAmount: 0,
      breakdown: {},
      prorationDetails: {}
    };

    switch (type) {
      case 'academic_fee':
        calculation = await calculateAcademicFeeRefund(
          safeSchoolId, 
          safeSourceId, 
          safeReason, 
          adminFee, 
          metadata
        );
        break;
      
      case 'transport_fee':
        calculation = await calculateTransportFeeRefund(
          safeSchoolId,
          safeSourceId,
          safeReason,
          adminFee,
          metadata
        );
        break;
      
      case 'fine':
        calculation = await calculateFineRefund(
          safeSchoolId,
          safeSourceId,
          safeReason,
          adminFee
        );
        break;
      
      case 'overpayment':
        calculation = await calculateOverpaymentRefund(
          safeSchoolId,
          safeSourceId,
          safeSourceType,
          adminFee
        );
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid refund type' }, { status: 400 });
    }

    return NextResponse.json({ calculation });
  } catch (error) {
    console.error('POST /api/refunds/calculate:', error);
    return NextResponse.json({ error: 'Failed to calculate refund' }, { status: 500 });
  }
}

async function calculateAcademicFeeRefund(
  schoolId: string,
  feeRecordId: string,
  reason: string,
  adminFee: number,
  metadata: any
) {
  const feeRecord = await (schoolPrisma as any).FeeRecord.findFirst({
    where: { id: feeRecordId, schoolId },
    include: { feeStructure: true }
  });

  if (!feeRecord) {
    throw new Error('Fee record not found');
  }

  const originalAmount = feeRecord.amount;
  const paidAmount = feeRecord.paidAmount;
  
  // For academic fees, refund based on reason and time elapsed
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

  // Special cases
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
    specialReason: reason
  };

  const netAmount = Math.max(0, refundableAmount - adminFee);

  return {
    originalAmount: paidAmount,
    refundableAmount,
    adminFee,
    netAmount,
    breakdown: {
      feeType: feeRecord.feeStructure?.name || 'Academic Fee',
      category: feeRecord.feeStructure?.category || 'academic',
      academicYear: feeRecord.academicYear
    },
    prorationDetails
  };
}

async function calculateTransportFeeRefund(
  schoolId: string,
  studentTransportId: string,
  reason: string,
  adminFee: number,
  metadata: any
) {
  const studentTransport = await (schoolPrisma as any).StudentTransport.findFirst({
    where: { id: studentTransportId },
    include: { route: true }
  });

  if (!studentTransport) {
    throw new Error('Student transport record not found');
  }

  const monthlyFee = studentTransport.monthlyFee;
  const yearlyFee = studentTransport.route?.yearlyFee || monthlyFee * 12;
  
  let refundableAmount = 0;
  let prorationDetails = {};

  const now = new Date();
  const assignedDate = new Date(studentTransport.assignedAt);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Calculate months remaining in current academic year
  const academicYearEnd = new Date('2025-03-31');
  const monthsRemaining = Math.max(0, 
    ((academicYearEnd.getFullYear() - currentYear) * 12 + 
    (academicYearEnd.getMonth() - currentMonth))
  );

  if (reason === 'transport_cancellation') {
    // Prorate based on months remaining
    refundableAmount = (monthlyFee * monthsRemaining);
    
    // If cancellation within first week of month, refund full month
    if (now.getDate() <= 7) {
      refundableAmount += monthlyFee;
    }
  } else if (reason === 'student_withdrawal') {
    // Full refund if withdrawal within first month
    const monthsInService = Math.ceil((now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (monthsInService <= 1) {
      refundableAmount = monthlyFee * monthsRemaining;
    } else {
      refundableAmount = monthlyFee * (monthsRemaining - 1); // Deduct one month as penalty
    }
  }

  prorationDetails = {
    monthlyFee,
    yearlyFee,
    monthsRemaining,
    assignedDate: studentTransport.assignedAt,
    currentMonth: now.getMonth() + 1,
    specialReason: reason
  };

  const netAmount = Math.max(0, refundableAmount - adminFee);

  return {
    originalAmount: monthlyFee,
    refundableAmount,
    adminFee,
    netAmount,
    breakdown: {
      routeName: studentTransport.route?.routeName || 'Unknown Route',
      routeNumber: studentTransport.route?.routeNumber || 'N/A',
      feeType: 'Transport Fee'
    },
    prorationDetails
  };
}

async function calculateFineRefund(
  schoolId: string,
  fineId: string,
  reason: string,
  adminFee: number
) {
  const fine = await (schoolPrisma as any).Fine.findFirst({
    where: { id: fineId, schoolId }
  });

  if (!fine) {
    throw new Error('Fine not found');
  }

  const paidAmount = fine.paidAmount;
  let refundableAmount = 0;

  // Fines are generally non-refundable except in specific cases
  if (reason === 'fine_applied_in_error') {
    refundableAmount = paidAmount;
  } else if (reason === 'appeal_approved') {
    refundableAmount = paidAmount * 0.5; // 50% refund for approved appeals
  }

  const netAmount = Math.max(0, refundableAmount - adminFee);

  return {
    originalAmount: fine.amount,
    refundableAmount,
    adminFee,
    netAmount,
    breakdown: {
      fineType: fine.type,
      category: fine.category,
      description: fine.description,
      fineNumber: fine.fineNumber
    },
    prorationDetails: {
      reason,
      originalFineAmount: fine.amount,
      paidAmount,
      waivedAmount: fine.waivedAmount
    }
  };
}

async function calculateOverpaymentRefund(
  schoolId: string,
  sourceId: string,
  sourceType: string,
  adminFee: number
) {
  let overpaymentAmount = 0;
  let sourceDetails = {};

  switch (sourceType) {
    case 'FeeRecord':
      const feeRecord = await (schoolPrisma as any).FeeRecord.findFirst({
        where: { id: sourceId, schoolId }
      });
      if (feeRecord) {
        overpaymentAmount = Math.max(0, feeRecord.paidAmount - feeRecord.amount);
        sourceDetails = {
          feeType: 'Academic Fee',
          originalAmount: feeRecord.amount,
          paidAmount: feeRecord.paidAmount
        };
      }
      break;
    
    case 'Fine':
      const fine = await (schoolPrisma as any).Fine.findFirst({
        where: { id: sourceId, schoolId }
      });
      if (fine) {
        overpaymentAmount = Math.max(0, fine.paidAmount - fine.amount);
        sourceDetails = {
          fineType: fine.type,
          originalAmount: fine.amount,
          paidAmount: fine.paidAmount
        };
      }
      break;
  }

  const netAmount = Math.max(0, overpaymentAmount - adminFee);

  return {
    originalAmount: overpaymentAmount,
    refundableAmount: overpaymentAmount,
    adminFee,
    netAmount,
    breakdown: sourceDetails,
    prorationDetails: {
      reason: 'overpayment',
      calculation: 'full_overpayment'
    }
  };
}
