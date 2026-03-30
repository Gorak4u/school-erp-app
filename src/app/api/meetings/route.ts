import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { saasPrisma } from '@/lib/prisma';
import { z } from 'zod';

const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(480),
  meetingType: z.enum(['voice', 'video']),
  participantIds: z.array(z.string()),
  conversationId: z.string().optional(),
  recurringPattern: z.string().optional(),
});

// Create a new scheduled meeting
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = createMeetingSchema.parse(body);

    // Generate unique meeting ID and link
    const meetingId = `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const meetingLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/meeting/${meetingId}`;

    // Calculate reminder times (5 min before and at meeting time)
    const scheduledTime = new Date(data.scheduledAt);
    const fiveMinBefore = new Date(scheduledTime.getTime() - 5 * 60 * 1000);

    // Store meeting info temporarily (will use DB when schema is migrated)
    const meeting = {
      id: meetingId,
      title: data.title,
      description: data.description,
      scheduled_at: scheduledTime,
      duration: data.duration,
      meeting_type: data.meetingType,
      status: 'scheduled',
      conversation_id: data.conversationId,
      organizer_id: session.user.id,
      meeting_link: meetingLink,
      recurring_pattern: data.recurringPattern,
    };

    // TODO: Save to database after migration is run
    // await saasPrisma.scheduled_meetings.create({ data: meeting });

    // TODO: Send email invites and socket notifications to participants
    // This would be handled by a background job or socket event

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        scheduledAt: meeting.scheduled_at,
        duration: meeting.duration,
        link: meeting.meeting_link,
      },
    });
  } catch (error: any) {
    console.error('Create meeting error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

// Get user's scheduled meetings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'scheduled';
    const limit = parseInt(searchParams.get('limit') || '50');

    // TODO: Query meetings from database after migration
    // const meetings = await saasPrisma.scheduled_meetings.findMany({ ... });
    
    return NextResponse.json({ meetings: [] });
  } catch (error) {
    console.error('Get meetings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}
