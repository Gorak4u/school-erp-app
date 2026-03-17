// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id, assignmentId } = await params;
    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    const body = await request.json();
    const assignment = await (schoolPrisma as any).assignment.update({ where: { id: assignmentId }, data: body });
    return NextResponse.json({ assignment });
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id, assignmentId } = await params;
    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    await (schoolPrisma as any).assignment.delete({ where: { id: assignmentId } });
    return NextResponse.json({ message: 'Assignment deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
