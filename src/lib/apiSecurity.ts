import { NextRequest } from 'next/server';

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function validateInput(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
  
  // Limit length
  return sanitized.substring(0, maxLength);
}

export function validateSearchQuery(query: string): string {
  return validateInput(query, 100); // Search queries are typically short
}

export function validateReason(reason: string): string {
  return validateInput(reason, 500); // Reasons can be longer but still limited
}

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // New window or expired window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { 
    allowed: true, 
    remaining: limit - record.count, 
    resetTime: record.resetTime 
  };
}

export function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from session, fallback to IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

export function sanitizePaginationParams(
  page: string | null,
  pageSize: string | null
): { page: number; pageSize: number } {
  const pageNum = Math.max(1, Math.min(1000, parseInt(page || '1') || 1));
  const pageSizeNum = Math.max(1, Math.min(100, parseInt(pageSize || '25') || 25));
  
  return { page: pageNum, pageSize: pageSizeNum };
}

export function validateDateRange(dateFrom: string | null, dateTo: string | null): {
  dateFrom?: Date;
  dateTo?: Date;
  error?: string;
} {
  const result: { dateFrom?: Date; dateTo?: Date; error?: string } = {};

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    if (isNaN(fromDate.getTime())) {
      return { error: 'Invalid date from format' };
    }
    result.dateFrom = fromDate;
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    if (isNaN(toDate.getTime())) {
      return { error: 'Invalid date to format' };
    }
    result.dateTo = toDate;
  }

  if (result.dateFrom && result.dateTo && result.dateFrom > result.dateTo) {
    return { error: 'Date from cannot be after date to' };
  }

  // Limit range to 1 year
  if (result.dateFrom && result.dateTo) {
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (result.dateTo.getTime() - result.dateFrom.getTime() > oneYear) {
      return { error: 'Date range cannot exceed 1 year' };
    }
  }

  return result;
}
