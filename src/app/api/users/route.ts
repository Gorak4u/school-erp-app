// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await (schoolPrisma as any).school_User.findMany({
      where: tenantWhere(ctx),
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        customRoleId: true,
        isActive: true,
        createdAt: true,
        CustomRole: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out super admins from school user list
    const filteredUsers = users.filter(user => {
      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
      return !superAdminEmails.includes(user.email.toLowerCase());
    });

    return NextResponse.json({ users: filteredUsers });
  } catch (err: any) {
    console.error('GET /api/users:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
    }

    const body = await request.json();
    const { email, firstName, lastName, role, customRoleId, password } = body;

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json({ error: 'email, firstName, lastName, password are required' }, { status: 400 });
    }

    const existing = await (schoolPrisma as any).school_User.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await (schoolPrisma as any).school_User.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashed,
        role: role || 'teacher',
        customRoleId: customRoleId || null,
        schoolId: ctx.schoolId,
        isActive: true,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, customRoleId: true, isActive: true, createdAt: true,
        CustomRole: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/users:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
