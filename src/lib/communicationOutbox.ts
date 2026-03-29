import { enqueueEmail, type EmailJob } from '@/lib/queues/emailQueue';
import { logger } from '@/lib/logger';
import { schoolPrisma } from '@/lib/prisma';
import { processInAppNotifications } from '@/lib/communicationOutboxProcessor';
import { templateService } from '@/lib/communication';

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

type OutboxSms = {
  to: string;
  message: string;
  recipientUserId?: string | null;
  schoolId?: string | null;
  templateKey?: string | null;
  dedupeKey?: string | null;
  scheduledAt?: Date | null;
};

// NEW: Template-based email type - unified API
type TemplateEmail = {
  templateKey: string;
  variables: Record<string, any>;
  to?: string | null;  // If null, derived from user tables
  recipientUserId?: string | null;
  schoolId?: string | null;
  dedupeKey?: string | null;
  scheduledAt?: Date | null;
};

type TemplateSMS = {
  templateKey: string;
  variables: Record<string, any>;
  to?: string | null;  // If null, derived from user tables
  recipientUserId?: string | null;
  schoolId?: string | null;
  dedupeKey?: string | null;
  scheduledAt?: Date | null;
};

function buildFallbackDedupeKey(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(':').slice(0, 240);
}

async function getSchoolSetting(schoolId: string | null | undefined, key: string): Promise<string | null> {
  if (!schoolId) return null;
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

export async function queueCommunicationOutbox(input: {
  notification?: OutboxNotification | null;
  email?: OutboxEmail | null;
  sms?: OutboxSms | null;
  templateEmail?: TemplateEmail | null;  // NEW: Template-based email
  templateSMS?: TemplateSMS | null;      // NEW: Template-based SMS
}) {
  const { notification, email, sms, templateEmail, templateSMS } = input;
  const schoolId = notification?.schoolId || email?.schoolId || sms?.schoolId || templateEmail?.schoolId || templateSMS?.schoolId;

  // Step 1: Check if notifications are globally enabled
  const enableNotifications = await getSchoolSetting(schoolId, 'enable_notifications');
  if (enableNotifications === 'false') {
    logger.info('Notifications disabled for school', { schoolId });
    return;
  }

  // Helper to derive recipient email from user tables
  async function deriveEmailFromUser(userId: string, schoolId: string): Promise<string | null> {
    try {
      const prisma = schoolPrisma as any;
      
      // 1. Try school_User table (admins, teachers)
      const user = await prisma.school_User.findFirst({
        where: { id: userId, schoolId },
        select: { email: true },
      });
      if (user?.email) return user.email;

      // 2. Try students table (students, parents)
      const student = await prisma.student.findFirst({
        where: { 
          schoolId,
          OR: [{ userId }, { id: userId }],
        },
        select: { email: true, fatherEmail: true, motherEmail: true },
      });
      if (student?.email) return student.email;
      if (student?.fatherEmail) return student.fatherEmail;
      if (student?.motherEmail) return student.motherEmail;

      return null;
    } catch (error) {
      logger.warn('Failed to derive email', { userId, schoolId, error });
      return null;
    }
  }

  // Helper to derive recipient phone from user tables
  async function derivePhoneFromUser(userId: string, schoolId: string): Promise<string | null> {
    try {
      const prisma = schoolPrisma as any;
      let phone: string | null = null;

      // Try students table
      const student = await prisma.student.findFirst({
        where: { 
          schoolId,
          OR: [{ userId }, { id: userId }],
        },
        select: { phone: true, fatherPhone: true, motherPhone: true },
      });

      if (student?.phone) phone = student.phone;
      else if (student?.fatherPhone) phone = student.fatherPhone;
      else if (student?.motherPhone) phone = student.motherPhone;

      // Try teachers table if not found
      if (!phone) {
        const teacher = await prisma.teacher.findFirst({
          where: { 
            schoolId,
            OR: [{ userId }, { id: userId }],
          },
          select: { phone: true },
        });
        phone = teacher?.phone || null;
      }

      return phone;
    } catch (error) {
      logger.warn('Failed to derive phone', { userId, schoolId, error });
      return null;
    }
  }

  // Helper to create CommunicationOutbox entry with duplicate check
  const createOutboxEntry = async (data: any) => {
    try {
      const prisma = schoolPrisma as any;
      
      // Check if entry with same channel+dedupeKey already exists
      if (data.dedupeKey) {
        const existing = await prisma.communicationOutbox.findFirst({
          where: {
            channel: data.channel,
            dedupeKey: data.dedupeKey,
          },
          select: { id: true, status: true },
        });
        
        if (existing) {
          // If failed, update to pending to retry
          if (existing.status === 'failed') {
            await prisma.communicationOutbox.update({
              where: { id: existing.id },
              data: {
                status: 'pending',
                attemptCount: 0,
                lastError: null,
                payloadJson: data.payloadJson, // Update with new payload
              },
            });
            logger.info('Updated failed entry to pending for retry', { 
              channel: data.channel, 
              dedupeKey: data.dedupeKey 
            });
            return true;
          }
          // If pending or sent, skip
          logger.info('Skipping duplicate notification', { 
            channel: data.channel, 
            dedupeKey: data.dedupeKey,
            status: existing.status 
          });
          return true;
        }
      }
      
      await prisma.communicationOutbox.create({ data });
      return true;
    } catch (error: any) {
      // If duplicate key error, skip gracefully
      if (error?.code === 'P2002') {
        logger.warn('Duplicate entry exists, skipping', { 
          channel: data.channel, 
          dedupeKey: data.dedupeKey 
        });
        return true;
      }
      logger.error('Failed to create CommunicationOutbox entry', { 
        error: error?.message || String(error), 
        schoolId, 
        data 
      });
      return false;
    }
  };

  // Step 2: Queue in-app notification if notification provided
  if (notification) {
    // Use provided dedupeKey, or build one with type + userId + entityId for unique per-request notifications
    const requestId = (notification.metadata as any)?.requestId;
    const notificationDedupeKey = notification.dedupeKey || buildFallbackDedupeKey([
      notification.type, 
      notification.userId, 
      notification.entityId || requestId || Date.now().toString() // Ensure unique per request
    ]);

    const inAppPayload = {
      schoolId: notification.schoolId || null,
      channel: 'in_app' as const,
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
      status: 'pending' as const,
      attemptCount: 0,
      nextAttemptAt: notification.scheduledAt || new Date(),
    };

    await createOutboxEntry(inAppPayload);
    logger.info('Queued in-app notification', { userId: notification.userId, type: notification.type });
  }

  // Step 3: Queue email if provided or if email_notifications enabled
  // Skip if templateEmail is provided (handled in Step 5 with rich templates)
  if (email) {
    // Email explicitly provided - create entry
    const emailDedupeKey = email.dedupeKey || buildFallbackDedupeKey(['email', email.to, email.subject]);

    const emailPayload = {
      schoolId: email.schoolId || null,
      channel: 'email' as const,
      templateKey: email.templateKey || null,
      recipientUserId: email.recipientUserId || null,
      recipientAddress: email.to,
      payloadJson: JSON.stringify({
        to: email.to,
        subject: email.subject,
        html: email.html,
        attachments: email.attachments || [],
      }),
      dedupeKey: emailDedupeKey,
      status: 'pending' as const,
      attemptCount: 0,
      nextAttemptAt: email.scheduledAt || new Date(),
    };

    await createOutboxEntry(emailPayload);
    logger.info('Queued email notification', { to: email.to, subject: email.subject });
  } else if (notification && notification.schoolId && !templateEmail) {
    // Check if email notifications enabled
    const emailNotifications = await getSchoolSetting(notification.schoolId, 'email_notifications');
    if (emailNotifications === 'true') {
      // Get user email from database
      try {
        const prisma = schoolPrisma as any;
        const user = await prisma.school_User.findFirst({
          where: { id: notification.userId, schoolId: notification.schoolId },
          select: { email: true },
        });

        if (user?.email) {
          const emailRequestId = (notification.metadata as any)?.requestId;
          const emailDedupeKey = buildFallbackDedupeKey([
            'email', 
            user.email, 
            notification.entityId || emailRequestId || Date.now().toString() // Unique per request
          ]);

          const emailPayload = {
            schoolId: notification.schoolId,
            channel: 'email' as const,
            templateKey: `notification_${notification.type}`,
            recipientUserId: notification.userId,
            recipientAddress: user.email,
            payloadJson: JSON.stringify({
              to: user.email,
              subject: notification.title,
              html: `<p>${notification.message}</p>`,
            }),
            dedupeKey: emailDedupeKey,
            status: 'pending' as const,
            attemptCount: 0,
            nextAttemptAt: new Date(),
          };

          await createOutboxEntry(emailPayload);
          logger.info('Auto-queued email notification', { to: user.email, userId: notification.userId });
        }
      } catch (error) {
        logger.warn('Failed to auto-queue email', { userId: notification.userId, error });
      }
    }
  }

  // Step 4: Queue SMS if provided or if sms_notifications enabled
  if (sms) {
    // SMS explicitly provided - create entry
    const smsDedupeKey = sms.dedupeKey || buildFallbackDedupeKey(['sms', sms.to, sms.message.slice(0, 50)]);

    const smsPayload = {
      schoolId: sms.schoolId || null,
      channel: 'sms' as const,
      templateKey: sms.templateKey || null,
      recipientUserId: sms.recipientUserId || null,
      recipientAddress: sms.to,
      payloadJson: JSON.stringify({
        to: sms.to,
        message: sms.message,
      }),
      dedupeKey: smsDedupeKey,
      status: 'pending' as const,
      attemptCount: 0,
      nextAttemptAt: sms.scheduledAt || new Date(),
    };

    await createOutboxEntry(smsPayload);
    logger.info('Queued SMS notification', { to: sms.to });
  } else if (notification && notification.schoolId) {
    // Auto-queue SMS if sms_notifications enabled - check student/teacher tables for phone
    const smsNotifications = await getSchoolSetting(notification.schoolId, 'sms_notifications');
    if (smsNotifications === 'true') {
      try {
        const prisma = schoolPrisma as any;
        let phone: string | null = null;

        // Try to find phone in students table
        const student = await prisma.student.findFirst({
          where: { 
            schoolId: notification.schoolId,
            OR: [
              { userId: notification.userId },
              { id: notification.userId },
            ],
          },
          select: { phone: true, fatherPhone: true, motherPhone: true },
        });

        if (student?.phone) {
          phone = student.phone;
        } else if (student?.fatherPhone) {
          phone = student.fatherPhone;
        } else if (student?.motherPhone) {
          phone = student.motherPhone;
        }

        // If not found, try teachers table
        if (!phone) {
          const teacher = await prisma.teacher.findFirst({
            where: { 
              schoolId: notification.schoolId,
              OR: [
                { userId: notification.userId },
                { id: notification.userId },
              ],
            },
            select: { phone: true },
          });
          phone = teacher?.phone || null;
        }

        if (phone) {
          const smsRequestId = (notification.metadata as any)?.requestId;
          const smsDedupeKey = buildFallbackDedupeKey([
            'sms', 
            phone, 
            notification.entityId || smsRequestId || Date.now().toString()
          ]);

          const smsPayload = {
            schoolId: notification.schoolId,
            channel: 'sms' as const,
            templateKey: `notification_${notification.type}`,
            recipientUserId: notification.userId,
            recipientAddress: phone,
            payloadJson: JSON.stringify({
              to: phone,
              message: `${notification.title}: ${notification.message}`,
            }),
            dedupeKey: smsDedupeKey,
            status: 'pending' as const,
            attemptCount: 0,
            nextAttemptAt: new Date(),
          };

          await createOutboxEntry(smsPayload);
          logger.info('Auto-queued SMS notification', { to: phone, userId: notification.userId });
        }
      } catch (error: any) {
        logger.warn('Failed to auto-queue SMS', { 
          userId: notification.userId, 
          error: error?.message || String(error),
          code: error?.code 
        });
      }
    }
  }

  // Step 5: Handle template-based email (NEW - renders template, derives recipient if needed)
  logger.info('Step 5: Checking templateEmail', { hasTemplateEmail: !!templateEmail, templateKey: templateEmail?.templateKey });
  if (templateEmail) {
    try {
      const emailEnabled = await getSchoolSetting(templateEmail.schoolId, 'email_notifications');
      logger.info('Email notifications setting', { schoolId: templateEmail.schoolId, enabled: emailEnabled });
      if (emailEnabled !== 'true') {
        logger.info('Email notifications disabled, skipping template email', { schoolId: templateEmail.schoolId });
      } else {
        // Render the template
        logger.info('Rendering template', { templateKey: templateEmail.templateKey, schoolId: templateEmail.schoolId });
        const rendered = await templateService.render({
          templateKey: templateEmail.templateKey,
          schoolId: templateEmail.schoolId || undefined,
          variables: templateEmail.variables,
        });

        logger.info('Template render result', { hasRendered: !!rendered, subject: rendered?.subject });

        if (!rendered) {
          logger.warn('Template not found, falling back to basic email', { templateKey: templateEmail.templateKey });
          // FALLBACK: Send basic notification email
          let recipientEmail = templateEmail.to;
          let recipientUserId = templateEmail.recipientUserId;

          if (!recipientEmail && templateEmail.recipientUserId && templateEmail.schoolId) {
            recipientEmail = await deriveEmailFromUser(templateEmail.recipientUserId, templateEmail.schoolId);
          }

          if (recipientEmail) {
            const fallbackDedupeKey = buildFallbackDedupeKey([
              'email',
              'fallback',
              templateEmail.templateKey,
              recipientEmail,
              Date.now().toString()
            ]);

            await createOutboxEntry({
              schoolId: templateEmail.schoolId || null,
              channel: 'email',
              templateKey: `fallback_${templateEmail.templateKey}`,
              recipientUserId: recipientUserId || null,
              recipientAddress: recipientEmail,
              payloadJson: JSON.stringify({
                to: recipientEmail,
                subject: templateEmail.templateKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                html: `<p>Notification: ${templateEmail.templateKey}</p><p>Please check the app for details.</p>`,
              }),
              dedupeKey: fallbackDedupeKey,
              status: 'pending',
              attemptCount: 0,
              nextAttemptAt: templateEmail.scheduledAt || new Date(),
            });

            logger.info('Fallback basic email queued', {
              templateKey: templateEmail.templateKey,
              to: recipientEmail,
            });
          }
        } else {
          // Determine recipient: explicit > derived > skip
          let recipientEmail = templateEmail.to;
          let recipientUserId = templateEmail.recipientUserId;

          if (!recipientEmail && templateEmail.recipientUserId && templateEmail.schoolId) {
            recipientEmail = await deriveEmailFromUser(templateEmail.recipientUserId, templateEmail.schoolId);
          }

          if (recipientEmail) {
            const emailDedupeKey = templateEmail.dedupeKey || buildFallbackDedupeKey([
              'email',
              templateEmail.templateKey,
              recipientEmail,
              Date.now().toString()
            ]);

            await createOutboxEntry({
              schoolId: templateEmail.schoolId || null,
              channel: 'email',
              templateKey: templateEmail.templateKey,
              recipientUserId: recipientUserId || null,
              recipientAddress: recipientEmail,
              payloadJson: JSON.stringify({
                to: recipientEmail,
                subject: rendered.subject,
                html: rendered.html,
              }),
              dedupeKey: emailDedupeKey,
              status: 'pending',
              attemptCount: 0,
              nextAttemptAt: templateEmail.scheduledAt || new Date(),
            });

            logger.info('Template email queued', {
              templateKey: templateEmail.templateKey,
              to: recipientEmail,
              schoolId: templateEmail.schoolId
            });
          } else {
            logger.warn('No recipient email for template email, skipping', {
              templateKey: templateEmail.templateKey,
              recipientUserId: templateEmail.recipientUserId
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to queue template email', { error, templateKey: templateEmail.templateKey });
    }
  }

  // Step 6: Handle template-based SMS (NEW - renders template, derives recipient if needed)
  if (templateSMS) {
    try {
      const smsEnabled = await getSchoolSetting(templateSMS.schoolId, 'sms_notifications');
      if (smsEnabled !== 'true') {
        logger.info('SMS notifications disabled, skipping template SMS', { schoolId: templateSMS.schoolId });
      } else {
        // Render the template
        const rendered = await templateService.render({
          templateKey: templateSMS.templateKey,
          schoolId: templateSMS.schoolId || undefined,
          category: 'sms',
          variables: templateSMS.variables,
        });

        if (!rendered || !rendered.text) {
          logger.error('SMS template not found', { templateKey: templateSMS.templateKey });
        } else {
          // Determine recipient: explicit > derived > skip
          let recipientPhone = templateSMS.to;
          let recipientUserId = templateSMS.recipientUserId;

          if (!recipientPhone && templateSMS.recipientUserId && templateSMS.schoolId) {
            recipientPhone = await derivePhoneFromUser(templateSMS.recipientUserId, templateSMS.schoolId);
          }

          if (recipientPhone) {
            const smsDedupeKey = templateSMS.dedupeKey || buildFallbackDedupeKey([
              'sms',
              templateSMS.templateKey,
              recipientPhone,
              Date.now().toString()
            ]);

            await createOutboxEntry({
              schoolId: templateSMS.schoolId || null,
              channel: 'sms',
              templateKey: templateSMS.templateKey,
              recipientUserId: recipientUserId || null,
              recipientAddress: recipientPhone,
              payloadJson: JSON.stringify({
                to: recipientPhone,
                message: rendered.text,
              }),
              dedupeKey: smsDedupeKey,
              status: 'pending',
              attemptCount: 0,
              nextAttemptAt: templateSMS.scheduledAt || new Date(),
            });

            logger.info('Template SMS queued', {
              templateKey: templateSMS.templateKey,
              to: recipientPhone,
              schoolId: templateSMS.schoolId
            });
          } else {
            logger.warn('No recipient phone for template SMS, skipping', {
              templateKey: templateSMS.templateKey,
              recipientUserId: templateSMS.recipientUserId
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to queue template SMS', { error, templateKey: templateSMS.templateKey });
    }
  }

  // Step 7: Auto-process in-app notifications immediately for real-time delivery
  if (notification?.schoolId) {
    try {
      await processInAppNotifications(notification.schoolId);
    } catch (error) {
      logger.error('Failed to auto-process in-app notifications', { schoolId: notification.schoolId, error });
    }
  }
}
