import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canViewStaffAttendanceAccess } from '@/lib/permissions';

function getDateValue(input: string | null) {
  return input || new Date().toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canViewStaffAttendanceAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = getDateValue(searchParams.get('date'));
    const rangeEnd = new Date(date);
    rangeEnd.setDate(rangeEnd.getDate() + 7);
    const rangeEndValue = rangeEnd.toISOString().split('T')[0];

    const teacherWhere: Record<string, unknown> = {
      ...tenantWhere(ctx),
      status: 'active',
    };

    const teachers = await (schoolPrisma as any).teacher.findMany({
      where: teacherWhere,
      orderBy: [{ department: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        department: true,
        designation: true,
        subject: true,
        photo: true,
      },
    });

    const teacherIds = teachers.map((teacher: any) => teacher.id);
    const attendanceDate = new Date(`${date}T00:00:00.000Z`);

    const [approvedLeaves, projectedSummaryRows, staffAttendanceRecords, attendanceByTeacher] = await Promise.all([
      (schoolPrisma as any).leaveApplication.findMany({
        where: {
          schoolId: ctx.schoolId,
          status: 'approved',
          startDate: { lte: new Date(rangeEndValue) },
          endDate: { gte: new Date(date) },
        },
        include: {
          leaveType: {
            select: {
              id: true,
              name: true,
              code: true,
              isPaid: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
              department: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      }),
      (schoolPrisma as any).staffAttendanceDailySummary.findMany({
        where: {
          teacherId: { in: teacherIds },
          attendanceDate,
        },
        select: {
          teacherId: true,
          status: true,
          derivedFromLeave: true,
          leaveApplicationId: true,
          metadata: true,
        },
      }).catch(() => []),
      (schoolPrisma as any).staffAttendanceRecord.findMany({
        where: {
          teacherId: { in: teacherIds },
          attendanceDate,
        },
        select: {
          teacherId: true,
          status: true,
          checkInAt: true,
          checkOutAt: true,
          remarks: true,
          source: true,
          markedBy: true,
          markedByRole: true,
        },
      }).catch(() => []),
      (schoolPrisma as any).attendanceRecord.groupBy({
        by: ['teacherId'],
        where: {
          teacherId: { in: teacherIds },
          attendanceDate,
        },
        _count: { _all: true },
      }),
    ]);

    const todayLeaveMap = new Map<string, any>();
    const upcomingLeaveMap = new Map<string, any[]>();

    for (const leave of approvedLeaves) {
      const start = new Date(leave.startDate).toISOString().split('T')[0];
      const end = new Date(leave.endDate).toISOString().split('T')[0];

      if (start <= date && end >= date) {
        todayLeaveMap.set(leave.staffId, leave);
      }

      if (start > date && start <= rangeEndValue) {
        const existing = upcomingLeaveMap.get(leave.staffId) || [];
        existing.push(leave);
        upcomingLeaveMap.set(leave.staffId, existing);
      }
    }

    const attendanceMap = new Map<string, number>();
    for (const item of attendanceByTeacher) {
      if (item.teacherId) {
        attendanceMap.set(item.teacherId, item._count._all);
      }
    }

    const projectedMap = new Map<string, any>();
    for (const row of projectedSummaryRows) {
      projectedMap.set(row.teacherId, row);
    }

    const manualAttendanceMap = new Map<string, any>();
    for (const record of staffAttendanceRecords) {
      if (record.teacherId) {
        manualAttendanceMap.set(record.teacherId, record);
      }
    }

    const staff = teachers.map((teacher: any) => {
      const todaysLeave = todayLeaveMap.get(teacher.id);
      const sessionsHandled = attendanceMap.get(teacher.id) || 0;
      const upcomingLeaves = upcomingLeaveMap.get(teacher.id) || [];
      const projected = projectedMap.get(teacher.id);
      const manualAttendance = manualAttendanceMap.get(teacher.id);
      
      // Prioritize manual attendance over projected attendance
      const status = manualAttendance?.status || projected?.status || (todaysLeave
        ? 'on_leave'
        : sessionsHandled > 0
          ? 'active'
          : 'awaiting_activity');

      return {
        ...teacher,
        status,
        sessionsHandled,
        todaysLeave: todaysLeave
          ? {
              id: todaysLeave.id,
              startDate: todaysLeave.startDate,
              endDate: todaysLeave.endDate,
              totalDays: todaysLeave.totalDays,
              leaveType: todaysLeave.leaveType,
            }
          : null,
        upcomingLeaves: upcomingLeaves.map((leave) => ({
          id: leave.id,
          startDate: leave.startDate,
          endDate: leave.endDate,
          totalDays: leave.totalDays,
          leaveType: leave.leaveType,
        })),
        manualAttendance: manualAttendance ? {
          status: manualAttendance.status,
          checkInAt: manualAttendance.checkInAt,
          checkOutAt: manualAttendance.checkOutAt,
          remarks: manualAttendance.remarks,
          source: manualAttendance.source,
          markedBy: manualAttendance.markedBy,
          markedByRole: manualAttendance.markedByRole,
        } : null,
      };
    });

    const summary = {
      totalStaff: staff.length,
      onLeave: staff.filter((item: any) => item.status === 'on_leave').length,
      activeInClasses: staff.filter((item: any) => item.status === 'active').length,
      awaitingActivity: staff.filter((item: any) => item.status === 'awaiting_activity').length,
      sessionsHandled: staff.reduce((total: number, item: any) => total + item.sessionsHandled, 0),
      upcomingLeaves: approvedLeaves.filter((leave: any) => {
        const start = new Date(leave.startDate).toISOString().split('T')[0];
        return start > date && start <= rangeEndValue;
      }).length,
    };

    return NextResponse.json({
      date,
      summary,
      staff,
    });
  } catch (error) {
    console.error('GET /api/attendance/staff-overview:', error);
    return NextResponse.json({ error: 'Failed to fetch staff attendance overview' }, { status: 500 });
  }
}
