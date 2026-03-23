import { logger } from '@/lib/logger';
import { schoolPrisma } from '@/lib/prisma';

type StaffAttendanceProjectionInput = {
  date: string;
  schoolId?: string | null;
};

function parseDateValue(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function projectStaffAttendanceForDate(input: StaffAttendanceProjectionInput) {
  const attendanceDate = parseDateValue(input.date);
  if (!attendanceDate) {
    throw new Error('Invalid projection date');
  }

  const nextDate = new Date(attendanceDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const teacherWhere = {
    ...(input.schoolId ? { schoolId: input.schoolId } : {}),
    status: 'active',
  };

  const [teachers, approvedLeaves, attendanceCounts] = await Promise.all([
    (schoolPrisma as any).teacher.findMany({
      where: teacherWhere,
      select: {
        id: true,
        schoolId: true,
      },
      orderBy: { name: 'asc' },
    }),
    (schoolPrisma as any).leaveApplication.findMany({
      where: {
        ...(input.schoolId ? { schoolId: input.schoolId } : {}),
        status: 'approved',
        startDate: { lte: nextDate },
        endDate: { gte: attendanceDate },
      },
      select: {
        id: true,
        staffId: true,
        startDate: true,
        endDate: true,
      },
    }),
    (schoolPrisma as any).attendanceRecord.groupBy({
      by: ['teacherId'],
      where: {
        teacherId: { not: null },
        attendanceDate,
        ...(input.schoolId ? { schoolId: input.schoolId } : {}),
      },
      _count: { _all: true },
    }),
  ]);

  const leaveMap = new Map<string, string>();
  for (const leave of approvedLeaves) {
    leaveMap.set(leave.staffId, leave.id);
  }

  const attendanceMap = new Map<string, number>();
  for (const row of attendanceCounts) {
    if (row.teacherId) {
      attendanceMap.set(row.teacherId, row._count._all);
    }
  }

  let projected = 0;

  for (const teacher of teachers) {
    const leaveApplicationId = leaveMap.get(teacher.id) || null;
    const attendanceCount = attendanceMap.get(teacher.id) || 0;
    const status = leaveApplicationId
      ? 'on_leave'
      : attendanceCount > 0
        ? 'active'
        : 'awaiting_activity';

    try {
      await (schoolPrisma as any).staffAttendanceDailySummary.upsert({
        where: {
          teacherId_attendanceDate: {
            teacherId: teacher.id,
            attendanceDate,
          },
        },
        update: {
          schoolId: teacher.schoolId || input.schoolId || undefined,
          status,
          derivedFromLeave: Boolean(leaveApplicationId),
          source: leaveApplicationId ? 'leave_projection' : 'system',
          leaveApplicationId,
          metadata: JSON.stringify({ attendanceCount }),
        },
        create: {
          teacherId: teacher.id,
          schoolId: teacher.schoolId || input.schoolId || undefined,
          attendanceDate,
          status,
          derivedFromLeave: Boolean(leaveApplicationId),
          source: leaveApplicationId ? 'leave_projection' : 'system',
          leaveApplicationId,
          metadata: JSON.stringify({ attendanceCount }),
        },
      });
      projected += 1;
    } catch (error) {
      logger.warn('StaffAttendanceDailySummary upsert skipped', {
        error,
        teacherId: teacher.id,
        date: input.date,
      });
    }
  }

  return {
    date: input.date,
    teachers: teachers.length,
    projected,
  };
}
