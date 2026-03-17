import { sendSchoolEmail } from '@/lib/email';

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  schoolId?: string;
}

export function enqueueEmail(job: EmailJob) {
  setImmediate(async () => {
    try {
      await sendSchoolEmail(job);
    } catch (error) {
      console.error('Failed to process email job:', { job, error });
    }
  });
}

export function enqueueEmailBatch(jobs: EmailJob[]) {
  for (const job of jobs) {
    enqueueEmail(job);
  }
}
