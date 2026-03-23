// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { queueAttendanceAbsenceNotifications } from '@/lib/studentCommunicationTargets';

function parseAttendanceDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '';
    const classId = searchParams.get('classId') || '';
    const section = searchParams.get('section') || '';
    const month = searchParams.get('month') || '';

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const where: any = { teacherId: id };
    if (date) where.date = date;
    if (classId) where.class = classId;
    if (section) where.section = section;
    if (month) where.date = { startsWith: month };

    const records = await (schoolPrisma as any).attendanceRecord.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, admissionNo: true, rollNo: true, class: true, section: true } },
      },
      orderBy: [{ date: 'desc' }, { class: 'asc' }],
    });

    // Group by date
    const byDate: Record<string, any[]> = {};
    for (const r of records) {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    }

    // Monthly stats if month provided
    let monthlyStats = null;
    if (month) {
      const statMap: Record<string, number> = {};
      for (const r of records) statMap[r.status] = (statMap[r.status] || 0) + 1;
      const total = records.length;
      monthlyStats = {
        total,
        present: statMap['present'] || 0,
        absent: statMap['absent'] || 0,
        late: statMap['late'] || 0,
        rate: total > 0 ? Math.round(((statMap['present'] || 0) / total) * 100) : 0,
      };
    }

    return NextResponse.json({ records, byDate, monthlyStats });
  } catch (err) {
    console.error('GET /api/teachers/[id]/attendance:', err);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const body = await request.json();
    const { date, classRef, section, subject, records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Attendance records array is required' }, { status: 400 });
    }

    // Upsert all records for the given date/class/section
    const results = await Promise.all(
      records.map((r: any) =>
        (schoolPrisma as any).attendanceRecord.upsert({
          where: { studentId_date_subject: { studentId: r.studentId, date, subject: subject || 'General' } },
          update: {
            status: r.status,
            remarks: r.remarks,
            teacherId: id,
            class: classRef,
            section,
            schoolId: ctx.schoolId || undefined,
            attendanceDate: parseAttendanceDate(date),
            domain: 'student',
            source: 'manual',
            attendanceSessionKey: [ctx.schoolId || 'school', classRef || 'class', section || 'section', date, subject || 'General'].join(':'),
          },
          create: {
            studentId: r.studentId,
            teacherId: id,
            date,
            status: r.status,
            subject: subject || 'General',
            class: classRef,
            section,
            remarks: r.remarks,
            schoolId: ctx.schoolId || undefined,
            attendanceDate: parseAttendanceDate(date),
            domain: 'student',
            source: 'manual',
            attendanceSessionKey: [ctx.schoolId || 'school', classRef || 'class', section || 'section', date, subject || 'General'].join(':'),
          },
        })
      )
    );

    await queueAttendanceAbsenceNotifications({
      schoolId: ctx.schoolId,
      date,
      subject: subject || 'General',
      absences: records.map((r: any) => ({
        studentId: r.studentId,
        status: r.status,
      })),
    });

    return NextResponse.json({ saved: results.length, records: results }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teachers/[id]/attendance:', err);
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
  }
}
