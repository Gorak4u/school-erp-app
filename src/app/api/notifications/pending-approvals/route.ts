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
    const canApproveFines = ctx.role === 'admin' || ctx.role === 'super_admin' || ctx.permissions?.includes('manage_fines');
    const canApproveTransport = ctx.role === 'admin' || ctx.role === 'super_admin' || ctx.permissions?.includes('manage_transport');

    if (!canApproveDiscounts && !canApproveLeaves && !canApproveFines && !canApproveTransport) {
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

    // Fetch pending fine waiver requests
    let pendingFineWaivers: any[] = [];
    if (canApproveFines) {
      pendingFineWaivers = await (schoolPrisma as any).FineWaiverRequest.findMany({
        where: {
          schoolId: ctx.schoolId,
          status: 'pending'
        },
        select: {
          id: true,
          fineId: true,
          waiveAmount: true,
          reason: true,
          requesterName: true,
          createdAt: true,
          fine: {
            select: {
              fineNumber: true,
              type: true,
              student: {
                select: {
                  name: true,
                  admissionNo: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    }

    // Fetch pending transport refund/waiver requests
    let pendingTransportRequests: any[] = [];
    if (canApproveTransport) {
      pendingTransportRequests = await (schoolPrisma as any).RefundRequest.findMany({
        where: {
          schoolId: ctx.schoolId,
          status: 'pending',
          type: { in: ['transport_fee', 'transport_fee_waiver'] }
        },
        select: {
          id: true,
          type: true,
          amount: true,
          netAmount: true,
          reason: true,
          priority: true,
          createdAt: true,
          student: {
            select: {
              name: true,
              admissionNo: true,
              class: true,
              section: true
            }
          }
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

    // Map fine waiver requests to approval format
    const fineWaiverApprovals = pendingFineWaivers.map(fw => ({
      id: fw.id,
      type: 'fine_waiver',
      title: `Fine Waiver - ${fw.fine?.student?.name || 'Unknown'}`,
      description: `Waiver of ₹${fw.waiveAmount} for fine #${fw.fine?.fineNumber || fw.fineId.slice(-6)}${fw.fine?.type ? ` (${fw.fine.type})` : ''}`,
      reason: fw.reason,
      createdAt: fw.createdAt,
      link: '/fines/waiver-requests'
    }));

    // Map transport refund/waiver requests to approval format
    const transportApprovals = pendingTransportRequests.map(tr => ({
      id: tr.id,
      type: tr.type,
      title: tr.type === 'transport_fee_waiver' 
        ? `Transport Waiver - ${tr.student?.name || 'Unknown'}`
        : `Transport Refund - ${tr.student?.name || 'Unknown'}`,
      description: tr.type === 'transport_fee_waiver'
        ? `Waiver of ₹${tr.amount} for transport fees`
        : `Refund of ₹${tr.netAmount} (gross: ₹${tr.amount})`,
      reason: tr.reason,
      priority: tr.priority,
      createdAt: tr.createdAt,
      link: '/transport/refunds'
    }));

    const combinedApprovals = [
      ...discountApprovals, 
      ...leaveApprovals, 
      ...fineWaiverApprovals,
      ...transportApprovals
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

    const pendingCount = pendingDiscounts.length + leaveNotifications.length + pendingFineWaivers.length + pendingTransportRequests.length;

    return NextResponse.json({
      pendingCount,
      approvals: combinedApprovals
    });
  } catch (error: any) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json({ error: 'Failed to fetch pending approvals' }, { status: 500 });
  }
}
