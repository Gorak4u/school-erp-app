import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { cronUnauthorizedResponse, isCronAuthorized, readCronBody } from '@/lib/cron/route-helpers';

// POST /api/cron/cleanup-inactive-conversations - Archive inactive conversations
export async function POST(request: NextRequest) {
  if (!(await isCronAuthorized(request))) {
    return cronUnauthorizedResponse();
  }

  try {
    const prisma = schoolPrisma as any;
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    // First, archive conversations that have been inactive for 365 days
    // We set status to 'archived' instead of deleting to preserve data
    const conversationsToArchive = await prisma.messengerConversation.findMany({
      where: {
        lastMessageAt: {
          lt: oneYearAgo,
        },
        status: 'active', // Only archive active conversations
      },
      select: {
        id: true,
        title: true,
        lastMessageAt: true,
      },
    });

    let archivedCount = 0;
    let deletedMessagesCount = 0;

    // Archive conversations and their messages
    for (const conversation of conversationsToArchive) {
      try {
        // Archive the conversation
        await prisma.messengerConversation.update({
          where: { id: conversation.id },
          data: {
            status: 'archived',
            updatedAt: new Date(),
          },
        });

        // Archive all messages in this conversation
        const messagesResult = await prisma.messengerMessage.updateMany({
          where: {
            conversationId: conversation.id,
            status: 'active',
          },
          data: {
            status: 'archived',
            updatedAt: new Date(),
          },
        });

        // Archive all participants
        await prisma.messengerConversationParticipant.updateMany({
          where: {
            conversationId: conversation.id,
            status: 'active',
          },
          data: {
            status: 'archived',
            updatedAt: new Date(),
          },
        });

        archivedCount++;
        deletedMessagesCount += messagesResult.count;

        logger.debug('Archived conversation', {
          conversationId: conversation.id,
          title: conversation.title,
          lastMessageAt: conversation.lastMessageAt,
          messagesArchived: messagesResult.count,
        });
      } catch (error) {
        logger.error('Failed to archive conversation', {
          conversationId: conversation.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('Inactive conversations cleanup completed', {
      archivedConversations: archivedCount,
      archivedMessages: deletedMessagesCount,
      cutoffDate: oneYearAgo.toISOString(),
    });

    return NextResponse.json({
      success: true,
      archivedConversations: archivedCount,
      archivedMessages: deletedMessagesCount,
      message: `Archived ${archivedCount} conversations and ${deletedMessagesCount} messages inactive for 365+ days`,
    });
  } catch (err: any) {
    logger.error('Failed to cleanup inactive conversations', { error: err });
    return NextResponse.json(
      { error: 'Failed to cleanup inactive conversations', details: err.message },
      { status: 500 }
    );
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
