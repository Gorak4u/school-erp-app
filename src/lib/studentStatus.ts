export const ARCHIVED_STUDENT_STATUSES = ['exit', 'exited', 'graduated', 'transferred', 'suspended'] as const;

export function normalizeStudentStatus(status?: string | null) {
  if (!status) return 'active';
  return status.toLowerCase();
}

export function isArchivedStudentStatus(status?: string | null) {
  const normalized = normalizeStudentStatus(status);
  return ARCHIVED_STUDENT_STATUSES.includes(normalized as any);
}
