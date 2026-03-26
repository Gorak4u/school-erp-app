// AI-Advanced Caching System for Refund Operations
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
  enableMetrics: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
}

// Advanced cache with LRU, TTL, and intelligent eviction
export class AdvancedCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    hitRate: 0
  };
  
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      enableMetrics: true,
      ...config
    };

    // Start automatic cleanup
    this.startCleanup();
  }

  // Set cache entry with intelligent TTL
  set(key: string, data: T, ttl?: number, tags: string[] = []): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags
    };

    // Check if we need to evict before adding
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }

    this.cache.set(key, entry);
    
    if (this.config.enableMetrics) {
      this.metrics.sets++;
    }
  }

  // Get cache entry with access tracking
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.config.enableMetrics) {
        this.metrics.misses++;
        this.updateHitRate();
      }
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      if (this.config.enableMetrics) {
        this.metrics.misses++;
        this.updateHitRate();
      }
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    if (this.config.enableMetrics) {
      this.metrics.hits++;
      this.updateHitRate();
    }
    
    return entry.data;
  }

  // Delete cache entry
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted && this.config.enableMetrics) {
      this.metrics.deletes++;
    }
    
    return deleted;
  }

  // Clear cache by pattern or tags
  clear(pattern?: string, tags?: string[]): number {
    let deleted = 0;
    
    if (pattern) {
      // Delete by pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          deleted++;
        }
      }
    } else if (tags) {
      // Delete by tags
      for (const [key, entry] of this.cache.entries()) {
        if (tags.some(tag => entry.tags.includes(tag))) {
          this.cache.delete(key);
          deleted++;
        }
      }
    } else {
      // Clear all
      deleted = this.cache.size;
      this.cache.clear();
    }
    
    if (this.config.enableMetrics) {
      this.metrics.deletes += deleted;
    }
    
    return deleted;
  }

  // Intelligent eviction based on LRU and access patterns
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastUsedScore = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      // Calculate score based on access frequency and recency
      const age = Date.now() - entry.lastAccessed;
      const frequency = entry.accessCount;
      const score = age / (frequency + 1); // Lower score = better candidate for keeping
      
      if (score > leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      
      if (this.config.enableMetrics) {
        this.metrics.evictions++;
      }
    }
  }

  // Automatic cleanup of expired entries
  private cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  // Start automatic cleanup timer
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Stop automatic cleanup
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }

  // Update hit rate metric
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  // Get cache metrics
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache entries for debugging
  entries(): Array<[string, CacheEntry<T>]> {
    return Array.from(this.cache.entries());
  }
}

// Specialized cache instances for different use cases
export const refundCache = new AdvancedCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes for refund data
  maxSize: 500,
  enableMetrics: true
});

export const analyticsCache = new AdvancedCache({
  defaultTTL: 10 * 60 * 1000, // 10 minutes for analytics
  maxSize: 100,
  enableMetrics: true
});

export const calculationCache = new AdvancedCache({
  defaultTTL: 30 * 60 * 1000, // 30 minutes for calculations
  maxSize: 200,
  enableMetrics: true
});

// Cache utilities
export class CacheUtils {
  // Generate cache keys with consistent format
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }

  // Create cache tags for invalidation
  static createTags(schoolId: string, type: string, entityId?: string): string[] {
    const tags = [`school:${schoolId}`, `type:${type}`];
    
    if (entityId) {
      tags.push(`entity:${entityId}`);
    }
    
    return tags;
  }

  // Invalidate related cache entries
  static invalidateRelated(
    cache: AdvancedCache,
    schoolId: string,
    type: string,
    entityId?: string
  ): number {
    const tags = this.createTags(schoolId, type, entityId);
    return cache.clear(undefined, tags);
  }

  // Warm up cache with common data
  static async warmUpCache(
    schoolId: string,
    fetchFunctions: Array<() => Promise<any>>
  ): Promise<void> {
    try {
      await Promise.all(fetchFunctions.map(fn => fn()));
    } catch (error) {
      console.warn('Cache warm-up failed:', error);
    }
  }

  // Cache health check
  static healthCheck(cache: AdvancedCache): {
    size: number;
    hitRate: number;
    memoryUsage: string;
    status: 'healthy' | 'warning' | 'critical';
  } {
    const metrics = cache.getMetrics();
    const size = cache.size();
    
    // Estimate memory usage (rough calculation)
    const memoryUsage = `${(size * 1024 / 1024).toFixed(2)} MB`;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (metrics.hitRate < 0.5) {
      status = 'warning';
    }
    
    if (size > cache['config']?.maxSize * 0.9) {
      status = 'critical';
    }
    
    return {
      size,
      hitRate: metrics.hitRate,
      memoryUsage,
      status
    };
  }
}

// Export singleton instances
export default {
  AdvancedCache,
  refundCache,
  analyticsCache,
  calculationCache,
  CacheUtils
};
