// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { name, description, color, icon, parentId, isActive } = body;

    const existing = await (schoolPrisma as any).expenseCategory.findFirst({
      where: { id, schoolId: ctx.schoolId },
    });
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const category = await (schoolPrisma as any).expenseCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ category });
  } catch (err: any) {
    console.error('PUT /api/expenses/categories/[id]:', err);
    return NextResponse.json({ error: 'Failed to update category', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const existing = await (schoolPrisma as any).expenseCategory.findFirst({
      where: { id, schoolId: ctx.schoolId },
    });
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const usageCount = await (schoolPrisma as any).expense.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (usageCount > 0) return NextResponse.json({ error: `Cannot delete — ${usageCount} expense(s) use this category` }, { status: 400 });

    await (schoolPrisma as any).expenseCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/expenses/categories/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete category', details: err.message }, { status: 500 });
  }
}
