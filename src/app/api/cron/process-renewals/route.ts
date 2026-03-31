import { NextRequest, NextResponse } from 'next/server';
import { runProcessRenewalsJob } from '@/lib/cron/jobs/process-renewals-job';
import { cronUnauthorizedResponse, isCronAuthorized } from '@/lib/cron/route-helpers';

export async function POST(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return cronUnauthorizedResponse();
  }

  const result = await runProcessRenewalsJob();
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
