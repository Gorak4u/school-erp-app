import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET() {
  try {
    const boards = await (schoolPrisma as any).board.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ boards });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch boards', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const board = await (schoolPrisma as any).board.create({ data: body });
    return NextResponse.json({ board }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create board', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const board = await (schoolPrisma as any).board.update({ where: { id }, data });
    return NextResponse.json({ board });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update board', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const cascade = searchParams.get('cascade') === 'true';

    if (!id) return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });

    // Verify board exists and get related counts
    const existing = await (schoolPrisma as any).board.findUnique({ 
      where: { id },
      include: {
        classes: {
          include: {
            sections: true
          }
        }
      }
    });
    if (!existing) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

    const classCount = existing.classes.length;
    const sectionCount = existing.classes.reduce((sum: number, cls: any) => sum + cls.sections.length, 0);
    
    // Check for fee structures using this board
    const feeStructureCount = await (schoolPrisma as any).feeStructure.count({ where: { boardId: id } });

    // If not cascading, check for foreign key relationships
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

    // Perform cascading deletion if requested
    if (cascade) {
      // Delete fee structures for this board
      if (feeStructureCount > 0) {
        await (schoolPrisma as any).feeStructure.deleteMany({ where: { boardId: id } });
      }

      // Delete sections for all classes in this board
      if (sectionCount > 0) {
        const classIds = existing.classes.map((cls: any) => cls.id);
        await (schoolPrisma as any).section.deleteMany({ where: { classId: { in: classIds } } });
      }

      // Delete classes for this board
      if (classCount > 0) {
        await (schoolPrisma as any).class.deleteMany({ where: { boardId: id } });
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
