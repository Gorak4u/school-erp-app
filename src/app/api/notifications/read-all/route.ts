import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { markNotificationAsRead } from '@/lib/notificationService';

// PUT /api/notifications/read-all - Mark all notifications as read
export async function PUT(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!ctx.schoolId) {
      return NextResponse.json({ error: 'No school context' }, { status: 400 });
    }

    const prisma = (await import('@/lib/prisma')).schoolPrisma as any;

    // Update all unread notifications for this user
    await prisma.Notification.updateMany({
      where: {
        schoolId: ctx.schoolId,
        userId: ctx.userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read', details: err.message },
      { status: 500 }
    );
  }
}
