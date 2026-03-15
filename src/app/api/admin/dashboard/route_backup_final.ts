import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';

// Enhanced caching system for production performance
const dashboardCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes (longer for better performance)
const BACKGROUND_REFRESH_INTERVAL = 12 * 60 * 1000; // 12 minutes

// Background refresh to keep cache warm
let backgroundRefreshTimer: NodeJS.Timeout | null = null;

// Background cache refresh function
const refreshCacheInBackground = async (period: string) => {
  try {
    console.log(`Background refreshing dashboard cache for period: ${period}`);
    const cacheKey = `admin-dashboard-${period}`;
    dashboardCache.delete(cacheKey); // Force refresh
  } catch (error) {
    console.error('Background cache refresh failed:', error);
  }
};

// Start background refresh timer
const startBackgroundRefresh = () => {
  if (backgroundRefreshTimer) clearInterval(backgroundRefreshTimer);
  
  backgroundRefreshTimer = setInterval(() => {
    ['7days', '30days', '90days'].forEach(period => {
      refreshCacheInBackground(period);
    });
  }, BACKGROUND_REFRESH_INTERVAL);
};

// Cache warming on startup
const warmCache = async () => {
  console.log('Warming dashboard cache...');
  try {
    await Promise.all([
      refreshCacheInBackground('7days'),
      refreshCacheInBackground('30days'),
      refreshCacheInBackground('90days'),
    ]);
    console.log('Dashboard cache warmed successfully');
    startBackgroundRefresh();
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
};

// Start cache warming on first API call
let cacheWarmed = false;

function getDateRange(period: string) {
  const now = new Date();
  switch (period) {
    case '7days':
      return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
    case '30days':
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
    case '90days':
      return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end: now };
    default:
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
  }
}

function getCachedDashboardData(period: string) {
  const cacheKey = `admin-dashboard-${period}`;
  const cached = dashboardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function cacheDashboardData(period: string, data: any) {
  const cacheKey = `admin-dashboard-${period}`;
  dashboardCache.set(cacheKey, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const cache = searchParams.get('cache') !== 'false'; // Default: true
    const period = searchParams.get('period') || '30days'; // Default: 30 days
    const refresh = searchParams.get('refresh') === 'true';

    // Start cache warming on first call
    if (!cacheWarmed && cache) {
      cacheWarmed = true;
      setTimeout(() => {
        warmCache();
      }, 1000);
    }

    // Check cache first (unless refresh requested)
    if (cache && !refresh) {
      const cached = getCachedDashboardData(period);
      if (cached) return NextResponse.json(cached);
    }

    const p = saasPrisma as any;
    const now = new Date();
    const { start, end } = getDateRange(period);
    const trialExpirySoon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Use Prisma client methods instead of raw queries to avoid column name issues
    const [
      totalSchools,
      activeSchools,
      demoSchools,
      blockedSchools,
      totalUsers,
      totalStudents,
      totalTeachers,
      newSchoolsThisPeriod,
      newSchoolsThisWeek,
      subscriptions,
      plans,
      trialsExpiringSoon,
      recentSchools,
      recentAuditLogs,
    ] = await Promise.all([
      // School counts
      p.school.count(),
      p.school.count({ where: { isActive: true } }),
      p.school.count({ where: { isDemo: true } }),
      p.school.count({ where: { isActive: false } }),
      // User counts
      p.user.count(),
      p.student.count(),
      p.teacher.count(),
      // Growth metrics
      p.school.count({ where: { createdAt: { gte: start, lte: end } } }),
      p.school.count({ where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } }),
      // Subscription data
      p.subscription.findMany({
        select: { plan: true, status: true },
      }),
      p.plan.findMany({ where: { isActive: true }, select: { name: true, priceMonthly: true } }),
      // Trials expiring soon
      p.subscription.findMany({
        where: {
          status: 'trial',
          trialEndsAt: { gte: now, lte: trialExpirySoon },
        },
        include: {
          school: {
            select: { id: true, name: true }
          }
        },
        orderBy: { trialEndsAt: 'asc' },
        take: 10,
      }),
      // Recent activity
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

    const result = {
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
      newSchoolsThisPeriod,
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
    };

    // Cache the results if caching is enabled
    if (cache) {
      cacheDashboardData(period, result);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
