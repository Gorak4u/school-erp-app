// @ts-nocheck
import { NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Build school-scoped where clauses
    const schoolFilter = (!ctx.isSuperAdmin && ctx.schoolId) ? { schoolId: ctx.schoolId } : {};
    const studentFilter = { ...schoolFilter };
    const teacherFilter = { ...schoolFilter };
    const examFilter = { ...schoolFilter };
    const feeRecordFilter = (!ctx.isSuperAdmin && ctx.schoolId)
      ? { student: { schoolId: ctx.schoolId } } : {};
    const attendanceFilter = (!ctx.isSuperAdmin && ctx.schoolId)
      ? { student: { schoolId: ctx.schoolId } } : {};
    const paymentFilter = (!ctx.isSuperAdmin && ctx.schoolId)
      ? { feeRecord: { student: { schoolId: ctx.schoolId } } } : {};

    const today = new Date().toISOString().slice(0, 10);
    const schoolId = ctx.schoolId;

    // OPTIMIZED: Consolidate student and teacher counts into efficient queries
    let totalStudents, activeStudents, totalTeachers, activeTeachers;
    
    if (schoolId) {
      // School-specific counts
      const [stats] = await (schoolPrisma as any).$queryRaw`
        SELECT 
          (SELECT COUNT(*) FROM "school"."Student" WHERE "schoolId" = ${schoolId}) as total_students,
          (SELECT COUNT(*) FROM "school"."Student" WHERE "schoolId" = ${schoolId} AND "status" = 'active') as active_students,
          (SELECT COUNT(*) FROM "school"."User" WHERE "schoolId" = ${schoolId}) as total_teachers,
          (SELECT COUNT(*) FROM "school"."User" WHERE "schoolId" = ${schoolId} AND "isActive" = true) as active_teachers
      `;
      totalStudents = parseInt(stats.total_students);
      activeStudents = parseInt(stats.active_students);
      totalTeachers = parseInt(stats.total_teachers);
      activeTeachers = parseInt(stats.active_teachers);
    } else {
      // All schools counts
      const [stats] = await (schoolPrisma as any).$queryRaw`
        SELECT 
          (SELECT COUNT(*) FROM "school"."Student") as total_students,
          (SELECT COUNT(*) FROM "school"."Student" WHERE "status" = 'active') as active_students,
          (SELECT COUNT(*) FROM "school"."User") as total_teachers,
          (SELECT COUNT(*) FROM "school"."User" WHERE "isActive" = true) as active_teachers
      `;
      totalStudents = parseInt(stats.total_students);
      activeStudents = parseInt(stats.active_students);
      totalTeachers = parseInt(stats.total_teachers);
      activeTeachers = parseInt(stats.active_teachers);
    }

    // OPTIMIZED: Consolidate fee and attendance stats into 1 query
    const [
      feeStats,
      finesAggregation,
      attendanceToday,
      classDistribution,
    ] = await Promise.all([
      (schoolPrisma as any).FeeRecord.aggregate({
        where: feeRecordFilter,
        _sum: { amount: true, paidAmount: true, pendingAmount: true },
      }),
      // Add fines aggregation
      (schoolPrisma as any).Fine.aggregate({
        where: { schoolId: ctx.schoolId },
        _sum: { amount: true, paidAmount: true, pendingAmount: true, waivedAmount: true },
      }),
      (schoolPrisma as any).AttendanceRecord.groupBy({
        by: ['status'],
        where: { date: today, ...attendanceFilter },
        _count: { status: true },
      }),
      (schoolPrisma as any).Student.groupBy({ 
        by: ['class'], 
        where: studentFilter, 
        _count: { class: true }, 
        orderBy: { class: 'asc' } 
      }),
    ]);

    // Extract fines statistics
    const finesStats = finesAggregation._sum;

    // OPTIMIZED: Fetch only necessary data for UI
    const [
      upcomingExams,
      recentPayments,
    ] = await Promise.all([
      (schoolPrisma as any).Exam.findMany({
        where: { ...examFilter, date: { gte: today }, status: 'scheduled' },
        orderBy: { date: 'asc' },
        take: 5,
        select: { id: true, name: true, date: true, class: true, subject: true, venue: true },
      }),
      (schoolPrisma as any).Payment.findMany({
        where: paymentFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          createdAt: true,
          feeRecord: {
            select: {
              id: true,
              student: { select: { id: true, name: true, class: true } },
            },
          },
        },
      }),
    ]);

    // Fee structure data - simplified
    const feesByStructure: any[] = [];

    const attendanceMap: Record<string, number> = {};
    attendanceToday.forEach(a => { attendanceMap[a.status] = a._count.status; });

    return NextResponse.json({
      students: {
        total: totalStudents,
        active: activeStudents,
        inactive: totalStudents - activeStudents,
      },
      teachers: {
        total: totalTeachers,
        active: activeTeachers,
      },
      fees: {
        // Combine regular fees and fines
        totalAmount: (feeStats._sum.amount || 0) + (finesAggregation._sum.amount || 0),
        totalCollected: (feeStats._sum.paidAmount || 0) + (finesAggregation._sum.paidAmount || 0),
        totalPending: (feeStats._sum.pendingAmount || 0) + (finesAggregation._sum.pendingAmount || 0),
        totalFines: finesAggregation._sum.amount || 0,
        finesCollected: finesAggregation._sum.paidAmount || 0,
        finesPending: finesAggregation._sum.pendingAmount || 0,
        finesWaived: finesAggregation._sum.waivedAmount || 0,
        regularFeesAmount: feeStats._sum.amount || 0,
        regularFeesCollected: feeStats._sum.paidAmount || 0,
        regularFeesPending: feeStats._sum.pendingAmount || 0,
        collectionRate: ((feeStats._sum.amount || 0) + (finesAggregation._sum.amount || 0))
          ? Math.round((((feeStats._sum.paidAmount || 0) + (finesAggregation._sum.paidAmount || 0)) / ((feeStats._sum.amount || 0) + (finesAggregation._sum.amount || 0))) * 100)
          : 0,
      },
      attendance: {
        date: today,
        present: attendanceMap['present'] || 0,
        absent: attendanceMap['absent'] || 0,
        late: attendanceMap['late'] || 0,
        total: Object.values(attendanceMap).reduce((a, b) => a + b, 0),
      },
      upcomingExams,
      recentPayments,
      charts: {
        classDistribution: {
          labels: classDistribution.map(c => `Class ${c.class}`),
          data: classDistribution.map(c => c._count.class),
        },
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
