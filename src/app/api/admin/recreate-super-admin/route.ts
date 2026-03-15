import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';
import bcrypt from 'bcryptjs';

// Emergency super admin recreation endpoint
// Only accessible if no super admin exists or by existing super admin
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    const body = await req.json();
    const { email, password, confirmPassword } = body;

    // Validate input
    if (!email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Email, password, and confirm password are required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Check if user is already super admin or if no super admin exists
    let isAuthorized = false;
    
    if (session?.user?.email) {
      // Existing super admin can recreate
      isAuthorized = isSuperAdmin(session.user.email);
    } else {
      // If no session, check if any super admin exists
      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
      let existingSuperAdminCount = 0;
      
      for (const adminEmail of superAdminEmails) {
        if (adminEmail) {
          const existingUser = await (schoolPrisma as any).school_User.findUnique({
            where: { email: adminEmail.toLowerCase() },
          });
          if (existingUser) {
            existingSuperAdminCount++;
          }
        }
      }
      
      // Allow recreation if no super admins exist
      isAuthorized = existingSuperAdminCount === 0;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized. Only existing super admins can recreate accounts.' }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await (schoolPrisma as any).school_User.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create super admin user
    const superAdmin = await (schoolPrisma as any).school_User.create({
      data: {
        id: 'super-admin-' + Date.now(),
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('🔧 Super admin recreated via API');
    console.log(`📧 Email: ${email}`);
    console.log(`🆔 User ID: ${superAdmin.id}`);

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully',
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: superAdmin.role,
      }
    });

  } catch (error: any) {
    console.error('Error recreating super admin:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check if super admin exists
export async function GET() {
  try {
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    let existingSuperAdmins = [];
    
    for (const adminEmail of superAdminEmails) {
      if (adminEmail) {
        const existingUser = await (schoolPrisma as any).school_User.findUnique({
          where: { email: adminEmail },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
          }
        });
        if (existingUser) {
          existingSuperAdmins.push(existingUser);
        }
      }
    }

    return NextResponse.json({
      superAdminEmails: superAdminEmails.filter(e => e),
      existingSuperAdmins,
      hasSuperAdmin: existingSuperAdmins.length > 0,
      count: existingSuperAdmins.length
    });

  } catch (error: any) {
    console.error('Error checking super admin status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
