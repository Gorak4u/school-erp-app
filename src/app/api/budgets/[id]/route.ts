// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

function hasBudgetAccess(ctx: any) {
  if (ctx.role === 'admin' || ctx.isSuperAdmin) return true;
  const perms: string[] = ctx.permissions || [];
  return perms.includes('expenses.manage_budgets');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!hasBudgetAccess(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const budget = await (schoolPrisma as any).budget.findFirst({
      where: { id, schoolId: ctx.schoolId },
      include: {
        category: true,
        items: {
          include: {
            expense: {
              select: {
                id: true, title: true, amount: true, status: true, dateIncurred: true,
                category: { select: { name: true, color: true, icon: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!budget) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });

    return NextResponse.json({
      budget: {
        ...budget,
        utilization: budget.totalAmount > 0 ? Math.round((budget.spentAmount / budget.totalAmount) * 100) : 0,
        isOverBudget: budget.spentAmount > budget.totalAmount,
        isNearLimit: budget.totalAmount > 0 && (budget.spentAmount / budget.totalAmount) * 100 >= budget.alertThreshold,
      },
    });
  } catch (err: any) {
    console.error('GET /api/budgets/[id]:', err);
    return NextResponse.json({ error: 'Failed to fetch budget', details: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!hasBudgetAccess(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const existing = await (schoolPrisma as any).budget.findFirst({
      where: { id, schoolId: ctx.schoolId },
    });
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.totalAmount !== undefined) {
      const total = Number(body.totalAmount);
      updateData.totalAmount = total;
      updateData.remainingAmount = total - existing.spentAmount;
    }
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId || null;
    if (body.startDate !== undefined) updateData.startDate = body.startDate;
    if (body.endDate !== undefined) updateData.endDate = body.endDate;
    if (body.alertThreshold !== undefined) updateData.alertThreshold = Number(body.alertThreshold);
    if (body.status !== undefined) updateData.status = body.status;

    const budget = await (schoolPrisma as any).budget.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });

    return NextResponse.json({ budget });
  } catch (err: any) {
    console.error('PUT /api/budgets/[id]:', err);
    return NextResponse.json({ error: 'Failed to update budget', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const existing = await (schoolPrisma as any).budget.findFirst({
      where: { id, schoolId: ctx.schoolId },
    });
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });

    await (schoolPrisma as any).budget.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/budgets/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete budget', details: err.message }, { status: 500 });
  }
}
