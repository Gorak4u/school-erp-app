import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const p = prisma as any;

    const resetToken = await p.verificationToken.findUnique({ where: { token } });

    if (!resetToken || !resetToken.identifier.startsWith('reset:')) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }
    if (new Date(resetToken.expires) < new Date()) {
      await p.verificationToken.delete({ where: { token } });
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const email = resetToken.identifier.replace('reset:', '');
    const hashed = await bcrypt.hash(password, 10);

    // Update password and delete the used token
    await p.user.update({ where: { email }, data: { password: hashed } });
    await p.verificationToken.delete({ where: { token } });

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

  const p = prisma as any;
  const resetToken = await p.verificationToken.findUnique({ where: { token } });

  if (!resetToken || !resetToken.identifier.startsWith('reset:') || new Date(resetToken.expires) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired reset link' });
  }
  return NextResponse.json({ valid: true, email: resetToken.identifier.replace('reset:', '') });
}
