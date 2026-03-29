import { sendSchoolEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { schoolPrisma } from '@/lib/prisma';
import { emitToUser } from '@/lib/socketServer';
import { createRequire } from 'module';

// SMS Provider implementations
async function sendSMS(payload: { to: string; message: string }, config: {
  provider: string;
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
}) {
  try {
    switch (config.provider) {
      case 'twilio':
        // Twilio implementation - requires 'twilio' package
        try {
          // Use eval to hide from webpack bundler
          const twilio = eval("require('twilio')");
          const client = twilio(config.apiKey, config.apiSecret);
          const result = await client.messages.create({
            body: payload.message,
            from: config.fromNumber,
            to: payload.to,
          });
          return { success: true, sid: result.sid };
        } catch (importError: any) {
          return { success: false, error: `Twilio not installed or error: ${importError.message}` };
        }

      case 'msg91':
        // MSG91 implementation
        const msg91Response = await fetch('https://api.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            'authkey': config.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flow_id: config.apiSecret, // Template ID as flow_id
            sender: config.fromNumber,
            mobiles: payload.to.replace('+', ''),
            message: payload.message,
          }),
        });
        if (!msg91Response.ok) {
          throw new Error(`MSG91 failed: ${await msg91Response.text()}`);
        }
        return { success: true };

      case 'textlocal':
        // TextLocal implementation
        const textlocalResponse = await fetch('https://api.textlocal.in/send/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apikey: config.apiKey,
            sender: config.fromNumber,
            numbers: payload.to.replace('+', ''),
            message: payload.message,
          }),
        });
        if (!textlocalResponse.ok) {
          throw new Error(`TextLocal failed: ${await textlocalResponse.text()}`);
        }
        return { success: true };

      default:
        throw new Error(`Unknown SMS provider: ${config.provider}`);
    }
  } catch (error: any) {
    return { success: false, error: error?.message || String(error) };
  }
}

async function getSMSSettings(schoolId: string): Promise<{
  enabled: boolean;
  provider: string;
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
} | null> {
  try {
    const prisma = schoolPrisma as any;
    const settings = await prisma.SchoolSetting.findMany({
      where: {
        schoolId,
        group: 'app_config',
        key: {
          in: ['sms_notifications', 'sms_provider', 'sms_api_key', 'sms_api_secret', 'sms_from_number'],
        },
      },
      select: { key: true, value: true },
    });

    const config: Record<string, string> = {};
    for (const s of settings) {
      config[s.key] = s.value || '';
    }

    if (config.sms_notifications !== 'true') {
      return null;
    }

    return {
      enabled: true,
      provider: config.sms_provider || 'twilio',
      apiKey: config.sms_api_key || '',
      apiSecret: config.sms_api_secret || '',
      fromNumber: config.sms_from_number || '',
    };
  } catch (error) {
    logger.error('Failed to get SMS settings', { schoolId, error });
    return null;
  }
}

type ProcessCommunicationOutboxInput = {
  limit?: number;
  schoolId?: string | null;
};

