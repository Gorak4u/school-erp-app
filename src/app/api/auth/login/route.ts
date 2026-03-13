// Login is handled by NextAuth at /api/auth/[...nextauth]
// Use next-auth/react signIn() on the frontend
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Use NextAuth signIn() — see /api/auth/signin' });
}
