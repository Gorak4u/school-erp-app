import { NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

// GET all plans (admin only)
export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can view plans' }, { status: 403 });
    }

    const plans = await (saasPrisma as any).plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('GET /api/plans/admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create or update plans (admin only)
export async function POST(request: Request) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can manage plans' }, { status: 403 });
    }

    const { plans } = await request.json();

    if (!Array.isArray(plans)) {
      return NextResponse.json({ error: 'Plans must be an array' }, { status: 400 });
    }

    const results = [];

    for (const planData of plans) {
      const { id, ...planFields } = planData;

      if (id) {
        // Update existing plan
        const updated = await (saasPrisma as any).plan.update({
          where: { id },
          data: {
            ...planFields,
            features: typeof planFields.features === 'string' 
              ? planFields.features 
              : JSON.stringify(planFields.features),
          },
        });
        results.push({ action: 'updated', plan: updated });
      } else {
        // Create new plan
        const created = await (saasPrisma as any).plan.create({
          data: {
            ...planFields,
            features: typeof planFields.features === 'string' 
              ? planFields.features 
              : JSON.stringify(planFields.features),
          },
        });
        results.push({ action: 'created', plan: created });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('POST /api/plans/admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update single plan (admin only)
export async function PUT(request: Request) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can update plans' }, { status: 403 });
    }

    const { id, ...planData } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const updated = await (saasPrisma as any).plan.update({
      where: { id },
      data: {
        ...planData,
        features: typeof planData.features === 'string' 
          ? planData.features 
          : JSON.stringify(planData.features),
      },
    });

    return NextResponse.json({ plan: updated });
  } catch (error: any) {
    console.error('PUT /api/plans/admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete plan (admin only)
export async function DELETE(request: Request) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can delete plans' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Check if any schools are using this plan
    const subscriptionsCount = await (saasPrisma as any).subscription.count({
      where: { plan: id },
    });

    if (subscriptionsCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete plan', 
        details: `Used by ${subscriptionsCount} school(s)`,
        code: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 });
    }

    await (saasPrisma as any).plan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/plans/admin:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
