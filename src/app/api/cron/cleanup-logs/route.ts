import { NextRequest, NextResponse } from 'next/server';
import { runCleanupLogsJob } from '@/lib/cron/jobs/cleanup-logs-job';
import { cronUnauthorizedResponse, isCronAuthorized, readCronBody } from '@/lib/cron/route-helpers';

export async function POST(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return cronUnauthorizedResponse();
  }

  try {
    console.log('[Cron] Starting cleanup-logs job...');
    const body = await readCronBody<{ daysToKeep?: number }>(request);
    const result = await runCleanupLogsJob({ daysToKeep: body.daysToKeep });
    console.log('[Cron] cleanup-logs job completed:', result);
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error: any) {
    console.error('[Cron] cleanup-logs job failed with error:', error);
    console.error('[Cron] Error stack:', error?.stack);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Unknown error occurred',
      stack: error?.stack 
    }, { status: 502 });
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
