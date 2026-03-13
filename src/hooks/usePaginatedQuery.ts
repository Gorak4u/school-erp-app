'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PaginatedState<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export interface PaginatedQueryOptions {
  pageSize?: number;
  debounceMs?: number;
}

export function usePaginatedQuery<T>(
  fetcher: (params: Record<string, string | number>) => Promise<{ [key: string]: any }>,
  dataKey: string,
  initialFilters: Record<string, string | number> = {},
  options: PaginatedQueryOptions = {}
) {
  const { pageSize: defaultPageSize = 50, debounceMs = 300 } = options;

  const [filters, setFilters] = useState<Record<string, string | number>>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [state, setState] = useState<PaginatedState<T>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: defaultPageSize,
    totalPages: 0,
    loading: true,
    error: null,
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const fetch = useCallback(
    async (
      currentFilters: Record<string, string | number>,
      currentPage: number,
      currentPageSize: number,
      currentSortBy: string,
      currentSortOrder: string
    ) => {
      // Cancel previous in-flight request
      if (abortController.current) abortController.current.abort();
      abortController.current = new AbortController();

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Strip empty string values from params
        const params: Record<string, string | number> = {};
        for (const [k, v] of Object.entries(currentFilters)) {
          if (v !== '' && v !== undefined && v !== null) params[k] = v;
        }
        params.page = currentPage;
        params.pageSize = currentPageSize;
        params.sortBy = currentSortBy;
        params.sortOrder = currentSortOrder;

        const res = await fetcher(params);

        setState({
          data: res[dataKey] || [],
          total: res.total || 0,
          page: res.page || currentPage,
          pageSize: res.pageSize || currentPageSize,
          totalPages: res.totalPages || Math.ceil((res.total || 0) / currentPageSize),
          loading: false,
          error: null,
        });
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setState(prev => ({ ...prev, loading: false, error: err.message || 'Failed to load data' }));
      }
    },
    [fetcher, dataKey]
  );

  // Debounced fetch when filters change (reset to page 1)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      fetch(filters, 1, pageSize, sortBy, sortOrder);
    }, debounceMs);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [filters, pageSize, sortBy, sortOrder]);

  // Immediate fetch when page changes
  useEffect(() => {
    fetch(filters, page, pageSize, sortBy, sortOrder);
  }, [page]);

  const setFilter = useCallback((key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
  }, [initialFilters]);

  const toggleSort = useCallback((field: string) => {
    setSortBy(prev => {
      if (prev === field) {
        setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortOrder('asc');
      return field;
    });
  }, []);

  const refresh = useCallback(() => {
    fetch(filters, page, pageSize, sortBy, sortOrder);
  }, [filters, page, pageSize, sortBy, sortOrder, fetch]);

  return {
    ...state,
    filters,
    sortBy,
    sortOrder,
    setFilter,
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
    toggleSort,
    refresh,
  };
}
