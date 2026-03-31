import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// DELETE /api/cron/cleanup-messenger-messages - Cleanup old messenger messages
export async function DELETE(request: NextRequest) {
  try {
    // Verify cron secret if configured
    const cronSecret = request.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = schoolPrisma as any;
    const hundredEightyDaysAgo = new Date();
    hundredEightyDaysAgo.setDate(hundredEightyDaysAgo.getDate() - 180);

    // Delete messenger messages older than 180 days
    const result = await prisma.messengerMessage.deleteMany({
      where: {
        createdAt: {
          lt: hundredEightyDaysAgo,
        },
      },
    });

    logger.info('Messenger messages cleanup completed', {
      deletedCount: result.count,
      olderThan: hundredEightyDaysAgo.toISOString(),
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} messenger messages older than 180 days`,
    });
  } catch (err: any) {
    logger.error('Failed to cleanup messenger messages', { error: err });
    return NextResponse.json(
      { error: 'Failed to cleanup messenger messages', details: err.message },
      { status: 500 }
    );
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  return DELETE(request);
}
