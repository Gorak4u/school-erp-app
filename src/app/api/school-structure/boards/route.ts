import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';
import { ctxSchoolWhere } from '@/lib/schoolScope';

export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);
    const boards = await (schoolPrisma as any).board.findMany({ where: schoolFilter, orderBy: { name: 'asc' } });
    return NextResponse.json({ boards });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch boards', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const body = await request.json();
    const { code, name, description, isActive } = body;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const existing = await (schoolPrisma as any).board.findFirst({
      where: { ...schoolFilter, code }
    });
    if (existing) {
      return NextResponse.json({ error: 'Board code already exists' }, { status: 409 });
    }

    const board = await (schoolPrisma as any).board.create({
      data: {
        code,
        name,
        description,
        isActive: isActive ?? true,
        schoolId: ctx.schoolId,
      }
    });
    return NextResponse.json({ board }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create board', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id, code, name, description, isActive } = await request.json();
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);
    const existing = await (schoolPrisma as any).board.findFirst({ where: { id, ...schoolFilter } });
    if (!existing) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

    const duplicate = await (schoolPrisma as any).board.findFirst({
      where: { ...schoolFilter, code, id: { not: id } }
    });
    if (duplicate) {
      return NextResponse.json({ error: 'Board code already exists' }, { status: 409 });
    }

    const board = await (schoolPrisma as any).board.update({
      where: { id },
      data: { code, name, description, isActive }
    });
    return NextResponse.json({ board });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update board', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const schoolFilter = ctx.isSuperAdmin && !ctx.schoolId ? {} : ctxSchoolWhere(ctx);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const cascade = searchParams.get('cascade') === 'true';

    if (!id) return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });

    const existing = await (schoolPrisma as any).board.findFirst({ where: { id, ...schoolFilter } });
    if (!existing) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

    const classCount = 0;
    const sectionCount = 0;
    const feeStructureCount = await (schoolPrisma as any).feeStructure.count({ where: { ...schoolFilter, boardId: id } });

    if (!cascade) {
      if (classCount > 0 || feeStructureCount > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete board', 
          details: `This board is being used by ${classCount} class(es) and ${feeStructureCount} fee structure(s).`,
          code: 'FOREIGN_KEY_CONSTRAINT',
          counts: {
            classes: classCount,
            sections: sectionCount,
            feeStructures: feeStructureCount
          }
        }, { status: 400 });
      }
    }

    if (cascade) {
      if (feeStructureCount > 0) {
        await (schoolPrisma as any).feeStructure.deleteMany({ where: { ...schoolFilter, boardId: id } });
      }
    }

    await (schoolPrisma as any).board.delete({ where: { id } });
    
    return NextResponse.json({ 
      success: true,
      cascaded: cascade,
      deleted: {
        classes: classCount,
        sections: sectionCount,
        feeStructures: feeStructureCount
      }
    });
  } catch (error: any) {
    console.error('Error deleting board:', error);
    if (error.code === 'P2025') return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    if (error.code === 'P2003') return NextResponse.json({ 
      error: 'Cannot delete board', 
      details: 'This board is referenced by other records. Please delete those records first.',
      code: 'FOREIGN_KEY_CONSTRAINT'
    }, { status: 400 });
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
  }
}
