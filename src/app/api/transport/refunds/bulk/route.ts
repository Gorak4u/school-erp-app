import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

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

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    const refunds = [];
    const netAmount = 1000 - adminFee; // Fixed amount for bulk refunds
    const isAutoApproved = netAmount < 1000;

    for (const studentTransport of route.students) {
      // Check for existing refunds
      const existingRefund = await (schoolPrisma as any).RefundRequest.findFirst({
        where: {
          sourceId: studentTransport.id,
          sourceType: 'StudentTransport',
          status: { not: 'rejected' }
        }
      });

      if (existingRefund) continue; // Skip if refund already exists

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
          amount: 1000,
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
