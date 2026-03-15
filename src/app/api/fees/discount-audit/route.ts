import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Only admins/principals can view school-wide audit logs
    if (ctx.role !== 'admin' && ctx.role !== 'principal' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const action = searchParams.get('action');

    const where: any = tenantWhere(ctx);
    if (action && action !== 'all') where.action = action;

    const [logs, total] = await Promise.all([
      (schoolPrisma as any).DiscountRequestAuditLog.findMany({
        where,
        include: {
          discountRequest: {
            select: {
              name: true,
              scope: true,
              discountType: true,
              discountValue: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).DiscountRequestAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      }
    });
  } catch (error) {
    console.error('GET /api/fees/discount-audit:', error);
    return NextResponse.json({ error: 'Failed to fetch school-wide audit logs' }, { status: 500 });
  }
}
