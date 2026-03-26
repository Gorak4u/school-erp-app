import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { analyzeTransportFees, calculateRefundEligibility, validateRefundAmount } from '@/lib/transportFeeAnalyzer';

// POST /api/transport/refunds/create - Create transport refund
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school selected. Please select a school to continue.' }, { status: 400 });
    }

    const body = await request.json();
    const { studentTransportId, refundAmount, adminFee, reason } = body;

    if (!studentTransportId) {
      return NextResponse.json({ error: 'Student transport ID is required' }, { status: 400 });
    }

    // Verify student transport exists and belongs to school
    const transportAssignment = await (schoolPrisma as any).StudentTransport.findFirst({
      where: { 
        id: studentTransportId,
        student: { schoolId: ctx.schoolId }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            admissionNo: true,
            class: true,
            section: true,
            parentEmail: true,
            parentPhone: true
          }
        }
      }
    });

    if (!transportAssignment) {
      return NextResponse.json({ error: 'Transport assignment not found' }, { status: 404 });
    }

    // Analyze fees and calculate eligibility
    const feeAnalysis = await analyzeTransportFees(studentTransportId);
    const eligibility = await calculateRefundEligibility(studentTransportId, feeAnalysis);

    // Validate refund amount
    const finalRefundAmount = refundAmount || eligibility.suggestedRefund;
    const finalAdminFee = adminFee || 0;
    const refundValidation = validateRefundAmount(
      finalRefundAmount,
      feeAnalysis.paidAmount,
      eligibility.existingRefunds
    );

    if (!refundValidation.isValid) {
      return NextResponse.json({ 
        error: refundValidation.error,
        feeAnalysis,
        eligibility
      }, { status: 400 });
    }

    // Create refund request
    const netAmount = finalRefundAmount - finalAdminFee;
    const refundStatus = netAmount < 1000 ? 'approved' : 'pending';

    const refund = await (schoolPrisma as any).RefundRequest.create({
      data: {
        schoolId: ctx.schoolId,
        studentId: transportAssignment.studentId,
        type: 'transport_fee',
        sourceId: studentTransportId,
        sourceType: 'StudentTransport',
        amount: finalRefundAmount,
        adminFee: finalAdminFee,
        netAmount: netAmount,
        reason: reason || 'Transport cancellation refund',
        status: refundStatus,
        priority: netAmount >= 5000 ? 'high' : netAmount >= 1000 ? 'normal' : 'low',
        refundMethod: 'bank_transfer'
      }
    });

    // If auto-approved, create approval and transaction records
    if (refund.status === 'approved') {
      await (schoolPrisma as any).RefundApproval.create({
        data: {
          refundId: refund.id,
          approverId: ctx.userId,
          approverRole: ctx.role || 'admin',
          action: 'approved',
          comments: 'Auto-approved transport refund'
        }
      });

      await (schoolPrisma as any).RefundTransaction.create({
        data: {
          refundId: refund.id,
          amount: netAmount,
          method: 'bank_transfer',
          transactionId: `AUTO-${refund.id.slice(-8).toUpperCase()}`,
          status: 'completed',
          processedBy: 'system',
          processedAt: new Date()
        }
      });
    }

    // Send notification
    const { sendRefundStatusNotification } = await import('@/lib/refundNotifications');
    await sendRefundStatusNotification(refund.id, refund.status);

    // Log audit action
    const { logAuditAction } = await import('@/lib/auditLog');
    await logAuditAction({
      actorEmail: ctx.email,
      action: 'create_transport_refund',
      target: 'RefundRequest',
      targetName: refund.id,
      details: {
        studentId: transportAssignment.studentId,
        studentName: transportAssignment.student.name,
        refundAmount: finalRefundAmount,
        adminFee: finalAdminFee,
        netAmount: netAmount,
        status: refund.status
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        adminFee: refund.adminFee,
        netAmount: refund.netAmount,
        status: refund.status,
        refundNumber: `REF-${refund.id.slice(-8).toUpperCase()}`,
        createdAt: refund.createdAt
      },
      feeAnalysis,
      eligibility
    });

  } catch (error: any) {
    console.error('POST /api/transport/refunds/create:', error);
    return NextResponse.json({ 
      error: 'Failed to create transport refund', 
      details: error.message 
    }, { status: 500 });
  }
}
