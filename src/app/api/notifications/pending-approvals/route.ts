import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Only admins and super admins can approve discounts
    const canApprove = ctx.role === 'admin' || ctx.isSuperAdmin;
    
    if (!canApprove) {
      return NextResponse.json({ 
        pendingCount: 0,
        approvals: []
      });
    }

    // Get pending discount requests
    const pendingDiscounts = await (schoolPrisma as any).discountRequest.findMany({
      where: {
        ...tenantWhere(ctx),
        status: 'pending'
      },
      select: {
        id: true,
        studentName: true,
        discountType: true,
        discountValue: true,
        reason: true,
        requestedBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Limit to recent 10
    });

    const pendingCount = pendingDiscounts.length;

    return NextResponse.json({
      pendingCount,
      approvals: pendingDiscounts.map((d: any) => ({
        id: d.id,
        type: 'discount_request',
        title: `Discount Request - ${d.studentName}`,
        description: `${d.discountType} discount of ${d.discountValue}${d.discountType === 'percentage' ? '%' : ''}`,
        reason: d.reason,
        createdAt: d.createdAt,
        link: `/fees?tab=discounts&requestId=${d.id}`
      }))
    });
  } catch (error: any) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json({ error: 'Failed to fetch pending approvals' }, { status: 500 });
  }
}
