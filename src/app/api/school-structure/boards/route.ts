import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const boards = await prisma.board.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ boards });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch boards', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const board = await prisma.board.create({ data: body });
    return NextResponse.json({ board }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create board', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const board = await prisma.board.update({ where: { id }, data });
    return NextResponse.json({ board });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update board', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await prisma.board.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete board', details: error.message }, { status: 500 });
  }
}
