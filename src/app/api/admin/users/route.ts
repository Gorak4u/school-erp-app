import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';
import { logAuditAction } from '@/lib/auditLog';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const school = searchParams.get('school');

    // Get SaaS users
    const saasUsers = await (saasPrisma as any).user.findMany({
      where: buildUserFilter(search, role, status, true),
      orderBy: { createdAt: 'desc' },
    });

    // Get all schools
    const schools = await (saasPrisma as any).school.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    // Get school users from all schools IN PARALLEL with server-side pagination (critical for 10M performance)
    const schoolUserPromises = schools.map(async (school: any) => {
      try {
        const schoolUsers = await (schoolPrisma as any).school_User.findMany({
          where: {
            ...buildUserFilter(search, role, status, false),
            schoolId: school.id,
          },
          orderBy: { createdAt: 'desc' },
          // Note: We'll apply pagination after combining all results for now
          // In a true optimization, we'd implement cursor-based pagination across schools
        });
        
        return schoolUsers.map((u: any) => ({
          ...u,
          schoolName: school.name,
          schoolId: school.id,
        }));
      } catch (error) {
        console.error(`Error fetching users for school ${school.name}:`, error);
        return []; // Return empty array for failed schools
      }
    });

    // Execute all queries in parallel (critical performance improvement)
    const schoolUserResults = await Promise.all(schoolUserPromises);
    const allSchoolUsers = schoolUserResults.flat();

    // Combine SaaS and school users
    const allUsers = [
      ...saasUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.name?.split(' ')[0] || u.name || '',
        lastName: u.name?.split(' ').slice(1).join(' ') || '',
        role: u.role,
        isActive: u.isActive,
        schoolName: 'SaaS Platform',
        schoolId: null,
        createdAt: u.createdAt,
      })),
      ...allSchoolUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive,
        schoolName: u.schoolName,
        schoolId: u.schoolId,
        createdAt: u.createdAt,
      })),
    ];

    // Apply additional filtering if needed
    const filteredUsers = allUsers.filter(user => {
      if (school && user.schoolName !== school) return false;
      return true;
    });

    // Sort by creation date
    filteredUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply server-side pagination (critical for 10M performance)
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to build user filter
function buildUserFilter(search?: string | null, role?: string | null, status?: string | null, isSaaS?: boolean) {
  const filter: any = {};
  
  if (search) {
    if (isSaaS) {
      // SaaS users have 'name' field
      filter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    } else {
      // School users have firstName/lastName fields
      filter.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
  }
  
  if (role && role !== 'all') {
    filter.role = role;
  }
  
  if (status && status !== 'all') {
    filter.isActive = status === 'active';
  }
  
  return filter;
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, action, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    // Try to find user in SaaS first, then in schools
    let user = null;
    let isSaaSUser = false;
    let targetPrisma = null;

    try {
      user = await (saasPrisma as any).user.findUnique({ where: { id } });
      if (user) {
        isSaaSUser = true;
        targetPrisma = saasPrisma;
      }
    } catch (error) {
      // Continue to check school users
    }

    if (!user) {
      // Check in all schools for this user
      const schools = await (saasPrisma as any).school.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      for (const school of schools) {
        try {
          user = await (schoolPrisma as any).school_User.findUnique({ where: { id } });
          if (user) {
            targetPrisma = schoolPrisma;
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const p = targetPrisma as any;
    const userName = isSaaSUser ? user.name : `${user.firstName} ${user.lastName}`;
    const userModel = isSaaSUser ? 'user' : 'school_User';

    if (action === 'block') {
      await p[userModel].update({ where: { id }, data: { isActive: false } });
      await logAuditAction({ actorEmail: session.user.email, action: 'block_user', target: id, targetName: userName });
      return NextResponse.json({ success: true, message: 'User blocked' });
    }
    if (action === 'unblock') {
      await p[userModel].update({ where: { id }, data: { isActive: true } });
      await logAuditAction({ actorEmail: session.user.email, action: 'unblock_user', target: id, targetName: userName });
      return NextResponse.json({ success: true, message: 'User unblocked' });
    }
    if (action === 'reset_password') {
      const newPassword = data.password || 'Reset@123';
      const hashed = await bcrypt.hash(newPassword, 10);
      await p[userModel].update({ where: { id }, data: { password: hashed } });
      await logAuditAction({ actorEmail: session.user.email, action: 'reset_password', target: id, targetName: userName, details: { newPassword } });
      return NextResponse.json({ success: true, message: `Password reset to: ${newPassword}` });
    }
    if (action === 'change_role') {
      await p[userModel].update({ where: { id }, data: { role: data.role } });
      await logAuditAction({ actorEmail: session.user.email, action: 'change_role', target: id, targetName: userName, details: { newRole: data.role } });
      return NextResponse.json({ success: true, message: `Role changed to ${data.role}` });
    }
    if (action === 'delete') {
      // Delete the user
      await p[userModel].delete({ where: { id } });
      await logAuditAction({ actorEmail: session.user.email, action: 'delete_user', target: id, targetName: userName });
      return NextResponse.json({ success: true, message: 'User deleted successfully' });
    }

    if (action === 'bulk_delete') {
      const { ids } = data;
      let deletedCount = 0;
      
      // Handle bulk delete for both SaaS and school users
      for (const userId of ids) {
        try {
          // Try SaaS first
          await (saasPrisma as any).user.delete({ where: { id: userId } });
          deletedCount++;
        } catch (error) {
          // Try school users
          try {
            const schools = await (saasPrisma as any).school.findMany({
              where: { isActive: true },
              select: { id: true },
            });

            for (const school of schools) {
              try {
                await (schoolPrisma as any).school_User.delete({ where: { id: userId } });
                deletedCount++;
                break;
              } catch (error) {
                continue;
              }
            }
          } catch (error) {
            continue;
          }
        }
      }
      
      await logAuditAction({ actorEmail: session.user.email, action: 'bulk_delete_users', details: { count: deletedCount } });
      return NextResponse.json({ success: true, message: `${deletedCount} users deleted successfully` });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
