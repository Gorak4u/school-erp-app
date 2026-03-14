// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

const INCLUDE_RELATIONS = {
  academicYear: { select: { id: true, name: true, year: true } },
  board: { select: { id: true, name: true, code: true } },
  medium: { select: { id: true, name: true, code: true } },
  class: { select: { id: true, name: true, code: true } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const structure = await (schoolPrisma as any).feeStructure.findUnique({ where: { id }, include: INCLUDE_RELATIONS });
    if (!structure) return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    return NextResponse.json(structure);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fee structure' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { id: _id, academicYear, board, medium, class: cls, createdAt, updatedAt, feeRecords, ...data } = await request.json();
    const structure = await (schoolPrisma as any).feeStructure.update({
      where: { id },
      data,
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
    const { id } = await params;
    await (schoolPrisma as any).feeStructure.delete({ where: { id } });
    return NextResponse.json({ message: 'Fee structure deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete fee structure' }, { status: 500 });
  }
}
