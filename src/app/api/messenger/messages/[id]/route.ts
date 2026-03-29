import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';
import {
  UpdateMessengerMessageSchema,
  isMessengerEnabledForSchool,
  sanitizeMessengerText,
} from '@/lib/messenger';
import { getIO } from '@/lib/socketServer';
import { logger } from '@/lib/logger';

function formatMessage(message: any) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    body: message.body,
    messageType: message.messageType,
    attachments: message.attachments,
    sender: {
      id: message.sender.id,
      name: `${message.sender.firstName} ${message.sender.lastName}`.trim(),
      avatar: message.sender.avatar,
    },
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          body: message.replyTo.body?.substring(0, 100) || '',
          senderName: `${message.replyTo.sender.firstName} ${message.replyTo.sender.lastName}`.trim(),
        }
      : null,
    reactions: (message.reactions || []).map((reaction: any) => ({
      reaction: reaction.reaction,
      userId: reaction.user.id,
      userName: `${reaction.user.firstName} ${reaction.user.lastName}`.trim(),
    })),
    isRead: Boolean(message.readReceipts?.length),
    editedAt: message.editedAt,
    createdAt: message.createdAt,
  };
}

async function loadMessage(prisma: any, messageId: string, schoolId: string) {
  return prisma.messengerMessage.findFirst({
    where: {
      id: messageId,
      schoolId,
      status: 'active',
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      conversation: {
        select: {
          id: true,
          createdBy: true,
        },
      },
      replyTo: {
        select: {
          id: true,
          body: true,
          sender: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      readReceipts: {
        select: {
          id: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });
}

async function canAccessMessage(prisma: any, conversationId: string, userId: string, role: string) {
  if (role === 'admin' || role === 'super_admin') return true;

  const participant = await prisma.messengerConversationParticipant.findFirst({
    where: {
      conversationId,
      userId,
      status: 'active',
    },
    select: {
      id: true,
      participantRole: true,
    },
  });

  return Boolean(participant);
}

async function emitMessageUpdate(prisma: any, message: any) {
  try {
    const io = getIO();
    const formatted = formatMessage(message);
    const participantIds = await prisma.messengerConversationParticipant.findMany({
      where: {
        conversationId: message.conversationId,
        status: 'active',
      },
      select: {
        userId: true,
      },
    });

    io.to(`conversation:${message.conversationId}`).emit('message:updated', formatted);
    for (const participant of participantIds) {
      io.to(`user:${participant.userId}`).emit('message:updated', formatted);
    }
  } catch (error) {
    logger.warn('Failed to emit messenger message update', { error, messageId: message.id });
  }
}

async function emitMessageDelete(prisma: any, message: any) {
  try {
    const io = getIO();
    const participantIds = await prisma.messengerConversationParticipant.findMany({
      where: {
        conversationId: message.conversationId,
        status: 'active',
      },
      select: {
        userId: true,
      },
    });

    io.to(`conversation:${message.conversationId}`).emit('message:deleted', {
      id: message.id,
      conversationId: message.conversationId,
    });

    for (const participant of participantIds) {
      io.to(`user:${participant.userId}`).emit('message:deleted', {
        id: message.id,
        conversationId: message.conversationId,
      });
    }
  } catch (error) {
    logger.warn('Failed to emit messenger message delete', { error, messageId: message.id });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!ctx.schoolId) {
      return NextResponse.json({ error: { code: 'NO_SCHOOL', message: 'No school context' } }, { status: 400 });
    }

    const messengerEnabled = await isMessengerEnabledForSchool(ctx.schoolId);
    if (!messengerEnabled) {
      return NextResponse.json(
        { error: { code: 'MESSENGER_DISABLED', message: 'Messenger is disabled for this school' } },
        { status: 403 }
      );
    }

    const { id: messageId } = await params;
    const prisma = schoolPrisma as any;
    const message = await loadMessage(prisma, messageId, ctx.schoolId);

    if (!message) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Message not found' } }, { status: 404 });
    }

    const canAccess = await canAccessMessage(prisma, message.conversationId, ctx.userId, ctx.role);
    if (!canAccess) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not allowed to edit this message' } }, { status: 403 });
    }

    if (message.senderId !== ctx.userId && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only the sender or an admin can edit this message' } }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const result = UpdateMessengerMessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', details: result.error.issues } }, { status: 400 });
    }

    const updated = await prisma.messengerMessage.update({
      where: { id: messageId },
      data: {
        body: sanitizeMessengerText(result.data.content),
        editedAt: new Date(),
        editVersion: { increment: 1 },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            body: true,
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        readReceipts: {
          select: {
            id: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    await emitMessageUpdate(prisma, updated);
    return NextResponse.json({ data: formatMessage(updated) });
  } catch (err: any) {
    logger.error('PATCH /api/messenger/messages/[id] failed', { error: err });
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to edit message' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!ctx.schoolId) {
      return NextResponse.json({ error: { code: 'NO_SCHOOL', message: 'No school context' } }, { status: 400 });
    }

    const messengerEnabled = await isMessengerEnabledForSchool(ctx.schoolId);
    if (!messengerEnabled) {
      return NextResponse.json(
        { error: { code: 'MESSENGER_DISABLED', message: 'Messenger is disabled for this school' } },
        { status: 403 }
      );
    }

    const { id: messageId } = await params;
    const prisma = schoolPrisma as any;
    const message = await loadMessage(prisma, messageId, ctx.schoolId);

    if (!message) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Message not found' } }, { status: 404 });
    }

    const canAccess = await canAccessMessage(prisma, message.conversationId, ctx.userId, ctx.role);
    if (!canAccess) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not allowed to delete this message' } }, { status: 403 });
    }

    if (message.senderId !== ctx.userId && ctx.role !== 'admin' && ctx.role !== 'super_admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only the sender or an admin can delete this message' } }, { status: 403 });
    }

    const deleted = await prisma.messengerMessage.update({
      where: { id: messageId },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
      },
    });

    await emitMessageDelete(prisma, deleted);
    return NextResponse.json({ data: { id: deleted.id, conversationId: deleted.conversationId }, success: true });
  } catch (err: any) {
    logger.error('DELETE /api/messenger/messages/[id] failed', { error: err });
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete message' } }, { status: 500 });
  }
}
