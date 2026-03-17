// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const studentId = searchParams.get('studentId') || '';

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const where: any = { teacherId: id, schoolId: ctx.schoolId };
    if (type) where.type = type;
    if (studentId) where.studentId = studentId;

    const notes = await (schoolPrisma as any).teacherNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ notes });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const body = await request.json();
    const note = await (schoolPrisma as any).teacherNote.create({
      data: { ...body, teacherId: id, schoolId: ctx.schoolId },
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');
    if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 });

    await (schoolPrisma as any).teacherNote.deleteMany({ where: { id: noteId, teacherId: id } });
    return NextResponse.json({ message: 'Note deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
