import { NextResponse } from 'next/server';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';
import { sendEmail, passwordResetEmailHtml } from '@/lib/email';
// Note: sendEmail() uses SaaS SMTP (SaasSetting group: saas_smtp) for platform emails like password reset
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // Try SaaS first (for super admin), then school
    let user = null;
    let userSchema = 'school';
    
    try {
      // Try SaaS schema with raw SQL
      const saasUser = await (saasPrisma as any).$queryRaw`
        SELECT id, email, name, "firstName", "lastName", "isActive", "isSuperAdmin" 
        FROM saas."school_User" 
        WHERE email = ${email.toLowerCase()}
      `;
      
      if (saasUser.length > 0) {
        user = saasUser[0];
        userSchema = 'saas';
      }
    } catch (error) {
      // If SaaS query fails, continue to school schema
      console.log('SaaS user lookup failed, trying school schema');
    }

    if (!user) {
      // Try school schema
      user = await (schoolPrisma as any).school_User.findUnique({ where: { email: email.toLowerCase() } });
    }

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' });
    }

    const identifier = `reset:${email.toLowerCase()}`;

    // Invalidate old tokens for this email - use appropriate schema
    if (userSchema === 'saas') {
      await (saasPrisma as any).$queryRaw`
        DELETE FROM saas."school_VerificationToken" WHERE identifier = ${identifier}
      `;
    } else {
      await (schoolPrisma as any).school_VerificationToken.deleteMany({ where: { identifier } });
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create token in appropriate schema
    if (userSchema === 'saas') {
      await (saasPrisma as any).$queryRaw`
        INSERT INTO saas."school_VerificationToken" (identifier, token, "expires", "createdAt", "updatedAt")
        VALUES (${identifier}, ${token}, ${expires}, NOW(), NOW())
      `;
    } else {
      await (schoolPrisma as any).school_VerificationToken.create({
        data: { identifier, token, expires },
      });
    }

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const userName = `${user.firstName} ${user.lastName}`.trim() || email;

    const result = await sendEmail({
      to: email,
      subject: 'Reset your School ERP password',
      html: passwordResetEmailHtml(resetUrl, userName),
    });

    // In dev with no SMTP: return the reset URL so user can test
    return NextResponse.json({
      success: true,
      message: 'If an account exists, a reset email has been sent.',
      ...(result.devMode ? { devResetUrl: resetUrl } : {}),
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
