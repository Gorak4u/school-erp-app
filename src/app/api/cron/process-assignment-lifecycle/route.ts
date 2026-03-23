import { NextRequest, NextResponse } from 'next/server';
import { processAssignmentLifecycleBatch } from '@/lib/assignmentLifecycle';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolId, limit } = body;

    const results = await processAssignmentLifecycleBatch({
      schoolId: schoolId || undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return NextResponse.json({
      processed: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('POST /api/cron/process-assignment-lifecycle:', error);
    return NextResponse.json({ error: 'Failed to process assignment lifecycle' }, { status: 500 });
  }
}
