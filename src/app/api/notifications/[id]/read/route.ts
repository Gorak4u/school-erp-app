import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { markNotificationAsRead } from '@/lib/notificationService';

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { id } = await params;

    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school context' }, { status: 400 });
    }

    const success = await markNotificationAsRead(id, ctx.userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to update notification', details: err.message },
      { status: 500 }
    );
  }
}
