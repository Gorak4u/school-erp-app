import { createCronJobResult } from '@/lib/cron/job-contract';
import { schoolPrisma } from '@/lib/prisma';

async function resolveSettingsSchoolId() {
  const [student, setting] = await Promise.all([
    schoolPrisma.student.findFirst({
      where: { schoolId: { not: null } },
      select: { schoolId: true },
    }).catch(() => null),
    (schoolPrisma as any).schoolSetting.findFirst({
      where: { schoolId: { not: 'default' } },
      select: { schoolId: true },
    }).catch(() => null),
  ]);

  return student?.schoolId || setting?.schoolId || 'default';
}

export async function runUpdateStatisticsJob() {
  const errors: string[] = [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const stats = {
    students: { total: 0, active: 0, newThisMonth: 0 },
    teachers: { total: 0, active: 0 },
    fees: { total: 0, collected: 0, pending: 0, collectionRate: 0 },
    attendance: { overall: 0, thisWeek: 0 },
  };

  try {
    const [totalStudents, activeStudents, newStudents] = await Promise.all([
      schoolPrisma.student.count(),
      schoolPrisma.student.count({ where: { status: 'active' } }),
      schoolPrisma.student.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    stats.students = {
      total: totalStudents,
      active: activeStudents,
      newThisMonth: newStudents,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to aggregate student statistics');
  }

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
    errors.push(error instanceof Error ? error.message : 'Failed to aggregate teacher statistics');
  }

  try {
    const feeAggregations = await schoolPrisma.feeRecord.aggregate({
      _sum: {
        amount: true,
        paidAmount: true,
        pendingAmount: true,
      },
    });

    const totalFees = Number(feeAggregations._sum.amount || 0);
    const collectedFees = Number(feeAggregations._sum.paidAmount || 0);
    const pendingFees = Number(feeAggregations._sum.pendingAmount || Math.max(0, totalFees - collectedFees));
    const collectionRate = totalFees > 0 ? (collectedFees / totalFees) * 100 : 0;

    stats.fees = {
      total: totalFees,
      collected: collectedFees,
      pending: pendingFees,
      collectionRate: Math.round(collectionRate * 100) / 100,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to aggregate fee statistics');
  }

  try {
    const [monthAttendanceStats, weekAttendanceStats] = await Promise.all([
      schoolPrisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { date: { gte: thirtyDaysAgo } },
        _count: { status: true },
      }),
      schoolPrisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { date: { gte: weekAgo } },
        _count: { status: true },
      }),
    ]);

    const monthTotal = monthAttendanceStats.reduce((sum, row) => sum + row._count.status, 0);
    const monthPresent = monthAttendanceStats.find((row) => row.status === 'present')?._count.status || 0;
    const weekTotal = weekAttendanceStats.reduce((sum, row) => sum + row._count.status, 0);
    const weekPresent = weekAttendanceStats.find((row) => row.status === 'present')?._count.status || 0;

    stats.attendance = {
      overall: monthTotal > 0 ? Math.round(((monthPresent / monthTotal) * 100) * 100) / 100 : 0,
      thisWeek: weekTotal > 0 ? Math.round(((weekPresent / weekTotal) * 100) * 100) / 100 : 0,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to aggregate attendance statistics');
  }

  try {
    const schoolId = await resolveSettingsSchoolId();
    const snapshot = JSON.stringify({ stats, generatedAt: now.toISOString() });

    await (schoolPrisma as any).schoolSetting.upsert({
      where: {
        schoolId_group_key: {
          schoolId,
          group: 'system_statistics',
          key: 'cron_snapshot',
        },
      },
      update: { value: snapshot },
      create: {
        schoolId,
        group: 'system_statistics',
        key: 'cron_snapshot',
        value: snapshot,
      },
    });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to persist statistics snapshot');
  }

  const success = errors.length === 0;

  return createCronJobResult({
    success,
    jobName: 'update-statistics',
    scope: 'school',
    message: success ? 'Statistics snapshot refreshed' : 'Statistics refresh completed with errors',
    processed: 1,
    attempted: 1,
    delivered: success ? 1 : 0,
    skipped: 0,
    failed: success ? 0 : errors.length,
    stats,
    errors,
  });
}
