import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/superAdmin';
import bcrypt from 'bcryptjs';

// Super admin can switch their user record to point to any school
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { schoolId } = await req.json();
    if (!schoolId) {
      return NextResponse.json({ error: 'schoolId required' }, { status: 400 });
    }

    const p = saasPrisma as any;

    // Verify school exists
    const school = await p.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Update super admin's schoolId to the target school
    // Note: school_User is in the school schema, so we need to use schoolPrisma
    const existingUser = await (schoolPrisma as any).school_User.findUnique({
      where: { email: session.user.email }
    });

    if (existingUser) {
      // Update existing user
      await (schoolPrisma as any).school_User.update({
        where: { email: session.user.email },
        data: { schoolId: school.id },
      });
    } else {
      // Create the user in school schema if they don't exist
      // Generate a secure random password for the super admin
      const tempPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      await (schoolPrisma as any).school_User.create({
        data: {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          email: session.user.email,
          password: hashedPassword,
          firstName: session.user.name?.split(' ')[0] || 'Super',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || 'Admin',
          role: 'admin',
          schoolId: school.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      console.log(`Created school user for ${session.user.email} with temp password: ${tempPassword}`);
    }

    return NextResponse.json({
      success: true,
      message: `Switched to ${school.name}`,
      school: { id: school.id, name: school.name, slug: school.slug },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
