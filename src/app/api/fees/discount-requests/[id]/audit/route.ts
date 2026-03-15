import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    
    // Admins and Principals can view audit logs. 
    // Requesters can also view audit logs for their own requests.
    const discountReq = await (schoolPrisma as any).DiscountRequest.findUnique({
      where: { id, ...tenantWhere(ctx) }
    });

    if (!discountReq) {
      return NextResponse.json({ error: 'Discount request not found' }, { status: 404 });
    }

    if (ctx.role !== 'admin' && ctx.role !== 'principal' && !ctx.isSuperAdmin && discountReq.requestedBy !== ctx.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const auditLogs = await (schoolPrisma as any).DiscountRequestAuditLog.findMany({
      where: {
        discountRequestId: id,
        ...tenantWhere(ctx)
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: auditLogs });
  } catch (err) {
    console.error('GET /api/fees/discount-requests/[id]/audit:', err);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
