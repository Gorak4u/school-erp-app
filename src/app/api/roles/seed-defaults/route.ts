import { NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { DEFAULT_ROLE_PERMISSIONS } from '@/lib/permissions';

const DEFAULT_CUSTOM_ROLES = [
  {
    name: 'Teacher',
    description: 'Default teacher role — view-only access to students, attendance, exams, fees, and reports. No financial management or alumni access.',
    permissions: DEFAULT_ROLE_PERMISSIONS.teacher,
    isDefault: true,
  },
  {
    name: 'Parent',
    description: 'Default parent role — view access to dashboard, students, attendance, fees, and reports for their children.',
    permissions: DEFAULT_ROLE_PERMISSIONS.parent,
    isDefault: false,
  },
  {
    name: 'Student',
    description: 'Default student role — view access to dashboard, attendance, exams, and reports.',
    permissions: DEFAULT_ROLE_PERMISSIONS.student,
    isDefault: false,
  },
];

export async function POST() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can seed default roles' }, { status: 403 });
    }

    const results = [];

    for (const roleTemplate of DEFAULT_CUSTOM_ROLES) {
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
