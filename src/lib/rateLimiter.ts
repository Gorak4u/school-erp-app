import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAttempt: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000, blockDurationMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  static getInstance(maxAttempts?: number, windowMs?: number, blockDurationMs?: number): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter(maxAttempts, windowMs, blockDurationMs);
    }
    return RateLimiter.instance;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      if (now > entry.resetTime) {
        this.attempts.delete(key);
      }
    }
  }

  isBlocked(identifier: string): boolean {
    const entry = this.attempts.get(identifier);
    if (!entry) return false;

    const now = Date.now();
    
    // If the block duration has passed, reset the counter
    if (now > entry.resetTime + this.blockDurationMs) {
      this.attempts.delete(identifier);
      return false;
    }

    // If max attempts reached and still within block duration
    if (entry.count >= this.maxAttempts) {
      return true;
    }

    return false;
  }

  checkLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    let entry = this.attempts.get(identifier);

    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
        lastAttempt: now
      };
      this.attempts.set(identifier, entry);
    }

    // Reset window if expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.windowMs;
    }

    // Increment count
    entry.count++;
    entry.lastAttempt = now;

    const remaining = Math.max(0, this.maxAttempts - entry.count);
    const allowed = entry.count <= this.maxAttempts;

    // Log rate limit violations
    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        identifier,
        count: entry.count,
        maxAttempts: this.maxAttempts,
        resetTime: entry.resetTime
      });
    }

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime
    };
  }

  getRemainingAttempts(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry) return this.maxAttempts;

    const now = Date.now();
    if (now > entry.resetTime) {
      this.attempts.delete(identifier);
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - entry.count);
  }

  getBlockDuration(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry || entry.count < this.maxAttempts) return 0;

    const now = Date.now();
    const blockEndTime = entry.resetTime + this.blockDurationMs;
    return Math.max(0, blockEndTime - now);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
    logger.info('Rate limit reset for identifier', { identifier });
  }
}

// Rate limiters for different purposes
export const authRateLimiter = RateLimiter.getInstance(5, 15 * 60 * 1000, 15 * 60 * 1000); // 5 attempts per 15 minutes, block for 15 minutes
export const apiRateLimiter = RateLimiter.getInstance(100, 60 * 1000, 5 * 60 * 1000); // 100 requests per minute, block for 5 minutes
export const passwordResetRateLimiter = RateLimiter.getInstance(3, 60 * 60 * 1000, 60 * 60 * 1000); // 3 attempts per hour, block for 1 hour

export function getClientIdentifier(request: Request | any): string {
  // Try to get IP address from various headers
  const forwarded = request.headers?.get('x-forwarded-for');
  const realIp = request.headers?.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || request.ip || 'unknown';
  
  // For additional security, include user agent hash
  const userAgent = request.headers?.get('user-agent') || 'unknown';
  const userAgentHash = Buffer.from(userAgent).toString('base64').slice(0, 16);
  
  return `${ip}:${userAgentHash}`;
}

export function checkRateLimit(limiter: RateLimiter, identifier: string): { allowed: boolean; error?: any } {
  // Check if currently blocked
  if (limiter.isBlocked(identifier)) {
    const blockDuration = limiter.getBlockDuration(identifier);
    logger.warn('Request blocked due to rate limit', {
      identifier,
      blockDuration
    });
    
    return {
      allowed: false,
      error: {
        status: 429,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(blockDuration / 1000)
      }
    };
  }

  // Check rate limit
  const result = limiter.checkLimit(identifier);
  
  if (!result.allowed) {
    logger.warn('Rate limit exceeded', {
      identifier,
      count: limiter.getRemainingAttempts(identifier)
    });
    
    return {
      allowed: false,
      error: {
        status: 429,
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      }
    };
  }

  return { allowed: true };
}
