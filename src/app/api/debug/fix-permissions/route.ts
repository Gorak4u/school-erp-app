import { NextResponse } from 'next/server';
import { schoolPrisma } from '@/lib/prisma';
import { getSessionContext } from '@/lib/apiAuth';

export async function POST() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
      return NextResponse.json({ error: 'Only admins can fix permissions' }, { status: 403 });
    }

    // Get all custom roles with comma-separated permissions
    const roles = await (schoolPrisma as any).CustomRole.findMany({
      where: {
        ...((ctx.schoolId && ctx.schoolId !== 'super') ? { schoolId: ctx.schoolId } : {}),
        permissions: {
          contains: ',',
          not: {
            startsWith: '['
          }
        }
      }
    });

    const fixedRoles = [];
    
    for (const role of roles) {
      try {
        // Parse comma-separated permissions
        const permissions = role.permissions
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean);
        
        // Update with JSON format
        await (schoolPrisma as any).CustomRole.update({
          where: { id: role.id },
          data: {
            permissions: JSON.stringify(permissions)
          }
        });
        
        fixedRoles.push({
          id: role.id,
          name: role.name,
          oldFormat: role.permissions,
          newFormat: JSON.stringify(permissions)
        });
        
      } catch (e) {
        console.error(`Failed to fix role ${role.name}:`, e);
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixedRoles.length} roles`,
      fixedRoles
    });

  } catch (error: any) {
    console.error('Fix permissions error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
