import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export function getCronAuthorizationHeader() {
  return `Bearer ${process.env.CRON_SECRET || ''}`;
}

export function isCronAuthorizationHeaderValid(authHeader: string | null) {
  return authHeader === getCronAuthorizationHeader();
}

export async function isCronAuthorized(request: NextRequest) {
  // First check for CRON_SECRET (for automated cron jobs)
  if (isCronAuthorizationHeaderValid(request.headers.get('authorization'))) {
    return true;
  }
  
  // Then check for super admin session (for manual testing via admin UI)
  try {
    const session = await getServerSession(authOptions as any);
    return !!(session && (session as any).user?.isSuperAdmin);
  } catch (error) {
    return false;
  }
}

export function cronUnauthorizedResponse() {
  return NextResponse.json({ 
    error: 'Unauthorized - Requires CRON_SECRET header or super admin session' 
  }, { status: 401 });
}

export async function readCronBody<T>(request: NextRequest): Promise<T> {
  return request.json().catch(() => ({} as T));
}
