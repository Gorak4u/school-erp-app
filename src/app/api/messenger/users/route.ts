import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';
import { isMessengerEnabledForSchool } from '@/lib/messenger';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 50);

    const prisma = schoolPrisma as any;

    const where: any = {
      schoolId: ctx.schoolId,
      isActive: true,
      id: { not: ctx.userId },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.school_User.findMany({
      where,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('GET /api/messenger/users:', err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' } }, { status: 500 });
  }
}
