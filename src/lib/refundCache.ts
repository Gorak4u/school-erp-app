// Refund analytics caching for performance optimization
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

export function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setCachedData(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function invalidateCache(pattern?: string): void {
  if (pattern) {
    // Invalidate cache entries matching pattern
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all cache
    cache.clear();
  }
}

// Generate cache key for refund analytics
export function getRefundAnalyticsKey(schoolId: string, period: string): string {
  return `refund_analytics_${schoolId}_${period}`;
}

// Generate cache key for student refund history
export function getStudentRefundsKey(schoolId: string, studentId: string): string {
  return `student_refunds_${schoolId}_${studentId}`;
}

// Generate cache key for fee refunds
export function getFeeRefundsKey(schoolId: string, filters: string): string {
  return `fee_refunds_${schoolId}_${filters}`;
}

// Generate cache key for transport refunds
export function getTransportRefundsKey(schoolId: string, routeId?: string): string {
  return routeId ? `transport_refunds_${schoolId}_${routeId}` : `transport_refunds_${schoolId}`;
}
