import { queueCommunicationOutbox } from '@/lib/communicationOutbox';
import { schoolPrisma } from '@/lib/prisma';

type StudentTarget = {
  studentId: string;
  name: string;
  className: string;
  sectionName: string;
  studentEmail: string | null;
  parentEmails: string[];
  userIds: string[];
};

type AssignmentEventType = 'published' | 'due_soon' | 'overdue' | 'graded' | 'submitted';

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim().toLowerCase())));
}

export async function resolveStudentCommunicationTargets(input: { schoolId?: string | null; studentIds: string[] }) {
  const studentIds = Array.from(new Set(input.studentIds.filter(Boolean)));
  if (studentIds.length === 0) return [] as StudentTarget[];

  const students = await (schoolPrisma as any).student.findMany({
    where: {
      id: { in: studentIds },
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
    },
    select: {
      id: true,
      name: true,
      class: true,
      section: true,
      email: true,
      parentEmail: true,
      fatherEmail: true,
      motherEmail: true,
    },
  });

  const allEmails = uniqueValues(
    students.flatMap((student: any) => [
      student.email,
      student.parentEmail,
      student.fatherEmail,
      student.motherEmail,
    ])
  );

  const users = allEmails.length > 0
    ? await (schoolPrisma as any).school_User.findMany({
        where: {
          email: { in: allEmails },
          ...(input.schoolId ? { schoolId: input.schoolId } : {}),
        },
        select: {
          id: true,
          email: true,
        },
      })
    : [];

  const userIdsByEmail = new Map<string, string[]>();
  for (const user of users) {
    const key = String(user.email || '').trim().toLowerCase();
    if (!key) continue;
    const existing = userIdsByEmail.get(key) || [];
    existing.push(user.id);
    userIdsByEmail.set(key, Array.from(new Set(existing)));
  }

  return students.map((student: any) => {
    const studentEmail = student.email?.trim() ? String(student.email).trim().toLowerCase() : null;
    const parentEmails = uniqueValues([student.parentEmail, student.fatherEmail, student.motherEmail]);
    const userIds = Array.from(new Set([
      ...(studentEmail ? userIdsByEmail.get(studentEmail) || [] : []),
      ...parentEmails.flatMap((email) => userIdsByEmail.get(email) || []),
    ]));

    return {
      studentId: student.id,
      name: student.name,
      className: student.class,
      sectionName: student.section,
      studentEmail,
      parentEmails,
      userIds,
    } satisfies StudentTarget;
  });
}

function getAssignmentMessage(input: {
  eventType: AssignmentEventType;
  assignmentTitle: string;
  dueDate: string;
  studentName: string;
  grade?: string | null;
  marks?: number | null;
}) {
  switch (input.eventType) {
    case 'published':
      return {
        type: 'assignment_published',
        title: 'New assignment published',
        message: `${input.assignmentTitle} has been published for ${input.studentName}. Due on ${input.dueDate}.`,
        emailSubject: `New assignment published: ${input.assignmentTitle}`,
      };
    case 'due_soon':
      return {
        type: 'assignment_due_soon',
        title: 'Assignment due soon',
        message: `${input.assignmentTitle} is due soon for ${input.studentName}. Due on ${input.dueDate}.`,
        emailSubject: `Assignment due soon: ${input.assignmentTitle}`,
      };
    case 'overdue':
      return {
        type: 'assignment_overdue',
        title: 'Assignment overdue',
        message: `${input.assignmentTitle} is overdue for ${input.studentName}. It was due on ${input.dueDate}.`,
        emailSubject: `Assignment overdue: ${input.assignmentTitle}`,
      };
    case 'graded':
      return {
        type: 'assignment_graded',
        title: 'Assignment graded',
        message: `${input.assignmentTitle} has been graded for ${input.studentName}${input.grade ? ` (${input.grade})` : ''}${input.marks != null ? ` - ${input.marks}` : ''}.`,
        emailSubject: `Assignment graded: ${input.assignmentTitle}`,
      };
    case 'submitted':
      return {
        type: 'assignment_submitted',
        title: 'Assignment submitted',
        message: `${input.studentName} submitted ${input.assignmentTitle}.`,
        emailSubject: `Assignment submitted: ${input.assignmentTitle}`,
      };
  }
}

