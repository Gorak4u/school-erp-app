import { enqueueEmail, type EmailJob } from '@/lib/queues/emailQueue';
import { logger } from '@/lib/logger';
import { schoolPrisma } from '@/lib/prisma';

type OutboxNotification = {
  userId: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown> | null;
  schoolId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  templateKey?: string | null;
  dedupeKey?: string | null;
  scheduledAt?: Date | null;
};

type OutboxEmail = EmailJob & {
  templateKey?: string;
  recipientUserId?: string | null;
  dedupeKey?: string | null;
  scheduledAt?: Date | null;
};

function buildFallbackDedupeKey(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(':').slice(0, 240);
}

export async function queueCommunicationOutbox(input: {
  notification?: OutboxNotification | null;
  email?: OutboxEmail | null;
}) {
  const { notification, email } = input;

  if (notification) {
    const notificationDedupeKey = notification.dedupeKey || buildFallbackDedupeKey([notification.type, notification.userId, notification.entityId || undefined]);
    let shouldSkipNotification = false;

    try {
      const existingNotification = await (schoolPrisma as any).notification.findFirst({
        where: {
          userId: notification.userId,
          dedupeKey: notificationDedupeKey,
        },
        select: { id: true },
      });

      if (existingNotification?.id) {
        shouldSkipNotification = true;
      }
    } catch (error) {
      logger.warn('Notification dedupe precheck skipped', {
        error,
        userId: notification.userId,
        type: notification.type,
      });
    }

    if (shouldSkipNotification) {
      logger.info('Skipping duplicate notification outbox item', {
        userId: notification.userId,
        type: notification.type,
        dedupeKey: notificationDedupeKey,
      });
    } else {

      try {
        await (schoolPrisma as any).notification.create({
          data: {
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority || 'medium',
            metadata: notification.metadata ? JSON.stringify(notification.metadata) : null,
            schoolId: notification.schoolId || null,
            channel: 'in_app',
            entityType: notification.entityType || null,
            entityId: notification.entityId || null,
            deliveryStatus: 'sent',
            templateKey: notification.templateKey || null,
            dedupeKey: notificationDedupeKey,
            scheduledAt: notification.scheduledAt || null,
            deliveredAt: new Date(),
            isRead: false,
          },
        });
      } catch (error) {
        logger.warn('Expanded notification write failed, retrying legacy shape', {
          error,
          userId: notification.userId,
          type: notification.type,
        });

        try {
          await (schoolPrisma as any).notification.create({
            data: {
              userId: notification.userId,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              priority: notification.priority || 'medium',
              metadata: notification.metadata ? JSON.stringify(notification.metadata) : null,
              schoolId: notification.schoolId || null,
              isRead: false,
            },
          });
        } catch (legacyError) {
          logger.error('Failed to enqueue notification outbox item', {
            error: legacyError,
            userId: notification.userId,
            type: notification.type,
          });
        }
      }

      try {
        await (schoolPrisma as any).communicationOutbox.create({
          data: {
            schoolId: notification.schoolId || null,
            channel: 'in_app',
            templateKey: notification.templateKey || null,
            recipientUserId: notification.userId,
            recipientAddress: null,
            payloadJson: JSON.stringify({
              type: notification.type,
              title: notification.title,
              message: notification.message,
              priority: notification.priority || 'medium',
              metadata: notification.metadata || null,
              entityType: notification.entityType || null,
              entityId: notification.entityId || null,
            }),
            dedupeKey: notificationDedupeKey,
            status: 'sent',
            attemptCount: 1,
            nextAttemptAt: notification.scheduledAt || null,
          },
        });
      } catch (error) {
        logger.warn('CommunicationOutbox notification write skipped', {
          error,
          userId: notification.userId,
          type: notification.type,
        });
      }
    }
  }

  if (email) {
    let emailPersistedToOutbox = false;

    try {
      await (schoolPrisma as any).communicationOutbox.create({
        data: {
          schoolId: email.schoolId || null,
          channel: 'email',
          templateKey: email.templateKey || null,
          recipientUserId: email.recipientUserId || null,
          recipientAddress: email.to,
          payloadJson: JSON.stringify({
            to: email.to,
            subject: email.subject,
            html: email.html,
            attachments: email.attachments || [],
          }),
          dedupeKey: email.dedupeKey || buildFallbackDedupeKey(['email', email.to, email.subject]),
          status: 'pending',
          attemptCount: 0,
          nextAttemptAt: email.scheduledAt || new Date(),
        },
      });
      emailPersistedToOutbox = true;
    } catch (error) {
      logger.warn('CommunicationOutbox email write skipped', {
        error,
        to: email.to,
        subject: email.subject,
      });
    }

    if (!emailPersistedToOutbox) {
      try {
        enqueueEmail(email);
      } catch (error) {
        logger.error('Failed to enqueue email outbox item', {
          error,
          to: email.to,
          subject: email.subject,
          schoolId: email.schoolId,
        });
      }
    }
  }
}
