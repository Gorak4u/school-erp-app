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
    const status = searchParams.get('status') || '';
    const classId = searchParams.get('classId') || '';
    const type = searchParams.get('type') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'));

    const teacher = await (schoolPrisma as any).teacher.findFirst({ where: { id, ...tenantWhere(ctx) } });
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });

    const where: any = { teacherId: id, schoolId: ctx.schoolId };
    if (status) where.status = status;
    if (classId) where.classId = classId;
    if (type) where.type = type;

    const [assignments, total] = await Promise.all([
      (schoolPrisma as any).assignment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { submissions: true } },
        },
      }),
      (schoolPrisma as any).assignment.count({ where }),
    ]);

    // Enrich with submission stats
    const enriched = await Promise.all(
      assignments.map(async (a: any) => {
        const [submitted, graded, pending] = await Promise.all([
          (schoolPrisma as any).assignmentSubmission.count({ where: { assignmentId: a.id, status: 'submitted' } }),
          (schoolPrisma as any).assignmentSubmission.count({ where: { assignmentId: a.id, status: 'graded' } }),
          (schoolPrisma as any).assignmentSubmission.count({ where: { assignmentId: a.id, status: 'pending' } }),
        ]);
        return { ...a, stats: { submitted, graded, pending, total: a._count.submissions } };
      })
    );

    return NextResponse.json({ assignments: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    console.error('GET /api/teachers/[id]/assignments:', err);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
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
    const assignment = await (schoolPrisma as any).assignment.create({
      data: { ...body, teacherId: id, schoolId: ctx.schoolId },
    });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teachers/[id]/assignments:', err);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
