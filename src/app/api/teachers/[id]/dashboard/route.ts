// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const teacher = await (schoolPrisma as any).teacher.findFirst({
      where: { id, ...tenantWhere(ctx) },
      include: {
        classTeacherAssignments: { where: { isActive: true } },
        schedules: { where: { isActive: true } },
      },
    });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const today = new Date().toISOString().split('T')[0];
    const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const thisMonth = today.substring(0, 7);
    const thisYear = today.substring(0, 4);

    const [
      todaySchedule,
      pendingLeaves,
      recentAssignments,
      recentLessons,
      attendanceTodayCount,
      totalStudentsAttended,
      pendingSubmissions,
      upcomingDueDates,
      notesCount,
      monthlyAttendanceStats,
    ] = await Promise.all([
      (schoolPrisma as any).teacherSchedule.findMany({
        where: { teacherId: id, dayOfWeek: todayDay, isActive: true },
        orderBy: { periodNumber: 'asc' },
      }),
      (schoolPrisma as any).teacherLeave.findMany({
        where: { teacherId: id, status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      (schoolPrisma as any).assignment.findMany({
        where: { teacherId: id, status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      (schoolPrisma as any).lessonPlan.findMany({
        where: { teacherId: id },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      (schoolPrisma as any).attendanceRecord.count({
        where: { teacherId: id, date: today },
      }),
      (schoolPrisma as any).attendanceRecord.count({
        where: { teacherId: id, date: today, status: 'present' },
      }),
      (schoolPrisma as any).assignmentSubmission.count({
        where: {
          assignment: { teacherId: id },
          status: 'submitted',
        },
      }),
      (schoolPrisma as any).assignment.findMany({
        where: { teacherId: id, status: 'active', dueDate: { gte: today } },
        orderBy: { dueDate: 'asc' },
        take: 3,
      }),
      (schoolPrisma as any).teacherNote.count({ where: { teacherId: id } }),
      (schoolPrisma as any).attendanceRecord.groupBy({
        by: ['status'],
        where: { teacherId: id, date: { startsWith: thisMonth } },
        _count: { id: true },
      }),
    ]);

    // Compute attendance rate
    const attendanceMap: Record<string, number> = {};
    for (const a of monthlyAttendanceStats) {
      attendanceMap[a.status] = a._count.id;
    }
    const totalAttended = Object.values(attendanceMap).reduce((s, v) => s + v, 0);
    const presentCount = attendanceMap['present'] || 0;
    const attendanceRate = totalAttended > 0 ? Math.round((presentCount / totalAttended) * 100) : 0;

    return NextResponse.json({
      teacher,
      dashboard: {
        todaySchedule,
        pendingLeaves: pendingLeaves.length,
        activeAssignments: recentAssignments.length,
        recentLessons: recentLessons.length,
        attendanceTakenToday: attendanceTodayCount > 0,
        studentsMarkedToday: attendanceTodayCount,
        presentToday: totalStudentsAttended,
        pendingSubmissions,
        upcomingDueDates,
        notesCount,
        attendanceRate,
        classesAssigned: teacher.schedules?.length || 0,
        classTeacherOf: teacher.classTeacherAssignments?.length || 0,
      },
    });
  } catch (err) {
    console.error('GET /api/teachers/[id]/dashboard:', err);
    return NextResponse.json({ error: 'Failed to fetch teacher dashboard' }, { status: 500 });
  }
}
