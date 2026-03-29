import { schoolPrisma, saasPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { emitToUser } from '@/lib/socketServer';

export interface NotificationPayload {
  userId: string;
  schoolId: string;
  type: 'approval_request' | 'approval_status' | 'payment' | 'general' | 'fine' | 'refund';
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
 * Create and send notification via all enabled channels
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const prisma = schoolPrisma as any;

    // Check if notifications are enabled for this school (default to true if not set)
    const appNotifications = await prisma.SchoolSetting.findFirst({
      where: {
        schoolId: payload.schoolId,
        group: 'app_config',
        key: 'enable_notifications',
      },
    });

    // Default to enabled if setting doesn't exist, check if explicitly disabled
    if (appNotifications && appNotifications.value === 'false') {
      logger.info('Notifications disabled for school', { schoolId: payload.schoolId });
      return false;
    }

    // Create in-app notification
    const notification = await prisma.Notification.create({
      data: {
        userId: payload.userId,
        schoolId: payload.schoolId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        priority: payload.priority || 'medium',
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
        channel: 'in_app',
        deliveryStatus: 'delivered',
        deliveredAt: new Date(),
        isRead: false,
      },
    });

    // Queue email notification if enabled
    const emailEnabled = await prisma.SchoolSetting.findFirst({
      where: {
        schoolId: payload.schoolId,
        group: 'app_config',
        key: 'email_notifications',
        value: 'true',
      },
    });

    if (emailEnabled && payload.metadata?.actionUrl) {
      // Fetch user email and school details for branding
      const [user, school] = await Promise.all([
        prisma.school_User.findUnique({
          where: { id: payload.userId },
          select: { email: true },
        }),
        (saasPrisma as any).school.findUnique({
          where: { id: payload.schoolId },
          select: { name: true, logo: true },
        }),
      ]);

      if (user?.email) {
        const schoolName = school?.name || 'School ERP';
        const primaryColor = '#3b82f6'; // Default blue color
        
        // Color coding based on notification type
        const typeColors: Record<string, { bg: string; text: string }> = {
          approval_request: { bg: '#f59e0b', text: '#d97706' },
          approval_status: { bg: '#22c55e', text: '#16a34a' },
          payment: { bg: '#3b82f6', text: '#2563eb' },
          fine: { bg: '#ef4444', text: '#dc2626' },
          refund: { bg: '#8b5cf6', text: '#7c3aed' },
          general: { bg: primaryColor, text: primaryColor },
        };
        const colors = typeColors[payload.type] || typeColors.general;

        // Build professional HTML email with school branding
        const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.title} - ${schoolName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f3f4f6;">
  <div style="background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.text} 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    ${school?.logo ? `<img src="${school.logo}" alt="${schoolName}" style="max-height: 60px; margin-bottom: 15px; border-radius: 8px;">` : ''}
    <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">${payload.title}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${schoolName}</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="background: ${colors.bg}15; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${colors.bg};">
      <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">${payload.message}</p>
    </div>
    
    ${payload.metadata?.actionUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${payload.metadata.actionUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.text} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: transform 0.2s;">
        View Details →
      </a>
    </div>
    ` : ''}
    
    <div style="border-top: 1px solid #e5e7eb; margin-top: 25px; padding-top: 20px;">
      <p style="font-size: 13px; color: #6b7280; margin: 0; text-align: center;">
        This notification was sent from ${schoolName}'s School ERP system<br>
        <span style="color: #9ca3af;">Please do not reply to this email</span>
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 15px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">© ${new Date().getFullYear()} ${schoolName}. All rights reserved.</p>
  </div>
</body>
</html>`;

        await prisma.CommunicationOutbox.create({
          data: {
            schoolId: payload.schoolId,
            channel: 'email',
            templateKey: `notification_${payload.type}`,
            recipientUserId: payload.userId,
            recipientAddress: user.email,
            payloadJson: JSON.stringify({
              subject: `${payload.title} - ${schoolName}`,
              html: htmlBody,
              to: user.email,
            }),
            status: 'pending',
          },
        });
      }
    }

    logger.info('Notification sent', {
      notificationId: notification.id,
      userId: payload.userId,
      type: payload.type,
    });

    // Emit real-time notification via Socket.IO
    emitToUser(payload.userId, 'notification', {
      id: notification.id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      priority: payload.priority || 'medium',
      metadata: payload.metadata,
      isRead: false,
      createdAt: notification.createdAt,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send notification', { error, payload });
    return false;
  }
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

/**
 * Send notification to all users with approval permissions
 */
export async function sendNotificationToApprovers(
  schoolId: string,
  payload: Omit<NotificationPayload, 'userId' | 'schoolId'>
): Promise<boolean> {
  try {
    const prisma = schoolPrisma as any;

    // Find all admin users in the school
    const adminUsers = await prisma.school_User.findMany({
      where: {
        schoolId,
        role: { in: ['admin', 'super_admin'] },
        isActive: true,
      },
      select: { id: true },
    });

    if (adminUsers.length === 0) {
      logger.warn('No admin users found for approval notification', { schoolId });
      return false;
    }

    // Send notification to each admin
    const results = await Promise.all(
      adminUsers.map((user: { id: string }) =>
        sendNotification({
          ...payload,
          userId: user.id,
          schoolId,
        })
      )
    );

    return results.some(r => r);
  } catch (error) {
    logger.error('Failed to send notification to approvers', { error, schoolId, payload });
    return false;
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
