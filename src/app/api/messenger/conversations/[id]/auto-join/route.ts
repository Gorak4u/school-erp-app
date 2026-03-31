import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// POST /api/messenger/conversations/[id]/auto-join - Auto-join conversation if user received notification
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let ctx: any = null;
  
  try {
    const sessionResult = await getSessionContext();
    if (sessionResult.error) return sessionResult.error;
    ctx = sessionResult.ctx;

    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school context' }, { status: 400 });
    }

    const { id: conversationId } = await params;
    const prisma = schoolPrisma as any;

    // Check if conversation exists
    const conversation = await prisma.messengerConversation.findFirst({
      where: {
        id: conversationId,
        schoolId: ctx.schoolId,
        status: 'active',
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.messengerConversationParticipant.findFirst({
      where: {
        conversationId,
        userId: ctx.userId,
      },
    });

    if (existingParticipant) {
      if (existingParticipant.status === 'active') {
        return NextResponse.json({ 
          success: true, 
          message: 'Already an active participant',
          participant: existingParticipant
        });
      } else {
        // Reactivate the participant
        const reactivated = await prisma.messengerConversationParticipant.update({
          where: { id: existingParticipant.id },
          data: {
            status: 'active',
            leftAt: null,
            deletedAt: null,
            updatedAt: new Date(),
          },
        });

        logger.info('Participant reactivated', {
          conversationId,
          userId: ctx.userId,
          previousStatus: existingParticipant.status,
        });

        return NextResponse.json({
          success: true,
          message: 'Participant reactivated',
          participant: reactivated,
        });
      }
    }

    // Check if user received a notification for this conversation
    const notification = await prisma.Notification.findFirst({
      where: {
        userId: ctx.userId,
        schoolId: ctx.schoolId,
        entityType: 'MessengerConversation',
        entityId: conversationId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!notification) {
      return NextResponse.json({ 
        error: 'No notification found for this conversation',
        code: 'NO_NOTIFICATION'
      }, { status: 403 });
    }

    // Auto-add user as participant since they received a notification
    const newParticipant = await prisma.messengerConversationParticipant.create({
      data: {
        conversationId,
        userId: ctx.userId,
        schoolId: ctx.schoolId,
        participantRole: 'member',
        status: 'active',
        joinedAt: new Date(),
        unreadCount: 0,
        isMuted: false,
        isArchived: false,
      },
    });

    logger.info('Auto-joined participant via notification', {
      conversationId,
      userId: ctx.userId,
      notificationId: notification.id,
      conversationType: conversation.conversationType,
    });

    return NextResponse.json({
      success: true,
      message: 'Auto-joined conversation via notification',
      participant: newParticipant,
      notification: {
        id: notification.id,
        type: notification.type,
        createdAt: notification.createdAt,
      },
    });

  } catch (error: any) {
    logger.error('Failed to auto-join conversation', { 
      error: error.message,
      conversationId: (await params).id,
      userId: ctx?.userId || 'unknown'
    });
    return NextResponse.json(
      { error: 'Failed to join conversation', details: error.message },
      { status: 500 }
    );
  }
}
