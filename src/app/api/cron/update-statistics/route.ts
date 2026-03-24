import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

/**
 * Update Statistics - Cron Job Handler
 * Updates cached statistics and analytics data
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = {
      students: { total: 0, active: 0, newThisMonth: 0 },
      teachers: { total: 0, active: 0 },
      fees: { total: 0, collected: 0, pending: 0, collectionRate: 0 },
      attendance: { overall: 0, thisWeek: 0 },
    };

    // 1. Student Statistics
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalStudents, activeStudents, newStudents] = await Promise.all([
        schoolPrisma.student.count(),
        schoolPrisma.student.count({ where: { status: 'active' } }),
        schoolPrisma.student.count({
          where: {
            createdAt: {
              gte: monthStart,
            },
          },
        }),
      ]);

      stats.students = {
        total: totalStudents,
        active: activeStudents,
        newThisMonth: newStudents,
      };
    } catch (error) {
      console.error('[Cron] Student stats error:', error);
    }

    // 2. Teacher Statistics
    try {
      const [totalTeachers, activeTeachers] = await Promise.all([
        (schoolPrisma as any).teacher.count(),
        (schoolPrisma as any).teacher.count({ where: { status: 'active' } }),
      ]);

      stats.teachers = {
        total: totalTeachers,
        active: activeTeachers,
      };
    } catch (error) {
      console.error('[Cron] Teacher stats error:', error);
    }

    // 3. Fee Statistics
    try {
      const feeAggregations = await schoolPrisma.feeRecord.aggregate({
        _sum: {
          amount: true,
          paidAmount: true,
        },
        where: {
          academicYear: new Date().getFullYear().toString(),
        },
      });

      const totalFees = feeAggregations._sum.amount || 0;
      const collectedFees = feeAggregations._sum.paidAmount || 0;
      const pendingFees = totalFees - collectedFees;
      const collectionRate = totalFees > 0 ? (collectedFees / totalFees) * 100 : 0;

      stats.fees = {
        total: totalFees,
        collected: collectedFees,
        pending: pendingFees,
        collectionRate: Math.round(collectionRate * 100) / 100,
      };
    } catch (error) {
      console.error('[Cron] Fee stats error:', error);
    }

    // 4. Attendance Statistics
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const attendanceStats = await schoolPrisma.attendanceRecord.groupBy({
        by: ['status'],
        where: {
          date: {
            gte: thirtyDaysAgo.toISOString().split('T')[0], // YYYY-MM-DD format
          },
        },
        _count: {
          status: true,
        },
      });

      const totalRecords = attendanceStats.reduce((sum, stat) => sum + stat._count.status, 0);
      const presentRecords = attendanceStats.find(stat => stat.status === 'present')?._count.status || 0;
      const overallAttendance = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

      // This week's attendance
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekAttendanceStats = await schoolPrisma.attendanceRecord.groupBy({
        by: ['status'],
        where: {
          date: {
            gte: weekAgo.toISOString().split('T')[0], // YYYY-MM-DD format
          },
        },
        _count: {
          status: true,
        },
      });

      const weekTotalRecords = weekAttendanceStats.reduce((sum, stat) => sum + stat._count.status, 0);
      const weekPresentRecords = weekAttendanceStats.find(stat => stat.status === 'present')?._count.status || 0;
      const weekAttendance = weekTotalRecords > 0 ? (weekPresentRecords / weekTotalRecords) * 100 : 0;

      stats.attendance = {
        overall: Math.round(overallAttendance * 100) / 100,
        thisWeek: Math.round(weekAttendance * 100) / 100,
      };
    } catch (error) {
      console.error('[Cron] Attendance stats error:', error);
    }

    // Store statistics in cache or database (optional)
    // You could store these in a cache table or Redis for quick retrieval

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cron] Update statistics error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
