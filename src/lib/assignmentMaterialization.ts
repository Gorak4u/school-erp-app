import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

type AssignmentMaterializationInput = {
  assignmentId: string;
  schoolId?: string | null;
  classId: string;
  sectionId?: string | null;
  dueAt?: Date | null;
  publishedAt?: Date | null;
  actorUserId?: string | null;
  actorTeacherId?: string | null;
  activityType?: string;
};

export function parseDateStartOfDay(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function materializeAssignmentRecipients(input: AssignmentMaterializationInput) {
  try {
    const [classRecord, sectionRecord] = await Promise.all([
      (schoolPrisma as any).class.findFirst({
        where: { id: input.classId },
        select: { id: true, name: true, code: true },
      }),
      input.sectionId
        ? (schoolPrisma as any).section.findFirst({
            where: { id: input.sectionId },
            select: { id: true, name: true, code: true },
          })
        : null,
    ]);

    const classValues = Array.from(new Set([input.classId, classRecord?.name, classRecord?.code].filter(Boolean)));
    const sectionValues = Array.from(new Set([input.sectionId, sectionRecord?.name, sectionRecord?.code].filter(Boolean)));

    const students = await (schoolPrisma as any).student.findMany({
      where: {
        schoolId: input.schoolId || undefined,
        class: { in: classValues.length > 0 ? classValues : [input.classId] },
        ...(input.sectionId ? { section: { in: sectionValues.length > 0 ? sectionValues : [input.sectionId] } } : {}),
        status: 'active',
      },
      select: { id: true },
    });

    if (students.length === 0) {
      return { recipientCount: 0 };
    }

    try {
      await (schoolPrisma as any).assignmentRecipient.createMany({
        data: students.map((student: { id: string }) => ({
          schoolId: input.schoolId || null,
          assignmentId: input.assignmentId,
          studentId: student.id,
          recipientStatus: 'assigned',
          dueAt: input.dueAt || null,
          publishedAt: input.publishedAt || null,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      logger.warn('AssignmentRecipient materialization skipped', {
        error,
        assignmentId: input.assignmentId,
      });
    }

    try {
      await (schoolPrisma as any).assignmentSubmission.createMany({
        data: students.map((student: { id: string }) => ({
          assignmentId: input.assignmentId,
          studentId: student.id,
          status: 'pending',
          schoolId: input.schoolId || null,
          submissionType: 'pending',
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      logger.warn('AssignmentSubmission materialization skipped', {
        error,
        assignmentId: input.assignmentId,
      });
    }

    try {
      await (schoolPrisma as any).assignmentActivity.create({
        data: {
          schoolId: input.schoolId || null,
          assignmentId: input.assignmentId,
          actorUserId: input.actorUserId || null,
          actorTeacherId: input.actorTeacherId || null,
          activityType: input.activityType || 'created',
          metadata: JSON.stringify({ recipientCount: students.length }),
        },
      });
    } catch (error) {
      logger.warn('AssignmentActivity write skipped', {
        error,
        assignmentId: input.assignmentId,
      });
    }

    return { recipientCount: students.length };
  } catch (error) {
    logger.error('Failed to materialize assignment recipients', {
      error,
      assignmentId: input.assignmentId,
      classId: input.classId,
      sectionId: input.sectionId,
    });
    return { recipientCount: 0 };
  }
}
