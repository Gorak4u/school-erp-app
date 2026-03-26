import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma-server';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { rateLimit, getClientIdentifier, validateSearchQuery, sanitizePaginationParams } from '@/lib/apiSecurity';
import { refundService } from '@/lib/services/refundService';

// Rate limiting constants (same as students page)
const REFUND_LIST_RATE_LIMIT = Number(process.env.REFUND_LIST_RATE_LIMIT_PER_MINUTE || '200');
const REFUND_CREATE_RATE_LIMIT = Number(process.env.REFUND_CREATE_RATE_LIMIT_PER_MINUTE || '5');
const RATE_LIMIT_WINDOW = 60_000; // 1 minute

// GET /api/refunds - List refunds with filters (AI-Optimized)
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Rate limiting check (same as students page)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, REFUND_LIST_RATE_LIMIT, RATE_LIMIT_WINDOW);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const studentId = searchParams.get('studentId');
    const priority = searchParams.get('priority');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: any = { schoolId: ctx.schoolId };
    
    if (status) where.status = status;
    if (type) where.type = type;
    if (studentId) where.studentId = studentId;
    if (priority) where.priority = priority;

    // Add search functionality (same as students page)
    const search = validateSearchQuery(searchParams.get('search') || '');
    if (search) {
      where.OR = [
        { student: { name: { startsWith: search, mode: 'insensitive' } } },
        { student: { admissionNo: { startsWith: search, mode: 'insensitive' } } },
        { reason: { startsWith: search, mode: 'insensitive' } },
        { type: { startsWith: search, mode: 'insensitive' } }
      ];
    }

    const [refunds, total] = await Promise.all([
      (schoolPrisma as any).RefundRequest.findMany({
        where,
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
          approvals: true // Simplified - just include approvals
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).RefundRequest.count({ where })
    ]);

    const response = NextResponse.json({
      refunds,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    response.headers.set('CDN-Cache-Control', 'max-age=300');

    return response;
  } catch (error) {
    console.error('GET /api/refunds:', error);
    return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
  }
}

// POST /api/refunds - Create refund request (AI-Optimized)
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Rate limiting check (same as students page)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, REFUND_CREATE_RATE_LIMIT, RATE_LIMIT_WINDOW);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: 'Too many refund creation requests. Please wait before creating another refund.',
        retryAfter: (rateLimitResult as any).retryAfter
      }, { status: 429 });
    }

    const {
      studentId,
      type,
      sourceId,
      sourceType,
      amount,
      adminFee = 0,
      reason,
      refundMethod,
      bankDetails,
      metadata
    } = await request.json();

    if (!studentId || !type || !amount || !reason || !refundMethod) {
      return NextResponse.json({
        error: 'studentId, type, amount, reason, and refundMethod are required'
      }, { status: 400 });
    }

    // Validate refund type
    const validTypes = ['academic_fee', 'transport_fee', 'fine', 'overpayment'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid refund type' }, { status: 400 });
    }

    // Validate refund method
    const validMethods = ['bank_transfer', 'credit_future', 'cash'];
    if (!validMethods.includes(refundMethod)) {
      return NextResponse.json({ error: 'Invalid refund method' }, { status: 400 });
    }

    // Check if student exists and belongs to school
    const student = await (schoolPrisma as any).Student.findFirst({
      where: { id: studentId, schoolId: ctx.schoolId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Validate source exists if provided
    if (sourceId && sourceType) {
      let sourceExists = false;
      
      switch (sourceType) {
        case 'FeeRecord':
          sourceExists = !!(await (schoolPrisma as any).FeeRecord.findFirst({
            where: { id: sourceId, studentId, schoolId: ctx.schoolId }
          }));
          break;
        case 'Fine':
          sourceExists = !!(await (schoolPrisma as any).Fine.findFirst({
            where: { id: sourceId, studentId, schoolId: ctx.schoolId }
          }));
          break;
        case 'StudentTransport':
          sourceExists = !!(await (schoolPrisma as any).StudentTransport.findFirst({
            where: { id: sourceId, studentId }
          }));
          break;
        default:
          return NextResponse.json({ error: 'Invalid source type' }, { status: 400 });
      }

      if (!sourceExists) {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
      }

      // Check for duplicate refund requests
      const existingRefund = await (schoolPrisma as any).RefundRequest.findFirst({
        where: {
          schoolId: ctx.schoolId,
          studentId,
          sourceId,
          sourceType,
          status: { not: 'rejected' }
        }
      });

      if (existingRefund) {
        return NextResponse.json({ 
          error: 'Refund request already exists for this source',
          existingRefundId: existingRefund.id,
          existingStatus: existingRefund.status
        }, { status: 409 });
      }
    }

    const netAmount = amount - adminFee;

    // Validate over-refund protection
    if (sourceId && sourceType) {
      let totalRefunded = 0;
      let originalAmount = 0;

      switch (sourceType) {
        case 'FeeRecord':
          const feeRecord = await (schoolPrisma as any).FeeRecord.findFirst({
            where: { id: sourceId, studentId, schoolId: ctx.schoolId }
          });
          if (feeRecord) {
            originalAmount = feeRecord.amount;
            const refunds = await (schoolPrisma as any).RefundRequest.findMany({
              where: { sourceId, sourceType, status: 'processed' }
            });
            totalRefunded = refunds.reduce((sum: number, r: any) => sum + r.netAmount, 0);
          }
          break;
        case 'Fine':
          const fine = await (schoolPrisma as any).Fine.findFirst({
            where: { id: sourceId, studentId, schoolId: ctx.schoolId }
          });
          if (fine) {
            originalAmount = fine.amount;
            const refunds = await (schoolPrisma as any).RefundRequest.findMany({
              where: { sourceId, sourceType, status: 'processed' }
            });
            totalRefunded = refunds.reduce((sum: number, r: any) => sum + r.netAmount, 0);
          }
          break;
      }

      if (totalRefunded + netAmount > originalAmount) {
        return NextResponse.json({ 
          error: 'Refund amount exceeds original payment',
          originalAmount,
          alreadyRefunded: totalRefunded,
          requestedAmount: netAmount,
          maximumAllowed: originalAmount - totalRefunded
        }, { status: 400 });
      }
    }
    
    // Auto-approve logic for amounts < 1000
    const isAutoApproved = netAmount < 1000 && type === 'overpayment';
    const status = isAutoApproved ? 'approved' : 'pending';
    const approvedBy = isAutoApproved ? 'system' : null;
    const approvedAt = isAutoApproved ? new Date() : null;
    const priority = netAmount >= 5000 ? 'high' : netAmount >= 1000 ? 'normal' : 'low';

    const refund = await (schoolPrisma as any).RefundRequest.create({
      data: {
        schoolId: ctx.schoolId,
        studentId,
        type,
        sourceId,
        sourceType,
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
        metadata,
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
          comments: 'Auto-approved: Amount < ₹1000 and type is overpayment'
        }
      });

      // Auto-process the refund for immediate completion
      await (schoolPrisma as any).RefundTransaction.create({
        data: {
          refundId: refund.id,
          amount: refund.netAmount,
          method: refund.refundMethod,
          transactionId: `AUTO-${refund.id.slice(-8).toUpperCase()}`,
          status: 'completed',
          processedBy: 'system',
          processedAt: new Date()
        }
      });

      // Update refund status to processed
      await (schoolPrisma as any).RefundRequest.update({
        where: { id: refund.id },
        data: {
          status: 'processed',
          processedBy: 'system',
          processedAt: new Date()
        }
      });
    }

    return NextResponse.json({ refund }, { status: 201 });
  } catch (error) {
    console.error('POST /api/refunds:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create refund request' 
    }, { status: 500 });
  }
}

