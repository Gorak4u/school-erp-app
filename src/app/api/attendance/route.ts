import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { hasPermissionByName } from '@/lib/permissions';
import { queueAttendanceAbsenceNotifications } from '@/lib/studentCommunicationTargets';

function parseAttendanceDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || '';
    const cls = searchParams.get('class') || '';
    const section = searchParams.get('section') || '';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '50')));

    const where: any = {};
    // Tenant isolation via student relation
    if (!ctx.isSuperAdmin && ctx.schoolId) where.student = { schoolId: ctx.schoolId };
    if (studentId) where.studentId = studentId;
    if (cls) where.class = cls;
    if (section) where.section = section;
    if (status) where.status = status;
    if (date) {
      where.date = date;
    } else if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    const [records, total] = await Promise.all([
      (schoolPrisma as any).attendanceRecord.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, class: true, section: true, rollNo: true } },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (schoolPrisma as any).attendanceRecord.count({ where }),
    ]);

    return NextResponse.json({
      records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('GET /api/attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { ctx, error } = await getSessionContext();
  if (error) return error;

  if (!hasPermissionByName(ctx.permissions, 'MANAGE_ATTENDANCE') && !['admin', 'teacher'].includes(ctx.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'records array is required' }, { status: 400 });
    }

    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : tenantWhere(ctx);

    // Get weekly holidays settings
    const weeklyHolidaysSetting = await (schoolPrisma as any).schoolSetting.findFirst({
      where: {
        ...schoolFilter,
        group: 'timings',
        key: 'weekly_holidays',
      },
    });

    const weeklyHolidays = weeklyHolidaysSetting?.value ? 
      JSON.parse(weeklyHolidaysSetting.value) : [];

    // Check for weekly holiday conflicts
    const holidayConflicts = [];
    for (const record of records) {
      const attendanceDate = new Date(record.date);
      const dayOfWeek = attendanceDate.getDay();
      
      if (weeklyHolidays.includes(dayOfWeek)) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        holidayConflicts.push(`${record.date} (${dayNames[dayOfWeek]}) is a weekly holiday`);
      }
    }

    if (holidayConflicts.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot mark attendance on weekly holidays', 
        conflicts: holidayConflicts 
      }, { status: 409 });
    }

    // Support bulk attendance (array) or single record
    if (Array.isArray(records)) {
      const results = await Promise.allSettled(
        records.map(rec =>
          (schoolPrisma as any).attendanceRecord.upsert({
            where: {
              studentId_date_subject: {
                studentId: rec.studentId,
                date: rec.date,
                subject: rec.subject || '',
              },
            },
            update: {
              status: rec.status,
              remarks: rec.remarks,
              teacherId: rec.teacherId,
              schoolId: ctx.schoolId || undefined,
              attendanceDate: parseAttendanceDate(rec.date),
              domain: 'student',
              source: rec.source || 'manual',
              attendanceSessionKey: [ctx.schoolId || 'school', rec.class || 'class', rec.section || 'section', rec.date, rec.subject || 'general'].join(':'),
            },
            create: {
              studentId: rec.studentId,
              date: rec.date,
              status: rec.status,
              subject: rec.subject || '',
              class: rec.class,
              section: rec.section,
              teacherId: rec.teacherId,
              remarks: rec.remarks,
              schoolId: ctx.schoolId || undefined,
              attendanceDate: parseAttendanceDate(rec.date),
              domain: 'student',
              source: rec.source || 'manual',
              attendanceSessionKey: [ctx.schoolId || 'school', rec.class || 'class', rec.section || 'section', rec.date, rec.subject || 'general'].join(':'),
            },
          })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      await queueAttendanceAbsenceNotifications({
        schoolId: ctx.schoolId,
        date: records[0]?.date,
        subject: records[0]?.subject || null,
        absences: records.map((rec: any) => ({
          studentId: rec.studentId,
          status: rec.status,
        })),
      });

      return NextResponse.json({ message: `Saved ${succeeded} records, ${failed} failed` }, { status: 201 });
    }

    // Single record
    const { studentId, date, status, subject = '', cls, section, teacherId, remarks } = body;
    if (!studentId || !date || !status) {
      return NextResponse.json({ error: 'studentId, date, status are required' }, { status: 400 });
    }

    const record = await (schoolPrisma as any).attendanceRecord.upsert({
      where: { studentId_date_subject: { studentId, date, subject } },
      update: {
        status,
        remarks,
        teacherId,
        schoolId: ctx.schoolId || undefined,
        attendanceDate: parseAttendanceDate(date),
        domain: 'student',
        source: body.source || 'manual',
        attendanceSessionKey: [ctx.schoolId || 'school', cls || 'class', section || 'section', date, subject || 'general'].join(':'),
      },
      create: {
        studentId,
        date,
        status,
        subject,
        class: cls,
        section,
        teacherId,
        remarks,
        schoolId: ctx.schoolId || undefined,
        attendanceDate: parseAttendanceDate(date),
        domain: 'student',
        source: body.source || 'manual',
        attendanceSessionKey: [ctx.schoolId || 'school', cls || 'class', section || 'section', date, subject || 'general'].join(':'),
      },
    });

    await queueAttendanceAbsenceNotifications({
      schoolId: ctx.schoolId,
      date,
      subject,
      absences: [{ studentId, status }],
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('POST /api/attendance:', error);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
