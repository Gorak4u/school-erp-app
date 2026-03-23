import { NextRequest, NextResponse } from 'next/server';
import { processCommunicationOutboxBatch } from '@/lib/communicationOutboxProcessor';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await processCommunicationOutboxBatch({
      limit: body?.limit,
      schoolId: body?.schoolId,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('POST /api/cron/process-communication-outbox:', error);
    return NextResponse.json({ error: 'Failed to process communication outbox' }, { status: 500 });
  }
}
