'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { showErrorToast, showSuccessToast } from '@/lib/toastUtils';

// Icons
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
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
  AlertTriangle,
  Eye,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap
} from 'lucide-react';

// Constants
const REFUND_TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'refunds', label: 'Refunds', icon: DollarSign },
  { id: 'waivers', label: 'Waivers', icon: CheckCircle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
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
  { value: 'transport_fee_waiver', label: 'Transport Waiver' },
  { value: 'fine', label: 'Fine' },
  { value: 'overpayment', label: 'Overpayment' },
];

// AI-Optimized Refunds Page
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
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Centralized theme object
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

  // CSS class generators
  const getCardClass = () =>
    `rounded-2xl border p-6 shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;

  const getInputClass = () =>
    `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;

  const getBtnPrimaryClass = () =>
    `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white' : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white'}`;

  const getBtnSecondaryClass = () =>
    `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'}`;

  // Data fetching functions
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/refunds?period=30');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data.analytics || data); // Handle both structures
    } catch (error) {
      console.error('Analytics fetch error:', error);
    }
  }, []);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '50',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/refunds?${params}`);
      if (!response.ok) throw new Error('Failed to fetch refunds');
      const data = await response.json();
      setRefunds(data.refunds || []);
    } catch (error) {
      console.error('Refunds fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchTerm]);

  // Initialize data
  useEffect(() => {
    fetchAnalytics();
    fetchRefunds();
  }, [fetchAnalytics, fetchRefunds]);

  // Filter refunds and waivers
  const refundData = useMemo(() => 
    refunds.filter(refund => !refund.type?.includes('waiver')), 
    [refunds]
  );

  const waiverData = useMemo(() => 
    refunds.filter(refund => refund.type?.includes('waiver')), 
    [refunds]
  );

  // Calculate separate metrics for refunds and waivers
  const refundMetrics = useMemo(() => {
    const approvedRefunds = refundData.filter(r => r.status === 'approved');
    const pendingRefunds = refundData.filter(r => r.status === 'pending');
    const processedRefunds = refundData.filter(r => r.status === 'processed');
    const totalRefundAmount = approvedRefunds.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    return {
      total: refundData.length,
      approved: approvedRefunds.length,
      pending: pendingRefunds.length,
      processed: processedRefunds.length,
      totalAmount: totalRefundAmount
    };
  }, [refundData]);

  const waiverMetrics = useMemo(() => {
    const approvedWaivers = waiverData.filter(w => w.status === 'approved');
    const pendingWaivers = waiverData.filter(w => w.status === 'pending');
    const processedWaivers = waiverData.filter(w => w.status === 'processed');
    const totalWaiverAmount = approvedWaivers.reduce((sum, w) => sum + (w.amount || 0), 0);
    
    return {
      total: waiverData.length,
      approved: approvedWaivers.length,
      pending: pendingWaivers.length,
      processed: processedWaivers.length,
      totalAmount: totalWaiverAmount
    };
  }, [waiverData]);

  // Render overview cards
  const renderOverviewCards = () => {
    if (!analytics) {
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
        title: 'Approved Refunds',
        value: refundMetrics.approved,
        icon: DollarSign,
        color: 'from-blue-500 to-cyan-600',
        change: '+12%',
        trend: 'up',
        subtitle: `₹${refundMetrics.totalAmount.toLocaleString()}`
      },
      {
        title: 'Pending Refunds',
        value: refundMetrics.pending,
        icon: Clock,
        color: 'from-yellow-500 to-orange-600',
        change: '+5%',
        trend: 'up',
        subtitle: `${refundMetrics.total} total requests`
      },
      {
        title: 'Approved Waivers',
        value: waiverMetrics.approved,
        icon: CheckCircle,
        color: 'from-green-500 to-emerald-600',
        change: '+18%',
        trend: 'up',
        subtitle: `₹${waiverMetrics.totalAmount.toLocaleString()}`
      },
      {
        title: 'Pending Waivers',
        value: waiverMetrics.pending,
        icon: AlertTriangle,
        color: 'from-purple-500 to-pink-600',
        change: '+8%',
        trend: 'up',
        subtitle: `${waiverMetrics.total} total requests`
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
                <p className={`text-sm ${themeConfig.text.secondary}`}>{card.title}</p>
                <p className={`text-2xl font-bold ${themeConfig.text.primary} mt-1`}>
                  {card.value}
                </p>
                <p className={`text-xs ${themeConfig.text.secondary} mt-1`}>{card.subtitle}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-500">{card.change}</span>
                  <span className="text-xs text-gray-500">from last month</span>
                </div>
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

  // Render analytics charts
  const renderAnalyticsCharts = () => {
    if (!analytics) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`${getCardClass()} animate-pulse`}>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${themeConfig.text.secondary}`}>Approval Rate</p>
                <p className={`text-2xl font-bold ${themeConfig.text.primary}`}>
                  {analytics?.overview?.approvalRate || '0'}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${themeConfig.text.secondary}`}>Avg Approval Time</p>
                <p className={`text-2xl font-bold ${themeConfig.text.primary}`}>
                  {analytics?.efficiency?.avgApprovalTime || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${themeConfig.text.secondary}`}>Auto Approval Rate</p>
                <p className={`text-2xl font-bold ${themeConfig.text.primary}`}>
                  {analytics?.efficiency?.autoApprovalRate || '0'}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div className={getCardClass()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${themeConfig.text.secondary}`}>Total Processed</p>
                <p className={`text-2xl font-bold ${themeConfig.text.primary}`}>
                  {analytics?.efficiency?.totalProcessed || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts and Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Refund Trends */}
          <motion.div className={getCardClass()}>
            <h3 className={`text-lg font-semibold ${themeConfig.text.primary} mb-4`}>Monthly Trends</h3>
            <div className="space-y-3">
              {analytics?.trends?.monthlyChartData?.map((item: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${themeConfig.border} ${themeConfig.hover} transition-all hover:scale-102`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${themeConfig.text.primary}`}>{item.month}</p>
                      <p className={`text-sm ${themeConfig.text.secondary}`}>Total: ₹{item.total?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${themeConfig.text.secondary} mb-1`}>Transport Fee</p>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                        <DollarSign className="w-3 h-3" />
                        <span className="font-medium">₹{item.transport_fee?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {(!analytics?.trends?.monthlyChartData || analytics.trends.monthlyChartData.length === 0) && (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className={`font-medium ${themeConfig.text.primary} mb-2`}>No monthly data available</p>
                  <p className={`text-sm ${themeConfig.text.secondary}`}>Monthly trends will appear here when data is available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Refund Breakdown by Type */}
          <motion.div className={getCardClass()}>
            <h3 className={`text-lg font-semibold ${themeConfig.text.primary} mb-4`}>Breakdown by Type</h3>
            <div className="space-y-3">
              {analytics?.breakdown?.byType?.map((item: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${themeConfig.border} ${themeConfig.hover} transition-all hover:scale-102`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                        <PieChart className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className={`font-medium ${themeConfig.text.primary}`}>
                          {item.type === 'transport_fee_waiver' ? 'Transport Waiver' : 
                           item.type?.replace('_', ' ') || item.type}
                        </p>
                        <p className={`text-sm ${themeConfig.text.secondary}`}>{item.count} requests</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${themeConfig.text.primary}`}>₹{item.amount?.toLocaleString()}</p>
                      <p className={`text-sm ${themeConfig.text.secondary}`}>Net: ₹{item.netAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {(!analytics?.breakdown?.byType || analytics.breakdown.byType.length === 0) && (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <PieChart className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className={`font-medium ${themeConfig.text.primary} mb-2`}>No breakdown data available</p>
                  <p className={`text-sm ${themeConfig.text.secondary}`}>Type breakdown will appear here when data is available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Refunds */}
          <motion.div className={getCardClass()}>
            <h3 className={`text-lg font-semibold ${themeConfig.text.primary} mb-4`}>Recent Refunds</h3>
            <div className="space-y-3">
              {analytics?.recent?.slice(0, 5).map((refund: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${themeConfig.border} ${themeConfig.hover} transition-all hover:scale-102`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                        <Users className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className={`font-medium ${themeConfig.text.primary}`}>
                          {refund.student?.name || 'Unknown'}
                        </p>
                        <p className={`text-sm ${themeConfig.text.secondary}`}>
                          {refund.type === 'transport_fee_waiver' ? 'Transport Waiver' : 
                           refund.type?.replace('_', ' ') || refund.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${themeConfig.text.primary}`}>₹{refund.amount?.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        refund.status === 'approved' ? 'bg-green-100 text-green-800' :
                        refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        refund.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        refund.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {refund.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {(!analytics?.recent || analytics.recent.length === 0) && (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className={`font-medium ${themeConfig.text.primary} mb-2`}>No recent refunds</p>
                  <p className={`text-sm ${themeConfig.text.secondary}`}>Recent refund activity will appear here</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Refund Methods */}
          <motion.div className={getCardClass()}>
            <h3 className={`text-lg font-semibold ${themeConfig.text.primary} mb-4`}>Refund Methods</h3>
            <div className="space-y-3">
              {analytics?.breakdown?.byMethod?.map((item: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 rounded-xl border ${themeConfig.border} ${themeConfig.hover} transition-all hover:scale-102`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
                        <Activity className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className={`font-medium ${themeConfig.text.primary}`}>
                          {item.method === 'bank_transfer' ? 'Bank Transfer' : 
                           item.method === 'waiver' ? 'Waiver' : 
                           item.method?.replace('_', ' ') || item.method}
                        </p>
                        <p className={`text-sm ${themeConfig.text.secondary}`}>{item.count} requests</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${themeConfig.text.primary}`}>₹{item.amount?.toLocaleString()}</p>
                      <p className={`text-sm ${themeConfig.text.secondary}`}>Net: ₹{item.netAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {(!analytics?.breakdown?.byMethod || analytics.breakdown.byMethod.length === 0) && (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <Activity className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className={`font-medium ${themeConfig.text.primary} mb-2`}>No method data available</p>
                  <p className={`text-sm ${themeConfig.text.secondary}`}>Payment method breakdown will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Alerts Section */}
        {analytics?.alerts && (
          <motion.div className={getCardClass()}>
            <h3 className={`text-lg font-semibold ${themeConfig.text.primary} mb-4`}>Alerts & Notifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <p className={`font-medium ${themeConfig.text.primary}`}>Pending Count</p>
                </div>
                <p className={`text-2xl font-bold text-yellow-600`}>
                  {analytics.alerts.pendingCount || 0}
                </p>
                <p className={`text-sm ${themeConfig.text.secondary}`}>
                  ₹{analytics.alerts.totalPendingAmount?.toLocaleString() || 0} pending
                </p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <p className={`font-medium ${themeConfig.text.primary}`}>High Priority</p>
                </div>
                <p className={`text-2xl font-bold text-red-600`}>
                  {analytics.alerts.highPriorityPending?.length || 0}
                </p>
                <p className={`text-sm ${themeConfig.text.secondary}`}>
                  Awaiting approval
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className={`font-medium ${themeConfig.text.primary}`}>Auto Approved</p>
                </div>
                <p className={`text-2xl font-bold text-green-600`}>
                  {analytics.efficiency?.autoApprovedCount || 0}
                </p>
                <p className={`text-sm ${themeConfig.text.secondary}`}>
                  Processed automatically
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Render refund requests table
  const renderRequestsTable = (data: any[], title: string, IconComponent: any) => {
    return (
      <div className={getCardClass()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className={`text-lg font-semibold ${themeConfig.text.primary}`}>{title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              {data.length} items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${getInputClass()} pl-10 w-64`}
              />
            </div>
            
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
            
            <button
              onClick={fetchRefunds}
              className={getBtnSecondaryClass()}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className={themeConfig.text.secondary}>Loading {title.toLowerCase()}...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gray-100">
              <IconComponent className="w-8 h-8 text-gray-400" />
            </div>
            <p className={`font-medium ${themeConfig.text.primary} mb-2`}>No {title.toLowerCase()} found</p>
            <p className={`text-sm ${themeConfig.text.secondary}`}>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : `${title} will appear here when created`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${themeConfig.border}`}>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${themeConfig.text.secondary}`}>Student</th>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${themeConfig.text.secondary}`}>Type</th>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${themeConfig.text.secondary}`}>Amount</th>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${themeConfig.text.secondary}`}>Status</th>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${themeConfig.text.secondary}`}>Date</th>
                  <th className={`text-left px-4 py-3 text-sm font-medium ${themeConfig.text.secondary}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`border-b ${themeConfig.border} hover:${themeConfig.hover}`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className={`font-medium ${themeConfig.text.primary}`}>
                          {item.student?.name || 'Unknown'}
                        </p>
                        <p className={`text-sm ${themeConfig.text.secondary}`}>
                          {item.student?.admissionNo || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${themeConfig.text.primary}`}>
                        {item.type === 'transport_fee_waiver' ? 'Transport Waiver' : 
                         item.type?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`font-medium ${themeConfig.text.primary}`}>
                        ₹{item.amount?.toLocaleString() || '0'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'approved' ? 'bg-green-100 text-green-800' :
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        item.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm ${themeConfig.text.secondary}`}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedRefund(item);
                          setShowDetailsModal(true);
                        }}
                        className={`p-1 rounded ${themeConfig.hover} transition-colors`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

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

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8"
        >
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
                  onClick={() => setActiveTab(tab.id)}
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
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="space-y-6">
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
                  {renderAnalyticsCharts()}
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
                {renderRequestsTable(refundData, 'Refunds', DollarSign)}
              </motion.div>
            )}

            {activeTab === 'waivers' && (
              <motion.div
                key="waivers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderRequestsTable(waiverData, 'Waivers', CheckCircle)}
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
                {renderAnalyticsCharts()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Refund Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedRefund && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowDetailsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                className={`${getCardClass()} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-semibold ${themeConfig.text.primary}`}>
                    Refund Details
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className={`p-2 rounded-lg ${themeConfig.hover} transition-colors`}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${themeConfig.text.secondary}`}>Student Name</p>
                      <p className={`font-medium ${themeConfig.text.primary}`}>
                        {selectedRefund.student?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${themeConfig.text.secondary}`}>Admission No</p>
                      <p className={`font-medium ${themeConfig.text.primary}`}>
                        {selectedRefund.student?.admissionNo || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${themeConfig.text.secondary}`}>Type</p>
                      <p className={`font-medium ${themeConfig.text.primary}`}>
                        {selectedRefund.type === 'transport_fee_waiver' ? 'Transport Waiver' : 
                         selectedRefund.type?.replace('_', ' ') || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${themeConfig.text.secondary}`}>Amount</p>
                      <p className={`font-medium ${themeConfig.text.primary}`}>
                        ₹{selectedRefund.amount?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${themeConfig.text.secondary}`}>Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedRefund.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedRefund.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedRefund.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        selectedRefund.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedRefund.status || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <p className={`text-sm ${themeConfig.text.secondary}`}>Created Date</p>
                      <p className={`font-medium ${themeConfig.text.primary}`}>
                        {new Date(selectedRefund.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {selectedRefund.reason && (
                    <div>
                      <p className={`text-sm ${themeConfig.text.secondary}`}>Reason</p>
                      <p className={`font-medium ${themeConfig.text.primary}`}>
                        {selectedRefund.reason}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
