import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma, saasPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Build school-scoped where clauses
    const schoolFilter = (!ctx.isSuperAdmin && ctx.schoolId) ? { schoolId: ctx.schoolId } : {};
    const studentFilter = { ...schoolFilter };
    const teacherFilter = { ...schoolFilter };

    // Performance metrics
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      activeTeachers,
      totalClasses,
      attendanceRate,
      feeCollectionRate,
    ] = await Promise.all([
      (schoolPrisma as any).student.count({ where: studentFilter }),
      (schoolPrisma as any).student.count({ where: { ...studentFilter, isActive: true } }),
      (schoolPrisma as any).teacher.count({ where: teacherFilter }),
      (schoolPrisma as any).teacher.count({ where: { ...teacherFilter, isActive: true } }),
      (schoolPrisma as any).class.count({ where: schoolFilter }),
      // Performance calculations
      (schoolPrisma as any).$queryRaw`
        SELECT 
          COALESCE(AVG(CASE WHEN status = 'present' THEN 100 ELSE 0 END), 0) as attendanceRate
        FROM (
          SELECT DISTINCT ON (studentId) 
            studentId, 
            status,
            createdAt
          FROM "Attendance" 
          WHERE ${!ctx.isSuperAdmin && ctx.schoolId ? `student->>'schoolId' = '${ctx.schoolId}'` : '1=1'}
          ORDER BY studentId, createdAt DESC
        ) recent_attendance
      `,
      (schoolPrisma as any).$queryRaw`
        SELECT 
          COALESCE(
            (SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
            0
          ) as feeCollectionRate
        FROM "FeeRecord"
        WHERE ${!ctx.isSuperAdmin && ctx.schoolId ? `student->>'schoolId' = '${ctx.schoolId}'` : '1=1'}
      `,
    ]);

    const performanceData = {
      overview: {
        studentEnrollment: {
          total: totalStudents,
          active: activeStudents,
          inactive: totalStudents - activeStudents,
          percentage: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0,
        },
        teacherStaff: {
          total: totalTeachers,
          active: activeTeachers,
          inactive: totalTeachers - activeTeachers,
          percentage: totalTeachers > 0 ? Math.round((activeTeachers / totalTeachers) * 100) : 0,
        },
        classes: {
          total: totalClasses,
        },
      },
      metrics: {
        attendanceRate: Math.round(Number(attendanceRate[0]?.attendanceRate) || 0),
        feeCollectionRate: Math.round(Number(feeCollectionRate[0]?.feeCollectionRate) || 0),
      },
      trends: {
        // Mock trend data - in real implementation, calculate from historical data
        studentGrowth: [
          { month: 'Jan', count: Math.round(totalStudents * 0.8) },
          { month: 'Feb', count: Math.round(totalStudents * 0.85) },
          { month: 'Mar', count: Math.round(totalStudents * 0.9) },
          { month: 'Apr', count: Math.round(totalStudents * 0.95) },
          { month: 'May', count: totalStudents },
        ],
        attendanceTrend: [
          { month: 'Jan', rate: Math.round(Number(attendanceRate[0]?.attendanceRate) || 0) - 5 },
          { month: 'Feb', rate: Math.round(Number(attendanceRate[0]?.attendanceRate) || 0) - 3 },
          { month: 'Mar', rate: Math.round(Number(attendanceRate[0]?.attendanceRate) || 0) - 2 },
          { month: 'Apr', rate: Math.round(Number(attendanceRate[0]?.attendanceRate) || 0) - 1 },
          { month: 'May', rate: Math.round(Number(attendanceRate[0]?.attendanceRate) || 0) },
        ],
      },
    };

    return NextResponse.json(performanceData);
  } catch (error: any) {
    console.error('Dashboard performance API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
