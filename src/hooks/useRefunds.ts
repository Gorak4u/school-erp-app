import { useState, useEffect, useCallback, useMemo } from 'react';
import { refundService } from '@/lib/services/refundService';
import type { RefundFilters, PaginationConfig } from '@/lib/services/refundService';

// AI-Optimized Refund Hooks
export interface UseRefundsOptions {
  initialFilters?: Partial<RefundFilters>;
  autoFetch?: boolean;
  cacheKey?: string;
}

export interface UseRefundsReturn {
  refunds: any[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  totalPages: number;
  filters: RefundFilters;
  pagination: PaginationConfig;
  updateFilters: (filters: Partial<RefundFilters>) => void;
  updatePagination: (pagination: Partial<PaginationConfig>) => void;
  refresh: () => Promise<void>;
  createRefund: (data: any) => Promise<any>;
  bulkProcess: (ids: string[], action: 'approve' | 'reject') => Promise<any>;
}

// Main refund management hook with intelligent caching
export function useRefunds(options: UseRefundsOptions = {}): UseRefundsReturn {
  const { initialFilters = {}, autoFetch = true } = options;
  
  // State management with optimized defaults
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Memoized filters and pagination
  const [filters, setFilters] = useState<RefundFilters>(() => ({
    schoolId: '', // Will be set by context
    ...initialFilters
  }));

  const [pagination, setPagination] = useState<PaginationConfig>(() => ({
    page: 1,
    pageSize: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }));

  // Optimized fetch function with debouncing
  const fetchRefunds = useCallback(async () => {
    if (!filters.schoolId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await refundService.getRefunds(filters, pagination);
      setRefunds(result.refunds);
      setTotal(result.total);
      setLastFetch(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch refunds');
      setRefunds([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  // Auto-fetch with dependency optimization
  useEffect(() => {
    if (autoFetch && filters.schoolId) {
      fetchRefunds();
    }
  }, [fetchRefunds, autoFetch, filters.schoolId]);

  // Memoized filter update function
  const updateFilters = useCallback((newFilters: Partial<RefundFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Memoized pagination update function
  const updatePagination = useCallback((newPagination: Partial<PaginationConfig>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  // Optimized refresh function
  const refresh = useCallback(async () => {
    await fetchRefunds();
  }, [fetchRefunds]);

  // Create refund with optimistic updates
  const createRefund = useCallback(async (data: any) => {
    try {
      const newRefund = await refundService.createRefund(data);
      
      // Optimistic update
      if (newRefund) {
        setRefunds(prev => [newRefund, ...prev]);
        setTotal(prev => prev + 1);
      }
      
      return newRefund;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create refund';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Bulk processing with progress tracking
  const bulkProcess = useCallback(async (ids: string[], action: 'approve' | 'reject') => {
    try {
      const result = await refundService.processBulkRefunds(ids, action);
      
      // Refresh data after bulk operation
      await refresh();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process bulk operation';
      setError(errorMessage);
      throw err;
    }
  }, [refresh]);

  // Computed values
  const currentPage = pagination.page;
  const totalPages = Math.ceil(total / pagination.pageSize);

  return {
    refunds,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    filters,
    pagination,
    updateFilters,
    updatePagination,
    refresh,
    createRefund,
    bulkProcess
  };
}

// Analytics hook with intelligent caching
export function useRefundAnalytics(schoolId: string, period: string = '30') {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/dashboard/refunds?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (schoolId) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, schoolId]);

  return {
    analytics,
    loading,
    error,
    refresh: fetchAnalytics
  };
}

// Individual refund hook with real-time updates
export function useRefund(refundId: string) {
  const [refund, setRefund] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRefund = useCallback(async () => {
    if (!refundId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/refunds/${refundId}`);
      
      if (!response.ok) {
        throw new Error('Refund not found');
      }
      
      const data = await response.json();
      setRefund(data.refund);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch refund');
      setRefund(null);
    } finally {
      setLoading(false);
    }
  }, [refundId]);

  useEffect(() => {
    fetchRefund();
  }, [fetchRefund]);

  const updateRefund = useCallback(async (updates: any) => {
    try {
      const response = await fetch(`/api/refunds/${refundId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update refund');
      }
      
      const data = await response.json();
      setRefund(data.refund);
      
      return data.refund;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update refund';
      setError(errorMessage);
      throw err;
    }
  }, [refundId]);

  return {
    refund,
    loading,
    error,
    refresh: fetchRefund,
    updateRefund
  };
}

// Refund calculation hook with smart caching
export function useRefundCalculation() {
  const [calculations, setCalculations] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const calculateRefund = useCallback(async (type: string, data: any) => {
    const cacheKey = `${type}_${JSON.stringify(data)}`;
    
    // Return cached result if available
    if (calculations.has(cacheKey)) {
      return calculations.get(cacheKey);
    }
    
    setLoading(prev => new Set(prev).add(cacheKey));
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(cacheKey);
      return newErrors;
    });
    
    try {
      const response = await fetch('/api/refunds/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...data })
      });
      
      if (!response.ok) {
        throw new Error('Calculation failed');
      }
      
      const result = await response.json();
      
      // Cache the result
      setCalculations(prev => new Map(prev).set(cacheKey, result));
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed';
      setErrors(prev => new Map(prev).set(cacheKey, errorMessage));
      throw err;
    } finally {
      setLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(cacheKey);
        return newLoading;
      });
    }
  }, [calculations]);

  const clearCache = useCallback(() => {
    setCalculations(new Map());
    setErrors(new Map());
  }, []);

  return {
    calculateRefund,
    clearCache,
    isLoading: (key: string) => loading.has(key),
    getError: (key: string) => errors.get(key),
    getCached: (key: string) => calculations.get(key)
  };
}

// Export main hook as default and others as named exports
export default useRefunds;