export async function queueAssignmentRecipientNotifications(input: {
  schoolId?: string | null;
  assignmentId: string;
  assignmentTitle: string;
  dueDate: string;
  eventType: AssignmentEventType;
  studentIds: string[];
  grade?: string | null;
  marks?: number | null;
}) {
  const targets = await resolveStudentCommunicationTargets({
    schoolId: input.schoolId,
    studentIds: input.studentIds,
  });

  let notificationCount = 0;
  let emailCount = 0;

  for (const target of targets) {
    const content = getAssignmentMessage({
      eventType: input.eventType,
      assignmentTitle: input.assignmentTitle,
      dueDate: input.dueDate,
      studentName: target.name,
      grade: input.grade,
      marks: input.marks,
    });

    await Promise.all([
      ...target.userIds.map(async (userId: string) => {
        notificationCount += 1;
        return queueCommunicationOutbox({
          notification: {
            userId,
            type: content.type,
            title: content.title,
            message: content.message,
            priority: input.eventType === 'overdue' ? 'high' : 'medium',
            schoolId: input.schoolId,
            entityType: 'assignment',
            entityId: input.assignmentId,
            templateKey: content.type,
            dedupeKey: `${content.type}:${input.assignmentId}:${target.studentId}:${userId}`,
            metadata: {
              assignmentId: input.assignmentId,
              studentId: target.studentId,
              eventType: input.eventType,
            },
          },
        });
      }),
      ...uniqueValues([target.studentEmail, ...target.parentEmails]).map(async (email) => {
        emailCount += 1;
        return queueCommunicationOutbox({
          email: {
            to: email,
            subject: content.emailSubject,
            html: `<div><h2>${content.title}</h2><p>${content.message}</p><p>Student: ${target.name}</p><p>Class: ${target.className} - ${target.sectionName}</p></div>`,
            schoolId: input.schoolId || undefined,
            templateKey: content.type,
            dedupeKey: `${content.type}_email:${input.assignmentId}:${target.studentId}:${email}`,
          },
        });
      }),
    ]);
  }

  return {
    targetedStudents: targets.length,
    notificationCount,
    emailCount,
  };
}

export async function queueAttendanceAbsenceNotifications(input: {
  schoolId?: string | null;
  date: string;
  subject?: string | null;
  absences: Array<{ studentId: string; status: string }>;
}) {
  const actionable = input.absences.filter((item) => ['absent', 'late'].includes(item.status));
  if (actionable.length === 0) {
    return { targetedStudents: 0, notificationCount: 0, emailCount: 0 };
  }

  const statusByStudentId = new Map(actionable.map((item) => [item.studentId, item.status]));
  const targets = await resolveStudentCommunicationTargets({
    schoolId: input.schoolId,
    studentIds: actionable.map((item) => item.studentId),
  });

  let notificationCount = 0;
  let emailCount = 0;

  for (const target of targets) {
    const status = statusByStudentId.get(target.studentId) || 'absent';
    const title = status === 'late' ? 'Student marked late' : 'Student marked absent';
    const type = status === 'late' ? 'attendance_late' : 'attendance_absent';
    const message = `${target.name} was marked ${status} on ${input.date}${input.subject ? ` for ${input.subject}` : ''}.`;

    await Promise.all([
      ...target.userIds.map(async (userId: string) => {
        notificationCount += 1;
        return queueCommunicationOutbox({
          notification: {
            userId,
            type,
            title,
            message,
            priority: status === 'absent' ? 'high' : 'medium',
            schoolId: input.schoolId,
            entityType: 'attendance_record',
            entityId: `${target.studentId}:${input.date}:${input.subject || 'general'}`,
            templateKey: type,
            dedupeKey: `${type}:${target.studentId}:${input.date}:${input.subject || 'general'}:${userId}`,
            metadata: {
              studentId: target.studentId,
              attendanceDate: input.date,
              subject: input.subject || null,
              status,
            },
          },
        });
      }),
      ...uniqueValues([target.studentEmail, ...target.parentEmails]).map(async (email) => {
        emailCount += 1;
        return queueCommunicationOutbox({
          email: {
            to: email,
            subject: `${title} - ${target.name}`,
            html: `<div><h2>${title}</h2><p>${message}</p><p>Student: ${target.name}</p><p>Class: ${target.className} - ${target.sectionName}</p></div>`,
            schoolId: input.schoolId || undefined,
            templateKey: type,
            dedupeKey: `${type}_email:${target.studentId}:${input.date}:${input.subject || 'general'}:${email}`,
          },
        });
      }),
    ]);
  }

  return {
    targetedStudents: targets.length,
    notificationCount,
    emailCount,
  };
}
