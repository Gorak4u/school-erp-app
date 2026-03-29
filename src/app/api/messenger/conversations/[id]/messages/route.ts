import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';
import { 
  SendMessengerMessageSchema, 
  ListMessengerMessagesQuerySchema,
  sanitizeMessengerText,
  createMessengerNotification,
  isMessengerEnabledForSchool,
} from '@/lib/messenger';
import { checkRateLimit, apiRateLimiter, getClientIdentifier } from '@/lib/rateLimiter';
import { getIO } from '@/lib/socketServer';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { searchParams } = new URL(request.url);
    const queryResult = ListMessengerMessagesQuerySchema.safeParse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
    });

    if (!queryResult.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', details: queryResult.error.issues } }, { status: 400 });
    }

    const { page, pageSize } = queryResult.data;
    const skip = (page - 1) * pageSize;

    const prisma = schoolPrisma as any;

    try {
      // Test if messenger tables exist
      await prisma.messengerConversation.findFirst({ take: 1 });
    } catch (tableError: any) {
      if (tableError.code === 'P2021') {
        console.log('Messenger tables not found, returning empty result');
        return NextResponse.json({
          data: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        });
      }
      throw tableError;
    }

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

    const where: any = {
      conversationId,
      status: 'active',
    };

    const [messages, total] = await Promise.all([
      prisma.messengerMessage.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          replyTo: {
            select: { id: true, body: true, sender: { select: { firstName: true, lastName: true } } },
          },
          readReceipts: {
            where: { userId: ctx.userId },
            select: { readAt: true },
          },
          reactions: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      prisma.messengerMessage.count({ where }),
    ]);

    const formatted = messages.map((m: any) => ({
      id: m.id,
      body: m.body,
      messageType: m.messageType,
      attachments: m.attachments,
      sender: {
        id: m.sender.id,
        name: `${m.sender.firstName} ${m.sender.lastName}`,
        avatar: m.sender.avatar,
      },
      replyTo: m.replyTo
        ? {
            id: m.replyTo.id,
            body: m.replyTo.body.substring(0, 100),
            senderName: `${m.replyTo.sender.firstName} ${m.replyTo.sender.lastName}`,
          }
        : null,
      reactions: m.reactions.map((r: any) => ({
        reaction: r.reaction,
        userId: r.user.id,
        userName: `${r.user.firstName} ${r.user.lastName}`,
      })),
      isRead: m.readReceipts.length > 0,
      editedAt: m.editedAt,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      data: formatted.reverse(),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: skip + formatted.length < total,
      },
    });
  } catch (err: any) {
    console.error('GET /api/messenger/conversations/[id]/messages:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch messages' } }, { status: 500 });
  }
}

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

    const identifier = getClientIdentifier(request);
    const rateLimitCheck = checkRateLimit(apiRateLimiter, identifier);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ error: rateLimitCheck.error }, { status: rateLimitCheck.error.status });
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const result = SendMessengerMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', details: result.error.issues } }, { status: 400 });
    }

    const { content, messageType, replyToId, attachments } = result.data;
    const sanitizedContent = sanitizeMessengerText(content);

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

    const message = await prisma.messengerMessage.create({
      data: {
        schoolId: ctx.schoolId,
        conversationId,
        senderId: ctx.userId,
        messageType,
        body: sanitizedContent,
        attachments: attachments && attachments.length > 0 ? attachments : null,
        replyToId,
        status: 'active',
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    await prisma.messengerConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: sanitizedContent.substring(0, 200),
      },
    });

    const otherParticipants = await prisma.messengerConversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: ctx.userId },
        status: 'active',
      },
      select: { userId: true, isMuted: true },
    });

    for (const p of otherParticipants) {
      await prisma.messengerConversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: p.userId,
          },
        },
        data: {
          unreadCount: { increment: 1 },
        },
      });

      if (!p.isMuted) {
        await createMessengerNotification({
          schoolId: ctx.schoolId,
          userId: p.userId,
          type: 'message',
          title: 'New Message',
          message: `${ctx.email}: ${sanitizedContent.substring(0, 100)}`,
          conversationId,
          messageId: message.id,
        });
      }
    }

    try {
      const io = getIO();
      const messageData = {
        id: message.id,
        conversationId,
        sender: {
          id: message.sender.id,
          name: `${message.sender.firstName} ${message.sender.lastName}`,
          avatar: message.sender.avatar,
        },
        body: message.body,
        messageType: message.messageType,
        attachments: message.attachments,
        createdAt: message.createdAt,
      };
      
      // Emit to conversation room (for users actively viewing the conversation)
      io.to(`conversation:${conversationId}`).emit('message:received', messageData);
      
      // Also emit to each participant's user room (for users not in conversation room)
      for (const p of otherParticipants) {
        io.to(`user:${p.userId}`).emit('message:received', messageData);
      }
      
      console.log(`📨 Message broadcast to conversation:${conversationId} and ${otherParticipants.length} users`);
    } catch (socketError) {
      console.warn('Socket.IO not available, skipping real-time broadcast:', socketError);
    }

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/messenger/conversations/[id]/messages:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to send message' } }, { status: 500 });
  }
}
