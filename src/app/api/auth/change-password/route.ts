import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    // Try SaaS first (for super admin), then school
    let user = null;
    
    try {
      // Try SaaS schema with raw SQL
      const saasUser = await (saasPrisma as any).$queryRaw`
        SELECT id, email, name, password, role, "isActive", "isSuperAdmin" 
        FROM saas."school_User" 
        WHERE email = ${session.user.email}
      `;
      
      if (saasUser.length > 0) {
        user = saasUser[0];
      }
    } catch (error) {
      // If SaaS query fails, continue to school schema
      console.log('SaaS user lookup failed, trying school schema');
    }

    if (!user) {
      // Try school schema
      user = await (schoolPrisma as any).school_User.findUnique({ where: { email: session.user.email } });
    }
    
    if (!user) return NextResponse.json({ error: 'school_User not found' }, { status: 404 });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    
    // Update in the appropriate schema
    if (user.schema === 'saas' || user.isSuperAdmin) {
      await (saasPrisma as any).$queryRaw`
        UPDATE saas."school_User" SET password = ${hashed}, "updatedAt" = NOW() 
        WHERE email = ${session.user.email}
      `;
    } else {
      await (schoolPrisma as any).school_User.update({ 
        where: { email: session.user.email }, 
        data: { password: hashed } 
      });
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
