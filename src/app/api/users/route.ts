// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import { BASE_ROLE_OPTIONS, canManageUsersAccess } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import { queueCommunicationOutbox } from '@/lib/communicationOutbox';

export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (!canManageUsersAccess(ctx)) {
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
    }).map((user: any) => ({
      ...user,
      customRole: user.CustomRole || null,
    }));

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

    console.log('POST /api/users - Context:', {
      role: ctx.role,
      isSuperAdmin: ctx.isSuperAdmin,
      schoolId: ctx.schoolId,
      userId: ctx.userId,
      email: ctx.email
    });

    if (!canManageUsersAccess(ctx)) {
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
    }

    const body = await request.json();
    const { email, firstName, lastName, role, customRoleId, password, schoolId } = body;

    console.log('POST /api/users - Request body:', {
      email,
      firstName,
      lastName,
      role,
      customRoleId,
      hasPassword: !!password,
      schoolId
    });

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json({ error: 'email, firstName, lastName, password are required' }, { status: 400 });
    }

    // For super admins, require schoolId in request body if not in context
    const targetSchoolId = ctx.schoolId || schoolId;
    if (!targetSchoolId) {
      return NextResponse.json({ error: 'schoolId is required' }, { status: 400 });
    }

    console.log('POST /api/users - Using schoolId:', targetSchoolId);

    const existing = await (schoolPrisma as any).school_User.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const allowedBaseRoles = new Set(BASE_ROLE_OPTIONS.map((option) => option.value));
    const finalRole = allowedBaseRoles.has(role) ? role : 'teacher';
    
    // If customRoleId is provided, validate it exists and belongs to the school
    if (customRoleId) {
      console.log('POST /api/users - Validating customRoleId:', customRoleId);
      try {
        const customRole = await (schoolPrisma as any).CustomRole.findFirst({
          where: { 
            id: customRoleId,
            schoolId: targetSchoolId 
          }
        });
        
        if (!customRole) {
          console.log('POST /api/users - Custom role not found or invalid school');
          return NextResponse.json({ error: 'Invalid custom role' }, { status: 400 });
        }
        
        console.log('POST /api/users - Custom role validated:', customRole.name);
      } catch (roleErr: any) {
        console.error('POST /api/users - Error validating custom role:', roleErr);
        return NextResponse.json({ error: 'Failed to validate custom role' }, { status: 500 });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await (schoolPrisma as any).school_User.create({
      data: {
        id: 'usr-' + Date.now() + Math.floor(Math.random() * 1000),
        email,
        firstName,
        lastName,
        password: hashed,
        role: finalRole,
        customRoleId: customRoleId || null,
        schoolId: targetSchoolId,
        isActive: true,
        updatedAt: new Date(),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, customRoleId: true, isActive: true, createdAt: true,
        CustomRole: { select: { id: true, name: true } },
      },
    });

    // Try to send welcome email if not a super admin and user has email
    if (!ctx.isSuperAdmin && targetSchoolId && user.email) {
      try {
        console.log('📧 Starting welcome email process:', {
          userEmail: user.email,
          schoolId: targetSchoolId,
          isSuperAdmin: ctx.isSuperAdmin
        });
        
        // Fetch school details and subscription for the email
        const school = await (saasPrisma as any).school.findUnique({
          where: { id: targetSchoolId },
          include: { subscription: true }
        });

        console.log('🏫 School data fetched:', {
          schoolFound: !!school,
          schoolName: school?.name,
          hasSubscription: !!school?.subscription
        });
        
        if (school) {
          queueCommunicationOutbox({
            notification: {
              userId: user.id,
              type: 'account_created',
              title: `Welcome to ${school.name}`,
              message: 'Your account has been created successfully.',
              priority: 'medium',
              schoolId: targetSchoolId,
              entityType: 'user',
              entityId: user.id,
            },
            templateEmail: {
              templateKey: 'user_welcome_email',
              schoolId: targetSchoolId,
              to: user.email,
              recipientUserId: user.id,
              variables: {
                userName: user.firstName || user.email,
                schoolName: school.name,
                email: user.email,
                tempPassword: password,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/login`,
              },
              dedupeKey: `user_welcome:${user.id}`,
            },
          }).catch((error) => {
            console.error('Failed to send user welcome notification:', error);
          });
          
          console.log(`✅ Welcome notification queued for new user ${user.email}`);
        } else {
          console.log(`❌ School not found for ID: ${targetSchoolId}, cannot send welcome email`);
        }
      } catch (emailErr: any) {
        console.error('❌ Failed to queue welcome notification:', {
          error: emailErr.message,
          userEmail: user.email,
          schoolId: targetSchoolId,
        });
        // Continue anyway since user creation was successful
      }
    } else {
      console.log('📧 Skipping welcome email:', {
        isSuperAdmin: ctx.isSuperAdmin,
        hasSchoolId: !!targetSchoolId,
        hasUserEmail: !!user.email
      });
    }

    return NextResponse.json({
      user: {
        ...user,
        customRole: user.CustomRole || null,
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/users - Detailed error:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      meta: err.meta,
      cause: err.cause
    });
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: err.message,
      code: err.code 
    }, { status: 500 });
  }
}
