// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { ctxSchoolWhere, validateSchoolScopedRefs } from '@/lib/schoolScope';

const INCLUDE_RELATIONS = {
  academicYear: { select: { id: true, name: true, year: true } },
  board: { select: { id: true, name: true, code: true } },
  medium: { select: { id: true, name: true, code: true } },
  class: { select: { id: true, name: true, code: true } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);
    const structure = await (schoolPrisma as any).feeStructure.findFirst({ where: { id, ...schoolFilter }, include: INCLUDE_RELATIONS });
    if (!structure) return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });

    return NextResponse.json(structure);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fee structure' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);
    const existingStructure = await (schoolPrisma as any).feeStructure.findFirst({ where: { id, ...schoolFilter } });
    if (!existingStructure) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { id: _id, academicYear, board, medium, class: cls, createdAt, updatedAt, feeRecords, ...data } = await request.json();
    const { records, error: validationError } = await validateSchoolScopedRefs(
      {
        academicYearId: data.academicYearId || existingStructure.academicYearId,
        boardId: data.boardId || existingStructure.boardId,
        mediumId: data.mediumId || existingStructure.mediumId,
        classId: data.classId || existingStructure.classId,
      },
      ctx.schoolId,
      schoolPrisma
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const structure = await (schoolPrisma as any).feeStructure.update({
      where: { id },
      data: {
        ...data,
        schoolId: records.academicYear?.schoolId ?? existingStructure.schoolId ?? ctx.schoolId,
      },
      include: INCLUDE_RELATIONS,
    });
    return NextResponse.json(structure);
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update fee structure' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);
    const existingStructure = await (schoolPrisma as any).feeStructure.findFirst({ where: { id, ...schoolFilter } });
    if (!existingStructure) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const feeRecordsCount = await (schoolPrisma as any).feeRecord.count({
      where: { feeStructureId: id }
    });
    
    if (feeRecordsCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete fee structure', 
        details: `This fee structure is being used by ${feeRecordsCount} fee record(s). Please delete or reassign the fee records first.`,
        code: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 });
    }
    
    await (schoolPrisma as any).feeStructure.delete({ where: { id } });
    return NextResponse.json({ message: 'Fee structure deleted' });
  } catch (error: any) {
    console.error('Delete fee structure error:', error);
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (error.code === 'P2002') return NextResponse.json({ 
      error: 'Cannot delete fee structure', 
      details: 'This fee structure is referenced by other records. Please delete those records first.',
      code: 'FOREIGN_KEY_CONSTRAINT'
    }, { status: 400 });
    return NextResponse.json({ error: 'Failed to delete fee structure' }, { status: 500 });
  }
}
