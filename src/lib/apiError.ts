import { NextResponse } from 'next/server';
import { logger } from './logger';

interface ApiErrorOptions {
  message: string;
  code?: string;
  field?: string;
  details?: any;
  retryAfter?: number;
  userId?: string;
  schoolId?: string;
  requestId?: string;
}

export function apiError(status: number, { message, code, field, details, retryAfter, userId, schoolId, requestId }: ApiErrorOptions) {
  // Log the error with context
  logger.error('API Error', {
    status,
    message,
    code,
    field,
    details,
    userId,
    schoolId,
    requestId
  });

  const payload: Record<string, any> = {
    success: false,
    error: code || 'ERROR',
    message,
    timestamp: new Date().toISOString()
  };

  if (field) payload.field = field;
  if (details !== undefined) payload.details = details;
  if (retryAfter) payload.retryAfter = retryAfter;
  if (requestId) payload.requestId = requestId;

  const response = NextResponse.json(payload, { status });
  if (retryAfter) {
    const seconds = Math.max(1, Math.ceil(retryAfter / 1000));
    response.headers.set('Retry-After', seconds.toString());
  }
  
  // Add CORS headers for error responses
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

// Standardized success response
export function apiSuccess<T = any>(data: T, meta?: {
  message?: string;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  requestId?: string;
}) {
  const payload: Record<string, any> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };

  if (meta?.message) payload.message = meta.message;
  if (meta?.pagination) payload.pagination = meta.pagination;
  if (meta?.requestId) payload.requestId = meta.requestId;

  return NextResponse.json(payload);
}

// Common error responses
export const commonErrors = {
  unauthorized: (message = 'Unauthorized') => apiError(401, { 
    message, 
    code: 'UNAUTHORIZED' 
  }),
  
  forbidden: (message = 'Forbidden') => apiError(403, { 
    message, 
    code: 'FORBIDDEN' 
  }),
  
  notFound: (resource = 'Resource') => apiError(404, { 
    message: `${resource} not found`, 
    code: 'NOT_FOUND' 
  }),
  
  validationError: (field: string, message: string) => apiError(400, { 
    message, 
    code: 'VALIDATION_ERROR', 
    field 
  }),
  
  rateLimitExceeded: (retryAfter: number) => apiError(429, { 
    message: 'Too many requests. Please try again later.', 
    code: 'RATE_LIMIT_EXCEEDED', 
    retryAfter 
  }),
  
  internalServerError: (details?: any) => apiError(500, { 
    message: 'Internal server error', 
    code: 'INTERNAL_ERROR', 
    details: process.env.NODE_ENV === 'development' ? details : undefined 
  }),
  
  serviceUnavailable: (message = 'Service temporarily unavailable') => apiError(503, { 
    message, 
    code: 'SERVICE_UNAVAILABLE' 
  })
};

// Error boundary for API routes
export function withErrorHandling(handler: (req: Request, context?: any) => Promise<Response>) {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      logger.error('Unhandled API error', error as any);
      
      if (error instanceof Error) {
        return commonErrors.internalServerError({
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
      
      return commonErrors.internalServerError('Unknown error occurred');
    }
  };
}
