import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';
import {
  createMessengerNotification,
  isMessengerEnabledForSchool,
  normalizeParticipantIds,
  buildConversationTitle,
} from '@/lib/messenger';
import { logger } from '@/lib/logger';

const MemberActionSchema = z.object({
  participantId: z.string().trim().min(1),
});

const AddParticipantsSchema = z.object({
  participantIds: z.array(z.string().trim().min(1)).min(1).max(100),
});

const UpdateParticipantSchema = z.object({
  participantId: z.string().trim().min(1),
  participantRole: z.enum(['admin', 'member']).optional(),
  isMuted: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

function formatParticipant(participant: any) {
  return {
    id: participant.user.id,
    participantId: participant.id,
    userId: participant.user.id,
    name: `${participant.user.firstName} ${participant.user.lastName}`.trim(),
    email: participant.user.email,
    avatar: participant.user.avatar,
    role: participant.participantRole,
    status: participant.status,
    isMuted: participant.isMuted,
    isArchived: participant.isArchived,
    unreadCount: participant.unreadCount,
    joinedAt: participant.joinedAt,
    lastReadAt: participant.lastReadAt,
    leftAt: participant.leftAt,
  };
}

async function loadConversation(prisma: any, conversationId: string, schoolId: string) {
  return prisma.messengerConversation.findFirst({
    where: {
      id: conversationId,
      schoolId,
      status: { not: 'deleted' },
    },
    include: {
      participants: {
        where: { status: 'active' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      },
    },
  });
}

function getCanManageMembers(ctx: any, conversation: any, currentParticipant: any) {
  return ctx.role === 'admin' || conversation.createdBy === ctx.userId || currentParticipant?.participantRole === 'admin';
}

async function getConversationContext(prisma: any, conversationId: string, schoolId: string, userId: string) {
  const conversation = await loadConversation(prisma, conversationId, schoolId);
  if (!conversation) {
    return { conversation: null, currentParticipant: null };
  }

  const currentParticipant = conversation.participants.find((participant: any) => participant.user.id === userId);
  return { conversation, currentParticipant };
}

async function parseBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

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
    const prisma = schoolPrisma as any;
    const { conversation, currentParticipant } = await getConversationContext(prisma, conversationId, ctx.schoolId, ctx.userId);

    if (!conversation || !currentParticipant) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not a conversation member' } }, { status: 403 });
    }

    const canManageMembers = getCanManageMembers(ctx, conversation, currentParticipant);

    return NextResponse.json({
      data: {
        conversation: {
          id: conversation.id,
          conversationType: conversation.conversationType,
          title: buildConversationTitle(
            conversation.conversationType,
            conversation.title,
            conversation.participants[0]
              ? `${conversation.participants[0].user.firstName} ${conversation.participants[0].user.lastName}`.trim()
              : 'Group chat',
            conversation.participants.length
          ),
          description: conversation.description,
          avatar: conversation.avatar,
          status: conversation.status,
          createdBy: conversation.createdBy,
        },
        participants: conversation.participants.map(formatParticipant),
        canManageMembers,
      },
    });
  } catch (err: any) {
    logger.error('GET /api/messenger/conversations/[id]/participants failed', {
      error: err,
      conversationId: params,
    });
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch conversation members' } }, { status: 500 });
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

    const { id: conversationId } = await params;
    const prisma = schoolPrisma as any;
    const { conversation, currentParticipant } = await getConversationContext(prisma, conversationId, ctx.schoolId, ctx.userId);

    if (!conversation || !currentParticipant) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not a conversation member' } }, { status: 403 });
    }

    if (conversation.conversationType === 'direct') {
      return NextResponse.json({ error: { code: 'INVALID_OPERATION', message: 'Direct conversations cannot have additional members' } }, { status: 400 });
    }

    if (!getCanManageMembers(ctx, conversation, currentParticipant)) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only conversation admins can add members' } }, { status: 403 });
    }

    const body = await parseBody(request);
    const result = AddParticipantsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', details: result.error.issues } }, { status: 400 });
    }

    const participantIds = normalizeParticipantIds(result.data.participantIds).filter((id) => id !== ctx.userId);
    if (participantIds.length === 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'No valid participant IDs provided' } }, { status: 400 });
    }

    const schoolUsers = await prisma.school_User.findMany({
      where: {
        schoolId: ctx.schoolId,
        isActive: true,
        id: { in: participantIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
    });

    const foundUserIds = new Set(schoolUsers.map((user: any) => user.id));
    const missingUserIds = participantIds.filter((id) => !foundUserIds.has(id));
    if (missingUserIds.length > 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARTICIPANTS', message: 'Some users were not found', details: missingUserIds } },
        { status: 400 }
      );
    }

    const existingParticipants = await prisma.messengerConversationParticipant.findMany({
      where: {
        conversationId,
        userId: { in: participantIds },
      },
      select: {
        userId: true,
        status: true,
      },
    });

    const existingMap = new Map<string, { status: string }>(
      existingParticipants.map((participant: any) => [participant.userId, { status: participant.status }])
    );
    const addedUsers = schoolUsers.filter((user: any) => existingMap.get(user.id)?.status !== 'active');

    for (const user of schoolUsers) {
      await prisma.messengerConversationParticipant.upsert({
        where: {
          conversationId_userId: {
            conversationId,
            userId: user.id,
          },
        },
        create: {
          schoolId: ctx.schoolId,
          conversationId,
          userId: user.id,
          participantRole: 'member',
          status: 'active',
          joinedAt: new Date(),
          unreadCount: 0,
          isMuted: false,
          isArchived: false,
          deletedAt: null,
          leftAt: null,
        },
        update: {
          status: 'active',
          leftAt: null,
          deletedAt: null,
          unreadCount: 0,
          isMuted: false,
          isArchived: false,
        },
      });
    }

    for (const user of addedUsers) {
      await createMessengerNotification({
        schoolId: ctx.schoolId,
        userId: user.id,
        type: 'conversation',
        title: 'Added to conversation',
        message: `You were added to ${conversation.title || 'a conversation'}`,
        conversationId,
        metadata: {
          action: 'member_added',
          conversationId,
        },
      });
    }

    const refreshedConversation = await loadConversation(prisma, conversationId, ctx.schoolId);
    return NextResponse.json({
      data: {
        participants: refreshedConversation?.participants.map(formatParticipant) || [],
        addedCount: addedUsers.length,
      },
    });
  } catch (err: any) {
    logger.error('POST /api/messenger/conversations/[id]/participants failed', {
      error: err,
    });
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to add conversation members' } }, { status: 500 });
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

    const { id: conversationId } = await params;
    const prisma = schoolPrisma as any;
    const { conversation, currentParticipant } = await getConversationContext(prisma, conversationId, ctx.schoolId, ctx.userId);

    if (!conversation || !currentParticipant) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not a conversation member' } }, { status: 403 });
    }

    const body = await parseBody(request);
    const result = UpdateParticipantSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', details: result.error.issues } }, { status: 400 });
    }

    const targetParticipant = await prisma.messengerConversationParticipant.findFirst({
      where: {
        conversationId,
        userId: result.data.participantId,
      },
    });

    if (!targetParticipant) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Member not found' } }, { status: 404 });
    }

    const canManageMembers = getCanManageMembers(ctx, conversation, currentParticipant);
    const isSelf = result.data.participantId === ctx.userId;

    if (!isSelf && !canManageMembers) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only conversation admins can update members' } }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (typeof result.data.isMuted === 'boolean') {
      updateData.isMuted = result.data.isMuted;
    }

    if (typeof result.data.isArchived === 'boolean') {
      updateData.isArchived = result.data.isArchived;
    }

    if (result.data.participantRole && canManageMembers && !isSelf) {
      updateData.participantRole = result.data.participantRole;
    }

    if (result.data.status) {
      updateData.status = result.data.status;
      updateData.leftAt = result.data.status === 'inactive' ? new Date() : null;
      updateData.deletedAt = result.data.status === 'inactive' ? new Date() : null;
      if (result.data.status === 'active') {
        updateData.unreadCount = 0;
      }
    }

    const updatedParticipant = await prisma.messengerConversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: result.data.participantId,
        },
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ data: formatParticipant(updatedParticipant) });
  } catch (err: any) {
    logger.error('PATCH /api/messenger/conversations/[id]/participants failed', {
      error: err,
    });
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update conversation member' } }, { status: 500 });
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

    const { id: conversationId } = await params;
    const prisma = schoolPrisma as any;
    const { conversation, currentParticipant } = await getConversationContext(prisma, conversationId, ctx.schoolId, ctx.userId);

    if (!conversation || !currentParticipant) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not a conversation member' } }, { status: 403 });
    }

    const body = await parseBody(request);
    const result = MemberActionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', details: result.error.issues } }, { status: 400 });
    }

    const targetParticipantId = result.data.participantId;
    const isSelf = targetParticipantId === ctx.userId;
    const canManageMembers = getCanManageMembers(ctx, conversation, currentParticipant);

    if (conversation.conversationType === 'direct' && !isSelf) {
      return NextResponse.json({ error: { code: 'INVALID_OPERATION', message: 'Direct conversations can only be left by the current user' } }, { status: 400 });
    }

    if (!isSelf && !canManageMembers) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only conversation admins can remove members' } }, { status: 403 });
    }

    const targetParticipant = await prisma.messengerConversationParticipant.findFirst({
      where: {
        conversationId,
        userId: targetParticipantId,
      },
    });

    if (!targetParticipant) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Member not found' } }, { status: 404 });
    }

    const removedParticipant = await prisma.messengerConversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: targetParticipantId,
        },
      },
      data: {
        status: 'inactive',
        leftAt: new Date(),
        deletedAt: new Date(),
        unreadCount: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (!isSelf) {
      await createMessengerNotification({
        schoolId: ctx.schoolId,
        userId: targetParticipantId,
        type: 'conversation',
        title: 'Removed from conversation',
        message: `You were removed from ${conversation.title || 'a conversation'}`,
        conversationId,
        metadata: {
          action: 'member_removed',
          conversationId,
        },
      });
    }

    const remainingActive = await prisma.messengerConversationParticipant.count({
      where: {
        conversationId,
        status: 'active',
      },
    });

    if (remainingActive === 0) {
      await prisma.messengerConversation.update({
        where: { id: conversationId },
        data: { status: 'archived' },
      });
    }

    return NextResponse.json({ data: formatParticipant(removedParticipant), success: true });
  } catch (err: any) {
    logger.error('DELETE /api/messenger/conversations/[id]/participants failed', {
      error: err,
    });
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to remove conversation member' } }, { status: 500 });
  }
}
