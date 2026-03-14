// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can update users' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await (schoolPrisma as any).school_User.findFirst({
      where: { id, ...tenantWhere(ctx) },
    });
    if (!existing) return NextResponse.json({ error: 'school_User not found' }, { status: 404 });

    const body = await request.json();
    const { password, customRoleId, ...rest } = body;

    const updateData: any = { ...rest };
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (customRoleId !== undefined) updateData.customRoleId = customRoleId || null;

    const user = await (schoolPrisma as any).school_User.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, customRoleId: true, isActive: true,
        CustomRole: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('PUT /api/users/[id]:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 });
    }

    const { id } = await params;
    // Prevent self-deletion
    if (id === ctx.userId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const existing = await (schoolPrisma as any).school_User.findFirst({
      where: { id, ...tenantWhere(ctx) },
    });
    if (!existing) return NextResponse.json({ error: 'school_User not found' }, { status: 404 });

    await (schoolPrisma as any).school_User.delete({ where: { id } });
    return NextResponse.json({ message: 'school_User deleted' });
  } catch (err: any) {
    console.error('DELETE /api/users/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
