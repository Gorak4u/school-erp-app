import { NextResponse } from 'next/server';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Try SaaS first, then school for token lookup
    let resetToken = null;
    let tokenSchema = 'school';
    
    try {
      const saasToken = await (saasPrisma as any).$queryRaw`
        SELECT identifier, token, "expires", "createdAt", "updatedAt"
        FROM saas."school_VerificationToken" 
        WHERE token = ${token}
      `;
      
      if (saasToken.length > 0) {
        resetToken = saasToken[0];
        tokenSchema = 'saas';
      }
    } catch (error) {
      console.log('SaaS token lookup failed, trying school schema');
    }

    if (!resetToken) {
      resetToken = await (schoolPrisma as any).school_VerificationToken.findUnique({ where: { token } });
    }

    if (!resetToken || !resetToken.identifier.startsWith('reset:')) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }
    if (new Date(resetToken.expires) < new Date()) {
      // Delete token from appropriate schema
      if (tokenSchema === 'saas') {
        await (saasPrisma as any).$queryRaw`DELETE FROM saas."school_VerificationToken" WHERE token = ${token}`;
      } else {
        await (schoolPrisma as any).school_VerificationToken.delete({ where: { token } });
      }
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const email = resetToken.identifier.replace('reset:', '');
    const hashed = await bcrypt.hash(password, 10);

    // Find user and update password in appropriate schema
    let userUpdated = false;
    
    try {
      const saasUser = await (saasPrisma as any).$queryRaw`
        SELECT id FROM saas."school_User" WHERE email = ${email}
      `;
      
      if (saasUser.length > 0) {
        await (saasPrisma as any).$queryRaw`
          UPDATE saas."school_User" SET password = ${hashed}, "updatedAt" = NOW() 
          WHERE email = ${email}
        `;
        userUpdated = true;
      }
    } catch (error) {
      console.log('SaaS user update failed, trying school schema');
    }

    if (!userUpdated) {
      await (schoolPrisma as any).school_User.update({ where: { email }, data: { password: hashed } });
    }

    // Delete the used token from appropriate schema
    if (tokenSchema === 'saas') {
      await (saasPrisma as any).$queryRaw`DELETE FROM saas."school_VerificationToken" WHERE token = ${token}`;
    } else {
      await (schoolPrisma as any).school_VerificationToken.delete({ where: { token } });
    }

    return NextResponse.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Validate token (GET) - used by the reset page to verify link before showing form
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ valid: false, error: 'Token required' });

  // Try SaaS first, then school for token validation
    let resetToken = null;
    
    try {
      const saasToken = await (saasPrisma as any).$queryRaw`
        SELECT identifier, token, "expires", "createdAt", "updatedAt"
        FROM saas."school_VerificationToken" 
        WHERE token = ${token}
      `;
      
      if (saasToken.length > 0) {
        resetToken = saasToken[0];
      }
    } catch (error) {
      console.log('SaaS token lookup failed, trying school schema');
    }

    if (!resetToken) {
      resetToken = await (schoolPrisma as any).school_VerificationToken.findUnique({ where: { token } });
    }

    if (!resetToken || !resetToken.identifier.startsWith('reset:') || new Date(resetToken.expires) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired reset link' });
    }
    return NextResponse.json({ valid: true, email: resetToken.identifier.replace('reset:', '') });
}
