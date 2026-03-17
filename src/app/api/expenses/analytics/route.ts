// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { canViewExpensesAccess } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!canViewExpensesAccess(ctx)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const baseWhere: any = { schoolId: ctx.schoolId, deletedAt: null };
    if (academicYear && academicYear !== 'all') baseWhere.academicYear = academicYear;
    if (dateFrom || dateTo) {
      baseWhere.dateIncurred = {};
      if (dateFrom) baseWhere.dateIncurred.gte = dateFrom;
      if (dateTo) baseWhere.dateIncurred.lte = dateTo;
    }

    // Run all aggregations in parallel for performance
    const [
      totalCount,
      totalAmountAgg,
      pendingCount,
      pendingAmountAgg,
      approvedAmountAgg,
      paidAmountAgg,
      rejectedCount,
      categoryBreakdown,
      statusBreakdown,
      priorityBreakdown,
      budgetSummary,
      recentExpenses,
    ] = await Promise.all([
      (schoolPrisma as any).expense.count({ where: baseWhere }),
      (schoolPrisma as any).expense.aggregate({ where: baseWhere, _sum: { amount: true } }),
      (schoolPrisma as any).expense.count({ where: { ...baseWhere, status: 'pending' } }),
      (schoolPrisma as any).expense.aggregate({ where: { ...baseWhere, status: 'pending' }, _sum: { amount: true } }),
      (schoolPrisma as any).expense.aggregate({ where: { ...baseWhere, status: 'approved' }, _sum: { amount: true } }),
      (schoolPrisma as any).expense.aggregate({ where: { ...baseWhere, status: 'paid' }, _sum: { amount: true } }),
      (schoolPrisma as any).expense.count({ where: { ...baseWhere, status: 'rejected' } }),
      // Category breakdown
      (schoolPrisma as any).expense.groupBy({
        by: ['categoryId'],
        where: baseWhere,
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      }),
      // Status breakdown
      (schoolPrisma as any).expense.groupBy({
        by: ['status'],
        where: baseWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Priority breakdown
      (schoolPrisma as any).expense.groupBy({
        by: ['priority'],
        where: baseWhere,
        _count: { id: true },
        _sum: { amount: true },
      }),
      // Budget summary
      (schoolPrisma as any).budget.findMany({
        where: {
          schoolId: ctx.schoolId,
          ...(academicYear && academicYear !== 'all' ? { academicYear } : {}),
        },
        select: {
          id: true, name: true, totalAmount: true, spentAmount: true, remainingAmount: true,
          alertThreshold: true, status: true,
          category: { select: { name: true, color: true, icon: true } },
        },
        orderBy: { spentAmount: 'desc' },
        take: 10,
      }),
      // Recent 5 expenses
      (schoolPrisma as any).expense.findMany({
        where: baseWhere,
        include: { category: { select: { name: true, color: true, icon: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Enrich category breakdown with category names
    const categoryIds = categoryBreakdown.map((c: any) => c.categoryId);
    const categoryMap: Record<string, any> = {};
    if (categoryIds.length > 0) {
      const cats = await (schoolPrisma as any).expenseCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, color: true, icon: true },
      });
      cats.forEach((c: any) => { categoryMap[c.id] = c; });
    }

    // Monthly trend — last 12 months using dateIncurred grouping
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    const monthlyWhere = {
      schoolId: ctx.schoolId,
      deletedAt: null,
      dateIncurred: { gte: twelveMonthsAgo.toISOString().split('T')[0] },
    };
    const monthlyRaw = await (schoolPrisma as any).expense.findMany({
      where: monthlyWhere,
      select: { dateIncurred: true, amount: true, status: true },
    });

    // Aggregate by YYYY-MM
    const monthlyMap: Record<string, { month: string; total: number; paid: number; count: number }> = {};
    for (const e of monthlyRaw) {
      const month = e.dateIncurred.slice(0, 7); // YYYY-MM
      if (!monthlyMap[month]) monthlyMap[month] = { month, total: 0, paid: 0, count: 0 };
      monthlyMap[month].total += e.amount;
      monthlyMap[month].count += 1;
      if (e.status === 'paid') monthlyMap[month].paid += e.amount;
    }
    const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      summary: {
        totalCount,
        totalAmount: totalAmountAgg._sum.amount || 0,
        pendingCount,
        pendingAmount: pendingAmountAgg._sum.amount || 0,
        approvedAmount: approvedAmountAgg._sum.amount || 0,
        paidAmount: paidAmountAgg._sum.amount || 0,
        rejectedCount,
      },
      categoryBreakdown: categoryBreakdown.map((c: any) => ({
        categoryId: c.categoryId,
        category: categoryMap[c.categoryId] || { name: 'Unknown', color: null, icon: null },
        total: c._sum.amount || 0,
        count: c._count.id,
      })),
      statusBreakdown: statusBreakdown.map((s: any) => ({
        status: s.status,
        count: s._count.id,
        total: s._sum.amount || 0,
      })),
      priorityBreakdown: priorityBreakdown.map((p: any) => ({
        priority: p.priority,
        count: p._count.id,
        total: p._sum.amount || 0,
      })),
      budgetSummary: budgetSummary.map((b: any) => ({
        ...b,
        utilization: b.totalAmount > 0 ? Math.round((b.spentAmount / b.totalAmount) * 100) : 0,
        isOverBudget: b.spentAmount > b.totalAmount,
        isNearLimit: b.totalAmount > 0 && (b.spentAmount / b.totalAmount) * 100 >= b.alertThreshold,
      })),
      monthlyTrend,
      recentExpenses,
    });
  } catch (err: any) {
    console.error('GET /api/expenses/analytics:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics', details: err.message }, { status: 500 });
  }
}
