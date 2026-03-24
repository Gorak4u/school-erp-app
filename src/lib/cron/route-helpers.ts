import { NextRequest, NextResponse } from 'next/server';

export function getCronAuthorizationHeader() {
  return `Bearer ${process.env.CRON_SECRET || ''}`;
}

export function isCronAuthorizationHeaderValid(authHeader: string | null) {
  return authHeader === getCronAuthorizationHeader();
}

export function isCronAuthorized(request: NextRequest) {
  return isCronAuthorizationHeaderValid(request.headers.get('authorization'));
}

export function cronUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function readCronBody<T>(request: NextRequest): Promise<T> {
  return request.json().catch(() => ({} as T));
}
