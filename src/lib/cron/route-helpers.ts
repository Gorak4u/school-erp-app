import { NextRequest, NextResponse } from 'next/server';

export function isCronAuthorized(request: NextRequest) {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export function cronUnauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function readCronBody<T>(request: NextRequest): Promise<T> {
  return request.json().catch(() => ({} as T));
}
