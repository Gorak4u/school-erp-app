import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';
import { 
  CreateMessengerConversationSchema, 
  ListMessengerConversationsQuerySchema,
  buildDirectConversationKey,
  buildGroupConversationKey,
  normalizeParticipantIds,
  buildConversationTitle,
  createMessengerNotification,
  isMessengerEnabledForSchool,
  MESSENGER_PAGE_SIZE
} from '@/lib/messenger';
import { checkRateLimit, apiRateLimiter, getClientIdentifier } from '@/lib/rateLimiter';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/messenger/conversations - Starting request');
    
    const { ctx, error } = await getSessionContext();
    if (error) {
      console.log('GET /api/messenger/conversations - Session error:', error);
      return error;
    }

    console.log('GET /api/messenger/conversations - Context:', {
      userId: ctx.userId,
      schoolId: ctx.schoolId,
      role: ctx.role
    });

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

    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      search: searchParams.get('search'),
      conversationType: searchParams.get('conversationType'),
      status: searchParams.get('status'),
      archived: searchParams.get('archived'),
    };
    
    console.log('GET /api/messenger/conversations - Query params:', queryParams);
    
    const queryResult = ListMessengerConversationsQuerySchema.safeParse(queryParams);

    if (!queryResult.success) {
      console.log('GET /api/messenger/conversations - Validation failed:', queryResult.error.issues);
      return NextResponse.json({ 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid query parameters',
          details: queryResult.error.issues 
        } 
      }, { status: 400 });
    }

    const { page, pageSize, search, conversationType, status, archived } = queryResult.data;
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

    const where: any = {
      schoolId: ctx.schoolId,
      status: status || { not: 'deleted' },
      participants: {
        some: {
          userId: ctx.userId,
          status: 'active',
          isArchived: archived === 'true' ? true : { not: true },
        },
      },
    };

    if (conversationType) {
      where.conversationType = conversationType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.messengerConversation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participants: {
            where: { status: 'active' },
            take: 10,
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
              },
            },
          },
          messages: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  status: 'active',
                  senderId: { not: ctx.userId },
                  readReceipts: {
                    none: { userId: ctx.userId },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.messengerConversation.count({ where }),
    ]);

    const formatted = conversations.map((c: any) => {
      const currentParticipant = c.participants.find((p: any) => p.userId === ctx.userId);
      const otherParticipants = c.participants.filter((p: any) => p.userId !== ctx.userId);

      return {
        id: c.id,
        conversationType: c.conversationType,
        title: buildConversationTitle(
          c.conversationType,
          c.title,
          otherParticipants[0]?.user ? `${otherParticipants[0].user.firstName} ${otherParticipants[0].user.lastName}` : 'Unknown',
          c.participants.length
        ),
        description: c.description,
        avatar: c.avatar,
        participants: c.participants.map((p: any) => ({
          id: p.user.id,
          name: `${p.user.firstName} ${p.user.lastName}`,
          email: p.user.email,
          avatar: p.user.avatar,
          role: p.participantRole,
        })),
        lastMessage: c.messages[0]
          ? {
              id: c.messages[0].id,
              body: c.messages[0].body,
              messageType: c.messages[0].messageType,
              sender: {
                id: c.messages[0].sender.id,
                name: `${c.messages[0].sender.firstName} ${c.messages[0].sender.lastName}`,
                avatar: c.messages[0].sender.avatar,
              },
              createdAt: c.messages[0].createdAt,
            }
          : null,
        unreadCount: c._count.messages,
        lastMessageAt: c.lastMessageAt,
        isMuted: currentParticipant?.isMuted || false,
        isArchived: currentParticipant?.isArchived || false,
      };
    });

    return NextResponse.json({
      data: formatted,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: skip + formatted.length < total,
      },
    });
  } catch (err: any) {
    console.error('GET /api/messenger/conversations - Error:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      meta: err.meta
    });
    
    // Check for Prisma database errors
    if (err.code === 'P2021' || err.code === 'P2022') {
      return NextResponse.json({ 
        error: { 
          code: 'DATABASE_SCHEMA_ERROR', 
          message: 'Database tables not found. Please run database migration.',
          details: 'Run: npx prisma migrate dev --name add_messenger_tables'
        } 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch conversations' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const result = CreateMessengerConversationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', details: result.error.issues } }, { status: 400 });
    }

    const { conversationType, participantIds, title, description, avatar } = result.data;
    const normalizedParticipantIds = normalizeParticipantIds([...participantIds, ctx.userId]);

    if (conversationType === 'broadcast' && ctx.role !== 'admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only admins can create broadcast conversations' } }, { status: 403 });
    }

    const prisma = schoolPrisma as any;

    let conversationKey: string | null = null;
    if (conversationType === 'direct') {
      if (normalizedParticipantIds.length !== 2) {
        return NextResponse.json({ error: { code: 'INVALID_PARTICIPANTS', message: 'Direct conversations must have exactly 2 participants' } }, { status: 400 });
      }
      conversationKey = buildDirectConversationKey(normalizedParticipantIds);

      const existing = await prisma.messengerConversation.findFirst({
        where: {
          schoolId: ctx.schoolId,
          conversationKey,
          status: { not: 'deleted' },
        },
        include: {
          participants: {
            where: { status: 'active' },
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
              },
            },
          },
        },
      });

      if (existing) {
        return NextResponse.json({ data: existing, alreadyExists: true });
      }
    } else if (conversationType === 'group') {
      conversationKey = buildGroupConversationKey(title, ctx.schoolId, normalizedParticipantIds);
    }

    const conversation = await prisma.messengerConversation.create({
      data: {
        schoolId: ctx.schoolId,
        conversationKey,
        conversationType,
        title,
        description,
        avatar,
        createdBy: ctx.userId,
        status: 'active',
        participants: {
          create: normalizedParticipantIds.map((userId) => ({
            schoolId: ctx.schoolId,
            userId,
            participantRole: userId === ctx.userId ? 'admin' : 'member',
            status: 'active',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    for (const participantId of normalizedParticipantIds) {
      if (participantId !== ctx.userId) {
        await createMessengerNotification({
          schoolId: ctx.schoolId,
          userId: participantId,
          type: 'conversation',
          title: 'New Conversation',
          message: `${ctx.email} added you to a conversation`,
          conversationId: conversation.id,
          metadata: { conversationType, title },
        });
      }
    }

    return NextResponse.json({ data: conversation }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/messenger/conversations:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create conversation' } }, { status: 500 });
  }
}
