// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { canLockStudentsAccess } from '@/lib/permissions';
import { getActiveAcademicYearForSchool } from '@/lib/schoolScope';

/**
 * POST /api/students/bulk-lock
 * Lock students from a previous AY so they cannot be edited until promoted.
 * Body: { action: 'lock' | 'unlock', fromAcademicYearId?: string, studentIds?: string[] }
 *
 * - action=lock:   set status='locked' for active students whose academicYearId != active AY
 * - action=unlock: set status='active' for locked students
 * - action=preview: return count without making changes
 */
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canLockStudentsAccess(ctx)) {
      return NextResponse.json({ error: 'Only admins can lock/unlock students' }, { status: 403 });
    }

    const body = await request.json();
    const { action = 'preview', fromAcademicYearId, studentIds } = body;

    const db = schoolPrisma as any;

    const activeAY = await getActiveAcademicYearForSchool(ctx.schoolId, db);

    if (!activeAY) {
      return NextResponse.json({ error: 'No active academic year found' }, { status: 400 });
    }

    const schoolFilter = ctx.schoolId ? { schoolId: ctx.schoolId } : {};

    if (action === 'lock') {
      // Lock active students who belong to an older AY (academicYearId is set and != active AY)
      const where: any = {
        ...schoolFilter,
        status: 'active',
        academicYearId: { not: null },
        NOT: { academicYearId: activeAY.id },
      };
      if (fromAcademicYearId) where.academicYearId = fromAcademicYearId;
      if (studentIds?.length) where.id = { in: studentIds };

      const updated = await db.student.updateMany({ where, data: { status: 'locked' } });
      return NextResponse.json({
        success: true,
        message: `Locked ${updated.count} student(s) pending promotion to ${activeAY.year}`,
        count: updated.count,
        activeAcademicYear: activeAY,
      });
    }

    if (action === 'unlock') {
      const where: any = { ...schoolFilter, status: 'locked' };
      if (studentIds?.length) where.id = { in: studentIds };

      const updated = await db.student.updateMany({ where, data: { status: 'active' } });
      return NextResponse.json({
        success: true,
        message: `Unlocked ${updated.count} student(s)`,
        count: updated.count,
      });
    }

    if (action === 'preview') {
      // Return count of students that WOULD be locked
      const where: any = {
        ...schoolFilter,
        status: 'active',
        academicYearId: { not: null },
        NOT: { academicYearId: activeAY.id },
      };
      if (fromAcademicYearId) where.academicYearId = fromAcademicYearId;

      const count = await db.student.count({ where });

      // Also get per-AY breakdown
      const byAY = await db.student.groupBy({
        by: ['academicYear'],
        where,
        _count: { academicYear: true },
      });

      return NextResponse.json({
        success: true,
        count,
        byAcademicYear: byAY.map((r: any) => ({ year: r.academicYear, count: r._count.academicYear })),
        activeAcademicYear: activeAY,
      });
    }

    return NextResponse.json({ error: 'action must be lock, unlock, or preview' }, { status: 400 });
  } catch (err: any) {
    console.error('POST /api/students/bulk-lock:', err);
    return NextResponse.json({ error: 'Operation failed', details: err.message }, { status: 500 });
  }
}

/**
 * GET /api/students/bulk-lock
 * Preview: returns count of students needing promotion
 */
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const db = schoolPrisma as any;
    const schoolFilter = ctx.schoolId ? { schoolId: ctx.schoolId } : {};

    const activeAY = await getActiveAcademicYearForSchool(ctx.schoolId, db);

    if (!activeAY) {
      return NextResponse.json({ needsPromotion: 0, locked: 0, activeAcademicYear: null });
    }

    const [needsPromotion, locked] = await Promise.all([
      db.student.count({
        where: {
          ...schoolFilter,
          status: 'active',
          academicYearId: { not: null },
          NOT: { academicYearId: activeAY.id },
        }
      }),
      db.student.count({ where: { ...schoolFilter, status: 'locked' } }),
    ]);

    return NextResponse.json({ needsPromotion, locked, activeAcademicYear: activeAY });
  } catch (err: any) {
    console.error('GET /api/students/bulk-lock:', err);
    return NextResponse.json({ error: 'Failed to fetch lock status' }, { status: 500 });
  }
}
