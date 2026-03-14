import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await (prisma as any).user.findMany({
      include: {
        school: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      users: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        schoolName: u.school?.name || '—',
        schoolId: u.schoolId,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, action, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const p = prisma as any;

    if (action === 'block') {
      await p.user.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ success: true, message: 'User blocked' });
    }
    if (action === 'unblock') {
      await p.user.update({ where: { id }, data: { isActive: true } });
      return NextResponse.json({ success: true, message: 'User unblocked' });
    }
    if (action === 'reset_password') {
      const newPassword = data.password || 'Reset@123';
      const hashed = await bcrypt.hash(newPassword, 10);
      await p.user.update({ where: { id }, data: { password: hashed } });
      return NextResponse.json({ success: true, message: `Password reset to: ${newPassword}` });
    }
    if (action === 'change_role') {
      await p.user.update({ where: { id }, data: { role: data.role } });
      return NextResponse.json({ success: true, message: `Role changed to ${data.role}` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
