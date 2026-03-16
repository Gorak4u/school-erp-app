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

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });

    // Verify board exists
    const existing = await (schoolPrisma as any).board.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

    // Check for foreign key relationships - classes using this board
    const classCount = await (schoolPrisma as any).class.count({ where: { boardId: id } });
    if (classCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete board', 
        details: `This board is being used by ${classCount} class(es). Please delete or reassign the classes first.`,
        code: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 });
    }

    // Check for fee structures using this board
    const feeStructureCount = await (schoolPrisma as any).feeStructure.count({ where: { boardId: id } });
    if (feeStructureCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete board', 
        details: `This board is being used by ${feeStructureCount} fee structure(s). Please delete the fee structures first.`,
        code: 'FOREIGN_KEY_CONSTRAINT'
      }, { status: 400 });
    }

    await (schoolPrisma as any).board.delete({ where: { id } });
    return NextResponse.json({ success: true });
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
