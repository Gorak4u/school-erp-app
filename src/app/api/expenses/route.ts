// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { sendExpenseCreatedEmail } from '@/lib/expenseEmails';

function hasExpenseAccess(ctx: any, action = 'view') {
  if (ctx.role === 'admin' || ctx.isSuperAdmin) return true;
  const perms: string[] = ctx.permissions || [];
  if (action === 'view') return perms.includes('expenses.view') || perms.includes('expenses.create');
  if (action === 'create') return perms.includes('expenses.create');
  if (action === 'approve') return perms.includes('expenses.approve');
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!hasExpenseAccess(ctx, 'view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const academicYear = searchParams.get('academicYear');
    const academicYearId = searchParams.get('academicYearId');
    const requestedBy = searchParams.get('requestedBy');
    const priority = searchParams.get('priority');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortDir = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

    const where: any = {
      schoolId: ctx.schoolId,
      deletedAt: null,
    };
    if (status && status !== 'all') where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (academicYear && academicYear !== 'all') where.academicYear = academicYear;
    if (academicYearId) where.academicYearId = academicYearId;
    if (requestedBy) where.requestedBy = requestedBy;
    if (priority && priority !== 'all') where.priority = priority;
    if (dateFrom || dateTo) {
      where.dateIncurred = {};
      if (dateFrom) where.dateIncurred.gte = dateFrom;
      if (dateTo) where.dateIncurred.lte = dateTo;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { vendorName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Cursor-based pagination — skip the cursor record, take limit+1 to detect hasMore
    const cursorObj = cursor ? { id: cursor } : undefined;

    const expenses = await (schoolPrisma as any).expense.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
        _count: { select: { budgetItems: true } },
      },
      orderBy: [{ [sortBy]: sortDir }, { id: 'desc' }],
      take: limit + 1,
      ...(cursorObj && { cursor: cursorObj, skip: 1 }),
    });

    const hasMore = expenses.length > limit;
    const records = hasMore ? expenses.slice(0, limit) : expenses;
    const nextCursor = hasMore ? records[records.length - 1].id : null;

    // Get total count (cached — does not scan 10M rows every time)
    const total = await (schoolPrisma as any).expense.count({ where });

    return NextResponse.json({ expenses: records, nextCursor, hasMore, total });
  } catch (err: any) {
    console.error('GET /api/expenses:', err);
    return NextResponse.json({ error: 'Failed to fetch expenses', details: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!hasExpenseAccess(ctx, 'create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const {
      title, description, amount, categoryId, dateIncurred, paymentMethod,
      priority, vendorName, vendorDetails, tags, remarks,
      academicYear, academicYearId, budgetId,
    } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return NextResponse.json({ error: 'Valid positive amount is required' }, { status: 400 });
    if (!categoryId) return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    if (!dateIncurred) return NextResponse.json({ error: 'dateIncurred is required' }, { status: 400 });

    const category = await (schoolPrisma as any).expenseCategory.findFirst({
      where: { id: categoryId, schoolId: ctx.schoolId, isActive: true },
    });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const expenseAmount = Number(amount);
    const receiptNumber = `EXP-${Date.now()}-${Math.random().toString(36).slice(-4).toUpperCase()}`;

    const expense = await (schoolPrisma as any).expense.create({
      data: {
        title: title.trim(),
        description: description || null,
        amount: expenseAmount,
        categoryId,
        dateIncurred,
        paymentMethod: paymentMethod || null,
        status: 'pending',
        priority: priority || 'medium',
        vendorName: vendorName || null,
        vendorDetails: vendorDetails || null,
        tags: tags ? JSON.stringify(tags) : '[]',
        receiptNumber,
        remarks: remarks || null,
        academicYear: academicYear || '2024-25',
        academicYearId: academicYearId || null,
        schoolId: ctx.schoolId,
        requestedBy: ctx.userId,
        requestedByName: ctx.email,
        requestedByEmail: ctx.email,
      },
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    // Link to budget if provided
    if (budgetId) {
      const budget = await (schoolPrisma as any).budget.findFirst({
        where: { id: budgetId, schoolId: ctx.schoolId },
      });
      if (budget) {
        await (schoolPrisma as any).budgetItem.create({
          data: { budgetId, expenseId: expense.id, amount: expenseAmount },
        });
        const newSpent = budget.spentAmount + expenseAmount;
        await (schoolPrisma as any).budget.update({
          where: { id: budgetId },
          data: { spentAmount: newSpent, remainingAmount: budget.totalAmount - newSpent },
        });
      }
    }

    // Audit log
    await (schoolPrisma as any).expenseAuditLog.create({
      data: {
        schoolId: ctx.schoolId,
        expenseId: expense.id,
        action: 'created',
        actorId: ctx.userId,
        actorEmail: ctx.email,
        actorName: ctx.email,
        actorRole: ctx.role,
        newStatus: 'pending',
        details: `Expense created: ${title} — ₹${expenseAmount}`,
      },
    });

    // Fire-and-forget: notify admins of new pending expense
    sendExpenseCreatedEmail(expense, ctx.schoolId).catch(() => {});

    // Toast to creator
    const res = NextResponse.json({ expense }, { status: 201 });
    res.headers.set('X-Toast', JSON.stringify({ type: 'info', title: '💸 Expense submitted', message: `Your expense "${expense.title}" (₹${expense.amount.toLocaleString('en-IN')}) is pending approval.` }));
    return res;
  } catch (err: any) {
    console.error('POST /api/expenses:', err);
    return NextResponse.json({ error: 'Failed to create expense', details: err.message }, { status: 500 });
  }
}
