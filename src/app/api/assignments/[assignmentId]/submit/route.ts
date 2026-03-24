import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { appendAssignmentActivity } from '@/lib/assignmentLifecycle';
import { queueCommunicationOutbox } from '@/lib/communicationOutbox';
import { schoolPrisma } from '@/lib/prisma';
import { queueAssignmentRecipientNotifications } from '@/lib/studentCommunicationTargets';

function parseDateStartOfDay(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function resolveSubmissionStudent(input: {
  assignmentId: string;
  schoolId?: string | null;
  studentId?: string | null;
  email: string;
  role: string;
}) {
  if (input.studentId && ['admin', 'teacher'].includes(input.role)) {
    return (schoolPrisma as any).student.findFirst({
      where: {
        id: input.studentId,
        ...(input.schoolId ? { schoolId: input.schoolId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        class: true,
        section: true,
      },
    });
  }

  return (schoolPrisma as any).student.findFirst({
    where: {
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
      email: input.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      class: true,
      section: true,
    },
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { assignmentId } = await params;

    const assignment = await (schoolPrisma as any).assignment.findFirst({
      where: {
        id: assignmentId,
        ...(ctx.schoolId ? { schoolId: ctx.schoolId } : {}),
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        teacher: { select: { id: true, name: true } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const student = await resolveSubmissionStudent({
      assignmentId,
      schoolId: ctx.schoolId,
      email: ctx.email,
      role: ctx.role,
    });

    if (!student && !['admin', 'teacher'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const submission = student
      ? await (schoolPrisma as any).assignmentSubmission.findFirst({
          where: {
            assignmentId,
            studentId: student.id,
          },
        })
      : null;

    return NextResponse.json({ assignment, student, submission });
  } catch (error) {
    console.error('GET /api/assignments/[assignmentId]/submit:', error);
    return NextResponse.json({ error: 'Failed to load assignment submission' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;
    const { assignmentId } = await params;
    const body = await request.json();

    const assignment = await (schoolPrisma as any).assignment.findFirst({
      where: {
        id: assignmentId,
        ...(ctx.schoolId ? { schoolId: ctx.schoolId } : {}),
      },
      select: {
        id: true,
        schoolId: true,
        title: true,
        dueDate: true,
        dueAt: true,
        teacherId: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
            schoolId: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const student = await resolveSubmissionStudent({
      assignmentId,
      schoolId: ctx.schoolId,
      studentId: body.studentId,
      email: ctx.email,
      role: ctx.role,
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found for submission' }, { status: 404 });
    }

    if (!['admin', 'teacher'].includes(ctx.role) && student.email?.toLowerCase() !== ctx.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existingSubmission = await (schoolPrisma as any).assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: student.id,
      },
      select: {
        id: true,
        attemptNo: true,
      },
    });

    const now = new Date();
    const effectiveDueAt = assignment.dueAt || parseDateStartOfDay(assignment.dueDate);
    const isLate = effectiveDueAt ? now.getTime() > effectiveDueAt.getTime() : false;
    const nextAttemptNo = Math.max(1, (existingSubmission?.attemptNo || 0) + 1);

    const submission = await (schoolPrisma as any).assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
      update: {
        content: body.content || null,
        attachments: body.attachments || null,
        status: 'submitted',
        submittedAt: now.toISOString(),
        submittedAtTs: now,
        submissionType: body.submissionType || 'manual',
        storagePath: body.storagePath || null,
        isLate,
        schoolId: assignment.schoolId || ctx.schoolId,
        attemptNo: nextAttemptNo,
      },
      create: {
        assignmentId,
        studentId: student.id,
        content: body.content || null,
        attachments: body.attachments || null,
        status: 'submitted',
        submittedAt: now.toISOString(),
        submittedAtTs: now,
        submissionType: body.submissionType || 'manual',
        storagePath: body.storagePath || null,
        isLate,
        schoolId: assignment.schoolId || ctx.schoolId,
        attemptNo: nextAttemptNo,
      },
      include: {
        student: { select: { id: true, name: true, class: true, section: true } },
      },
    });

    await Promise.allSettled([
      (schoolPrisma as any).assignmentRecipient.updateMany({
        where: { assignmentId, studentId: student.id },
        data: {
          recipientStatus: 'submitted',
          lastNotifiedAt: now,
        },
      }),
      appendAssignmentActivity({
        assignmentId,
        schoolId: assignment.schoolId,
        actorUserId: ctx.userId,
        activityType: 'submitted',
        metadata: {
          studentId: student.id,
          submissionId: submission.id,
          attemptNo: nextAttemptNo,
          isLate,
        },
      }),
      queueAssignmentRecipientNotifications({
        schoolId: assignment.schoolId,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
        eventType: 'submitted',
        studentIds: [student.id],
      }),
      queueCommunicationOutbox({
        notification: assignment.teacher?.userId
          ? {
              userId: assignment.teacher.userId,
              type: 'assignment_submission_received',
              title: 'Assignment submission received',
              message: `${student.name} submitted ${assignment.title}.`,
              priority: 'medium',
              schoolId: assignment.schoolId,
              entityType: 'assignment_submission',
              entityId: submission.id,
              templateKey: 'assignment_submission_received',
              dedupeKey: `assignment_submission_received:${submission.id}:${assignment.teacher.userId}`,
              metadata: {
                assignmentId: assignment.id,
                studentId: student.id,
                submissionId: submission.id,
              },
            }
          : null,
        email: assignment.teacher?.email
          ? {
              to: assignment.teacher.email,
              subject: `Assignment submitted: ${assignment.title}`,
              html: `<div><h2>Assignment submission received</h2><p>${student.name} submitted <strong>${assignment.title}</strong>.</p><p>Attempt: ${nextAttemptNo}</p><p>${isLate ? 'This submission was late.' : 'This submission was on time.'}</p></div>`,
              schoolId: ctx.schoolId || assignment.schoolId || assignment.teacher?.schoolId || undefined,
              recipientUserId: assignment.teacher.userId || null,
              templateKey: 'assignment_submission_received',
              dedupeKey: `assignment_submission_received_email:${submission.id}:${assignment.teacher.email}`,
            }
          : null,
      }),
    ]);

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error('POST /api/assignments/[assignmentId]/submit:', error);
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}
