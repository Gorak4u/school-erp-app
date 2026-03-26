'use client';

import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { refundPerformanceMonitor } from '@/lib/refundLogger';

// Icons
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  BanknoteIcon,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Target,
  Zap
} from 'lucide-react';

interface RefundAnalyticsProps {
  analytics: any;
  loading: boolean;
}

// AI-Optimized Refund Analytics Component following settings pattern
export default function RefundAnalytics({ analytics, loading }: RefundAnalyticsProps) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // CSS class generators following settings pattern
  const cardClasses = useMemo(() =>
    `rounded-2xl border p-6 shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`,
    [isDark]
  );

  const getMetricCardClasses = useCallback((trend: 'up' | 'down' | 'neutral') => {
    const baseClasses = 'rounded-2xl border p-6 shadow-lg transition-all hover:scale-105';
    const trendClasses = {
      up: isDark ? 'border-green-600/30 bg-green-600/10' : 'border-green-500/30 bg-green-50',
      down: isDark ? 'border-red-600/30 bg-red-600/10' : 'border-red-500/30 bg-red-50',
      neutral: isDark ? 'border-gray-600/30 bg-gray-700/50' : 'border-gray-300/30 bg-gray-50'
    };
    return `${baseClasses} ${trendClasses[trend]}`;
  }, [isDark]);

  const getProgressClasses = useCallback((percentage: number) => {
    const color = percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red';
    return `h-2 rounded-full bg-gradient-to-r from-${color}-500 to-${color}-600`;
  }, []);

  // Enhanced data processing
  const processedAnalytics = useMemo(() => {
    if (!analytics) return null;

    const { overview, financial, breakdown, trends, alerts } = analytics;

    return {
      overview: {
        totalRefunds: overview?.totalRefunds || 0,
        totalAmount: overview?.totalAmount || 0,
        averageAmount: overview?.averageAmount || 0,
        pendingRefunds: overview?.pendingRefunds || 0,
        processedRefunds: overview?.processedRefunds || 0,
        rejectedRefunds: overview?.rejectedRefunds || 0
      },
      financial: {
        grossAmount: financial?.grossAmount || 0,
        adminFees: financial?.adminFees || 0,
        netAmount: financial?.netAmount || 0,
        savingsRate: financial?.savingsRate || 0,
        totalSavings: financial?.totalSavings || 0
      },
      breakdown: {
        byType: breakdown?.byType || {},
        byMethod: breakdown?.byMethod || {},
        byStatus: breakdown?.byStatus || {},
        byMonth: breakdown?.byMonth || []
      },
      trends: {
        monthly: trends?.monthly || [],
        weekly: trends?.weekly || [],
        forecast: trends?.forecast || []
      },
      alerts: alerts || []
    };
  }, [analytics]);

  // Enhanced formatters
  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  const formatTrend = useCallback((trend: number) => {
    const isPositive = trend >= 0;
    return {
      value: Math.abs(trend),
      direction: isPositive ? 'up' : 'down',
      color: isPositive ? 'text-green-500' : 'text-red-500',
      icon: isPositive ? ArrowUpRight : ArrowDownRight
    };
  }, []);

  // Loading state following settings pattern
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className={`${cardClasses} animate-pulse`}
            >
              <div className="h-20 bg-gray-200 rounded"></div>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className={`${cardClasses} animate-pulse`}
            >
              <div className="h-64 bg-gray-200 rounded"></div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state following settings pattern
  if (!processedAnalytics) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${cardClasses} text-center py-12`}
      >
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
          No Analytics Data
        </h3>
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          Refund analytics will appear here once data is available.
        </p>
      </motion.div>
    );
  }

  const { overview, financial, breakdown, trends, alerts } = processedAnalytics;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={getMetricCardClasses('neutral')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Refunds
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mt-1`}>
                {overview.totalRefunds}
              </p>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                All time requests
              </p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-teal-600/20' : 'bg-teal-100'}`}>
              <Users className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={getMetricCardClasses('neutral')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Amount
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mt-1`}>
                {formatAmount(overview.totalAmount)}
              </p>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Gross refund amount
              </p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className={getMetricCardClasses('neutral')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Average Amount
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mt-1`}>
                {formatAmount(overview.averageAmount)}
              </p>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Per refund average
              </p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={getMetricCardClasses('neutral')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Pending
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mt-1`}>
                {overview.pendingRefunds}
              </p>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Awaiting approval
              </p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-yellow-600/20' : 'bg-yellow-100'}`}>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Financial Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className={cardClasses}
      >
        <h3 className={`font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Activity className="w-5 h-5 text-teal-600" />
          Financial Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Gross Amount
            </p>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatAmount(financial.grossAmount)}
            </p>
          </div>
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Admin Fees
            </p>
            <p className={`text-xl font-bold text-red-500`}>
              -{formatAmount(financial.adminFees)}
            </p>
          </div>
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Net Amount
            </p>
            <p className={`text-xl font-bold text-green-600`}>
              {formatAmount(financial.netAmount)}
            </p>
          </div>
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Savings Rate
            </p>
            <p className={`text-xl font-bold text-teal-600`}>
              {formatPercentage(financial.savingsRate)}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between mb-2">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Processing Efficiency
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatPercentage((overview.processedRefunds / overview.totalRefunds) * 100)}
            </span>
          </div>
          <div className={`h-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(overview.processedRefunds / overview.totalRefunds) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-600`}
            />
          </div>
        </div>
      </motion.div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className={cardClasses}
        >
          <h3 className={`font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <PieChart className="w-5 h-5 text-teal-600" />
            Refund Types
          </h3>
          <div className="space-y-4">
            {Object.entries(breakdown.byType).map(([type, data]: [string, any], index: number) => {
              const percentage = (data.count / overview.totalRefunds) * 100;
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {data.count} ({formatPercentage(percentage)})
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        type === 'academic_fee' ? 'from-blue-500 to-blue-600' :
                        type === 'transport_fee' ? 'from-green-500 to-green-600' :
                        type === 'fine' ? 'from-red-500 to-red-600' :
                        'from-purple-500 to-purple-600'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className={cardClasses}
        >
          <h3 className={`font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Refund Methods
          </h3>
          <div className="space-y-4">
            {Object.entries(breakdown.byMethod).map(([method, data]: [string, any], index: number) => {
              const percentage = (data.count / overview.totalRefunds) * 100;
              return (
                <motion.div
                  key={method}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {method.replace('_', ' ').charAt(0).toUpperCase() + method.replace('_', ' ').slice(1)}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {data.count} ({formatPercentage(percentage)})
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        method === 'bank_transfer' ? 'from-blue-500 to-blue-600' :
                        method === 'credit_future' ? 'from-green-500 to-green-600' :
                        'from-yellow-500 to-yellow-600'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
          className={cardClasses}
        >
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Alerts & Insights
          </h3>
          <div className="space-y-3">
            {alerts.map((alert: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                  alert.type === 'error' ? 'bg-red-500/20 border border-red-500/30' :
                  'bg-blue-500/20 border border-blue-500/30'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                  alert.type === 'warning' ? 'text-yellow-500' :
                  alert.type === 'error' ? 'text-red-500' :
                  'text-blue-500'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {alert.title}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {alert.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
