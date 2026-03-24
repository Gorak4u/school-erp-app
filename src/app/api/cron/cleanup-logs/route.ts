import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';

/**
 * Cleanup Old Logs - Cron Job Handler
 * Removes old audit logs and system records
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const daysToKeep = body.daysToKeep || 90;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Clean up old audit logs
    const auditLogsDeleted = await schoolPrisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Clean up old communication outbox entries that are sent or dead_letter
    const outboxDeleted = await schoolPrisma.communicationOutbox.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: {
          in: ['sent', 'dead_letter'],
        },
      },
    });

    // Clean up old notification entries (if they exist)
    let notificationsDeleted = 0;
    try {
      const result = await (schoolPrisma as any).notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
      notificationsDeleted = result.count;
    } catch (error) {
      // Notifications table might not exist, ignore error
    }

    return NextResponse.json({
      success: true,
      deleted: {
        auditLogs: auditLogsDeleted.count,
        outboxEntries: outboxDeleted.count,
        notifications: notificationsDeleted,
      },
      cutoffDate: cutoffDate.toISOString(),
      daysToKeep,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cron] Log cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
