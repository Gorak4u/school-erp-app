import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { getTransportRefundSummary } from '@/lib/transportFeeAnalyzer';

// GET /api/transport/refunds - Transport-related refunds
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const status = searchParams.get('status');
    const routeId = searchParams.get('routeId');
    const studentTransportId = searchParams.get('studentTransportId');
    const requestType = searchParams.get('requestType'); // 'refund', 'waiver', 'all'

    const where: any = { 
      schoolId: ctx.schoolId
    };
    
    // Filter by request type
    if (requestType === 'refund') {
      where.type = 'transport_fee';
    } else if (requestType === 'waiver') {
      where.type = 'transport_fee_waiver';
    } else {
      // Default to both types
      where.type = { in: ['transport_fee', 'transport_fee_waiver'] };
    }
    
    if (status) where.status = status;
    if (studentTransportId) where.sourceId = studentTransportId;

    const [refunds, total] = await Promise.all([
      (schoolPrisma as any).RefundRequest.findMany({
        where,
        include: {
          student: true // Include all student fields temporarily
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      (schoolPrisma as any).RefundRequest.count({ where })
    ]);

    console.log('🔍 Transport Refunds Query:', { 
    schoolId: ctx.schoolId, 
    where, 
    page, 
    pageSize, 
    total, 
    refundsFound: refunds.length,
    sampleRefund: refunds[0] ? {
      id: refunds[0].id,
      type: refunds[0].type,
      status: refunds[0].status,
      hasStudent: !!refunds[0].student
    } : null
  });

    return NextResponse.json({
      refunds,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('GET /api/transport/refunds:', error);
    return NextResponse.json({ error: 'Failed to fetch transport refunds' }, { status: 500 });
  }
}

// POST /api/transport/refunds - Create transport cancellation refund
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { studentTransportId, refundAmount, adminFee, reason, cancellationDate } = body;

    if (!studentTransportId) {
      return NextResponse.json({ error: 'Student transport ID is required' }, { status: 400 });
    }

    // Get comprehensive refund analysis
    const refundSummary = await getTransportRefundSummary(studentTransportId);

    // Validate refund amount
    const finalRefundAmount = refundAmount || refundSummary.eligibility.suggestedRefund;
    const finalAdminFee = adminFee || 0;
    const netAmount = finalRefundAmount - finalAdminFee;

    if (finalRefundAmount > refundSummary.eligibility.maxRefundable) {
      return NextResponse.json({ 
        error: `Refund amount cannot exceed ₹${refundSummary.eligibility.maxRefundable}`,
        refundSummary
      }, { status: 400 });
    }

    // Create refund request
    const refundStatus = netAmount < 1000 ? 'approved' : 'pending';
    const refund = await (schoolPrisma as any).RefundRequest.create({
      data: {
        schoolId: ctx.schoolId,
        studentId: refundSummary.feeAnalysis.feeRecords[0]?.studentId || 'unknown',
        type: 'transport_fee',
        sourceId: studentTransportId,
        sourceType: 'StudentTransport',
        amount: finalRefundAmount,
        adminFee: finalAdminFee,
        netAmount: netAmount,
        reason: reason || 'Transport cancellation refund',
        status: refundStatus,
        priority: netAmount >= 5000 ? 'high' : netAmount >= 1000 ? 'normal' : 'low',
        refundMethod: 'bank_transfer',
        metadata: {
          cancellationDate: cancellationDate || new Date(),
          feeAnalysis: refundSummary.feeAnalysis,
          eligibility: refundSummary.eligibility
        },
        createdBy: ctx.userId
      }
    });

    // Auto-approval workflow
    if (refund.status === 'approved') {
      await (schoolPrisma as any).RefundApproval.create({
        data: {
          refundId: refund.id,
          approverId: ctx.userId,
          approverRole: ctx.role || 'admin',
          action: 'approved',
          comments: 'Auto-approved transport cancellation refund'
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
      action: 'create_transport_cancellation_refund',
      target: 'RefundRequest',
      targetName: refund.id,
      details: {
        studentTransportId,
        refundAmount: finalRefundAmount,
        adminFee: finalAdminFee,
        netAmount: netAmount,
        status: refund.status,
        cancellationDate
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
      refundSummary
    });

  } catch (error: any) {
    console.error('POST /api/transport/refunds:', error);
    return NextResponse.json({ 
      error: 'Failed to create transport refund', 
      details: error.message 
    }, { status: 500 });
  }
}
