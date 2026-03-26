'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { showErrorToast, showSuccessToast } from '@/lib/toastUtils';
import useRefunds, { UseRefundsOptions } from '@/hooks/useRefunds';
import { useRefundAnalytics } from '@/hooks/useRefunds';
import { refundPerformanceMonitor } from '@/lib/refundLogger';

// Import UI components
import RefundList from '@/components/refunds/RefundList';
import RefundAnalytics from '@/components/refunds/RefundAnalytics';
import RefundForm from '@/components/refunds/RefundForm';
import RefundDetails from '@/components/refunds/RefundDetails';

// Icons
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

// Constants
const REFUND_TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'refunds', label: 'Refund Requests', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: DollarSign },
];

const REFUND_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status', color: 'text-gray-500' },
  { value: 'pending', label: 'Pending', color: 'text-yellow-500' },
  { value: 'approved', label: 'Approved', color: 'text-blue-500' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-500' },
  { value: 'processed', label: 'Processed', color: 'text-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-gray-500' },
];

const REFUND_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'academic_fee', label: 'Academic Fee' },
  { value: 'transport_fee', label: 'Transport Fee' },
  { value: 'fine', label: 'Fine' },
  { value: 'overpayment', label: 'Overpayment' },
];

const REFUND_PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priority' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

// AI-Optimized Refunds Page following app template
export default function RefundsPage() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { hasPermission, isAdmin } = usePermissions();
  const canManageRefunds = isAdmin || hasPermission('manage_refunds' as any);
  const isDark = theme === 'dark';
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // AI-optimized hooks
  const { analytics, loading: analyticsLoading, refresh: refreshAnalytics } = useRefundAnalytics('current-school', '30');
  
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

  const getInputClass = () =>
    `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;

  const getBtnPrimaryClass = () =>
    `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white' : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white'}`;

  const getBtnSecondaryClass = () =>
    `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'}`;

  const getHeadingClass = () =>
    `text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`;

  const getSubtextClass = () =>
    `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  // Event handlers
  const handleRefundSelect = useCallback((refund: any) => {
    setSelectedRefund(refund);
    setShowDetailsModal(true);
  }, []);

  const handleRefundUpdate = useCallback((updatedRefund: any) => {
    // Refresh analytics and list
    refreshAnalytics();
    showSuccessToast('Refund updated successfully');
  }, [refreshAnalytics]);

  const handleRefundCreated = useCallback((newRefund: any) => {
    setShowCreateModal(false);
    refreshAnalytics();
    showSuccessToast('Refund request created successfully');
  }, [refreshAnalytics]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // Render overview cards
  const renderOverviewCards = () => {
    if (analyticsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`${getCardClass()} animate-pulse`}>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    const cards = [
      {
        title: 'Total Refunds',
        value: analytics?.totalRefunds || 0,
        icon: DollarSign,
        color: 'from-blue-500 to-cyan-600',
        change: analytics?.refundTrend || '+0%',
      },
      {
        title: 'Pending',
        value: analytics?.pendingRefunds || 0,
        icon: Clock,
        color: 'from-yellow-500 to-orange-600',
        change: analytics?.pendingTrend || '+0%',
      },
      {
        title: 'Processed',
        value: analytics?.processedRefunds || 0,
        icon: CheckCircle,
        color: 'from-green-500 to-emerald-600',
        change: analytics?.processedTrend || '+0%',
      },
      {
        title: 'Total Amount',
        value: new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0
        }).format(analytics?.totalAmount || 0),
        icon: TrendingUp,
        color: 'from-purple-500 to-pink-600',
        change: analytics?.amountTrend || '+0%',
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={getCardClass()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={getSubtextClass()}>{card.title}</p>
                <p className={`text-2xl font-bold ${themeConfig.text.primary} mt-1`}>
                  {card.value}
                </p>
                <p className={`text-xs mt-2 ${card.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {card.change} from last month
                </p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Render filters
  const renderFilters = () => (
    <div className={`${getCardClass()} mb-6`}>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search refunds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${getInputClass()} pl-10`}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={getInputClass()}
          >
            {REFUND_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={getInputClass()}
          >
            {REFUND_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={getInputClass()}
          >
            {REFUND_PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => refreshAnalytics()}
            className={getBtnSecondaryClass()}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {canManageRefunds && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={getBtnPrimaryClass()}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout currentPage="refunds">
      <div className={`min-h-screen ${themeConfig.bg} p-6`}>
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeConfig.text.primary} mb-2`}>
            Refund Management
          </h1>
          <p className={themeConfig.text.secondary}>
            Manage and track all refund requests and transactions
          </p>
        </div>

        {/* Modern Advanced Tab Navigation - AI-Refactored following settings pattern */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8"
        >
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? 'from-blue-600/10 to-purple-600/10' : 'from-blue-500/5 to-purple-500/5'} pointer-events-none rounded-xl`}></div>
          
          {/* Tab Container */}
          <div className={`relative flex flex-nowrap md:flex-wrap gap-2 p-4 min-w-max md:min-w-0 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {REFUND_TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    type: "spring" as const,
                    stiffness: 300,
                    damping: 24
                  }}
                  onClick={() => handleTabChange(tab.id)}
                  className={`group relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? `bg-gradient-to-r ${isDark ? 'from-blue-600 to-purple-600 text-white shadow-lg' : 'from-blue-500 to-purple-500 text-white shadow-lg'} transform scale-105`
                      : isDark 
                      ? 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200' 
                      : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active Tab Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeRefundTab"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${isDark ? 'from-blue-600/20 to-purple-600/20' : 'from-blue-500/20 to-purple-500/20'} shadow-lg`}
                      transition={{
                        type: "spring" as const,
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                  
                  {/* Tab Icon */}
                  <motion.div
                    initial={{ rotate: 0 }}
                    whileHover={{ rotate: 10 }}
                    transition={{ type: "spring" as const, stiffness: 300 }}
                    className={`relative z-10 text-base ${isActive ? 'drop-shadow-sm' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.div>
                  
                  {/* Tab Label */}
                  <span className="relative z-10 text-xs font-medium tracking-wide">
                    {tab.label}
                  </span>
                  
                  {/* Hover Effect */}
                  {!isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))'
                          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))'
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Area with proper spacing */}
        <div className="space-y-6">
          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderOverviewCards()}
                <div className="mt-8">
                  <RefundAnalytics analytics={analytics} loading={analyticsLoading} />
                </div>
              </motion.div>
            )}

            {activeTab === 'refunds' && (
              <motion.div
                key="refunds"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderFilters()}
                <RefundList
                  initialFilters={{
                    ...(statusFilter !== 'all' && { status: statusFilter }),
                    ...(typeFilter !== 'all' && { type: typeFilter }),
                    ...(priorityFilter !== 'all' && { priority: priorityFilter })
                  }}
                  onRefundSelect={handleRefundSelect}
                  onRefundUpdate={handleRefundUpdate}
                />
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <RefundAnalytics analytics={analytics} loading={analyticsLoading} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Create Refund Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <RefundForm
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleRefundCreated}
              />
            )}
          </AnimatePresence>

          {/* Refund Details Modal */}
          <AnimatePresence>
            {showDetailsModal && selectedRefund && (
              <RefundDetails
                isOpen={showDetailsModal}
                refund={selectedRefund}
                onClose={() => setShowDetailsModal(false)}
                onUpdate={handleRefundUpdate}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
