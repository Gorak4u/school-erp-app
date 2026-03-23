import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { hasPermissionByName } from '@/lib/permissions';

function parseAttendanceDate(date: string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// GET - Get attendance calendar for individual student or staff
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await context.params;
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
  const month = parseInt(searchParams.get('month') || new Date().getMonth().toString());

  const { ctx, error } = await getSessionContext();
  if (error) return error;

  // Check permissions based on type
  if (type === 'student') {
    if (!hasPermissionByName(ctx.permissions, 'VIEW_ATTENDANCE') && !['admin', 'teacher'].includes(ctx.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (type === 'staff') {
    if (!hasPermissionByName(ctx.permissions, 'VIEW_STAFF_ATTENDANCE') && !hasPermissionByName(ctx.permissions, 'MANAGE_ATTENDANCE') && !['admin'].includes(ctx.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  try {
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : tenantWhere(ctx);
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month, getDaysInMonth(year, month));

    // Get weekly holidays
    const weeklyHolidaysSetting = await (schoolPrisma as any).schoolSetting.findFirst({
      where: {
        ...schoolFilter,
        group: 'timings',
        key: 'weekly_holidays',
      },
    });

    const weeklyHolidays = weeklyHolidaysSetting?.value ? 
      JSON.parse(weeklyHolidaysSetting.value) : [];

    // Fetch attendance/leave records and person info
    let records, personInfo;

    if (type === 'student') {
      [records, personInfo] = await Promise.all([
        (schoolPrisma as any).attendanceRecord.findMany({
          where: {
            ...schoolFilter,
            studentId: id,
            date: {
              gte: startDate.toISOString().split('T')[0],
              lte: endDate.toISOString().split('T')[0],
            },
          },
          orderBy: [{ date: 'asc' }],
        }),
        (schoolPrisma as any).student.findFirst({
          where: { id, ...schoolFilter },
          select: {
            id: true,
            name: true,
            rollNo: true,
            class: true,
            section: true,
          },
        }),
      ]);
    } else {
      // Staff - fetch both attendance and leave records
      const [attendanceRecords, leaveApplications, teacherInfo] = await Promise.all([
        (schoolPrisma as any).staffAttendanceRecord.findMany({
          where: {
            ...schoolFilter,
            teacherId: id,
            attendanceDate: {
              gte: startDate.toISOString(),
              lte: endDate.toISOString(),
            },
          },
          orderBy: [{ attendanceDate: 'asc' }],
        }),
        (schoolPrisma as any).leaveApplication.findMany({
          where: {
            ...schoolFilter,
            staffId: id,
            status: 'approved',
            startDate: { lte: endDate.toISOString().split('T')[0] },
            endDate: { gte: startDate.toISOString().split('T')[0] },
          },
          include: {
            leaveType: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        }),
        (schoolPrisma as any).teacher.findFirst({
          where: { id, ...schoolFilter },
          select: {
            id: true,
            name: true,
            employeeId: true,
            designation: true,
            department: true,
          },
        }),
      ]);

      // Convert leave applications to daily records
      const leaveRecords = [];
      for (const leave of leaveApplications) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          if (date >= startDate && date <= endDate) {
            leaveRecords.push({
              date: new Date(date),
              status: 'on_leave',
              remarks: `${leave.leaveType.name}`,
              source: 'leave',
              leaveType: leave.leaveType,
            });
          }
        }
      }

      // Combine and sort records
      records = [...attendanceRecords.map(r => ({
        date: r.attendanceDate,
        status: r.status,
        remarks: r.remarks,
        source: r.source,
      })), ...leaveRecords].sort((a, b) => a.date.getTime() - b.date.getTime());

      personInfo = teacherInfo;
    }

    // Build calendar data
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const calendar = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      calendar.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if it's a weekly holiday
      const isWeeklyHoliday = weeklyHolidays.includes(dayOfWeek);
      
      // Find attendance record for this date
      const record = records.find(r => {
        const recordDate = type === 'student' ? r.date : r.date;
        return recordDate.toISOString().split('T')[0] === dateStr;
      });

      calendar.push({
        date: dateStr,
        day,
        dayOfWeek,
        isWeeklyHoliday,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        attendance: record ? {
          status: record.status,
          remarks: record.remarks,
          source: record.source || 'manual',
          leaveType: record.leaveType,
        } : null,
      });
    }

    return NextResponse.json({
      calendar,
      person: personInfo,
      year,
      month,
      weeklyHolidays,
      summary: {
        totalDays: daysInMonth,
        holidays: weeklyHolidays.length,
        present: records.filter((r: any) => r.status === 'present').length,
        absent: records.filter((r: any) => r.status === 'absent').length,
        late: records.filter((r: any) => r.status === 'late').length,
        onLeave: records.filter((r: any) => r.status === 'on_leave').length,
        halfDay: records.filter((r: any) => r.status === 'half_day').length,
      },
    });
  } catch (error) {
    console.error(`GET /api/attendance/calendar/${type}/${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch attendance calendar' }, { status: 500 });
  }
}
