import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/apiAuth';
import { schoolPrisma } from '@/lib/prisma';
import { resolvePermissions } from '@/lib/permissions';

export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    // Get user with custom role
    const user = await (schoolPrisma as any).school_User.findUnique({
      where: { id: ctx.userId },
      include: {
        CustomRole: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse permissions safely
    let parsedCustomPermissions = [];
    let parseError = null;
    
    if (user.CustomRole?.permissions) {
      try {
        parsedCustomPermissions = JSON.parse(user.CustomRole.permissions);
      } catch (e: any) {
        parseError = e.message;
        console.error('Permission JSON parse error:', e);
      }
    }

    // Resolve permissions using the same logic as auth
    const resolvedPermissions = resolvePermissions(user.role, user.CustomRole?.permissions);

    return NextResponse.json({
      // User info
      userInfo: {
        id: user.id,
        email: user.email,
        role: user.role,
        customRoleId: user.customRoleId,
        isActive: user.isActive
      },
      
      // Custom role details
      customRole: user.CustomRole ? {
        id: user.CustomRole.id,
        name: user.CustomRole.name,
        description: user.CustomRole.description,
        permissions: user.CustomRole.permissions,
        isDefault: user.CustomRole.isDefault
      } : null,
      
      // Permission analysis
      permissionAnalysis: {
        rawPermissions: user.CustomRole?.permissions,
        parsedCustomPermissions,
        parseError,
        resolvedPermissions,
        sessionPermissions: ctx.permissions,
        permissionsMatch: JSON.stringify(resolvedPermissions) === JSON.stringify(ctx.permissions),
        hasCustomRole: !!user.customRoleId,
        permissionCount: {
          custom: parsedCustomPermissions.length,
          resolved: resolvedPermissions.length,
          session: ctx.permissions?.length || 0
        }
      },
      
      // Debug info
      debug: {
        usingCustomRole: !!user.customRoleId,
        fallbackToDefault: !user.customRoleId || !!parseError,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Debug permissions error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
