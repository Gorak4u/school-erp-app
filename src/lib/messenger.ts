import { z } from 'zod';
import { schoolPrisma } from '@/lib/prisma';
import { emitToUser } from '@/lib/socketServer';
import { logger } from '@/lib/logger';
import { validateInput } from '@/lib/apiSecurity';

export const MESSENGER_PAGE_SIZE = 25;
export const MAX_MESSAGE_LENGTH = 8000;
export const MAX_CONVERSATION_TITLE_LENGTH = 120;
export const MAX_CONVERSATION_DESCRIPTION_LENGTH = 500;

export const MessengerConversationTypeSchema = z.enum(['direct', 'group', 'broadcast']);
export type MessengerConversationType = z.infer<typeof MessengerConversationTypeSchema>;

export const MessengerMessageTypeSchema = z.enum(['text', 'image', 'file', 'audio', 'video', 'system']);
export type MessengerMessageType = z.infer<typeof MessengerMessageTypeSchema>;

export const CreateMessengerConversationSchema = z.object({
  conversationType: MessengerConversationTypeSchema,
  participantIds: z.array(z.string().min(1)).min(1).max(250),
  title: z.string().trim().max(MAX_CONVERSATION_TITLE_LENGTH).optional().nullable(),
  description: z.string().trim().max(MAX_CONVERSATION_DESCRIPTION_LENGTH).optional().nullable(),
  avatar: z.string().trim().max(512).optional().nullable(),
});

export const ListMessengerConversationsQuerySchema = z.object({
  page: z.string().nullable().optional().transform(val => {
    if (!val) return 1;
    const num = parseInt(val, 10);
    return isNaN(num) ? 1 : Math.max(1, num);
  }),
  pageSize: z.string().nullable().optional().transform(val => {
    if (!val) return MESSENGER_PAGE_SIZE;
    const num = parseInt(val, 10);
    return isNaN(num) ? MESSENGER_PAGE_SIZE : Math.min(100, Math.max(1, num));
  }),
  search: z.string().trim().max(120).nullable().optional(),
  conversationType: z.string().nullable().optional().refine(
    (val) => !val || ['direct', 'group', 'broadcast'].includes(val),
    { message: 'Invalid conversation type' }
  ).transform(val => val as 'direct' | 'group' | 'broadcast' | null | undefined),
  status: z.string().nullable().optional().refine(
    (val) => !val || ['active', 'archived'].includes(val),
    { message: 'Invalid status' }
  ).transform(val => val as 'active' | 'archived' | null | undefined),
  archived: z.string().nullable().optional().refine(
    (val) => !val || ['true', 'false'].includes(val),
    { message: 'Invalid archived value' }
  ).transform(val => val as 'true' | 'false' | null | undefined),
});

export const SendMessengerMessageSchema = z.object({
  content: z.string().trim().max(MAX_MESSAGE_LENGTH).optional().default(''),
  messageType: MessengerMessageTypeSchema.default('text'),
  replyToId: z.string().trim().min(1).optional().nullable(),
  attachments: z.array(z.any()).optional().default([]),
});

export const UpdateMessengerMessageSchema = z.object({
  content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export const ListMessengerMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(MESSENGER_PAGE_SIZE),
});

export const MarkMessengerReadSchema = z.object({
  messageId: z.string().trim().min(1).optional().nullable(),
});

export function sanitizeMessengerText(value: string, maxLength: number = MAX_MESSAGE_LENGTH): string {
  return validateInput(value || '', maxLength);
}

export function buildDirectConversationKey(userIds: string[]): string {
  return `direct:${Array.from(new Set(userIds)).sort().join(':')}`;
}

export function buildGroupConversationKey(title: string | null | undefined, schoolId: string, participantIds: string[]): string {
  const safeTitle = sanitizeMessengerText(title || 'Group chat', 120).toLowerCase().replace(/\s+/g, '-');
  return `group:${schoolId}:${safeTitle}:${Array.from(new Set(participantIds)).sort().join(':')}`;
}

export function normalizeParticipantIds(participantIds: string[]): string[] {
  return Array.from(new Set(participantIds.map((id) => id.trim()).filter(Boolean)));
}

export async function createMessengerNotification(params: {
  schoolId: string;
  userId: string;
  type: 'message' | 'conversation' | 'mention';
  title: string;
  message: string;
  conversationId?: string;
  messageId?: string;
  metadata?: Record<string, any>;
}) {
  const prisma = schoolPrisma as any;

  try {
    const metadata = {
      module: 'messenger',
      ...(params.metadata || {}),
    };

    const notification = await prisma.Notification.create({
      data: {
        schoolId: params.schoolId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        priority: 'medium',
        metadata: JSON.stringify(metadata),
        channel: 'in_app',
        entityType: params.conversationId ? 'MessengerConversation' : 'MessengerMessage',
        entityId: params.messageId || params.conversationId || null,
        deliveryStatus: 'delivered',
        isRead: false,
      },
    });

    emitToUser(params.userId, 'messenger_notification', {
      id: notification.id,
      type: params.type,
      title: params.title,
      message: params.message,
      isRead: false,
      createdAt: notification.createdAt,
      metadata,
    });

    return notification;
  } catch (error) {
    logger.error('Failed to create messenger notification', {
      error,
      schoolId: params.schoolId,
      userId: params.userId,
      conversationId: params.conversationId,
      messageId: params.messageId,
    });
    return null;
  }
}

export async function isMessengerEnabledForSchool(schoolId: string): Promise<boolean> {
  try {
    const prisma = schoolPrisma as any;
    const setting = await prisma.schoolSetting.findFirst({
      where: {
        schoolId,
        group: 'app_config',
        key: 'messenger_enabled',
      },
      select: { value: true },
    });

    if (!setting) {
      return true;
    }

    return setting.value !== 'false';
  } catch (error) {
    logger.warn('Failed to read messenger enabled flag, defaulting to enabled', {
      error,
      schoolId,
    });
    return true;
  }
}

export function buildConversationTitle(
  conversationType: MessengerConversationType,
  title: string | null | undefined,
  fallbackName: string,
  participantCount: number
): string {
  if (conversationType !== 'direct') {
    return title?.trim() || fallbackName || 'Group chat';
  }

  return title?.trim() || fallbackName || `Direct chat (${participantCount})`;
}

export function isConversationVisible(status: string | null | undefined): boolean {
  return !status || status === 'active' || status === 'archived';
}
