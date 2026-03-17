// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { BASE_ROLE_OPTIONS, canManageUsersAccess } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canManageUsersAccess(ctx)) {
      return NextResponse.json({ error: 'Only admins can update users' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await (schoolPrisma as any).school_User.findFirst({
      where: { id, ...tenantWhere(ctx) },
    });
    if (!existing) return NextResponse.json({ error: 'school_User not found' }, { status: 404 });

    const body = await request.json();
    const { password, customRoleId, role, ...rest } = body;

    const allowedBaseRoles = new Set(BASE_ROLE_OPTIONS.map((option) => option.value));
    const updateData: any = {
      ...rest,
      ...(role && allowedBaseRoles.has(role) ? { role } : {}),
    };
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (customRoleId !== undefined) {
      if (customRoleId) {
        const customRole = await (schoolPrisma as any).CustomRole.findFirst({
          where: { id: customRoleId, ...tenantWhere(ctx) },
        });
        if (!customRole) {
          return NextResponse.json({ error: 'Invalid custom role' }, { status: 400 });
        }
      }
      updateData.customRoleId = customRoleId || null;
    }

    const user = await (schoolPrisma as any).school_User.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, customRoleId: true, isActive: true,
        CustomRole: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        customRole: user.CustomRole || null,
      }
    });
  } catch (err: any) {
    console.error('PUT /api/users/[id]:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canManageUsersAccess(ctx)) {
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
