import { NextRequest, NextResponse } from 'next/server';
import { runUpdateStatisticsJob } from '@/lib/cron/jobs/update-statistics-job';
import { cronUnauthorizedResponse, isCronAuthorized } from '@/lib/cron/route-helpers';

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return cronUnauthorizedResponse();
  }

  const result = await runUpdateStatisticsJob();
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
