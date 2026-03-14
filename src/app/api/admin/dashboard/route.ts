import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const p = saasPrisma as any;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trialExpirySoon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalSchools,
      activeSchools,
      demoSchools,
      blockedSchools,
      totalUsers,
      totalStudents,
      totalTeachers,
      newSchoolsThisMonth,
      newSchoolsThisWeek,
      subscriptions,
      plans,
      trialsExpiringSoon,
      recentSchools,
      recentAuditLogs,
    ] = await Promise.all([
      p.school.count(),
      p.school.count({ where: { isActive: true } }),
      p.school.count({ where: { isDemo: true } }),
      p.school.count({ where: { isActive: false } }),
      p.user.count(),
      p.student.count(),
      p.teacher.count(),
      p.school.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      p.school.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      p.subscription.findMany({
        select: { plan: true, status: true },
      }),
      p.plan.findMany({ where: { isActive: true }, select: { name: true, priceMonthly: true } }),
      p.subscription.findMany({
        where: {
          status: 'trial',
          trialEndsAt: { gte: now, lte: trialExpirySoon },
        },
        include: {  },
        orderBy: { trialEndsAt: 'asc' },
        take: 10,
      }),
      p.school.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, name: true, createdAt: true, isActive: true,
          subscription: { select: { plan: true, status: true } },
        },
      }),
      p.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Compute plan-based MRR: sum priceMonthly for active subscriptions
    const planPriceMap: Record<string, number> = {};
    for (const pl of plans) planPriceMap[pl.name] = pl.priceMonthly || 0;

    let mrr = 0;
    const subByPlan: Record<string, number> = {};
    const subByStatus: Record<string, number> = {};
    for (const s of subscriptions) {
      subByPlan[s.plan] = (subByPlan[s.plan] || 0) + 1;
      subByStatus[s.status] = (subByStatus[s.status] || 0) + 1;
      if (s.status === 'active') {
        mrr += planPriceMap[s.plan] || 0;
      }
    }

    const activeCount = subByStatus['active'] || 0;
    const trialCount = subByStatus['trial'] || 0;
    const expiredCount = subByStatus['expired'] || 0;
    const churnRate = totalSchools > 0 ? Math.round((expiredCount / totalSchools) * 100) : 0;
    const trialConversion = (trialCount + activeCount) > 0
      ? Math.round((activeCount / (trialCount + activeCount)) * 100)
      : 0;

    return NextResponse.json({
      // Core counts
      totalSchools,
      activeSchools,
      blockedSchools,
      demoSchools,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalSubscriptions: subscriptions.length,
      // Growth
      newSchoolsThisMonth,
      newSchoolsThisWeek,
      // Revenue
      mrr,
      arr: mrr * 12,
      // Rates
      churnRate,
      trialConversion,
      // Breakdowns
      subscriptionsByPlan: subByPlan,
      subscriptionsByStatus: subByStatus,
      // Alerts
      trialsExpiringSoon: trialsExpiringSoon.map((t: any) => ({
        schoolId: t.school?.id,
        schoolName: t.school?.name,
        trialEndsAt: t.trialEndsAt,
        daysLeft: Math.ceil((new Date(t.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      // Recent activity
      recentSchools,
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
