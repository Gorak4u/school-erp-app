// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const schedules = await (schoolPrisma as any).teacherSchedule.findMany({
      where: { teacherId: id, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timetable: Record<string, any[]> = {};
    for (const day of DAYS) timetable[day] = [];
    for (const s of schedules) {
      if (timetable[s.dayOfWeek]) timetable[s.dayOfWeek].push(s);
    }

    return NextResponse.json({ schedules, timetable });
  } catch (err) {
    console.error('GET /api/teachers/[id]/schedule:', err);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
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
    const { entries } = body; // array of schedule entries

    if (Array.isArray(entries)) {
      // Upsert multiple entries
      const results = await Promise.all(
        entries.map((entry: any) =>
          (schoolPrisma as any).teacherSchedule.upsert({
            where: {
              teacherId_classId_dayOfWeek_periodNumber_academicYearId: {
                teacherId: id,
                classId: entry.classId,
                dayOfWeek: entry.dayOfWeek,
                periodNumber: entry.periodNumber,
                academicYearId: entry.academicYearId || '',
              },
            },
            update: { ...entry, teacherId: id, schoolId: ctx.schoolId },
            create: { ...entry, teacherId: id, schoolId: ctx.schoolId },
          })
        )
      );
      return NextResponse.json({ schedules: results }, { status: 201 });
    }

    const schedule = await (schoolPrisma as any).teacherSchedule.create({
      data: { ...body, teacherId: id, schoolId: ctx.schoolId },
    });
    return NextResponse.json({ schedule }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Schedule conflict: period already assigned' }, { status: 409 });
    console.error('POST /api/teachers/[id]/schedule:', err);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (scheduleId) {
      await (schoolPrisma as any).teacherSchedule.deleteMany({ where: { id: scheduleId, teacherId: id } });
    } else {
      await (schoolPrisma as any).teacherSchedule.updateMany({ where: { teacherId: id }, data: { isActive: false } });
    }
    return NextResponse.json({ message: 'Schedule updated' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
