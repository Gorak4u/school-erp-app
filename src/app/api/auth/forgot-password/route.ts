import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, passwordResetEmailHtml } from '@/lib/email';
// Note: sendEmail() uses SaaS SMTP (SaasSetting group: saas_smtp) for platform emails like password reset
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const p = prisma as any;

    const user = await p.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' });
    }

    const identifier = `reset:${email.toLowerCase()}`;

    // Invalidate old tokens for this email
    await p.verificationToken.deleteMany({ where: { identifier } });

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await p.verificationToken.create({
      data: { identifier, token, expires },
    });

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
