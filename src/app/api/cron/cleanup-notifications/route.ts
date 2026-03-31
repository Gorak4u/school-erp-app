import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cronUnauthorizedResponse, isCronAuthorized, readCronBody } from '@/lib/cron/route-helpers';

// POST /api/cron/cleanup-notifications - Cleanup old notifications
export async function POST(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return cronUnauthorizedResponse();
  }

  try {
    const prisma = schoolPrisma as any;
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Delete notifications older than 90 days
    const result = await prisma.Notification.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    logger.info('Notification cleanup completed', {
      deletedCount: result.count,
      olderThan: ninetyDaysAgo.toISOString(),
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} notifications older than 90 days`,
    });
  } catch (err: any) {
    logger.error('Failed to cleanup notifications', { error: err });
    return NextResponse.json(
      { error: 'Failed to cleanup notifications', details: err.message },
      { status: 500 }
    );
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
