// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
      prisma.student.count({ where: studentFilter }),
      prisma.student.count({ where: { ...studentFilter, status: 'active' } }),
      prisma.teacher.count({ where: teacherFilter }),
      prisma.teacher.count({ where: { ...teacherFilter, status: 'active' } }),
      prisma.feeRecord.aggregate({
        where: feeRecordFilter,
        _sum: { amount: true, paidAmount: true, pendingAmount: true },
      }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { date: today, ...attendanceFilter },
        _count: { status: true },
      }),
      prisma.exam.findMany({
        where: { ...examFilter, date: { gte: today }, status: 'scheduled' },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      prisma.payment.findMany({
        where: paymentFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          feeRecord: {
            include: { student: { select: { id: true, name: true, class: true } } },
          },
        },
      }),
      prisma.student.groupBy({ by: ['class'], where: studentFilter, _count: { class: true }, orderBy: { class: 'asc' } }),
      prisma.feeRecord.groupBy({ by: ['feeStructureId'], where: feeRecordFilter, _sum: { amount: true, paidAmount: true }, _count: { id: true } }),
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
