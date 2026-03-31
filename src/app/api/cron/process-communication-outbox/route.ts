import { NextRequest, NextResponse } from 'next/server';
import { runProcessCommunicationOutboxJob } from '@/lib/cron/jobs/process-communication-outbox-job';
import { cronUnauthorizedResponse, isCronAuthorized, readCronBody } from '@/lib/cron/route-helpers';

export async function POST(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return cronUnauthorizedResponse();
  }

  try {
    console.log('[Cron] Starting process-communication-outbox job...');
    const body = await readCronBody<{ limit?: number; schoolId?: string | null }>(request);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout after 5 minutes')), 5 * 60 * 1000);
    });
    
    const jobPromise = runProcessCommunicationOutboxJob({
      limit: body.limit,
      schoolId: body.schoolId,
    });
    
    const result = await Promise.race([jobPromise, timeoutPromise]) as any;
    console.log('[Cron] process-communication-outbox job completed:', result);
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error: any) {
    console.error('[Cron] process-communication-outbox job failed with error:', error);
    console.error('[Cron] Error stack:', error?.stack);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Unknown error occurred',
      stack: error?.stack 
    }, { status: 502 });
  }
}
