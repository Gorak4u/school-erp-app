// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const INCLUDE_RELATIONS = {
  academicYear: { select: { id: true, name: true, year: true } },
  board: { select: { id: true, name: true, code: true } },
  medium: { select: { id: true, name: true, code: true } },
  class: { select: { id: true, name: true, code: true } },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const boardId = searchParams.get('boardId');
    const mediumId = searchParams.get('mediumId');
    const classId = searchParams.get('classId');
    const isActive = searchParams.get('isActive');
    const category = searchParams.get('category');

    const where: any = {};
    if (academicYearId) where.academicYearId = academicYearId;
    if (boardId) where.boardId = boardId;
    if (mediumId) where.mediumId = mediumId;
    if (classId) where.classId = classId;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';
    if (category) where.category = category;

    const structures = await prisma.feeStructure.findMany({
      where,
      include: INCLUDE_RELATIONS,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ structures });
  } catch (error) {
    console.error('GET /api/fees/structures:', error);
    return NextResponse.json({ error: 'Failed to fetch fee structures' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle clone operation: copy all fee structures from one AY to another
    if (body.action === 'clone') {
      const { sourceAcademicYearId, targetAcademicYearId } = body;
      if (!sourceAcademicYearId || !targetAcademicYearId) {
        return NextResponse.json({ error: 'sourceAcademicYearId and targetAcademicYearId required' }, { status: 400 });
      }
      const sourceStructures = await prisma.feeStructure.findMany({
        where: { academicYearId: sourceAcademicYearId, isActive: true },
      });
      if (sourceStructures.length === 0) {
        return NextResponse.json({ error: 'No fee structures found in source academic year' }, { status: 404 });
      }
      const created = await prisma.feeStructure.createMany({
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

    const structure = await prisma.feeStructure.create({
      data,
      include: INCLUDE_RELATIONS,
    });

    return NextResponse.json({ structure }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/fees/structures:', error);
    return NextResponse.json({ error: error.message || 'Failed to create fee structure' }, { status: 500 });
  }
}
