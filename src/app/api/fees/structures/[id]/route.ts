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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const structure = await (schoolPrisma as any).feeStructure.findUnique({ where: { id }, include: INCLUDE_RELATIONS });
    if (!structure) return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    
    // Verify structure belongs to user's school - strict isolation
    if (!ctx.isSuperAdmin) {
      if (!ctx.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (structure.schoolId !== ctx.schoolId) {
        // Structure belongs to different school or has null schoolId
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    // Super admins can access all structures including null schoolId
    
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
    
    // Verify structure belongs to user's school before updating - strict isolation
    const existingStructure = await (schoolPrisma as any).feeStructure.findUnique({ where: { id } });
    if (!existingStructure) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!ctx.isSuperAdmin) {
      if (!ctx.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (existingStructure.schoolId !== ctx.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    
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
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    
    // Verify structure belongs to user's school before deleting - strict isolation
    const existingStructure = await (schoolPrisma as any).feeStructure.findUnique({ where: { id } });
    if (!existingStructure) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!ctx.isSuperAdmin) {
      if (!ctx.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (existingStructure.schoolId !== ctx.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    
    await (schoolPrisma as any).feeStructure.delete({ where: { id } });
    return NextResponse.json({ message: 'Fee structure deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete fee structure' }, { status: 500 });
  }
}
