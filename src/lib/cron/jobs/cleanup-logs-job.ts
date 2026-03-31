import { createCronJobResult } from '@/lib/cron/job-contract';
import { schoolPrisma } from '@/lib/prisma';

export async function runCleanupLogsJob(input: { daysToKeep?: number } = {}) {
  const daysToKeep = Math.max(1, input.daysToKeep || 7);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const errors: string[] = [];
  let auditLogs = 0;
  let outboxEntries = 0;
  let notifications = 0;
  let assignments = 0;
  let assignmentSubmissions = 0;
  let assignmentRecipients = 0;
  let assignmentActivities = 0;
  let verificationTokens = 0;
  let passwordResetTokens = 0;
  let sessions = 0;

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

  // Cleanup Assignment tables (main assignments and submissions should NOT be cleaned - only temporary data)
  try {
    const result = await (schoolPrisma as any).assignmentRecipient.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
    assignmentRecipients = result.count;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to delete assignment recipients');
  }

  try {
    const result = await (schoolPrisma as any).assignmentActivity.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
    assignmentActivities = result.count;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to delete assignment activities');
  }

  // Cleanup Security tokens (1 day retention)
  const tokenCutoffDate = new Date();
  tokenCutoffDate.setDate(tokenCutoffDate.getDate() - 1);

  try {
    const result = await (schoolPrisma as any).verificationToken.deleteMany({
      where: { createdAt: { lt: tokenCutoffDate } },
    });
    verificationTokens = result.count;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to delete verification tokens');
  }

  try {
    const result = await (schoolPrisma as any).passwordResetToken.deleteMany({
      where: { createdAt: { lt: tokenCutoffDate } },
    });
    passwordResetTokens = result.count;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to delete password reset tokens');
  }

  // Cleanup Sessions (7 days retention - use expires field instead of createdAt)
  try {
    const result = await (schoolPrisma as any).session.deleteMany({
      where: { 
        expires: { 
          lt: cutoffDate 
        } 
      },
    });
    sessions = result.count;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Failed to delete sessions');
  }

  const deleted = auditLogs + outboxEntries + notifications + assignmentRecipients + assignmentActivities + verificationTokens + passwordResetTokens + sessions;
  const success = errors.length === 0;

  return createCronJobResult({
    success,
    jobName: 'cleanup-logs',
    scope: 'school',
    message: success ? `Deleted ${deleted} old record(s)` : 'Cleanup completed with errors',
    processed: deleted,
    attempted: 8,
    delivered: success ? 8 : Math.max(0, 8 - errors.length),
    skipped: 0,
    failed: errors.length,
    stats: {
      cutoffDate: cutoffDate.toISOString(),
      tokenCutoffDate: tokenCutoffDate.toISOString(),
      daysToKeep,
      deleted: {
        auditLogs,
        outboxEntries,
        notifications,
        assignmentRecipients,
        assignmentActivities,
        verificationTokens,
        passwordResetTokens,
        sessions,
      },
    },
    errors,
  });
}
