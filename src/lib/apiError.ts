import { NextResponse } from 'next/server';

interface ApiErrorOptions {
  message: string;
  code?: string;
  field?: string;
  details?: any;
  retryAfter?: number;
}

export function apiError(status: number, { message, code, field, details, retryAfter }: ApiErrorOptions) {
  const payload: Record<string, any> = {
    error: code || 'ERROR',
    message,
  };

  if (field) payload.field = field;
  if (details !== undefined) payload.details = details;
  if (retryAfter) payload.retryAfter = retryAfter;

  const response = NextResponse.json(payload, { status });
  if (retryAfter) {
    const seconds = Math.max(1, Math.ceil(retryAfter / 1000));
    response.headers.set('Retry-After', seconds.toString());
  }
  return response;
}
