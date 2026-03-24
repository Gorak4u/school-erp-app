// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canDeleteStudentsAccess, canEditStudentsAccess, canViewStudentsAccess } from '@/lib/permissions';

function stripUnsupportedStudentFields(data: Record<string, any>) {
  const {
    id,
    boardId,
    mediumId,
    classId,
    sectionId,
    _ts,
    _mediumId,
    _classId,
    _sectionId,
    _skipWelcomeEmails,
    _admissionFlowHandled,
    _admissionPreview,
    _discountInfo,
    _transportInfo,
    // Remove transport object as it's handled separately
    transport,
    ...rest
  } = data;
  
  return rest;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!canViewStudentsAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    
    // OPTIMIZED: Limit attendance to last 30 days and fee records to recent 10
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const student = await (schoolPrisma as any).student.findFirst({
      where: { id, ...tenantWhere(ctx) },
      include: {
        feeRecords: { 
          include: { 
            feeStructure: { select: { id: true, name: true, category: true, amount: true } },
            payments: { 
              orderBy: { createdAt: 'desc' },
              take: 5, // Limit to recent 5 payments per fee record
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to recent 10 fee records
        },
        attendanceRecords: { 
          where: { date: { gte: thirtyDaysAgo.toISOString().slice(0, 10) } },
          orderBy: { date: 'desc' },
          take: 30, // Limit to 30 most recent records
        },
        examResults: { 
          include: { exam: { select: { id: true, name: true, date: true, subject: true, totalMarks: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20, // Limit to recent 20 exam results
        },
      },
    });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    return NextResponse.json({
      ...student,
      documents: student.documents ? JSON.parse(student.documents) : {},
    });
  } catch (error) {
    console.error('GET /api/students/[id]:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!canEditStudentsAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { documents, fees, attendance, academics, behavior, feeRecords, attendanceRecords, examResults, _bypassLock, ...data } = body;
    const sanitizedData = stripUnsupportedStudentFields(data);

    // Verify ownership before update
    const existing = await (schoolPrisma as any).student.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!existing) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // ── Lock guard ──────────────────────────────────────────────────────────
    // If student has an academicYearId, check it matches the current active AY.
    // Status-only updates (promote/exit) and explicit _bypassLock flag bypass this.
    const isStatusOnlyUpdate = Object.keys(sanitizedData).length === 1 && 'status' in sanitizedData;
    if (!isStatusOnlyUpdate && !_bypassLock && existing.academicYearId) {
      const activeAY = await (schoolPrisma as any).academicYear.findFirst({
        where: { ...(ctx.schoolId ? { schoolId: ctx.schoolId } : {}), isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, year: true }
      });
      if (activeAY && existing.academicYearId !== activeAY.id) {
        return NextResponse.json({
          error: 'Student record is locked. Please promote or mark as exit before editing.',
          code: 'NEEDS_PROMOTION',
          currentAcademicYear: existing.academicYear,
          activeAcademicYear: activeAY.year,
        }, { status: 409 });
      }
    }
    // ── End lock guard ───────────────────────────────────────────────────────

    const student = await (schoolPrisma as any).student.update({
      where: { id },
      data: {
        ...sanitizedData,
        // Explicitly remove any id fields that might have slipped through
        id: undefined,
        documents: documents ? JSON.stringify(documents) : undefined,
        gpa: academics?.gpa,
        rank: academics?.rank,
        disciplineScore: behavior?.disciplineScore,
        incidents: behavior?.incidents,
        achievements: behavior?.achievements,
      },
    });

    return NextResponse.json({ student });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    console.error('PUT /api/students/[id]:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    if (!canDeleteStudentsAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    // Verify ownership before delete
    const existing = await (schoolPrisma as any).student.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!existing) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    await (schoolPrisma as any).student.delete({ where: { id } });
    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    console.error('DELETE /api/students/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
