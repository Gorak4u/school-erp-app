// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id, assignmentId } = await params;

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const assignment = await (schoolPrisma as any).assignment.findFirst({ where: { id: assignmentId, teacherId: id } });
    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

    const submissions = await (schoolPrisma as any).assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: { select: { id: true, name: true, admissionNo: true, class: true, section: true, rollNo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: submissions.length,
      submitted: submissions.filter((s: any) => s.status === 'submitted').length,
      graded: submissions.filter((s: any) => s.status === 'graded').length,
      pending: submissions.filter((s: any) => s.status === 'pending').length,
      avgMarks: submissions.filter((s: any) => s.marks != null).reduce((sum: number, s: any) => sum + (s.marks || 0), 0) /
        (submissions.filter((s: any) => s.marks != null).length || 1),
    };

    return NextResponse.json({ submissions, stats, assignment });
  } catch (err) {
    console.error('GET submissions:', err);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { id, assignmentId } = await params;

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const body = await request.json();
    const { submissionId, marks, grade, feedback, status } = body;

    const submission = await (schoolPrisma as any).assignmentSubmission.update({
      where: { id: submissionId },
      data: { marks, grade, feedback, status: status || 'graded' },
      include: {
        student: { select: { id: true, name: true, admissionNo: true } },
      },
    });

    return NextResponse.json({ submission });
  } catch (err: any) {
    if (err.code === 'P2025') return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    return NextResponse.json({ error: 'Failed to grade submission' }, { status: 500 });
  }
}
