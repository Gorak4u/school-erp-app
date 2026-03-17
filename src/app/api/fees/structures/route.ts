// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

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

    // DEBUG: Log the query parameters
    console.log('Fee Structures API - Debug Info:');
    console.log('School ID:', ctx.schoolId);
    console.log('Academic Year ID:', academicYearId);
    console.log('Is Super Admin:', ctx.isSuperAdmin);
    console.log('All params:', { academicYearId, boardId, mediumId, classId, isActive, category });

    const where: any = {};
    if (ctx.schoolId) where.schoolId = ctx.schoolId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (boardId) where.boardId = boardId;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';
    if (category) where.category = category;
    
    // SIMPLIFIED filtering logic - remove complex AND/OR conditions
    // Fee structures can be filtered by exact match or null for broader scope
    if (mediumId) {
      where.mediumId = mediumId;
    }
    if (classId) {
      where.classId = classId;
    }

    // DEBUG: Log the final where clause
    console.log('Final where clause:', JSON.stringify(where, null, 2));

    // First, let's check if any fee structures exist at all for this school
    const allSchoolStructures = await (schoolPrisma as any).feeStructure.findMany({
      where: ctx.schoolId ? { schoolId: ctx.schoolId } : {},
      take: 3,
      select: { id: true, name: true, academicYearId: true, schoolId: true, isActive: true }
    });
    console.log('Sample fee structures for school:', allSchoolStructures);

    const structures = await (schoolPrisma as any).feeStructure.findMany({
      where,
      include: INCLUDE_RELATIONS,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    console.log('Query result count:', structures.length);
    if (structures.length > 0) {
      console.log('Sample result:', structures[0]);
    }

    // Add cache-busting headers
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

    // Handle clone operation: copy all fee structures from one AY to another
    if (body.action === 'clone') {
      const { sourceAcademicYearId, targetAcademicYearId } = body;
      if (!sourceAcademicYearId || !targetAcademicYearId) {
        return NextResponse.json({ error: 'sourceAcademicYearId and targetAcademicYearId required' }, { status: 400 });
      }
      const sourceWhere: any = { academicYearId: sourceAcademicYearId, isActive: true };
      if (!ctx.isSuperAdmin && ctx.schoolId) sourceWhere.schoolId = ctx.schoolId;
      const sourceStructures = await (schoolPrisma as any).feeStructure.findMany({ where: sourceWhere });
      if (sourceStructures.length === 0) {
        return NextResponse.json({ error: 'No fee structures found in source academic year' }, { status: 404 });
      }
      const created = await (schoolPrisma as any).feeStructure.createMany({
        data: sourceStructures.map(s => ({
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
          mediumId: s.mediumId,
          classId: s.classId,
        })),
      });
      return NextResponse.json({ cloned: created.count, message: `${created.count} fee structures cloned` }, { status: 201 });
    }

    // Normal create
    const { id, academicYear, board, medium, class: cls, createdAt, updatedAt, ...data } = body;

    const structure = await (schoolPrisma as any).feeStructure.create({
      data: { ...data, schoolId: ctx.schoolId },
      include: INCLUDE_RELATIONS,
    });

    return NextResponse.json({ structure }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/fees/structures:', error);
    return NextResponse.json({ error: error.message || 'Failed to create fee structure' }, { status: 500 });
  }
}
