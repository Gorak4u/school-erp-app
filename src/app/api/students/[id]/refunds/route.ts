import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET /api/students/[id]/refunds - Get student refund history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id: studentId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');

    // Verify student belongs to school
    const student = await (schoolPrisma as any).Student.findFirst({
      where: { id: studentId, schoolId: ctx.schoolId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const where: any = { 
      studentId,
      schoolId: ctx.schoolId 
    };
    
    if (status) where.status = status;

    const [refunds, total] = await Promise.all([
      (schoolPrisma as any).RefundRequest.findMany({
        where,
        include: {
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
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).RefundRequest.count({ where })
    ]);

    // Calculate summary statistics
    const summary = await (schoolPrisma as any).RefundRequest.groupBy({
      by: ['status'],
      where: { studentId, schoolId: ctx.schoolId },
      _sum: {
        netAmount: true,
        amount: true
      },
      _count: true
    });

    const summaryStats = {
      totalRefunds: refunds.length,
      totalAmount: refunds.reduce((sum: number, refund: any) => sum + (refund.amount || 0), 0),
      totalNetAmount: refunds.reduce((sum: number, refund: any) => sum + (refund.netAmount || 0), 0),
      pendingCount: summary.find((s: any) => s.status === 'pending')?._count || 0,
      approvedCount: summary.find((s: any) => s.status === 'approved')?._count || 0,
      processedCount: summary.find((s: any) => s.status === 'processed')?._count || 0,
      rejectedCount: summary.find((s: any) => s.status === 'rejected')?._count || 0
    };

    return NextResponse.json({
      refunds,
      summary: summaryStats,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GET /api/students/[id]/refunds:', error);
    return NextResponse.json({ error: 'Failed to fetch student refunds' }, { status: 500 });
  }
}

// POST /api/students/[id]/refunds - Create refund request for student
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id: studentId } = await params;
    const {
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

    // Verify student belongs to school
    const student = await (schoolPrisma as any).Student.findFirst({
      where: { id: studentId, schoolId: ctx.schoolId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
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
    }

    const netAmount = amount - adminFee;
    
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
          comments: 'Auto-approved: Amount < ₹1000 and overpayment type'
        }
      });
    }

    return NextResponse.json({ refund }, { status: 201 });
  } catch (error) {
    console.error('POST /api/students/[id]/refunds:', error);
    return NextResponse.json({ error: 'Failed to create refund request' }, { status: 500 });
  }
}
