import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';
import { MarkMessengerReadSchema, isMessengerEnabledForSchool } from '@/lib/messenger';
import { getIO } from '@/lib/socketServer';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: conversationId } = await params;
    const body = await request.json();
    const result = MarkMessengerReadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', details: result.error.issues } }, { status: 400 });
    }

    const { messageId } = result.data;
    const prisma = schoolPrisma as any;

    const participant = await prisma.messengerConversationParticipant.findFirst({
      where: {
        conversationId,
        userId: ctx.userId,
        status: 'active',
      },
    });

    if (!participant) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not a conversation member' } }, { status: 403 });
    }

    if (messageId) {
      await prisma.messengerMessageReadReceipt.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId: ctx.userId,
          },
        },
        create: {
          schoolId: ctx.schoolId,
          messageId,
          userId: ctx.userId,
        },
        update: {},
      });

      const message = await prisma.messengerMessage.findUnique({
        where: { id: messageId },
        select: { senderId: true },
      });

      if (message) {
        try {
          const io = getIO();
          io.to(`user:${message.senderId}`).emit('message:readReceipt', {
            messageId,
            userId: ctx.userId,
            readAt: new Date(),
          });
        } catch (socketError) {
          console.warn('Socket.IO not available');
        }
      }
    }

    await prisma.messengerConversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: ctx.userId,
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
        lastReadMessageId: messageId || undefined,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('POST /api/messenger/conversations/[id]/read:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to mark as read' } }, { status: 500 });
  }
}
