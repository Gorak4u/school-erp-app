'use client';

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';
import useRefunds, { UseRefundsOptions } from '@/hooks/useRefunds';
import { refundPerformanceMonitor } from '@/lib/refundLogger';

// Icons
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Check,
  X,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Search,
  Filter,
  Download,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

interface RefundListProps {
  initialFilters?: Partial<UseRefundsOptions['initialFilters']>;
  onRefundSelect?: (refund: any) => void;
  onRefundUpdate?: (refund: any) => void;
  className?: string;
}

// AI-Optimized Production-Grade Refund List Component following app template
export default function RefundList({
  initialFilters = {},
  onRefundSelect,
  onRefundUpdate,
  className = ''
}: RefundListProps) {
  const { theme: themeValue, setTheme, toggleTheme } = useTheme();
  const isDark = themeValue === 'dark';
  
  // Use AI-optimized hooks for state management
  const {
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
    bulkProcess
  } = useRefunds({
    initialFilters,
    autoFetch: true
  });

  // State for bulk operations
  const [selectedRefunds, setSelectedRefunds] = React.useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = React.useState(false);

  // Centralized theme object following app template
  const themeConfig = useMemo(() => ({
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      muted: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    card: isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200',
    input: isDark 
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
    gradients: {
      primary: 'from-teal-500 to-cyan-600',
      secondary: 'from-purple-500 to-pink-600',
      success: 'from-green-500 to-emerald-600',
      warning: 'from-orange-500 to-red-600',
    }
  }), [isDark]);

  // CSS class generators following app template
  const getCardClass = () =>
    `rounded-2xl border p-6 shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;

  const getRowClass = () =>
    `p-4 rounded-xl border transition-all ${isDark ? 'border-gray-600/50 bg-gray-700/30 hover:bg-gray-700/50' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'}`;

  const getBtnPrimaryClass = () =>
    `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white' : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white'}`;

  const getBtnSecondaryClass = () =>
    `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'}`;

  const getBtnDangerClass = () =>
    `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

  const getHeadingClass = () =>
    `text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`;

  const getSubtextClass = () =>
    `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  // Memoized status colors with AI optimization
  const getStatusConfig = useMemo(() => ({
    pending: { color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: Clock },
    approved: { color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: CheckCircle },
    rejected: { color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: XCircle },
    processed: { color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/30', icon: CheckCircle },
    cancelled: { color: 'text-gray-500', bg: 'bg-gray-500/20', border: 'border-gray-500/30', icon: XCircle },
  }), []);

  // Memoized priority colors
  const getPriorityConfig = useMemo(() => ({
    high: { color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    normal: { color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
    low: { color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  }), []);

  // Optimized refund type mapping
  const getRefundTypeLabel = useCallback((type: string) => {
    const labels = {
      academic_fee: 'Academic Fee',
      transport_fee: 'Transport Fee',
      fine: 'Fine',
      overpayment: 'Overpayment'
    };
    return labels[type as keyof typeof labels] || type;
  }, []);

  // Optimized amount formatting
  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  // Optimized date formatting
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Optimized bulk actions with performance monitoring
  const handleSelectAll = useCallback(() => {
    if (selectedRefunds.length === refunds.length) {
      setSelectedRefunds([]);
    } else {
      setSelectedRefunds(refunds.map(r => r.id));
    }
  }, [refunds.length, selectedRefunds.length]);

  const handleSelectRefund = useCallback((refundId: string) => {
    setSelectedRefunds(prev => 
      prev.includes(refundId) 
        ? prev.filter(id => id !== refundId)
        : [...prev, refundId]
    );
  }, []);

  const handleBulkAction = useCallback(async (action: 'approve' | 'reject') => {
    if (selectedRefunds.length === 0) return;
    
    setBulkActionLoading(true);
    const operationId = `bulk_${action}_${Date.now()}`;
    refundPerformanceMonitor.startOperation(operationId);
    
    try {
      await bulkProcess(selectedRefunds, action);
      setSelectedRefunds([]);
      await refresh();
      showSuccessToast(`Successfully ${action}ed ${selectedRefunds.length} refunds`);
      onRefundUpdate?.({ action, refundIds: selectedRefunds });
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
      showErrorToast('Error', `Failed to ${action} refunds`);
    } finally {
      refundPerformanceMonitor.endOperation(operationId, 'RefundList.bulkAction');
      setBulkActionLoading(false);
    }
  }, [selectedRefunds, bulkProcess, refresh, onRefundUpdate]);

  // Optimized sorting with performance tracking
  const handleSort = useCallback((column: string) => {
    const operationId = `sort_${column}_${Date.now()}`;
    refundPerformanceMonitor.startOperation(operationId);
    
    const newOrder = pagination.sortBy === column && pagination.sortOrder === 'desc' ? 'asc' : 'desc';
    updatePagination({ sortBy: column, sortOrder: newOrder });
    
    refundPerformanceMonitor.endOperation(operationId, 'RefundList.sort');
  }, [pagination.sortBy, pagination.sortOrder, updatePagination]);

  // Memoized table data for performance optimization
  const tableData = useMemo(() => {
    return refunds.map(refund => {
      const statusConfig = getStatusConfig[refund.status as keyof typeof getStatusConfig] || getStatusConfig.pending;
      const priorityConfig = getPriorityConfig[refund.priority as keyof typeof getPriorityConfig] || getPriorityConfig.normal;
      const StatusIcon = statusConfig.icon;
      
      return {
        ...refund,
        statusConfig,
        priorityConfig,
        StatusIcon,
        typeLabel: getRefundTypeLabel(refund.type),
        formattedAmount: formatAmount(refund.amount),
        formattedNetAmount: formatAmount(refund.netAmount),
        formattedDate: formatDate(refund.createdAt)
      };
    });
  }, [refunds, getStatusConfig, getPriorityConfig, getRefundTypeLabel, formatAmount, formatDate]);

  // Loading state with skeleton following app template
  if (loading && refunds.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`${getRowClass()} mb-4`}>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state with retry functionality
  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className={`${getCardClass()} max-w-md mx-auto`}>
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className={`text-lg font-medium ${themeConfig.text.primary} mb-2`}>
            Error loading refunds
          </h3>
          <p className={themeConfig.text.secondary + ' mb-4'}>{error}</p>
          <button
            onClick={refresh}
            className={getBtnPrimaryClass()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with actions and bulk operations */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className={getHeadingClass()}>
            Refunds ({total})
          </h3>
          {selectedRefunds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className={getSubtextClass()}>
                {selectedRefunds.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={bulkActionLoading}
                className={getBtnPrimaryClass()}
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                disabled={bulkActionLoading}
                className={getBtnDangerClass()}
              >
                Reject
              </button>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className={`${getBtnSecondaryClass()} ${loading ? 'animate-spin' : ''}`}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Production-grade table following app template */}
      <div className={getCardClass()}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${themeConfig.border}`}>
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={selectedRefunds.length === refunds.length && refunds.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className={`text-left p-4 text-sm font-semibold ${themeConfig.text.secondary}`}>
                  Student
                </th>
                <th className={`text-left p-4 text-sm font-semibold ${themeConfig.text.secondary} cursor-pointer hover:${themeConfig.text.primary}`}
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className={`text-left p-4 text-sm font-semibold ${themeConfig.text.secondary} cursor-pointer hover:${themeConfig.text.primary}`}
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className={`text-left p-4 text-sm font-semibold ${themeConfig.text.secondary} cursor-pointer hover:${themeConfig.text.primary}`}
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className={`text-left p-4 text-sm font-semibold ${themeConfig.text.secondary} cursor-pointer hover:${themeConfig.text.primary}`}
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-1">
                    Priority
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className={`text-left p-4 text-sm font-semibold ${themeConfig.text.secondary} cursor-pointer hover:${themeConfig.text.primary}`}
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className={`text-left p-4 text-sm font-semibold ${themeConfig.text.secondary}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {tableData.map((refund, index) => (
                  <motion.tr
                    key={refund.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`border-b ${themeConfig.border} hover:${themeConfig.hover}`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedRefunds.includes(refund.id)}
                        onChange={() => handleSelectRefund(refund.id)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className={`text-sm font-medium ${themeConfig.text.primary}`}>
                          {refund.student?.name || 'Unknown'}
                        </div>
                        <div className={getSubtextClass()}>
                          {refund.student?.admissionNo || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${themeConfig.text.primary}`}>
                        {refund.typeLabel}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className={`text-sm font-medium ${themeConfig.text.primary}`}>
                          {refund.formattedAmount}
                        </div>
                        {refund.adminFee > 0 && (
                          <div className={getSubtextClass()}>
                            Net: {refund.formattedNetAmount}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${refund.statusConfig.bg} ${refund.statusConfig.color} ${refund.statusConfig.border}`}>
                        <refund.StatusIcon className="w-3 h-3 mr-1" />
                        {refund.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${refund.priorityConfig.bg} ${refund.priorityConfig.color} ${refund.priorityConfig.border}`}>
                        {refund.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={getSubtextClass()}>
                        {refund.formattedDate}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRefundSelect?.(refund)}
                          className={`p-2 rounded-lg ${themeConfig.hover} transition-colors`}
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-teal-500" />
                        </button>
                        <button 
                          className={`p-2 rounded-lg ${themeConfig.hover} transition-colors`}
                          title="More options"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Optimized pagination following app template */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className={getSubtextClass()}>
            Showing {((currentPage - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(currentPage * pagination.pageSize, total)} of {total} results
          </div>
          <nav className="flex items-center gap-2" aria-label="Pagination">
            <button
              onClick={() => updatePagination({ page: currentPage - 1 })}
              disabled={currentPage === 1}
              className={`${getBtnSecondaryClass()} disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`text-sm px-3 py-2 rounded-lg ${themeConfig.card} ${themeConfig.text.primary}`}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => updatePagination({ page: currentPage + 1 })}
              disabled={currentPage === totalPages}
              className={`${getBtnSecondaryClass()} disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      )}

      {/* Empty state with call to action */}
      {refunds.length === 0 && !loading && !error && (
        <div className={`text-center py-12 ${getCardClass()}`}>
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className={`text-lg font-medium ${themeConfig.text.primary} mb-2`}>
            No refunds found
          </h3>
          <p className={themeConfig.text.secondary + ' mb-4'}>
            {Object.keys(initialFilters).length > 0 
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first refund request.'
            }
          </p>
        </div>
      )}
    </div>
  );
}
