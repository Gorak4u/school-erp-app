// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id, lessonId } = await params;
    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    const body = await request.json();
    const lesson = await (schoolPrisma as any).lessonPlan.update({ where: { id: lessonId }, data: body });
    return NextResponse.json({ lesson });
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id, lessonId } = await params;
    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    await (schoolPrisma as any).lessonPlan.delete({ where: { id: lessonId } });
    return NextResponse.json({ message: 'Lesson deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}
