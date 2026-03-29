import { Server as SocketIOServer, Socket } from 'socket.io';
import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface SocketData {
  userId: string;
  schoolId: string;
  role: string;
}

export function registerMessengerHandlers(io: SocketIOServer, socket: Socket & { data: SocketData }) {
  const { userId, schoolId } = socket.data;

  socket.on('conversation:join', async (payload: { conversationId: string }) => {
    try {
      const prisma = schoolPrisma as any;
      const participant = await prisma.messengerConversationParticipant.findFirst({
        where: {
          conversationId: payload.conversationId,
          userId,
          status: 'active',
        },
      });

      if (participant) {
        socket.join(`conversation:${payload.conversationId}`);
        socket.emit('conversation:joined', { conversationId: payload.conversationId });
      }
    } catch (error) {
      logger.error('Conversation join error', { error, userId, conversationId: payload.conversationId });
    }
  });

  socket.on('conversation:leave', (payload: { conversationId: string }) => {
    socket.leave(`conversation:${payload.conversationId}`);
  });

  socket.on('typing:start', (payload: { conversationId: string }) => {
    socket.to(`conversation:${payload.conversationId}`).emit('typing', {
      userId,
      conversationId: payload.conversationId,
      isTyping: true,
    });
  });

  socket.on('typing:stop', (payload: { conversationId: string }) => {
    socket.to(`conversation:${payload.conversationId}`).emit('typing', {
      userId,
      conversationId: payload.conversationId,
      isTyping: false,
    });
  });

  socket.on('message:read', async (payload: { messageId: string; conversationId: string }) => {
    try {
      const prisma = schoolPrisma as any;
      
      await prisma.messengerMessageReadReceipt.upsert({
        where: {
          messageId_userId: {
            messageId: payload.messageId,
            userId,
          },
        },
        create: {
          schoolId,
          messageId: payload.messageId,
          userId,
        },
        update: {},
      });

      const message = await prisma.messengerMessage.findUnique({
        where: { id: payload.messageId },
        select: { senderId: true },
      });

      if (message) {
        io.to(`user:${message.senderId}`).emit('message:readReceipt', {
          messageId: payload.messageId,
          userId,
          readAt: new Date(),
        });
      }
    } catch (error) {
      logger.error('Message read error', { error, userId, messageId: payload.messageId });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Messenger user disconnected', { userId });
  });
}
