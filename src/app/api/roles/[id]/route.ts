import { NextRequest, NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { canManageRolesAccess } from '@/lib/permissions';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canManageRolesAccess(ctx)) {
      return NextResponse.json({ error: 'Only admins can manage roles' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await (schoolPrisma as any).CustomRole.findFirst({
      where: { id, ...tenantWhere(ctx) },
    });
    if (!existing) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    const body = await request.json();
    const { name, description, permissions, isDefault } = body;

    const role = await (schoolPrisma as any).CustomRole.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(permissions !== undefined && {
          permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : permissions,
        }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json({ role });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'A role with this name already exists' }, { status: 409 });
    }
    console.error('PUT /api/roles/[id]:', err);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canManageRolesAccess(ctx)) {
      return NextResponse.json({ error: 'Only admins can manage roles' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await (schoolPrisma as any).CustomRole.findFirst({
      where: { id, ...tenantWhere(ctx) },
      include: { _count: { select: { User: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    if ((existing._count?.User || 0) > 0) {
      return NextResponse.json(
        { error: `Cannot delete role: ${existing._count?.User || 0} user(s) are assigned to it. Reassign them first.` },
        { status: 400 }
      );
    }

    await (schoolPrisma as any).CustomRole.delete({ where: { id } });
    return NextResponse.json({ message: 'Role deleted' });
  } catch (err: any) {
    console.error('DELETE /api/roles/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
