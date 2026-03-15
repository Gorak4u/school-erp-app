// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const record = await (schoolPrisma as any).feeRecord.findUnique({
      where: { id },
      include: {
        student: true,
        feeStructure: true,
        payments: true,
      },
    });
    if (!record) return NextResponse.json({ error: 'Fee record not found' }, { status: 404 });
    
    // Verify record belongs to user's school - strict isolation
    if (!ctx.isSuperAdmin) {
      if (!ctx.schoolId) {
        // Non-admin users without school context cannot access any records
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (record.student?.schoolId !== ctx.schoolId) {
        // Record belongs to different school or has null schoolId
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    // Super admins can access all records including null schoolId
    
    return NextResponse.json({ record });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fee record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    
    // Verify record belongs to user's school before updating - strict isolation
    const existingRecord = await (schoolPrisma as any).feeRecord.findUnique({
      where: { id },
      include: { student: true }
    });
    if (!existingRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!ctx.isSuperAdmin) {
      if (!ctx.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (existingRecord.student?.schoolId !== ctx.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    
    const record = await (schoolPrisma as any).feeRecord.update({ where: { id }, data: body });
    return NextResponse.json({ record });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update fee record' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;
    
    // Verify record belongs to user's school before deleting - strict isolation
    const existingRecord = await (schoolPrisma as any).feeRecord.findUnique({
      where: { id },
      include: { student: true }
    });
    if (!existingRecord) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!ctx.isSuperAdmin) {
      if (!ctx.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (existingRecord.student?.schoolId !== ctx.schoolId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    
    await (schoolPrisma as any).feeRecord.delete({ where: { id } });
    return NextResponse.json({ message: 'Fee record deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete fee record' }, { status: 500 });
  }
}
