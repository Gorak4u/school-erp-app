import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canApproveDiscountsAccess } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const canApproveDiscounts = canApproveDiscountsAccess(ctx);
    const canApproveLeaves = ctx.role === 'admin' || ctx.permissions?.includes('approve_department_leave') || ctx.permissions?.includes('approve_all_leave');

    if (!canApproveDiscounts && !canApproveLeaves) {
      return NextResponse.json({ 
        pendingCount: 0,
        approvals: []
      });
    }

    let pendingDiscounts: any[] = [];
    if (canApproveDiscounts) {
      pendingDiscounts = await (schoolPrisma as any).discountRequest.findMany({
        where: {
          ...tenantWhere(ctx),
          status: 'pending'
        },
        select: {
          id: true,
          name: true,
          discountType: true,
          discountValue: true,
          reason: true,
          requestedByName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    }

    let leaveNotifications: any[] = [];
    if (canApproveLeaves) {
      leaveNotifications = await (schoolPrisma as any).notification.findMany({
        where: {
          userId: ctx.userId,
          type: 'leave_approval_request',
          isRead: false
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    }

    const leaveApprovals = leaveNotifications.map(notification => {
      let metadata: any = {};
      try { metadata = notification.metadata ? JSON.parse(notification.metadata) : {}; } catch (e) {}
      return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        description: notification.message,
        reason: metadata.reason,
        createdAt: notification.createdAt,
        link: metadata.link || '/leave?tab=approvals'
      };
    });

    const discountApprovals = pendingDiscounts.map(d => ({
      id: d.id,
      type: 'discount_request',
      title: `Discount Request - ${d.name}`,
      description: `${d.discountType} discount of ${d.discountValue}${d.discountType === 'percentage' ? '%' : ''}`,
      reason: d.reason,
      createdAt: d.createdAt,
      link: `/fees?tab=discounts&requestId=${d.id}`
    }));

    const combinedApprovals = [...discountApprovals, ...leaveApprovals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    const pendingCount = pendingDiscounts.length + leaveNotifications.length;

    return NextResponse.json({
      pendingCount,
      approvals: combinedApprovals
    });
  } catch (error: any) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json({ error: 'Failed to fetch pending approvals' }, { status: 500 });
  }
}
