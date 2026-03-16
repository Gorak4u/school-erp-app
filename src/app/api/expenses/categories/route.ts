// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

function hasExpenseAccess(ctx: any) {
  if (ctx.role === 'admin' || ctx.isSuperAdmin) return true;
  const perms: string[] = ctx.permissions || [];
  return perms.includes('expenses.view') || perms.includes('expenses.create') || perms.includes('expenses.manage_budgets');
}

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!hasExpenseAccess(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const includeSubcategories = searchParams.get('includeSubcategories') !== 'false';
    const parentOnly = searchParams.get('parentOnly') === 'true';

    const where: any = {
      schoolId: ctx.schoolId,
      isActive: true,
    };
    if (parentOnly) where.parentId = null;

    const categories = await (schoolPrisma as any).expenseCategory.findMany({
      where,
      include: includeSubcategories ? {
        subcategories: { where: { isActive: true }, orderBy: { name: 'asc' } },
        _count: { select: { expenses: { where: { deletedAt: null, schoolId: ctx.schoolId } } } }
      } : {
        _count: { select: { expenses: { where: { deletedAt: null, schoolId: ctx.schoolId } } } }
      },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error('GET /api/expenses/categories:', err);
    return NextResponse.json({ error: 'Failed to fetch categories', details: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, description, color, icon, parentId } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 });

    const existing = await (schoolPrisma as any).expenseCategory.findFirst({
      where: { name: name.trim(), schoolId: ctx.schoolId, isActive: true },
    });
    if (existing) return NextResponse.json({ error: `Category '${name}' already exists` }, { status: 400 });

    const category = await (schoolPrisma as any).expenseCategory.create({
      data: {
        name: name.trim(),
        description: description || null,
        color: color || null,
        icon: icon || null,
        parentId: parentId || null,
        isActive: true,
        schoolId: ctx.schoolId,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/expenses/categories:', err);
    return NextResponse.json({ error: 'Failed to create category', details: err.message }, { status: 500 });
  }
}
