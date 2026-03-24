import { NextRequest, NextResponse } from 'next/server';
import { cronUnauthorizedResponse, isCronAuthorized } from '@/lib/cron/route-helpers';
import { runSendRemindersJob } from '@/lib/send-reminders-job';

export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return cronUnauthorizedResponse();
  }

  const result = await runSendRemindersJob();
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
