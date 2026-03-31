import { NextRequest, NextResponse } from 'next/server';
import { cronUnauthorizedResponse, isCronAuthorized } from '@/lib/cron/route-helpers';
import { runSendRemindersJob } from '@/lib/send-reminders-job';

export async function POST(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return cronUnauthorizedResponse();
  }

  try {
    console.log('[Cron] Starting send-reminders job...');
    const result = await runSendRemindersJob();
    console.log('[Cron] send-reminders job completed:', result);
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error: any) {
    console.error('[Cron] send-reminders job failed with error:', error);
    console.error('[Cron] Error stack:', error?.stack);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Unknown error occurred',
      stack: error?.stack 
    }, { status: 502 });
  }
}
