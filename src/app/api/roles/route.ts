import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';

export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    const roles = await (prisma as any).customRole.findMany({
      where: tenantWhere(ctx),
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ roles });
  } catch (err: any) {
    console.error('GET /api/roles:', err);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Only admins can create roles
    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can manage roles' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, permissions, isDefault } = body;

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const role = await (prisma as any).customRole.create({
      data: {
        name,
        description: description || '',
        permissions: Array.isArray(permissions) ? JSON.stringify(permissions) : permissions || '[]',
        isDefault: isDefault || false,
        schoolId: ctx.schoolId,
      },
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'A role with this name already exists' }, { status: 409 });
    }
    console.error('POST /api/roles:', err);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
