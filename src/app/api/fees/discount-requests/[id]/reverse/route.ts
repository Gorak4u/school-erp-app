import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canReverseDiscountsAccess } from '@/lib/permissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canReverseDiscountsAccess(ctx)) {
      return NextResponse.json({ error: 'Only admins can reverse discounts' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reversal reason is required' }, { status: 400 });
    }

    // 1. Fetch the applied request
    const discountReq = await (schoolPrisma as any).DiscountRequest.findUnique({
      where: { id, ...tenantWhere(ctx) }
    });

    if (!discountReq) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (discountReq.status !== 'applied') return NextResponse.json({ error: 'Only applied requests can be reversed' }, { status: 400 });

    // 2. Fetch all active applications for this request
    const applications = await (schoolPrisma as any).DiscountApplication.findMany({
      where: {
        discountRequestId: id,
        isReversed: false,
        ...tenantWhere(ctx)
      }
    });

    if (applications.length === 0) {
      return NextResponse.json({ error: 'No active applications found to reverse' }, { status: 400 });
    }

    // 3. Prepare reverse operations
    const updates = [];
    
    for (const app of applications) {
      updates.push(
        (schoolPrisma as any).$executeRawUnsafe(
          `UPDATE "school"."FeeRecord" SET "discount" = GREATEST(0, "discount" - $1), "pendingAmount" = "amount" - "paidAmount" - GREATEST(0, "discount" - $1) WHERE id = $2 AND "schoolId" = $3`,
          app.discountAmount,
          app.feeRecordId,
          ctx.schoolId
        )
      );
    }

    // 4. Execute batch operations
    await (schoolPrisma as any).$transaction([
      ...updates,
      (schoolPrisma as any).DiscountApplication.updateMany({
        where: {
          discountRequestId: id,
          isReversed: false,
          ...tenantWhere(ctx)
        },
        data: {
          isReversed: true,
          reversedBy: ctx.userId,
          reversedByEmail: ctx.email,
          reversedAt: new Date(),
          reversalReason: reason
        }
      }),
      (schoolPrisma as any).DiscountRequest.update({
        where: { id },
        data: {
          status: 'cancelled' // Or create a 'reversed' status
        }
      }),
      (schoolPrisma as any).DiscountRequestAuditLog.create({
        data: {
          schoolId: ctx.schoolId,
          discountRequestId: id,
          action: 'reversed',
          actorUserId: ctx.userId,
          actorEmail: ctx.email,
          actorName: ctx.email.split('@')[0],
          actorRole: ctx.role || 'admin',
          previousStatus: 'applied',
          newStatus: 'cancelled',
          details: JSON.stringify({ reversedCount: applications.length, reason })
        }
      })
    ]);

    return NextResponse.json({ success: true, data: { reversedCount: applications.length } });
  } catch (err) {
    console.error('POST /api/fees/discount-requests/[id]/reverse:', err);
    return NextResponse.json({ error: 'Failed to reverse discount' }, { status: 500 });
  }
}
