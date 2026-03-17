// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const assignments = await (schoolPrisma as any).classTeacherAssignment.findMany({
      where: { teacherId: id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ assignments });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch class assignments' }, { status: 500 });
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
    const { classId, sectionId, boardId, mediumId, academicYearId, assignedDate } = body;

    const assignment = await (schoolPrisma as any).classTeacherAssignment.upsert({
      where: {
        teacherId_classId_sectionId_academicYearId: {
          teacherId: id,
          classId,
          sectionId: sectionId || null,
          academicYearId,
        },
      },
      update: { isActive: true, boardId, mediumId, assignedDate: assignedDate || new Date().toISOString().split('T')[0] },
      create: {
        teacherId: id,
        classId,
        sectionId: sectionId || null,
        boardId,
        mediumId,
        academicYearId,
        assignedDate: assignedDate || new Date().toISOString().split('T')[0],
        schoolId: ctx.schoolId,
      },
    });

    // Update teacher's isClassTeacher flag
    await (schoolPrisma as any).teacher.update({
      where: { id },
      data: { isClassTeacher: true },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teachers/[id]/class-assignments:', err);
    return NextResponse.json({ error: 'Failed to create class assignment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 });

    await (schoolPrisma as any).classTeacherAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
    });

    // If no active assignments left, clear isClassTeacher
    const remaining = await (schoolPrisma as any).classTeacherAssignment.count({
      where: { teacherId: id, isActive: true },
    });
    if (remaining === 0) {
      await (schoolPrisma as any).teacher.update({ where: { id }, data: { isClassTeacher: false } });
    }

    return NextResponse.json({ message: 'Class assignment removed' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to remove class assignment' }, { status: 500 });
  }
}
