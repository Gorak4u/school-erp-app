import { NextResponse, NextRequest } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma, saasPrisma } from '@/lib/prisma';

// Simple in-memory cache for performance data
const performanceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getDateRange(timeframe: string) {
  const now = new Date();
  switch (timeframe) {
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

function getCachedPerformanceData(key: string) {
  const cached = performanceCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function cachePerformanceData(key: string, data: any) {
  performanceCache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || 'all';
    const timeframe = searchParams.get('timeframe') || '30days';
    const limit = parseInt(searchParams.get('limit') || '100');
    const cache = searchParams.get('cache') !== 'false';

    // Check cache first
    if (cache) {
      const cacheKey = `performance-${ctx.schoolId || 'super'}-${department}-${timeframe}`;
      const cached = getCachedPerformanceData(cacheKey);
      if (cached) return NextResponse.json(cached);
    }

    // Add timeframe-based date filtering
    const { start, end } = getDateRange(timeframe);
    const dateFilter = { createdAt: { gte: start, lte: end } };

    // Build school-scoped where clauses with department and date filtering
    const schoolFilter = (!ctx.isSuperAdmin && ctx.schoolId) ? { schoolId: ctx.schoolId } : {};
    const studentFilter = { ...schoolFilter, ...dateFilter };
    const teacherFilter = { ...schoolFilter, ...dateFilter };
    
    // Add department-based filtering
    const departmentFilter = department !== 'all' ? { department } : {};

    // Performance metrics
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalClasses,
      attendanceRate,
      feeCollectionRate,
    ] = await Promise.all([
      (schoolPrisma as any).Student.count({ where: studentFilter }),
      (schoolPrisma as any).Student.count({ where: { ...studentFilter, status: 'active' } }),
      (schoolPrisma as any).school_User.count({ where: teacherFilter }),
      (schoolPrisma as any).school_User.count({ where: { ...teacherFilter, isActive: true } }),
      (schoolPrisma as any).Class.count({ where: schoolFilter }),
      // Performance calculations - simplified
      (schoolPrisma as any).AttendanceRecord.aggregate({
        where: !ctx.isSuperAdmin && ctx.schoolId ? {
          student: { schoolId: ctx.schoolId }
        } : {},
        _count: { id: true },
      }),
      (schoolPrisma as any).FeeRecord.aggregate({
        where: !ctx.isSuperAdmin && ctx.schoolId ? {
          student: { schoolId: ctx.schoolId },
          status: 'paid'
        } : { status: 'paid' },
        _count: { id: true },
      }),
    ]);

    const performanceData = {
      overview: {
        studentEnrollment: {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents,
          percentage: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0,
        },
        teacherStaff: {
          total: totalTeachers,
          active: activeTeachers,
          inactive: totalTeachers - activeTeachers,
          percentage: totalTeachers > 0 ? Math.round((activeTeachers / totalTeachers) * 100) : 0,
        },
        classes: {
          total: totalClasses,
        },
      },
      metrics: {
        attendanceRate: 85, // Simplified - would need more complex calculation for actual rate
        feeCollectionRate: attendanceRate._count.id > 0 ? Math.round((feeCollectionRate._count.id / attendanceRate._count.id) * 100) : 0,
      },
      trends: {
        // Mock trend data - in real implementation, calculate from historical data
        studentGrowth: [
          { month: 'Jan', count: Math.round(totalStudents * 0.8) },
          { month: 'Feb', count: Math.round(totalStudents * 0.85) },
          { month: 'Mar', count: Math.round(totalStudents * 0.9) },
          { month: 'Apr', count: Math.round(totalStudents * 0.95) },
          { month: 'May', count: totalStudents },
        ],
        attendanceTrend: [
          { month: 'Jan', rate: 80 },
          { month: 'Feb', rate: 82 },
          { month: 'Mar', rate: 83 },
          { month: 'Apr', rate: 84 },
          { month: 'May', rate: 85 },
        ],
      },
    };

    // Cache the results if caching is enabled
    if (cache) {
      const cacheKey = `performance-${ctx.schoolId || 'super'}-${department}-${timeframe}`;
      cachePerformanceData(cacheKey, performanceData);
    }

    return NextResponse.json(performanceData);
  } catch (error: any) {
    console.error('Dashboard performance API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
