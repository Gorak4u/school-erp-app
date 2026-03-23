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

    // Handle upsert manually due to nullable sectionId in unique constraint
    let assignment;
    const existingAssignment = await (schoolPrisma as any).classTeacherAssignment.findFirst({
      where: {
        teacherId: id,
        classId,
        sectionId: sectionId || null,
        academicYearId,
      },
    });

    if (existingAssignment) {
      // Update existing assignment
      assignment = await (schoolPrisma as any).classTeacherAssignment.update({
        where: { id: existingAssignment.id },
        data: { isActive: true, boardId, mediumId, assignedDate: assignedDate || new Date().toISOString().split('T')[0] },
      });
    } else {
      // Create new assignment
      assignment = await (schoolPrisma as any).classTeacherAssignment.create({
        data: {
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
    }

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

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const assignment = await (schoolPrisma as any).classTeacherAssignment.findFirst({
      where: {
        id: assignmentId,
        teacherId: id,
        schoolId: ctx.schoolId,
      },
      select: { id: true },
    });
    if (!assignment) return NextResponse.json({ error: 'Class assignment not found' }, { status: 404 });

    await (schoolPrisma as any).classTeacherAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Class assignment removed' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to remove class assignment' }, { status: 500 });
  }
}
