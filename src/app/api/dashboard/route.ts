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

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      feeStats,
      attendanceToday,
      upcomingExams,
      recentPayments,
      classDistribution,
      feesByStructure,
    ] = await Promise.all([
      (schoolPrisma as any).student.count({ where: studentFilter }),
      (schoolPrisma as any).student.count({ where: { ...studentFilter, status: 'active' } }),
      (schoolPrisma as any).teacher.count({ where: teacherFilter }),
      (schoolPrisma as any).teacher.count({ where: { ...teacherFilter, status: 'active' } }),
      (schoolPrisma as any).feeRecord.aggregate({
        where: feeRecordFilter,
        _sum: { amount: true, paidAmount: true, pendingAmount: true },
      }),
      (schoolPrisma as any).attendanceRecord.groupBy({
        by: ['status'],
        where: { date: today, ...attendanceFilter },
        _count: { status: true },
      }),
      (schoolPrisma as any).exam.findMany({
        where: { ...examFilter, date: { gte: today }, status: 'scheduled' },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      (schoolPrisma as any).payment.findMany({
        where: paymentFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          feeRecord: {
            include: { student: { select: { id: true, name: true, class: true } } },
          },
        },
      }),
      (schoolPrisma as any).student.groupBy({ by: ['class'], where: studentFilter, _count: { class: true }, orderBy: { class: 'asc' } }),
      (schoolPrisma as any).feeRecord.groupBy({ by: ['feeStructureId'], where: feeRecordFilter, _sum: { amount: true, paidAmount: true }, _count: { id: true } }),
    ]);

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
        feeCollection: {
          labels: feesByStructure.map(f => f.feeStructureId),
          collected: feesByStructure.map(f => f._sum.paidAmount || 0),
          total: feesByStructure.map(f => f._sum.amount || 0),
        },
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
