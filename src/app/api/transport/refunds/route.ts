import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

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

    const where: any = { 
      schoolId: ctx.schoolId,
      type: 'transport_fee'
    };
    
    if (status) where.status = status;
    if (studentTransportId) where.sourceId = studentTransportId;

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
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).RefundRequest.count({ where })
    ]);

    // Calculate transport-specific statistics
    const stats = await (schoolPrisma as any).RefundRequest.aggregate({
      where: { schoolId: ctx.schoolId, type: 'transport_fee' },
      _sum: { amount: true, netAmount: true },
      _count: true
    });

    // Get route-specific data if routeId is provided
    let routeData = null;
    if (routeId) {
      routeData = await (schoolPrisma as any).TransportRoute.findFirst({
        where: { id: routeId, schoolId: ctx.schoolId },
        include: {
          students: {
            where: { isActive: true },
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
          }
        }
      });
    }

    return NextResponse.json({
      refunds,
      total,
      stats: {
        totalRefunds: stats._count,
        totalAmount: stats._sum.amount || 0,
        totalNetAmount: stats._sum.netAmount || 0
      },
      routeData,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('GET /api/transport/refunds:', error);
    return NextResponse.json({ error: 'Failed to fetch transport refunds' }, { status: 500 });
  }
}

// POST /api/transport/refunds/bulk - Bulk transport refunds
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { routeId, reason, adminFee = 0, refundMethod } = await request.json();

    if (!routeId || !reason || !refundMethod) {
      return NextResponse.json({
        error: 'routeId, reason, and refundMethod are required'
      }, { status: 400 });
    }

    // Get all active students on the route
    const route = await (schoolPrisma as any).TransportRoute.findFirst({
      where: { id: routeId, schoolId: ctx.schoolId },
      include: {
        students: {
          where: { isActive: true },
          include: {
            student: true
          }
        }
      }
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Create refund requests for all students
    const refunds = [];
    for (const studentTransport of route.students) {
      const amount = studentTransport.monthlyFee;
      const netAmount = amount - adminFee;
      
      // Auto-approve logic for amounts < 1000
      const isAutoApproved = netAmount < 1000;
      const status = isAutoApproved ? 'approved' : 'pending';
      const approvedBy = isAutoApproved ? 'system' : null;
      const approvedAt = isAutoApproved ? new Date() : null;
      const priority = netAmount >= 5000 ? 'high' : netAmount >= 1000 ? 'normal' : 'low';

      const refund = await (schoolPrisma as any).RefundRequest.create({
        data: {
          schoolId: ctx.schoolId,
          studentId: studentTransport.studentId,
          type: 'transport_fee',
          sourceId: studentTransport.id,
          sourceType: 'StudentTransport',
          amount,
          adminFee,
          netAmount,
          reason,
          status,
          priority,
          refundMethod,
          approvedBy,
          approvedAt,
          metadata: {
            bulkRefund: true,
            routeId,
            routeName: route.routeName
          },
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
            comments: 'Auto-approved: Amount < ₹1000'
          }
        });
      }

      refunds.push(refund);
    }

    return NextResponse.json({ 
      message: `Created ${refunds.length} refund requests`,
      refunds 
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/transport/refunds/bulk:', error);
    return NextResponse.json({ error: 'Failed to create bulk refunds' }, { status: 500 });
  }
}
