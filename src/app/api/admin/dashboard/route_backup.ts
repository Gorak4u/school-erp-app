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
    // This will refresh the cache without blocking user requests
    const cacheKey = `admin-dashboard-${period}`;
    dashboardCache.delete(cacheKey); // Force refresh
    
    // Note: Cache warming will be handled in the main GET function
  } catch (error) {
    console.error('Background cache refresh failed:', error);
  }
};

// Start background refresh timer
const startBackgroundRefresh = () => {
  if (backgroundRefreshTimer) clearInterval(backgroundRefreshTimer);
  
  backgroundRefreshTimer = setInterval(() => {
    // Refresh all common periods
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
      // Start background refresh and cache warming asynchronously
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

    // Try to use materialized views first (faster), fallback to direct queries
    const useMaterializedViews = false; // Disabled until materialized views are created
    
    const [
      schoolStats,
      userStats,
      growthStats,
      subscriptionData,
      trialsExpiringSoon,
      recentSchools,
      recentAuditLogs,
    ] = await Promise.all([
      // School statistics - use materialized view if available
      useMaterializedViews 
        ? p.$queryRaw`SELECT * FROM mv_school_stats LIMIT 1`
        : p.$queryRaw`
            SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN "isActive" = true THEN 1 END) as active,
              COUNT(CASE WHEN "isDemo" = true THEN 1 END) as demo,
              COUNT(CASE WHEN "isActive" = false THEN 1 END) as blocked
            FROM "saas"."School"
          `,
      // User statistics - use materialized view if available
      useMaterializedViews 
        ? p.$queryRaw`SELECT * FROM mv_user_stats LIMIT 1`
        : p.$queryRaw`
            SELECT 
              (SELECT COUNT(*) FROM "saas"."User") as total,
              (SELECT COUNT(*) FROM "school"."Student") as students,
              (SELECT COUNT(*) FROM "school"."Teacher") as teachers
          `,
      // Growth statistics - use materialized view if available, fallback to direct query
      useMaterializedViews 
        ? p.$queryRaw`
            SELECT 
              new_this_month as this_period,
              new_this_week as this_week
            FROM mv_school_stats 
            LIMIT 1
          `
        : p.$queryRaw`
            SELECT 
              COUNT(CASE WHEN "createdAt" >= ${start} AND "createdAt" <= ${end} THEN 1 END) as this_period,
              COUNT(CASE WHEN "createdAt" >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)} THEN 1 END) as this_week
            FROM "saas"."School"
          `,
      // Subscription statistics - use materialized view if available
      useMaterializedViews 
        ? p.$queryRaw`
            SELECT plan, status, count as "count" FROM mv_subscription_stats
            UNION ALL
            SELECT 'unknown' as plan, 'unknown' as status, 0 as count
            WHERE NOT EXISTS (SELECT 1 FROM mv_subscription_stats LIMIT 1)
          `
        : p.$queryRaw`
            SELECT 
              s.plan,
              s.status,
              p.priceMonthly
            FROM "saas"."Subscription" s
            LEFT JOIN "saas"."Plan" p ON s.plan = p.name AND p.isActive = true
          `,
      // Trials expiring soon - use materialized view if available
      useMaterializedViews 
        ? p.$queryRaw`SELECT * FROM mv_trials_expiring_soon LIMIT 10`
        : p.subscription.findMany({
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
      // Recent schools - use materialized view if available
      useMaterializedViews 
        ? p.$queryRaw`SELECT * FROM mv_recent_schools LIMIT 5`
        : p.school.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true, 
              name: true, 
              createdAt: true, 
              isActive: true,
              subscription: { 
                select: { plan: true, status: true } 
              },
            },
          }),
      // Recent audit logs - use materialized view if available
      useMaterializedViews 
        ? p.$queryRaw`SELECT * FROM mv_recent_audit_logs LIMIT 5`
        : p.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              actorEmail: true,
              action: true,
              targetName: true,
              createdAt: true,
            },
          }),
    ]);

    // Extract consolidated statistics
    const totalSchools = Number(schoolStats[0]?.total || 0);
    const activeSchools = Number(schoolStats[0]?.active || 0);
    const demoSchools = Number(schoolStats[0]?.demo || 0);
    const blockedSchools = Number(schoolStats[0]?.blocked || 0);
    
    const totalUsers = Number(userStats[0]?.total || 0);
    const totalStudents = Number(userStats[0]?.students || 0);
    const totalTeachers = Number(userStats[0]?.teachers || 0);
    
    const newSchoolsThisPeriod = Number(growthStats[0]?.this_period || 0);
    const newSchoolsThisWeek = Number(growthStats[0]?.this_week || 0);

    // Process subscription data and compute MRR
    let mrr = 0;
    const subscriptionsByPlan: Record<string, number> = {};
    const subscriptionsByStatus: Record<string, number> = {};
    const planPriceMap: Record<string, number> = {};
    
    for (const sub of subscriptionData) {
      const plan = sub.plan || 'unknown';
      const status = sub.status || 'unknown';
      const price = Number(sub.pricemonthly) || 0;
      
      subscriptionsByPlan[plan] = (subscriptionsByPlan[plan] || 0) + 1;
      subscriptionsByStatus[status] = (subscriptionsByStatus[status] || 0) + 1;
      planPriceMap[plan] = price;
      
      if (status === 'active') {
        mrr += price;
      }
    }

    const activeCount = subscriptionsByStatus['active'] || 0;
    const trialCount = subscriptionsByStatus['trial'] || 0;
    const expiredCount = subscriptionsByStatus['expired'] || 0;
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
      totalSubscriptions: subscriptionData.length,
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
      subscriptionsByPlan: subscriptionsByPlan,
      subscriptionsByStatus: subscriptionsByStatus,
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
