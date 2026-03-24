import { NextRequest, NextResponse } from 'next/server';
import { runProcessCommunicationOutboxJob } from '@/lib/cron/jobs/process-communication-outbox-job';
import { cronUnauthorizedResponse, isCronAuthorized, readCronBody } from '@/lib/cron/route-helpers';

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return cronUnauthorizedResponse();
  }

  const body = await readCronBody<{ limit?: number; schoolId?: string | null }>(request);
  const result = await runProcessCommunicationOutboxJob({
    limit: body.limit,
    schoolId: body.schoolId,
  });

  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
