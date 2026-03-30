import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';
import { isMessengerEnabledForSchool } from '@/lib/messenger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!ctx.schoolId) {
      return NextResponse.json(
        { error: { code: 'NO_SCHOOL', message: 'No school context' } },
        { status: 400 }
      );
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
    const { archived } = body;

    if (typeof archived !== 'boolean') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'archived must be a boolean' } },
        { status: 400 }
      );
    }

    const prisma = schoolPrisma as any;

    // Verify user is a participant in this conversation
    const participant = await prisma.messengerConversationParticipant.findFirst({
      where: {
        conversationId,
        userId: ctx.userId,
        status: 'active',
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not a conversation member' } },
        { status: 403 }
      );
    }

    // Update the isArchived status for this participant only
    await prisma.messengerConversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        isArchived: archived,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        isArchived: archived,
      },
    });
  } catch (err: any) {
    console.error('POST /api/messenger/conversations/[id]/archive:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to archive conversation' } },
      { status: 500 }
    );
  }
}
