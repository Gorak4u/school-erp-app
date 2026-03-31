// This debug route is no longer needed
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    error: 'Debug route disabled',
    message: 'This debug endpoint has been removed'
  }, { status: 404 });
}
