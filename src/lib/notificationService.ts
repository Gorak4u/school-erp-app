import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface NotificationPayload {
  userId: string;
  schoolId: string;
  type: 'approval_request' | 'approval_status' | 'payment' | 'general' | 'fine' | 'refund' | 'message' | 'conversation' | 'mention';
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: {
    requestId?: string;
    actionUrl?: string;
    entityType?: string;
    entityId?: string;
    [key: string]: any;
  };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    const prisma = schoolPrisma as any;

    await prisma.Notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    logger.error('Failed to mark notification as read', { error, notificationId });
    return false;
  }
}

/**
 * Get notifications for user
 */
export async function getNotifications(
  schoolId: string,
  userId: string,
  options: {
    isRead?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ notifications: any[]; total: number }> {
  try {
    const prisma = schoolPrisma as any;
    const { isRead, limit = 20, offset = 0 } = options;

    const where: any = {
      schoolId,
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [notifications, total] = await Promise.all([
      prisma.Notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.Notification.count({ where }),
    ]);

    return {
      notifications: notifications.map((n: any) => ({
        ...n,
        metadata: n.metadata ? JSON.parse(n.metadata) : null,
      })),
      total,
    };
  } catch (error) {
    logger.error('Failed to get notifications', { error, schoolId, userId });
    return { notifications: [], total: 0 };
  }
}

export async function getUnreadCount(schoolId: string, userId: string): Promise<number> {
  try {
    const prisma = schoolPrisma as any;

    const count = await prisma.Notification.count({
      where: {
        schoolId,
        userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    logger.error('Failed to get unread count', { error, schoolId, userId });
    return 0;
  }
}
