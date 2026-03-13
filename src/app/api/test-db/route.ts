import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    databaseUrlValue: process.env.DATABASE_URL || 'undefined',
    nodeEnv: process.env.NODE_ENV
  });
}
