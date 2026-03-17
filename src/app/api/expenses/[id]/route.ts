// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { sendExpenseApprovedEmail, sendExpenseRejectedEmail, sendExpensePaidEmail } from '@/lib/expenseEmails';

function hasExpenseAccess(ctx: any, action = 'view') {
  if (ctx.role === 'admin' || ctx.isSuperAdmin) return true;
  const perms: string[] = ctx.permissions || [];
  if (action === 'view') return perms.includes('expenses.view') || perms.includes('expenses.create');
  if (action === 'create') return perms.includes('expenses.create');
  if (action === 'approve') return perms.includes('expenses.approve');
  return false;
}

async function logAudit(schoolId: string, expenseId: string, ctx: any, action: string, prevStatus?: string, newStatus?: string, details?: string) {
  try {
    await (schoolPrisma as any).expenseAuditLog.create({
      data: {
        schoolId,
        expenseId,
        action,
        actorId: ctx.userId,
        actorEmail: ctx.email,
        actorName: ctx.email,
        actorRole: ctx.role,
        prevStatus: prevStatus || null,
        newStatus: newStatus || null,
        details: details || null,
      },
    });
  } catch {}
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!hasExpenseAccess(ctx, 'view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const expense = await (schoolPrisma as any).expense.findFirst({
      where: { id, schoolId: ctx.schoolId, deletedAt: null },
      include: {
        category: true,
        budgetItems: { include: { budget: { select: { id: true, name: true, totalAmount: true, spentAmount: true } } } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    return NextResponse.json({ expense });
  } catch (err: any) {
    console.error('GET /api/expenses/[id]:', err);
    return NextResponse.json({ error: 'Failed to fetch expense', details: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!hasExpenseAccess(ctx, 'create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { action, ...fields } = body;

    const existing = await (schoolPrisma as any).expense.findFirst({
      where: { id, schoolId: ctx.schoolId, deletedAt: null },
    });
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    // Action-based state transitions
    if (action === 'approve') {
      if (!hasExpenseAccess(ctx, 'approve')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (existing.status !== 'pending') return NextResponse.json({ error: `Cannot approve expense with status '${existing.status}'` }, { status: 400 });

      const expense = await (schoolPrisma as any).expense.update({
        where: { id },
        data: {
          status: 'approved',
          approvedBy: ctx.userId,
          approvedByName: ctx.email,
          approvedAt: new Date(),
          approvalNote: fields.approvalNote || null,
        },
        include: { category: { select: { id: true, name: true, color: true, icon: true } } },
      });
      await logAudit(ctx.schoolId, id, ctx, 'approved', 'pending', 'approved', fields.approvalNote);
      sendExpenseApprovedEmail(expense, ctx.schoolId).catch(() => {});
      const res = NextResponse.json({ expense });
      res.headers.set('X-Toast', JSON.stringify({ type: 'success', title: 'Expense approved', message: `You approved "${expense.title}" (₹${expense.amount.toLocaleString('en-IN')})` }));
      return res;
    }

    if (action === 'reject') {
      if (!hasExpenseAccess(ctx, 'approve')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      if (existing.status !== 'pending') return NextResponse.json({ error: `Cannot reject expense with status '${existing.status}'` }, { status: 400 });
      if (!fields.rejectionReason?.trim()) return NextResponse.json({ error: 'rejectionReason is required' }, { status: 400 });

      const expense = await (schoolPrisma as any).expense.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectedBy: ctx.userId,
          rejectedAt: new Date(),
          rejectionReason: fields.rejectionReason,
        },
        include: { category: { select: { id: true, name: true, color: true, icon: true } } },
      });
      await logAudit(ctx.schoolId, id, ctx, 'rejected', 'pending', 'rejected', fields.rejectionReason);
      sendExpenseRejectedEmail(expense, fields.rejectionReason, ctx.schoolId).catch(() => {});
      const res = NextResponse.json({ expense });
      res.headers.set('X-Toast', JSON.stringify({ type: 'warning', title: 'Expense rejected', message: `You rejected "${expense.title}" (₹${expense.amount.toLocaleString('en-IN')})` }));
      return res;
    }

    if (action === 'pay') {
      if (existing.status !== 'approved') return NextResponse.json({ error: `Cannot mark as paid — expense is '${existing.status}' (must be approved first)` }, { status: 400 });

      const expense = await (schoolPrisma as any).expense.update({
        where: { id },
        data: {
          status: 'paid',
          paidBy: ctx.userId,
          paidAt: new Date(),
          paymentMethod: fields.paymentMethod || existing.paymentMethod,
          remarks: fields.remarks || existing.remarks,
        },
        include: { category: { select: { id: true, name: true, color: true, icon: true } } },
      });
      await logAudit(ctx.schoolId, id, ctx, 'paid', 'approved', 'paid', fields.paymentMethod);
      sendExpensePaidEmail(expense, fields.paymentMethod || existing.paymentMethod, ctx.schoolId).catch(() => {});
      const res = NextResponse.json({ expense });
      res.headers.set('X-Toast', JSON.stringify({ type: 'success', title: 'Expense marked as paid', message: `You marked "${expense.title}" (₹${expense.amount.toLocaleString('en-IN')}) as paid` }));
      return res;
    }

    // Regular update — only pending expenses can be edited
    if (existing.status !== 'pending') return NextResponse.json({ error: `Cannot edit expense with status '${existing.status}'` }, { status: 400 });

    const updateData: any = {};
    if (fields.title !== undefined) updateData.title = fields.title.trim();
    if (fields.description !== undefined) updateData.description = fields.description;
    if (fields.amount !== undefined) updateData.amount = Number(fields.amount);
    if (fields.categoryId !== undefined) updateData.categoryId = fields.categoryId;
    if (fields.dateIncurred !== undefined) updateData.dateIncurred = fields.dateIncurred;
    if (fields.paymentMethod !== undefined) updateData.paymentMethod = fields.paymentMethod;
    if (fields.priority !== undefined) updateData.priority = fields.priority;
    if (fields.vendorName !== undefined) updateData.vendorName = fields.vendorName;
    if (fields.vendorDetails !== undefined) updateData.vendorDetails = fields.vendorDetails;
    if (fields.tags !== undefined) updateData.tags = JSON.stringify(fields.tags);
    if (fields.remarks !== undefined) updateData.remarks = fields.remarks;
    if (fields.receiptUrl !== undefined) updateData.receiptUrl = fields.receiptUrl;

    const expense = await (schoolPrisma as any).expense.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });
    await logAudit(ctx.schoolId, id, ctx, 'updated', existing.status, existing.status, 'Expense details updated');
    return NextResponse.json({ expense });
  } catch (err: any) {
    console.error('PUT /api/expenses/[id]:', err);
    return NextResponse.json({ error: 'Failed to update expense', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    
    const { id } = await params;
    const existing = await (schoolPrisma as any).expense.findFirst({
      where: { id, schoolId: ctx.schoolId, deletedAt: null },
    });
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    if (existing.status === 'paid') return NextResponse.json({ error: 'Cannot delete a paid expense' }, { status: 400 });
    
    // Admin-only delete restriction for rejected expenses
    if (existing.status === 'rejected' && ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ 
        error: 'Only administrators can delete rejected expenses', 
        details: 'Rejected expenses require admin-level privileges for deletion to maintain audit trail.'
      }, { status: 403 });
    }

    // For non-rejected expenses, require admin or super admin
    if (existing.status !== 'rejected' && ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await (schoolPrisma as any).expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Reverse budget impact
    const budgetItems = await (schoolPrisma as any).budgetItem.findMany({ where: { expenseId: id } });
    for (const item of budgetItems) {
      const budget = await (schoolPrisma as any).budget.findUnique({ where: { id: item.budgetId } });
      if (budget) {
        const newSpent = Math.max(0, budget.spentAmount - item.amount);
        await (schoolPrisma as any).budget.update({
          where: { id: item.budgetId },
          data: { spentAmount: newSpent, remainingAmount: budget.totalAmount - newSpent },
        });
      }
    }

    await logAudit(ctx.schoolId, id, ctx, 'deleted', existing.status, null, 'Expense soft-deleted');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/expenses/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete expense', details: err.message }, { status: 500 });
  }
}
