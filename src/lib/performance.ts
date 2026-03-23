import { logger } from './logger';

// Performance monitoring utility
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();
  private static memoryThreshold = 100 * 1024 * 1024; // 100MB

  static startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`Timer '${label}' not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);

    // Log slow operations (> 1 second)
    if (duration > 1000) {
      logger.warn(`Slow operation detected`, {
        operation: label,
        duration: `${duration.toFixed(2)}ms`
      });
    }

    return duration;
  }

  static measureMemory(): { used: number; total: number; percentage: number } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const used = usage.heapUsed;
      const total = usage.heapTotal;
      const percentage = (used / total) * 100;

      // Log memory warnings
      if (used > this.memoryThreshold) {
        logger.warn('High memory usage detected', {
          used: `${(used / 1024 / 1024).toFixed(2)}MB`,
          total: `${(total / 1024 / 1024).toFixed(2)}MB`,
          percentage: `${percentage.toFixed(2)}%`
        });
      }

      return { used, total, percentage };
    }

    return { used: 0, total: 0, percentage: 0 };
  }

  static async withPerformanceMonitoring<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(operation);
    
    try {
      const result = await fn();
      this.endTimer(operation);
      return result;
    } catch (error) {
      this.endTimer(operation);
      logger.error(`Operation '${operation}' failed`, error as any);
      throw error;
    }
  }
}

// Database query optimization utilities
export class QueryOptimizer {
  // Suggest pagination for large datasets
  static suggestPagination(count: number): { shouldPaginate: boolean; suggestedLimit: number } {
    const shouldPaginate = count > 100;
    const suggestedLimit = shouldPaginate ? Math.min(50, Math.ceil(count / 10)) : count;
    
    if (shouldPaginate) {
      logger.info('Large dataset detected, pagination recommended', {
        count,
        suggestedLimit
      });
    }
    
    return { shouldPaginate, suggestedLimit };
  }

  // Optimize Prisma queries with proper selects
  static createOptimizedSelect(fields: string[]): Record<string, boolean> {
    const select: Record<string, boolean> = {};
    fields.forEach(field => {
      select[field] = true;
    });
    return select;
  }

  // Generate cache key for queries
  static generateCacheKey(base: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${String(params[key])}`)
      .join('|');
    
    return `${base}:${Buffer.from(sortedParams).toString('base64').slice(0, 16)}`;
  }
}

// React performance utilities
export class ReactPerformanceUtils {
  // Memoization helper for expensive computations
  static memoize<T extends (...args: unknown[]) => unknown>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = fn(...args);
      cache.set(key, result as any);
      
      // Limit cache size to prevent memory leaks
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        if (firstKey) {
          cache.delete(firstKey);
        }
      }

      return result;
    }) as T;
  }

  // Debounce utility for search inputs
  static debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  // Throttle utility for scroll events
  static throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

// Memory leak detection
export class MemoryLeakDetector {
  private static intervals: Set<NodeJS.Timeout> = new Set();
  private static eventListeners: Map<string, EventListener[]> = new Map();

  // Track intervals for cleanup
  static trackInterval(intervalId: NodeJS.Timeout, label: string): void {
    this.intervals.add(intervalId);
    logger.debug('Interval tracked', { label, id: intervalId });
  }

  // Clear all tracked intervals
  static clearAllIntervals(): void {
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals.clear();
    logger.info('All tracked intervals cleared');
  }

  // Track event listeners for cleanup
  static addEventListener(
    element: Element | Window | Document,
    event: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): void {
    const key = `${element.constructor.name}:${event}`;
    
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    
    this.eventListeners.get(key)!.push(listener);
    element.addEventListener(event, listener, options);
    
    logger.debug('Event listener tracked', { key, listenerCount: this.eventListeners.get(key)!.length });
  }

  // Remove tracked event listeners
  static removeEventListeners(
    element: Element | Window | Document,
    event: string
  ): void {
    const key = `${element.constructor.name}:${event}`;
    const listeners = this.eventListeners.get(key);
    
    if (listeners) {
      listeners.forEach(listener => {
        element.removeEventListener(event, listener);
      });
      
      this.eventListeners.delete(key);
      logger.debug('Event listeners removed', { key, count: listeners.length });
    }
  }

  // Detect potential memory leaks
  static detectLeaks(): void {
    const memory = PerformanceMonitor.measureMemory();
    
    if (memory.percentage > 80) {
      logger.warn('Potential memory leak detected', {
        memoryUsage: `${memory.percentage.toFixed(2)}%`,
        trackedIntervals: this.intervals.size,
        trackedListeners: Array.from(this.eventListeners.values()).reduce((sum, listeners) => sum + listeners.length, 0)
      });
    }
  }
}

// Performance monitoring middleware for API routes
export function withPerformanceMonitoring(
  handler: (req: Request, context?: unknown) => Promise<Response>,
  operationName?: string
) {
  return async (req: Request, context?: unknown) => {
    const operation = operationName || `${req.method} ${new URL(req.url).pathname}`;
    PerformanceMonitor.startTimer(operation);
    
    // Detect potential memory leaks before processing
    MemoryLeakDetector.detectLeaks();
    
    try {
      const response = await handler(req, context);
      PerformanceMonitor.endTimer(operation);
      
      // Log response size for large responses
      const responseText = await response.clone().text();
      const responseSize = Buffer.byteLength(responseText, 'utf8');
      
      if (responseSize > 1024 * 1024) { // 1MB
        logger.warn('Large API response detected', {
          operation,
          size: `${(responseSize / 1024 / 1024).toFixed(2)}MB`
        });
      }
      
      return response;
    } catch (error) {
      PerformanceMonitor.endTimer(operation);
      logger.error(`Operation '${operation}' failed`, error as any);
      throw error;
    }
  };
}

// Cleanup utility for React components
export function useCleanup(onCleanup: () => void) {
  // This should be used in React useEffect cleanup
  return () => {
    onCleanup();
    MemoryLeakDetector.detectLeaks();
  };
}

// Export convenience functions
export const measurePerformance = PerformanceMonitor.withPerformanceMonitoring;
export const memoize = ReactPerformanceUtils.memoize;
export const debounce = ReactPerformanceUtils.debounce;
export const throttle = ReactPerformanceUtils.throttle;
