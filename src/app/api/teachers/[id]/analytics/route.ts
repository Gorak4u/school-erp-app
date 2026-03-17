// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // month, quarter, year
    const academicYear = searchParams.get('academicYear') || '';

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const today = new Date();
    const thisMonth = today.toISOString().substring(0, 7);
    const thisYear = today.getFullYear().toString();

    // Date range based on period
    let dateFrom = thisMonth;
    if (period === 'quarter') {
      const q = Math.floor(today.getMonth() / 3);
      const qStart = new Date(today.getFullYear(), q * 3, 1);
      dateFrom = qStart.toISOString().substring(0, 7);
    } else if (period === 'year') {
      dateFrom = thisYear;
    }

    const [
      assignmentsCreated,
      lessonsCreated,
      attendanceRecords,
      submissionsGraded,
      leavesTaken,
      examsCreated,
    ] = await Promise.all([
      (schoolPrisma as any).assignment.findMany({
        where: { teacherId: id, schoolId: ctx.schoolId },
        select: { id: true, classId: true, subject: true, type: true, createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
      (schoolPrisma as any).lessonPlan.findMany({
        where: { teacherId: id, schoolId: ctx.schoolId },
        select: { id: true, classId: true, subject: true, status: true, date: true },
        orderBy: { date: 'asc' },
      }),
      (schoolPrisma as any).attendanceRecord.findMany({
        where: { teacherId: id, date: { startsWith: period === 'year' ? thisYear : dateFrom } },
        select: { id: true, date: true, status: true, class: true, section: true },
      }),
      (schoolPrisma as any).assignmentSubmission.count({
        where: { assignment: { teacherId: id }, status: 'graded' },
      }),
      (schoolPrisma as any).teacherLeave.findMany({
        where: { teacherId: id, status: 'approved', fromDate: { startsWith: thisYear } },
        select: { id: true, leaveType: true, days: true, fromDate: true },
      }),
      (schoolPrisma as any).exam.findMany({
        where: { schoolId: ctx.schoolId, ...(academicYear ? { academicYear } : {}) },
        select: { id: true, class: true, subject: true, date: true, status: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Attendance trend by month
    const attByMonth: Record<string, { present: number; absent: number; late: number; total: number }> = {};
    for (const r of attendanceRecords) {
      const m = r.date.substring(0, 7);
      if (!attByMonth[m]) attByMonth[m] = { present: 0, absent: 0, late: 0, total: 0 };
      attByMonth[m].total++;
      if (r.status === 'present') attByMonth[m].present++;
      else if (r.status === 'absent') attByMonth[m].absent++;
      else if (r.status === 'late') attByMonth[m].late++;
    }
    const attendanceTrend = Object.entries(attByMonth).map(([month, stats]) => ({
      month,
      ...stats,
      rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
    }));

    // Assignment completion rates
    const assignmentStats = {
      total: assignmentsCreated.length,
      active: assignmentsCreated.filter((a: any) => a.status === 'active').length,
      closed: assignmentsCreated.filter((a: any) => a.status === 'closed').length,
      graded: assignmentsCreated.filter((a: any) => a.status === 'graded').length,
      submissionsGraded,
      byType: assignmentsCreated.reduce((acc: any, a: any) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {}),
    };

    // Lesson plan stats
    const lessonStats = {
      total: lessonsCreated.length,
      draft: lessonsCreated.filter((l: any) => l.status === 'draft').length,
      published: lessonsCreated.filter((l: any) => l.status === 'published').length,
      completed: lessonsCreated.filter((l: any) => l.status === 'completed').length,
    };

    // Leave stats
    const leaveStats = {
      totalDays: leavesTaken.reduce((sum: number, l: any) => sum + l.days, 0),
      byType: leavesTaken.reduce((acc: any, l: any) => {
        acc[l.leaveType] = (acc[l.leaveType] || 0) + l.days;
        return acc;
      }, {}),
    };

    // Overall engagement score (0-100)
    const engagementFactors = [
      Math.min(100, (lessonsCreated.length / 20) * 100),
      Math.min(100, (assignmentsCreated.length / 10) * 100),
      Math.min(100, (attendanceRecords.length / 100) * 100),
      Math.min(100, (submissionsGraded / 20) * 100),
    ];
    const engagementScore = Math.round(engagementFactors.reduce((s, v) => s + v, 0) / engagementFactors.length);

    return NextResponse.json({
      overview: {
        totalLessons: lessonsCreated.length,
        totalAssignments: assignmentsCreated.length,
        totalAttendanceRecords: attendanceRecords.length,
        submissionsGraded,
        engagementScore,
        experience: teacher.experience || 0,
        joiningDate: teacher.joiningDate,
      },
      attendanceTrend,
      assignmentStats,
      lessonStats,
      leaveStats,
      examsCount: examsCreated.length,
    });
  } catch (err) {
    console.error('GET /api/teachers/[id]/analytics:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
