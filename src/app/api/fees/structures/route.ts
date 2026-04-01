import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { ctxSchoolWhere, validateSchoolScopedRefs } from '@/lib/schoolScope';

// Type definitions for the API
type FeeStructureWhereClause = {
  schoolId?: string;
  academicYearId?: string;
  boardId?: string;
  mediumId?: string;
  classId?: string;
  isActive?: boolean;
  category?: string;
  [key: string]: unknown; // Allow additional properties
};

const INCLUDE_RELATIONS = {
  academicYear: { select: { id: true, name: true, year: true } },
  board: { select: { id: true, name: true, code: true } },
  medium: { select: { id: true, name: true, code: true } },
  class: { select: { id: true, name: true, code: true } },
};

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const boardId = searchParams.get('boardId');
    const mediumId = searchParams.get('mediumId');
    const classId = searchParams.get('classId');
    const isActive = searchParams.get('isActive');
    const category = searchParams.get('category');

    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);
    const where: FeeStructureWhereClause = { ...schoolFilter };
    if (academicYearId) where.academicYearId = academicYearId;
    if (boardId) where.boardId = boardId;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';
    if (category) where.category = category;

    if (mediumId) {
      where.mediumId = mediumId;
    }
    if (classId) {
      where.classId = classId;
    }

    // Retry logic for database connection issues (Neon serverless sleep)
    let retries = 3;
    let structures;
    while (retries > 0) {
      try {
        structures = await (schoolPrisma as any).feeStructure.findMany({
          where,
          include: INCLUDE_RELATIONS,
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
        break; // Success, exit loop
      } catch (e: any) {
        if (e.code === 'P1001' && retries > 1) {
          retries--;
          await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
          continue;
        }
        throw e; // Non-retryable error or exhausted retries
      }
    }

    const headers = new Headers();
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return NextResponse.json({ feeStructures: structures }, { headers });
  } catch (error: any) {
    console.error('GET /api/fees/structures:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      meta: error.meta,
      cause: error.cause
    });
    
    // Check for specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Record not found', details: error.meta }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unique constraint violation', details: error.meta }, { status: 400 });
    }
    if (error.code === 'P2023') {
      return NextResponse.json({ error: 'Invalid foreign key constraint', details: error.meta }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch fee structures', 
      message: error.message,
      code: error.code,
      details: error.meta 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    if (body.action === 'clone') {
      const { sourceAcademicYearId, targetAcademicYearId } = body;
      if (!sourceAcademicYearId || !targetAcademicYearId) {
        return NextResponse.json({ error: 'sourceAcademicYearId and targetAcademicYearId required' }, { status: 400 });
      }

      const { records, error: validationError } = await validateSchoolScopedRefs(
        { academicYearId: sourceAcademicYearId },
        ctx.schoolId,
        schoolPrisma
      );
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
      const sourceAcademicYear = records.academicYear;
      const targetAcademicYear = await (schoolPrisma as any).academicYear.findFirst({
        where: { id: targetAcademicYearId, ...schoolFilter }
      });
      if (!targetAcademicYear) {
        return NextResponse.json({ error: 'Target academic year not found for this school' }, { status: 400 });
      }

      const sourceWhere: FeeStructureWhereClause = { ...schoolFilter, academicYearId: sourceAcademicYearId, isActive: true };
      const sourceStructures = await (schoolPrisma as any).feeStructure.findMany({
        where: sourceWhere,
        include: {
          medium: { select: { id: true, code: true } },
          class: { select: { id: true, code: true } },
        }
      });
      if (sourceStructures.length === 0) {
        return NextResponse.json({ error: 'No fee structures found in source academic year' }, { status: 404 });
      }

      const [targetMediums, targetClasses] = await Promise.all([
        (schoolPrisma as any).medium.findMany({
          where: { ...schoolFilter, academicYearId: targetAcademicYearId },
          select: { id: true, code: true }
        }),
        (schoolPrisma as any).class.findMany({
          where: { ...schoolFilter, academicYearId: targetAcademicYearId },
          select: { id: true, code: true }
        }),
      ]);
      const mediumMap = new Map(targetMediums.map((medium: { id: string; code: string }) => [medium.code, medium.id]));
      const classMap = new Map(targetClasses.map((cls: { id: string; code: string }) => [cls.code, cls.id]));

      const created = await (schoolPrisma as any).feeStructure.createMany({
        data: sourceStructures.map((s: Record<string, unknown>) => ({
          name: s.name,
          category: s.category,
          amount: s.amount,
          frequency: s.frequency,
          dueDate: s.dueDate,
          lateFee: s.lateFee,
          description: s.description,
          applicableCategories: s.applicableCategories,
          isActive: true,
          schoolId: ctx.schoolId,
          academicYearId: targetAcademicYearId,
          boardId: s.boardId,
          mediumId: (s.medium as { code?: string })?.code ? (mediumMap.get((s.medium as { code: string }).code) ?? null) : null,
          classId: (s.class as { code?: string })?.code ? (classMap.get((s.class as { code: string }).code) ?? null) : null,
        })),
      });
      return NextResponse.json({ cloned: created.count, message: `${created.count} fee structures cloned` }, { status: 201 });
    }

    const { id, academicYear, board, medium, class: cls, createdAt, updatedAt, ...data } = body;
    const { records, error: validationError } = await validateSchoolScopedRefs(
      {
        academicYearId: data.academicYearId,
        boardId: data.boardId,
        mediumId: data.mediumId,
        classId: data.classId,
      },
      ctx.schoolId,
      schoolPrisma
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const structure = await (schoolPrisma as any).feeStructure.create({
      data: { ...data, schoolId: records.academicYear?.schoolId ?? ctx.schoolId },
      include: INCLUDE_RELATIONS,
    });

    return NextResponse.json({ structure }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/fees/structures:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create fee structure';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
