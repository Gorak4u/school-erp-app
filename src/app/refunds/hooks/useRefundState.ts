// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMotionValue, useSpring } from 'framer-motion';
import { refundsApi } from '@/lib/apiClient';
import { RefundSearchEngine } from '../search/RefundSearchEngine';

export function useRefundState() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Advanced Search State (same as students page)
  const [advancedSearch, setAdvancedSearch] = useState({
    enabled: false,
    query: '',
    fuzzyThreshold: 0.7,
    searchFields: ['type', 'status', 'priority', 'reason', 'student.name', 'student.admissionNo'],
    recommendations: [] as any[],
    searchHistory: [] as string[],
    isSearching: false,
    searchAnalytics: {
      totalSearches: 0,
      averageResults: 0,
      popularQueries: [] as { query: string; count: number }[]
    }
  });

  // Dashboard State
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalRefunds: 0,
    pendingRefunds: 0,
    approvedRefunds: 0,
    processedRefunds: 0,
    rejectedRefunds: 0,
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    recentRefunds: 0,
    highPriorityRefunds: 0,
    typeDistribution: {} as Record<string, number>,
    statusDistribution: {} as Record<string, number>,
    recentActivities: [] as Array<{
      id: string;
      type: 'refund_created' | 'refund_approved' | 'refund_rejected' | 'refund_processed';
      description: string;
      timestamp: string;
      studentName: string;
    }>
  });
  
  // Pagination & Table State (same as students page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Motion values for mouse tracking (same as students page)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isClient, setIsClient] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Client-side initialization and mouse tracking
  useEffect(() => {
    setIsClient(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Calculate dashboard statistics
  useEffect(() => {
    const stats = {
      totalRefunds: refunds.length,
      pendingRefunds: refunds.filter(r => r.status === 'pending').length,
      approvedRefunds: refunds.filter(r => r.status === 'approved').length,
      processedRefunds: refunds.filter(r => r.status === 'processed').length,
      rejectedRefunds: refunds.filter(r => r.status === 'rejected').length,
      totalAmount: refunds.reduce((acc, r) => acc + (r.amount || 0), 0),
      pendingAmount: refunds.filter(r => r.status === 'pending').reduce((acc, r) => acc + (r.amount || 0), 0),
      approvedAmount: refunds.filter(r => r.status === 'approved').reduce((acc, r) => acc + (r.amount || 0), 0),
      recentRefunds: refunds.filter(r => {
        const createdDate = new Date(r.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate > weekAgo;
      }).length,
      highPriorityRefunds: refunds.filter(r => r.priority === 'high' && r.status === 'pending').length,
      typeDistribution: {} as Record<string, number>,
      statusDistribution: {} as Record<string, number>,
      recentActivities: []
    };

    // Calculate type distribution
    refunds.forEach(refund => {
      stats.typeDistribution[refund.type] = (stats.typeDistribution[refund.type] || 0) + 1;
    });

    // Calculate status distribution
    refunds.forEach(refund => {
      stats.statusDistribution[refund.status] = (stats.statusDistribution[refund.status] || 0) + 1;
    });

    setDashboardStats(stats);
  }, [refunds]);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadRefunds = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page: currentPage, pageSize };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;

      const data = await refundsApi.list(params);
      setRefunds(data.refunds || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load refunds:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function uses current state values

  // Initial load
  useEffect(() => { 
    loadRefunds(); 
  }, []);

  // Reload when filters change (debounced)
  useEffect(() => {
    const t = setTimeout(() => loadRefunds(), 300);
    return () => clearTimeout(t);
  }, [searchTerm, statusFilter, typeFilter]);

  // Reload when page or pageSize changes
  useEffect(() => {
    loadRefunds();
  }, [currentPage, pageSize]);

  // Search functionality using RefundSearchEngine
  const searchRefunds = useCallback((query: string) => {
    const searchEngine = RefundSearchEngine.getInstance();
    return searchEngine.searchRefunds({
      text: query,
      filters: {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined
      },
      sortBy: sortConfig?.key || 'createdAt',
      sortOrder: sortConfig?.direction || 'desc'
    });
  }, [statusFilter, typeFilter, sortConfig]);

  // Get search suggestions
  const getSearchSuggestions = useCallback((query: string) => {
    const searchEngine = RefundSearchEngine.getInstance();
    return searchEngine.generateRefundSuggestions(query);
  }, []);

  return {
    router,
    refunds, setRefunds,
    total, loading, loadRefunds,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    advancedSearch, setAdvancedSearch,
    showDashboard, setShowDashboard,
    dashboardStats, setDashboardStats,
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    totalPages, setTotalPages,
    sortConfig, setSortConfig,
    isClient, setIsClient,
    mousePosition, setMousePosition,
    mouseX, mouseY,
    searchRefunds,
    getSearchSuggestions
  };
}
