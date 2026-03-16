import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { resolveUserDisplayName } from '@/lib/userName';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const status = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');
    const scope = searchParams.get('scope');

    const where: any = tenantWhere(ctx);
    if (status && status !== 'all') where.status = status;
    if (academicYear) where.academicYear = academicYear;
    if (scope && scope !== 'all') where.scope = scope;

    // Users can only see requests they created, UNLESS they are admin/principal
    if (ctx.role !== 'admin' && ctx.role !== 'principal' && !ctx.isSuperAdmin) {
      where.requestedBy = ctx.userId;
    }

    const [requests, total] = await Promise.all([
      (schoolPrisma as any).DiscountRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).DiscountRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      }
    });
  } catch (error) {
    console.error('GET /api/fees/discount-requests:', error);
    return NextResponse.json({ error: 'Failed to fetch discount requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const {
      name, description, discountType, discountValue, maxCapAmount,
      scope, targetType, feeStructureIds, studentIds, classIds, sectionIds,
      academicYear, reason, supportingDoc, validFrom, validTo
    } = body;

    // Validate
    if (!name || !discountType || discountValue === undefined || !scope || !targetType || !academicYear || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const requesterName = await resolveUserDisplayName(ctx.userId, ctx.email);

    // Create request in transaction to ensure audit log is also created
    const result = await (schoolPrisma as any).$transaction(async (tx: any) => {
      // 1. Create the request
      const discountReq = await tx.DiscountRequest.create({
        data: {
          schoolId: ctx.schoolId,
          name,
          description,
          discountType,
          discountValue: Number(discountValue),
          maxCapAmount: maxCapAmount ? Number(maxCapAmount) : null,
          scope,
          targetType,
          feeStructureIds: JSON.stringify(feeStructureIds || []),
          studentIds: JSON.stringify(studentIds || []),
          classIds: JSON.stringify(classIds || []),
          sectionIds: JSON.stringify(sectionIds || []),
          academicYear,
          reason,
          supportingDoc,
          status: 'pending',
          requestedBy: ctx.userId,
          requestedByEmail: ctx.email,
          requestedByName: requesterName,
          validFrom,
          validTo
        }
      });

      // 2. Create Audit Log
      await tx.DiscountRequestAuditLog.create({
        data: {
          schoolId: ctx.schoolId,
          discountRequestId: discountReq.id,
          action: 'created',
          actorUserId: ctx.userId,
          actorEmail: ctx.email,
          actorName: requesterName,
          actorRole: ctx.role || 'user',
          newStatus: 'pending',
          details: JSON.stringify({ reason })
        }
      });

      return discountReq;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('POST /api/fees/discount-requests:', error);
    return NextResponse.json({ error: 'Failed to create discount request' }, { status: 500 });
  }
}
