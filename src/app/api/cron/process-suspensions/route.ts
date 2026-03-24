import { NextRequest, NextResponse } from 'next/server';
import { runProcessSuspensionsJob } from '@/lib/cron/jobs/process-suspensions-job';
import { cronUnauthorizedResponse, isCronAuthorized } from '@/lib/cron/route-helpers';

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return cronUnauthorizedResponse();
  }

  const result = await runProcessSuspensionsJob();
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
