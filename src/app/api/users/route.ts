// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { getSessionContext, tenantWhere } from '@/lib/apiAuth';
import bcrypt from 'bcryptjs';
import { sendSchoolEmail } from '@/lib/email';
import { generateWelcomeEmail } from '@/lib/email-templates';

export async function GET() {
  try {
    const { ctx, error } = await getSessionContext();
    if (error) return error;

    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
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
    });

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

    if (ctx.role !== 'admin' && !ctx.isSuperAdmin) {
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

    let finalRole = role || 'teacher';
    
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
        finalRole = customRole.name; // Assign custom role name as role
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

    // Try to send welcome email if not a super admin
    if (!ctx.isSuperAdmin && targetSchoolId) {
      try {
        // Fetch school details and subscription for the email
        const school = await (saasPrisma as any).school.findUnique({
          where: { id: targetSchoolId },
          include: { subscription: true }
        });

        if (school && school.subscription) {
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const emailData = {
            user: { ...user, name: `${user.firstName} ${user.lastName}` },
            school,
            subscription: school.subscription,
            loginUrl: `${baseUrl}/login`,
            dashboardUrl: `${baseUrl}/dashboard`,
            paymentUrl: school.subscription.plan !== 'trial' ? `${baseUrl}/billing` : undefined,
            password: password // Include plain text password for first login
          };

          const { subject, html } = generateWelcomeEmail(emailData);
          
          await sendSchoolEmail({
            to: user.email,
            subject,
            html,
            schoolId: targetSchoolId
          });
          
          console.log(`Welcome email sent to new user ${user.email} using school SMTP`);
        }
      } catch (emailErr) {
        console.error('Failed to send welcome email to new user:', emailErr);
        // Continue anyway since user creation was successful
      }
    }

    return NextResponse.json({ user }, { status: 201 });
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
