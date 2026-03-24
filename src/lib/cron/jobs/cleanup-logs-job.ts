import { createCronJobResult } from '@/lib/cron/job-contract';
import { schoolPrisma } from '@/lib/prisma';

export async function runCleanupLogsJob(input: { daysToKeep?: number } = {}) {
  const daysToKeep = Math.max(1, input.daysToKeep || 90);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const errors: string[] = [];
  let auditLogs = 0;
  let outboxEntries = 0;
  let notifications = 0;

  try {
    const result = await schoolPrisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
    auditLogs = result.count;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to delete audit logs');
  }

  try {
    const result = await (schoolPrisma as any).communicationOutbox.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: ['sent', 'dead_letter', 'skipped'] },
      },
    });
    outboxEntries = result.count;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to delete communication outbox entries');
  }

  try {
    const result = await (schoolPrisma as any).notification.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
    notifications = result.count;
  } catch (error) {
    notifications = 0;
  }

  const deleted = auditLogs + outboxEntries + notifications;
  const success = errors.length === 0;

  return createCronJobResult({
    success,
    jobName: 'cleanup-logs',
    scope: 'school',
    message: success ? `Deleted ${deleted} old record(s)` : 'Cleanup completed with errors',
    processed: deleted,
    attempted: 3,
    delivered: success ? 3 : Math.max(0, 3 - errors.length),
    skipped: 0,
    failed: errors.length,
    stats: {
      cutoffDate: cutoffDate.toISOString(),
      daysToKeep,
      deleted: {
        auditLogs,
        outboxEntries,
        notifications,
      },
    },
    errors,
  });
}
