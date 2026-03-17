import { NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { PREDEFINED_ROLE_TEMPLATES, canManageRolesAccess } from '@/lib/permissions';

export async function POST() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canManageRolesAccess(ctx)) {
      return NextResponse.json({ error: 'Only admins can seed default roles' }, { status: 403 });
    }

    const results = [];

    for (const roleTemplate of PREDEFINED_ROLE_TEMPLATES) {
      const existing = await (schoolPrisma as any).CustomRole.findFirst({
        where: { ...tenantWhere(ctx), name: roleTemplate.name },
      });

      if (existing) {
        results.push({ name: roleTemplate.name, status: 'already_exists', id: existing.id });
        continue;
      }

      const created = await (schoolPrisma as any).CustomRole.create({
        data: {
          name: roleTemplate.name,
          description: roleTemplate.description,
          permissions: JSON.stringify(roleTemplate.permissions),
          isDefault: roleTemplate.isDefault,
          schoolId: ctx.schoolId,
        },
      });

      results.push({ name: roleTemplate.name, status: 'created', id: created.id });
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('POST /api/roles/seed-defaults:', err);
    return NextResponse.json({ error: 'Failed to seed default roles' }, { status: 500 });
  }
}
