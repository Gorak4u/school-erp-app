import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// POST /api/admin/cleanup-messenger - Manual messenger cleanup for admins
export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Verify user is admin or super admin
    if (!ctx.isSuperAdmin && ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school context' }, { status: 400 });
    }

    const { type, daysToKeep } = await request.json();

    if (!type || !['messages', 'conversations'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid type. Must be "messages" or "conversations"' 
      }, { status: 400 });
    }

    const prisma = schoolPrisma as any;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (daysToKeep || 180));

    let result;

    if (type === 'messages') {
      // Clean up old messages
      result = await prisma.messengerMessage.deleteMany({
        where: {
          schoolId: ctx.schoolId,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info('Manual messenger messages cleanup', {
        userId: ctx.userId,
        schoolId: ctx.schoolId,
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString(),
      });

      return NextResponse.json({
        success: true,
        type: 'messages',
        deletedCount: result.count,
        cutoffDate: cutoffDate.toISOString(),
        message: `Deleted ${result.count} messages older than ${daysToKeep || 180} days`,
      });
    }

    if (type === 'conversations') {
      // Archive inactive conversations
      const conversationsToArchive = await prisma.messengerConversation.findMany({
        where: {
          schoolId: ctx.schoolId,
          lastMessageAt: {
            lt: cutoffDate,
          },
          status: 'active',
        },
        select: {
          id: true,
          title: true,
          lastMessageAt: true,
        },
      });

      let archivedCount = 0;
      let archivedMessagesCount = 0;

      for (const conversation of conversationsToArchive) {
        // Archive conversation
        await prisma.messengerConversation.update({
          where: { id: conversation.id },
          data: { status: 'archived' },
        });

        // Archive messages
        const messagesResult = await prisma.messengerMessage.updateMany({
          where: {
            conversationId: conversation.id,
            status: 'active',
          },
          data: { status: 'archived' },
        });

        // Archive participants
        await prisma.messengerConversationParticipant.updateMany({
          where: {
            conversationId: conversation.id,
            status: 'active',
          },
          data: { status: 'archived' },
        });

        archivedCount++;
        archivedMessagesCount += messagesResult.count;
      }

      logger.info('Manual conversations cleanup', {
        userId: ctx.userId,
        schoolId: ctx.schoolId,
        archivedConversations: archivedCount,
        archivedMessages: archivedMessagesCount,
        cutoffDate: cutoffDate.toISOString(),
      });

      return NextResponse.json({
        success: true,
        type: 'conversations',
        archivedConversations: archivedCount,
        archivedMessages: archivedMessagesCount,
        cutoffDate: cutoffDate.toISOString(),
        message: `Archived ${archivedCount} conversations and ${archivedMessagesCount} messages inactive for ${daysToKeep || 365}+ days`,
      });
    }

  } catch (err: any) {
    logger.error('Manual messenger cleanup failed', { error: err });
    return NextResponse.json(
      { error: 'Cleanup failed', details: err.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/cleanup-messenger - Get cleanup statistics
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Verify user is admin or super admin
    if (!ctx.isSuperAdmin && ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school context' }, { status: 400 });
    }

    const prisma = schoolPrisma as any;

    // Get statistics
    const [
      totalMessages,
      totalConversations,
      totalParticipants,
      oldMessagesCount,
      inactiveConversationsCount
    ] = await Promise.all([
      prisma.messengerMessage.count({
        where: { schoolId: ctx.schoolId }
      }),
      prisma.messengerConversation.count({
        where: { schoolId: ctx.schoolId }
      }),
      prisma.messengerConversationParticipant.count({
        where: { schoolId: ctx.schoolId }
      }),
      // Messages older than 180 days
      prisma.messengerMessage.count({
        where: {
          schoolId: ctx.schoolId,
          createdAt: {
            lt: new Date(Date.now() - (180 * 24 * 60 * 60 * 1000))
          }
        }
      }),
      // Conversations inactive for 365 days
      prisma.messengerConversation.count({
        where: {
          schoolId: ctx.schoolId,
          lastMessageAt: {
            lt: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000))
          },
          status: 'active'
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      statistics: {
        totalMessages,
        totalConversations,
        totalParticipants,
        oldMessagesCount,
        inactiveConversationsCount,
        cleanupPotential: {
          messagesToDelete: oldMessagesCount,
          conversationsToArchive: inactiveConversationsCount
        }
      }
    });

  } catch (err: any) {
    logger.error('Failed to get messenger cleanup statistics', { error: err });
    return NextResponse.json(
      { error: 'Failed to get statistics', details: err.message },
      { status: 500 }
    );
  }
}
