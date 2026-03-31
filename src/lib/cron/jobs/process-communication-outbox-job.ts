import { processCommunicationOutboxBatch } from '@/lib/communicationOutboxProcessor';
import { createCronJobResult } from '@/lib/cron/job-contract';

export async function runProcessCommunicationOutboxJob(input: { limit?: number; schoolId?: string | null } = {}) {
  try {
    console.log('[Cron] process-communication-outbox: Starting job with input:', input);
    const summary = await processCommunicationOutboxBatch(input);
    console.log('[Cron] process-communication-outbox: Completed with summary:', summary);
    
    const attempted = Math.max(0, summary.scanned - summary.skipped);
    const failed = summary.failed + summary.deadLetter;
    const success = failed === 0 && (summary.sent > 0 || summary.scanned === 0);

    const result = createCronJobResult({
      success,
      jobName: 'process-communication-outbox',
      scope: 'school',
      message: summary.scanned === 0
        ? 'No communication outbox items were ready'
        : success
          ? `Delivered ${summary.sent} communication outbox item(s)`
          : summary.sent === 0
            ? 'No communication outbox emails were delivered'
            : `Outbox delivery failed for ${failed} item(s)`,
      processed: summary.scanned,
      attempted,
      delivered: summary.sent,
      skipped: summary.skipped,
      failed,
      stats: summary,
      errors: success ? [] : ['One or more communication outbox items failed to send'],
    });
    
    console.log('[Cron] process-communication-outbox: Final result:', result);
    return result;
  } catch (error: any) {
    console.error('[Cron] process-communication-outbox: Job failed with error:', error);
    return createCronJobResult({
      success: false,
      jobName: 'process-communication-outbox',
      scope: 'school',
      message: 'Job execution failed',
      processed: 0,
      attempted: 0,
      delivered: 0,
      skipped: 0,
      failed: 1,
      stats: {},
      errors: [error?.message || 'Unknown error'],
    });
  }
}
