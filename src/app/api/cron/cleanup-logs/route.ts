import { NextRequest, NextResponse } from 'next/server';
import { runCleanupLogsJob } from '@/lib/cron/jobs/cleanup-logs-job';
import { cronUnauthorizedResponse, isCronAuthorized, readCronBody } from '@/lib/cron/route-helpers';

export async function POST(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return cronUnauthorizedResponse();
  }

  const body = await readCronBody<{ daysToKeep?: number }>(request);
  const result = await runCleanupLogsJob({ daysToKeep: body.daysToKeep });
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
