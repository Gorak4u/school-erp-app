import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cronUnauthorizedResponse, isCronAuthorized, readCronBody } from '@/lib/cron/route-helpers';

// POST /api/cron/cleanup-messenger-messages - Cleanup old messenger messages
export async function POST(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return cronUnauthorizedResponse();
  }

  try {
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
  return POST(request);
}
