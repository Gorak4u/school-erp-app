import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
} from '@/lib/notificationService';

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school context' }, { status: 400 });
    }

    const options: any = { limit, offset };
    if (isRead !== null) options.isRead = isRead === 'true';

    const result = await getNotifications(ctx.schoolId, ctx.userId, options);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: err.message },
      { status: 500 }
    );
  }
}
