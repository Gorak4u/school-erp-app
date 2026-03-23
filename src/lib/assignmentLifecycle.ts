import { logger } from '@/lib/logger';
import { schoolPrisma } from '@/lib/prisma';
import { queueAssignmentRecipientNotifications } from '@/lib/studentCommunicationTargets';

type AssignmentLike = {
  id: string;
  schoolId?: string | null;
  title: string;
  dueDate: string;
  status?: string | null;
  publishAt?: Date | null;
  isScheduled?: boolean | null;
};

function getTodayValue() {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function shouldDispatchAssignmentPublish(input: {
  status?: string | null;
  publishAt?: Date | null;
  isScheduled?: boolean | null;
}) {
  if (input.status === 'draft') return false;
  if (input.isScheduled && input.publishAt && input.publishAt.getTime() > Date.now()) {
    return false;
  }
  return true;
}

export async function appendAssignmentActivity(input: {
  assignmentId: string;
  schoolId?: string | null;
  actorUserId?: string | null;
  actorTeacherId?: string | null;
  activityType: string;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    await (schoolPrisma as any).assignmentActivity.create({
      data: {
        assignmentId: input.assignmentId,
        schoolId: input.schoolId || null,
        actorUserId: input.actorUserId || null,
        actorTeacherId: input.actorTeacherId || null,
        activityType: input.activityType,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    logger.warn('Assignment activity write skipped', {
      error,
      assignmentId: input.assignmentId,
      activityType: input.activityType,
    });
  }
}

async function getAssignmentRecipientStudentIds(assignmentId: string) {
  const recipients = await (schoolPrisma as any).assignmentRecipient.findMany({
    where: { assignmentId },
    select: { studentId: true },
  }).catch(() => []);

  if (recipients.length > 0) {
    return recipients.map((recipient: { studentId: string }) => recipient.studentId);
  }

  const submissions = await (schoolPrisma as any).assignmentSubmission.findMany({
    where: { assignmentId },
    select: { studentId: true },
  }).catch(() => []);

  return submissions.map((submission: { studentId: string }) => submission.studentId);
}

export async function queueAssignmentPublishNotifications(assignment: AssignmentLike) {
  const studentIds = await getAssignmentRecipientStudentIds(assignment.id);
  if (studentIds.length === 0) {
    return { targetedStudents: 0, notificationCount: 0, emailCount: 0 };
  }

  return queueAssignmentRecipientNotifications({
    schoolId: assignment.schoolId,
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    dueDate: assignment.dueDate,
    eventType: 'published',
    studentIds,
  });
}

async function queueAssignmentReminderNotifications(input: {
  assignment: AssignmentLike;
  eventType: 'due_soon' | 'overdue';
}) {
  const pendingSubmissions = await (schoolPrisma as any).assignmentSubmission.findMany({
    where: {
      assignmentId: input.assignment.id,
      status: 'pending',
    },
    select: { studentId: true },
  });

  const studentIds = pendingSubmissions.map((row: { studentId: string }) => row.studentId);
  if (studentIds.length === 0) {
    return { targetedStudents: 0, notificationCount: 0, emailCount: 0 };
  }

  const result = await queueAssignmentRecipientNotifications({
    schoolId: input.assignment.schoolId,
    assignmentId: input.assignment.id,
    assignmentTitle: input.assignment.title,
    dueDate: input.assignment.dueDate,
    eventType: input.eventType,
    studentIds,
  });

  try {
    await (schoolPrisma as any).assignmentRecipient.updateMany({
      where: {
        assignmentId: input.assignment.id,
        studentId: { in: studentIds },
      },
      data: {
        lastNotifiedAt: new Date(),
      },
    });
  } catch (error) {
    logger.warn('Assignment recipient reminder timestamp update skipped', {
      error,
      assignmentId: input.assignment.id,
      eventType: input.eventType,
    });
  }

  await appendAssignmentActivity({
    assignmentId: input.assignment.id,
    schoolId: input.assignment.schoolId,
    activityType: 'reminded',
    metadata: {
      reminderType: input.eventType,
      targetedStudents: result.targetedStudents,
    },
  });

  return result;
}

export async function processAssignmentLifecycleBatch(input: { schoolId?: string | null; limit?: number } = {}) {
  const limit = Math.min(100, Math.max(1, input.limit || 25));
  const now = new Date();
  const today = getTodayValue();
  const tomorrow = getTomorrowValue();

  const scheduledAssignments = await (schoolPrisma as any).assignment.findMany({
    where: {
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
      isScheduled: true,
      publishAt: { lte: now },
    },
    orderBy: { publishAt: 'asc' },
    take: limit,
    select: {
      id: true,
      schoolId: true,
      title: true,
      dueDate: true,
      status: true,
      publishAt: true,
      isScheduled: true,
    },
  });

  let published = 0;
  let dueSoon = 0;
  let overdue = 0;

  for (const assignment of scheduledAssignments) {
    const updated = await (schoolPrisma as any).assignment.update({
      where: { id: assignment.id },
      data: {
        isScheduled: false,
        status: assignment.status === 'draft' || assignment.status === 'scheduled' ? 'active' : assignment.status,
      },
      select: {
        id: true,
        schoolId: true,
        title: true,
        dueDate: true,
        status: true,
        publishAt: true,
        isScheduled: true,
      },
    });

    await queueAssignmentPublishNotifications(updated);
    await appendAssignmentActivity({
      assignmentId: updated.id,
      schoolId: updated.schoolId,
      activityType: 'published',
      metadata: { source: 'cron' },
    });
    published += 1;
  }

  const [dueSoonAssignments, overdueAssignments] = await Promise.all([
    (schoolPrisma as any).assignment.findMany({
      where: {
        ...(input.schoolId ? { schoolId: input.schoolId } : {}),
        status: 'active',
        dueDate: { in: [today, tomorrow] },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
      select: { id: true, schoolId: true, title: true, dueDate: true },
    }),
    (schoolPrisma as any).assignment.findMany({
      where: {
        ...(input.schoolId ? { schoolId: input.schoolId } : {}),
        status: 'active',
        dueDate: { lt: today },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
      select: { id: true, schoolId: true, title: true, dueDate: true },
    }),
  ]);

  for (const assignment of dueSoonAssignments) {
    const result = await queueAssignmentReminderNotifications({
      assignment,
      eventType: 'due_soon',
    });
    if (result.targetedStudents > 0) dueSoon += 1;
  }

  for (const assignment of overdueAssignments) {
    const result = await queueAssignmentReminderNotifications({
      assignment,
      eventType: 'overdue',
    });
    if (result.targetedStudents > 0) overdue += 1;
  }

  return {
    published,
    dueSoon,
    overdue,
  };
}
