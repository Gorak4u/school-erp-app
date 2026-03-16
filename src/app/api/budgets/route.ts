// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

function hasBudgetAccess(ctx: any) {
  if (ctx.role === 'admin' || ctx.isSuperAdmin) return true;
  const perms: string[] = ctx.permissions || [];
  return perms.includes('expenses.manage_budgets');
}

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!hasBudgetAccess(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const academicYearId = searchParams.get('academicYearId');
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');

    const where: any = { schoolId: ctx.schoolId };
    if (academicYear && academicYear !== 'all') where.academicYear = academicYear;
    if (academicYearId) where.academicYearId = academicYearId;
    if (status && status !== 'all') where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const budgets = await (schoolPrisma as any).budget.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute utilization % for each budget
    const enriched = budgets.map((b: any) => ({
      ...b,
      utilization: b.totalAmount > 0 ? Math.round((b.spentAmount / b.totalAmount) * 100) : 0,
      isOverBudget: b.spentAmount > b.totalAmount,
      isNearLimit: b.totalAmount > 0 && (b.spentAmount / b.totalAmount) * 100 >= b.alertThreshold,
    }));

    return NextResponse.json({ budgets: enriched });
  } catch (err: any) {
    console.error('GET /api/budgets:', err);
    return NextResponse.json({ error: 'Failed to fetch budgets', details: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!hasBudgetAccess(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, description, totalAmount, categoryId, academicYear, academicYearId, startDate, endDate, alertThreshold } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!totalAmount || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) {
      return NextResponse.json({ error: 'Valid positive totalAmount is required' }, { status: 400 });
    }
    if (!startDate || !endDate) return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });

    const total = Number(totalAmount);
    const budget = await (schoolPrisma as any).budget.create({
      data: {
        name: name.trim(),
        description: description || null,
        totalAmount: total,
        spentAmount: 0,
        remainingAmount: total,
        categoryId: categoryId || null,
        academicYear: academicYear || '2024-25',
        academicYearId: academicYearId || null,
        startDate,
        endDate,
        alertThreshold: alertThreshold ? Number(alertThreshold) : 80,
        status: 'active',
        createdBy: ctx.userId,
        createdByName: ctx.email,
        schoolId: ctx.schoolId,
      },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/budgets:', err);
    return NextResponse.json({ error: 'Failed to create budget', details: err.message }, { status: 500 });
  }
}