function getNextAttemptDate(attemptCount: number) {
  const minutes = Math.min(60, Math.max(1, 2 ** Math.max(0, attemptCount - 1)));
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function processCommunicationOutboxBatch(input: ProcessCommunicationOutboxInput = {}) {
  const limit = Math.min(100, Math.max(1, input.limit || 25));
  const now = new Date();

  const items = await (schoolPrisma as any).communicationOutbox.findMany({
    where: {
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
      channel: { in: ['email', 'sms'] }, // Skip in_app - handled by separate worker
      status: { in: ['pending', 'failed'] },
      OR: [
        { nextAttemptAt: null },
        { nextAttemptAt: { lte: now } },
      ],
    },
    orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
    take: limit,
  });

  const summary = {
    scanned: items.length,
    sent: 0,
    failed: 0,
    deadLetter: 0,
    skipped: 0,
  };

  for (const item of items) {
    const claim = await (schoolPrisma as any).communicationOutbox.updateMany({
      where: {
        id: item.id,
        status: { in: ['pending', 'failed'] },
      },
      data: {
        status: 'processing',
      },
    });

    if (!claim.count) {
      summary.skipped += 1;
      continue;
    }

    try {
      const payload = JSON.parse(item.payloadJson || '{}');

      // Skip in_app - handled by processInAppNotifications()
      if (item.channel === 'in_app') {
        summary.skipped += 1;
        continue;
      }

      if (item.channel === 'email') {
        const result = await sendSchoolEmail({
          to: payload.to || item.recipientAddress,
          subject: payload.subject,
          html: payload.html,
          schoolId: item.schoolId || undefined,
          attachments: payload.attachments,
        });

        if (result?.skipped) {
          await (schoolPrisma as any).communicationOutbox.update({
            where: { id: item.id },
            data: {
              status: 'skipped',
              attemptCount: (item.attemptCount || 0) + 1,
              nextAttemptAt: null,
              lastError: result?.reason || 'Email notifications disabled',
            },
          });

          summary.skipped += 1;
          continue;
        }

        if (!result?.success) {
          throw new Error(result?.error || 'Email delivery failed');
        }
      }

      if (item.channel === 'sms') {
        const smsSettings = await getSMSSettings(item.schoolId);

        if (!smsSettings) {
          await (schoolPrisma as any).communicationOutbox.update({
            where: { id: item.id },
            data: {
              status: 'skipped',
              attemptCount: (item.attemptCount || 0) + 1,
              nextAttemptAt: null,
              lastError: 'SMS notifications disabled or not configured',
            },
          });
          summary.skipped += 1;
          continue;
        }

        if (!smsSettings.apiKey || !smsSettings.fromNumber) {
          await (schoolPrisma as any).communicationOutbox.update({
            where: { id: item.id },
            data: {
              status: 'skipped',
              attemptCount: (item.attemptCount || 0) + 1,
              nextAttemptAt: null,
              lastError: 'SMS API credentials not configured',
            },
          });
          summary.skipped += 1;
          continue;
        }

        const result = await sendSMS(
          { to: payload.to || item.recipientAddress, message: payload.message },
          smsSettings
        );

        if (!result?.success) {
          throw new Error(result?.error || 'SMS delivery failed');
        }
      }

      await (schoolPrisma as any).communicationOutbox.update({
        where: { id: item.id },
        data: {
          status: 'sent',
          attemptCount: (item.attemptCount || 0) + 1,
          nextAttemptAt: null,
          lastError: null,
        },
      });

      summary.sent += 1;
    } catch (error) {
      const nextAttemptCount = (item.attemptCount || 0) + 1;
      const nextStatus = nextAttemptCount >= 5 ? 'dead_letter' : 'failed';

      await (schoolPrisma as any).communicationOutbox.update({
        where: { id: item.id },
        data: {
          status: nextStatus,
          attemptCount: nextAttemptCount,
          nextAttemptAt: nextStatus === 'dead_letter' ? null : getNextAttemptDate(nextAttemptCount),
          lastError: error instanceof Error ? error.message : 'Unknown outbox processing error',
        },
      });

      if (nextStatus === 'dead_letter') {
        summary.deadLetter += 1;
      } else {
        summary.failed += 1;
      }

      logger.error('Communication outbox processing failed', {
        error,
        outboxId: item.id,
        channel: item.channel,
        schoolId: item.schoolId,
      });
    }
  }

  return summary;
}

async function getSchoolSetting(schoolId: string, key: string): Promise<string | null> {
  try {
    const prisma = schoolPrisma as any;
    const setting = await prisma.schoolSetting.findFirst({
      where: { schoolId, key },
      select: { value: true },
    });
    return setting?.value || null;
  } catch (error) {
    logger.warn('Failed to fetch school setting', { schoolId, key, error });
    return null;
  }
}

/**
 * In-App Notification Worker
 * 
 * Processes pending in-app notifications from CommunicationOutbox
 * and delivers them immediately via:
 * 1. Creating Notification table entry
 * 2. Emitting Socket.IO event for real-time updates
 */
export async function processInAppNotifications(schoolId: string): Promise<void> {
  // Check if notifications are enabled
  const enableNotifications = await getSchoolSetting(schoolId, 'enable_notifications');
  if (enableNotifications === 'false') {
    logger.info('In-app notifications disabled for school', { schoolId });
    return;
  }

  const prisma = schoolPrisma as any;

  try {
    // Find all pending in-app notifications for this school
    const pendingEntries = await prisma.communicationOutbox.findMany({
      where: {
        schoolId,
        channel: 'in_app',
        status: 'pending',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (pendingEntries.length === 0) {
      return;
    }

    logger.info(`Processing ${pendingEntries.length} pending in-app notifications`, { schoolId });

    for (const entry of pendingEntries) {
      try {
        const payload = JSON.parse(entry.payloadJson);

        // Create Notification table entry
        const notification = await prisma.notification.create({
          data: {
            userId: entry.recipientUserId,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            priority: payload.priority || 'medium',
            metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
            schoolId: entry.schoolId,
            channel: 'in_app',
            entityType: payload.entityType || null,
            entityId: payload.entityId || null,
            deliveryStatus: 'delivered',
            templateKey: entry.templateKey,
            dedupeKey: entry.dedupeKey,
            isRead: false,
          },
        });

        // Emit Socket.IO event for real-time notification
        emitToUser(entry.recipientUserId, 'notification', {
          id: notification.id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          priority: payload.priority || 'medium',
          metadata: payload.metadata,
          isRead: false,
          createdAt: notification.createdAt,
        });

        // Mark CommunicationOutbox entry as sent
        await prisma.communicationOutbox.update({
          where: { id: entry.id },
          data: {
            status: 'sent',
            attemptCount: { increment: 1 },
          },
        });

        logger.info('In-app notification delivered', {
          userId: entry.recipientUserId,
          notificationId: notification.id,
          type: payload.type,
        });
      } catch (error: any) {
        logger.error('Failed to deliver in-app notification', {
          entryId: entry.id,
          userId: entry.recipientUserId,
          error: error?.message || String(error),
        });

        // Mark as failed with error details
        await prisma.communicationOutbox.update({
          where: { id: entry.id },
          data: {
            status: 'failed',
            attemptCount: { increment: 1 },
            lastError: error?.message || String(error),
          },
        });
      }
    }
  } catch (error) {
    logger.error('Failed to process in-app notifications', { schoolId, error });
  }
}
