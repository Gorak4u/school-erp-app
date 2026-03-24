import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { queueCommunicationOutbox } from '@/lib/communicationOutbox';
import { queueAssignmentPublishNotifications, shouldDispatchAssignmentPublish } from '@/lib/assignmentLifecycle';
import { materializeAssignmentRecipients, parseDateStartOfDay } from '@/lib/assignmentMaterialization';
import { canCreateAssignmentsAccess, canViewAssignmentsAccess } from '@/lib/permissions';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canViewAssignmentsAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const classId = searchParams.get('classId') || '';
    const type = searchParams.get('type') || '';
    const teacherId = searchParams.get('teacherId') || '';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('pageSize') || '12', 10)));
    const cursor = searchParams.get('cursor') || null;
    
    // Date range filters
    const dueDateFrom = searchParams.get('dueDateFrom') || '';
    const dueDateTo = searchParams.get('dueDateTo') || '';
    const createdFrom = searchParams.get('createdFrom') || '';
    const createdTo = searchParams.get('createdTo') || '';

    const today = getToday();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const where: Record<string, unknown> = {};
    if (ctx.schoolId) where.schoolId = ctx.schoolId;
    if (status) where.status = status;
    if (classId) where.classId = classId;
    if (type) where.type = type;

    // Add date range filters
    const dateFilters: any = {};
    if (dueDateFrom || dueDateTo) {
      dateFilters.dueDate = {};
      if (dueDateFrom) dateFilters.dueDate.gte = dueDateFrom;
      if (dueDateTo) dateFilters.dueDate.lte = dueDateTo;
    }
    if (createdFrom || createdTo) {
      dateFilters.createdAt = {};
      if (createdFrom) dateFilters.createdAt.gte = new Date(createdFrom);
      if (createdTo) dateFilters.createdAt.lte = new Date(createdTo + 'T23:59:59.999Z');
    }
    
    Object.assign(where, dateFilters);

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (ctx.role === 'teacher') {
      const teacher = await (schoolPrisma as any).teacher.findFirst({
        where: {
          userId: ctx.userId,
          ...tenantWhere(ctx),
        },
        select: { id: true },
      });
      if (!teacher?.id) {
        return NextResponse.json({
          assignments: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
          summary: {
            totalAssignments: 0,
            activeAssignments: 0,
            gradedAssignments: 0,
            overdueAssignments: 0,
            dueSoonAssignments: 0,
            submissionCount: 0,
            pendingReviewCount: 0,
          },
        });
      }
      where.teacherId = teacher.id;
    } else if (teacherId) {
      where.teacherId = teacherId;
    }

    if (search) {
      (where as any).OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Optimized query with cursor-based pagination
    const queryOptions: any = {
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: pageSize + 1, // Fetch one extra to check if there are more records
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            department: true,
            designation: true,
          },
        },
        _count: { select: { submissions: true } },
      },
    };

    // Add cursor if provided
    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Skip the cursor item
    }

    const [assignments, total, activeAssignments, gradedAssignments, overdueAssignments, dueSoonAssignments, submissionCount, pendingReviewCount] = await Promise.all([
      (schoolPrisma as any).assignment.findMany(queryOptions),
      (schoolPrisma as any).assignment.count({ where }),
      (schoolPrisma as any).assignment.count({ where: { ...(where as any), status: 'active' } }),
      (schoolPrisma as any).assignment.count({ where: { ...(where as any), status: 'graded' } }),
      (schoolPrisma as any).assignment.count({ where: { ...(where as any), status: 'active', dueDate: { lt: today } } }),
      (schoolPrisma as any).assignment.count({ where: { ...(where as any), status: 'active', dueDate: { gte: today, lte: nextWeekStr } } }),
      (schoolPrisma as any).assignmentSubmission.count({
        where: {
          assignment: where,
        },
      }),
      (schoolPrisma as any).assignmentSubmission.count({
        where: {
          assignment: where,
          status: { in: ['pending', 'submitted'] },
        },
      }),
    ]);

    // Check if there are more records
    const hasMore = assignments.length > pageSize;
    const actualAssignments = hasMore ? assignments.slice(0, -1) : assignments;
    const nextCursor = hasMore ? actualAssignments[actualAssignments.length - 1].id : null;

    const enriched = await Promise.all(
      actualAssignments.map(async (assignment: any) => {
        const [submitted, graded, pending, classInfo] = await Promise.all([
          (schoolPrisma as any).assignmentSubmission.count({ where: { assignmentId: assignment.id, status: 'submitted' } }),
          (schoolPrisma as any).assignmentSubmission.count({ where: { assignmentId: assignment.id, status: 'graded' } }),
          (schoolPrisma as any).assignmentSubmission.count({ where: { assignmentId: assignment.id, status: 'pending' } }),
          // Fetch class information
          assignment.classId ? (schoolPrisma as any).class.findUnique({
            where: { id: assignment.classId },
            select: { 
              id: true, 
              name: true, 
              code: true,
              medium: {
                select: { id: true, name: true, code: true }
              }
            }
          }) : null
        ]);

        const totalRecipients = assignment._count?.submissions || 0;
        const completionRate = totalRecipients > 0 ? Math.round((submitted / totalRecipients) * 100) : 0;

        return {
          ...assignment,
          class: classInfo,
          stats: {
            totalRecipients,
            submitted,
            graded,
            pending,
            completionRate,
          },
          isOverdue: assignment.status === 'active' && assignment.dueDate < today,
          isDueSoon: assignment.status === 'active' && assignment.dueDate >= today && assignment.dueDate <= nextWeekStr,
        };
      })
    );

    return NextResponse.json({
      assignments: enriched,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      pagination: {
        hasMore,
        nextCursor,
        cursor,
      },
      summary: {
        totalAssignments: total,
        activeAssignments,
        gradedAssignments,
        overdueAssignments,
        dueSoonAssignments,
        submissionCount,
        pendingReviewCount,
      },
    });
  } catch (error) {
    console.error('GET /api/assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canCreateAssignmentsAccess(ctx)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      teacherId: requestedTeacherId,
      title,
      subject,
      classId,
      dueDate,
      description,
      sectionId,
      type,
      totalMarks,
      instructions,
      status,
      academicYearId,
      attachments,
      publishAt,
      dueAt,
      closeAt,
      audienceType,
      gradingMode,
      latePolicy,
      visibilityScope,
      publishedBy,
      isScheduled,
      templateId,
    } = body;

    if (!title || !subject || !classId || !dueDate) {
      return NextResponse.json({ error: 'title, subject, classId, and dueDate are required' }, { status: 400 });
    }

    const normalizedPublishAt = publishAt ? new Date(publishAt) : null;
    const normalizedDueAt = dueAt ? new Date(dueAt) : parseDateStartOfDay(dueDate);
    const normalizedCloseAt = closeAt ? new Date(closeAt) : null;

    let teacherId = requestedTeacherId || '';

    if (ctx.role === 'admin' && !teacherId) {
      return NextResponse.json({ error: 'teacherId is required for admin assignment creation' }, { status: 400 });
    }

    if (!teacherId || ctx.role === 'teacher') {
      const teacher = await (schoolPrisma as any).teacher.findFirst({
        where: {
          userId: ctx.userId,
          ...tenantWhere(ctx),
        },
        select: { id: true },
      });

      if (!teacher?.id) {
        return NextResponse.json({ error: 'Teacher profile not found for assignment creation' }, { status: 404 });
      }

      teacherId = teacher.id;
    }

    const assignedTeacher = await (schoolPrisma as any).teacher.findFirst({
      where: {
        id: teacherId,
        ...tenantWhere(ctx),
      },
      select: {
        id: true,
        name: true,
        email: true,
        userId: true,
        schoolId: true,
      },
    });

    if (!assignedTeacher?.id) {
      return NextResponse.json({ error: 'Assigned teacher not found' }, { status: 404 });
    }

    // Use teacher's schoolId if ctx.schoolId is null (for super admins)
    const effectiveSchoolId = ctx.schoolId || assignedTeacher.schoolId;

    const assignment = await (schoolPrisma as any).assignment.create({
      data: {
        teacherId,
        title,
        subject,
        classId,
        dueDate,
        description: description || null,
        sectionId: sectionId || null,
        type: type || 'homework',
        totalMarks: totalMarks ? Number(totalMarks) : 100,
        instructions: instructions || null,
        status: status || 'active',
        academicYearId: academicYearId || null,
        attachments: attachments || null,
        schoolId: effectiveSchoolId,
        publishAt: normalizedPublishAt,
        dueAt: normalizedDueAt,
        closeAt: normalizedCloseAt,
        audienceType: audienceType || (sectionId ? 'section' : 'class'),
        gradingMode: gradingMode || 'points',
        latePolicy: latePolicy || 'allow_with_flag',
        visibilityScope: visibilityScope || 'students_and_staff',
        publishedBy: publishedBy || ctx.userId,
        isScheduled: Boolean(isScheduled || normalizedPublishAt),
        templateId: templateId || null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
      },
    });

    const recipientSummary = await materializeAssignmentRecipients({
      assignmentId: assignment.id,
      schoolId: ctx.schoolId,
      classId,
      sectionId: sectionId || null,
      dueAt: normalizedDueAt,
      publishedAt: normalizedPublishAt || new Date(),
      actorUserId: ctx.userId,
      actorTeacherId: assignedTeacher.id,
      activityType: status === 'draft' ? 'created' : 'published',
    });

    await queueCommunicationOutbox({
      notification: assignedTeacher.userId
        ? {
            userId: assignedTeacher.userId,
            type: 'assignment_created',
            title: 'New assignment created',
            message: `${assignment.title} has been scheduled for ${assignment.dueDate}.`,
            priority: 'medium',
            metadata: {
              assignmentId: assignment.id,
              classId: assignment.classId,
              dueDate: assignment.dueDate,
              teacherId: assignedTeacher.id,
              recipientCount: recipientSummary.recipientCount,
            },
            schoolId: ctx.schoolId,
            entityType: 'assignment',
            entityId: assignment.id,
            templateKey: 'assignment_created',
            dedupeKey: `assignment_created:${assignment.id}:${assignedTeacher.userId || assignedTeacher.id}`,
          }
        : null,
      email: assignedTeacher.email
        ? {
            to: assignedTeacher.email,
            subject: `New assignment created: ${assignment.title}`,
            schoolId: effectiveSchoolId,
            recipientUserId: assignedTeacher.userId || null,
            templateKey: 'assignment_created',
            dedupeKey: `assignment_created_email:${assignment.id}:${assignedTeacher.email}`,
            html: `<div><h2>New assignment created</h2><p><strong>${assignment.title}</strong> has been created for class ${assignment.classId}.</p><p>Subject: ${assignment.subject}</p><p>Due date: ${assignment.dueDate}</p><p>Recipients materialized: ${recipientSummary.recipientCount}</p></div>`,
          }
        : null,
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
  } catch (error) {
    console.error('POST /api/assignments:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
