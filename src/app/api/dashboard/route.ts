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
          (SELECT COUNT(*) FROM "school"."Teacher" WHERE "schoolId" = ${schoolId}) as total_teachers,
          (SELECT COUNT(*) FROM "school"."Teacher" WHERE "schoolId" = ${schoolId} AND "status" = 'active') as active_teachers
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
          (SELECT COUNT(*) FROM "school"."Teacher") as total_teachers,
          (SELECT COUNT(*) FROM "school"."Teacher" WHERE "status" = 'active') as active_teachers
      `;
      totalStudents = parseInt(stats.total_students);
      activeStudents = parseInt(stats.active_students);
      totalTeachers = parseInt(stats.total_teachers);
      activeTeachers = parseInt(stats.active_teachers);
    }

    // OPTIMIZED: Consolidate fee and attendance stats into 1 query
    const [
      feeStats,
      attendanceToday,
      classDistribution,
    ] = await Promise.all([
      (schoolPrisma as any).feeRecord.aggregate({
        where: feeRecordFilter,
        _sum: { amount: true, paidAmount: true, pendingAmount: true },
      }),
      (schoolPrisma as any).attendanceRecord.groupBy({
        by: ['status'],
        where: { date: today, ...attendanceFilter },
        _count: { status: true },
      }),
      (schoolPrisma as any).student.groupBy({ 
        by: ['class'], 
        where: studentFilter, 
        _count: { class: true }, 
        orderBy: { class: 'asc' } 
      }),
    ]);

    // OPTIMIZED: Fetch only necessary data for UI
    const [
      upcomingExams,
      recentPayments,
    ] = await Promise.all([
      (schoolPrisma as any).exam.findMany({
        where: { ...examFilter, date: { gte: today }, status: 'scheduled' },
        orderBy: { date: 'asc' },
        take: 5,
        select: { id: true, name: true, date: true, class: true, subject: true, venue: true },
      }),
      (schoolPrisma as any).payment.findMany({
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
        totalAmount: feeStats._sum.amount || 0,
        totalCollected: feeStats._sum.paidAmount || 0,
        totalPending: feeStats._sum.pendingAmount || 0,
        collectionRate: feeStats._sum.amount
          ? Math.round(((feeStats._sum.paidAmount || 0) / feeStats._sum.amount) * 100)
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
