// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { queueAssignmentPublishNotifications, shouldDispatchAssignmentPublish } from '@/lib/assignmentLifecycle';
import { materializeAssignmentRecipients, parseDateStartOfDay } from '@/lib/assignmentMaterialization';

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
    const normalizedPublishAt = body.publishAt ? new Date(body.publishAt) : null;
    const normalizedDueAt = body.dueAt ? new Date(body.dueAt) : parseDateStartOfDay(body.dueDate);
    const normalizedCloseAt = body.closeAt ? new Date(body.closeAt) : null;

    const assignment = await (schoolPrisma as any).assignment.create({
      data: {
        ...body,
        teacherId: id,
        schoolId: ctx.schoolId,
        publishAt: normalizedPublishAt,
        dueAt: normalizedDueAt,
        closeAt: normalizedCloseAt,
        audienceType: body.audienceType || (body.sectionId ? 'section' : 'class'),
        gradingMode: body.gradingMode || 'points',
        latePolicy: body.latePolicy || 'allow_with_flag',
        visibilityScope: body.visibilityScope || 'students_and_staff',
        publishedBy: body.publishedBy || ctx.userId,
        isScheduled: Boolean(body.isScheduled || normalizedPublishAt),
        templateId: body.templateId || null,
      },
    });

    await materializeAssignmentRecipients({
      assignmentId: assignment.id,
      schoolId: ctx.schoolId,
      classId: body.classId,
      sectionId: body.sectionId || null,
      dueAt: normalizedDueAt,
      publishedAt: normalizedPublishAt || new Date(),
      actorUserId: ctx.userId,
      actorTeacherId: id,
      activityType: body.status === 'draft' ? 'created' : 'published',
    });

    if (shouldDispatchAssignmentPublish({
      status: assignment.status,
      publishAt: normalizedPublishAt,
      isScheduled: assignment.isScheduled,
    })) {
      await queueAssignmentPublishNotifications({
        id: assignment.id,
        schoolId: assignment.schoolId,
        title: assignment.title,
        dueDate: assignment.dueDate,
        status: assignment.status,
        publishAt: normalizedPublishAt,
        isScheduled: assignment.isScheduled,
      });
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    console.error('POST /api/teachers/[id]/assignments:', err);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
