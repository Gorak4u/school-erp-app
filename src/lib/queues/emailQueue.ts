import { sendSchoolEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  schoolId?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export function enqueueEmail(job: EmailJob) {
  setImmediate(async () => {
    try {
      await sendSchoolEmail(job);
    } catch (error) {
      logger.error('Failed to process email job', { error, job: { to: job.to, subject: job.subject, schoolId: job.schoolId } });
    }
  });
}

export function enqueueEmailBatch(jobs: EmailJob[]) {
  for (const job of jobs) {
    enqueueEmail(job);
  }
}
