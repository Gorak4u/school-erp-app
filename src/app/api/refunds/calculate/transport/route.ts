import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// POST /api/refunds/calculate/transport - Transport fee proration calculation
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const {
      studentTransportId,
      reason,
      adminFee = 0,
      metadata
    } = await request.json();

    if (!studentTransportId || !reason) {
      return NextResponse.json({
        error: 'studentTransportId and reason are required'
      }, { status: 400 });
    }

    const studentTransport = await (schoolPrisma as any).StudentTransport.findFirst({
      where: { id: studentTransportId },
      include: { route: true }
    });

    if (!studentTransport) {
      return NextResponse.json({ error: 'Student transport record not found' }, { status: 404 });
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
    } else if (reason === 'route_change') {
      // Full refund for remaining months when changing routes
      refundableAmount = monthlyFee * monthsRemaining;
    } else if (reason === 'overpayment') {
      // Full refund of overpaid amount
      refundableAmount = monthlyFee; // This would be calculated based on actual overpayment
    }

    prorationDetails = {
      monthlyFee,
      yearlyFee,
      monthsRemaining,
      assignedDate: studentTransport.assignedAt,
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),
      specialReason: reason,
      academicYearEnd,
      currentDate: now
    };

    const netAmount = Math.max(0, refundableAmount - adminFee);

    const calculation = {
      originalAmount: monthlyFee,
      refundableAmount,
      adminFee,
      netAmount,
      breakdown: {
        routeName: studentTransport.route?.routeName || 'Unknown Route',
        routeNumber: studentTransport.route?.routeNumber || 'N/A',
        feeType: 'Transport Fee',
        routeId: studentTransport.routeId,
        studentId: studentTransport.studentId
      },
      prorationDetails,
      eligibility: {
        canRefund: refundableAmount > 0,
        timeEligible: monthsRemaining > 0,
        amountEligible: netAmount > 0
      }
    };

    return NextResponse.json({ calculation });
  } catch (error) {
    console.error('POST /api/refunds/calculate/transport:', error);
    return NextResponse.json({ error: 'Failed to calculate transport fee refund' }, { status: 500 });
  }
}
