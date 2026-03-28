'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useFeeDashboardStats, Period } from '@/hooks/useDashboardStats';
import SkeletonLoader from '@/app/students/components/SkeletonLoader';
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Ban,
  Users,
  Wallet,
  PieChart,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  BarChart3,
  Calendar,
  Receipt,
  CreditCard,
  FileText,
  Zap,
  Bell,
  Activity,
  Percent,
  TrendingDown,
  Download,
  Filter,
  Gift
} from 'lucide-react';

export default function FeeDashboard({ ctx }: { ctx: any }) {
  const {
    theme, selectedStudents,
  } = ctx;

  // Use API-based dashboard stats with period filter
  const [period, setPeriod] = React.useState<Period>('all');
  const { stats, loading, error, refetch } = useFeeDashboardStats(period);

  // Debug: log period changes
  React.useEffect(() => {
    console.log('FeeDashboard period changed:', period);
  }, [period]);

  // Use stats from API instead of calculated from filtered students
  const totalFees = stats?.totalFeesCollected || 0;
  const collectedFees = stats?.totalFeesPaid || 0;
  const pendingFees = stats?.totalFeesPending || 0;
  const overdueFees = stats?.totalFeesOverdue || 0;
  const collectionRate = stats?.collectionRate || 0;
  const totalStudents = stats?.totalStudents || 0;
  const fullyPaidCount = stats?.fullyPaidCount || 0;
  const partiallyPaidCount = stats?.partiallyPaidCount || 0;
  const overdueCount = stats?.overdueCount || 0;
  const totalDiscount = stats?.totalDiscount || 0;
  const totalWaived = stats?.totalWaived || 0;
  const pendingApprovals = stats?.pendingApprovals || 0;

  const isDark = theme === 'dark';

  // Period options
  const periodOptions: { value: Period; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' },
  ];

  const statCards = [
    // Primary Financial Metrics (Row 1)
    { 
      label: 'Total Fees', 
      value: `₹${(totalFees / 100000).toFixed(2)}L`, 
      icon: DollarSign, 
      color: 'blue', 
      gradient: 'from-blue-500 to-cyan-600',
      trend: { value: `${collectionRate.toFixed(1)}%`, label: 'collected', type: 'increase' as const },
      bgColor: isDark ? 'from-blue-600/20 to-cyan-600/20' : 'from-blue-500/10 to-cyan-500/10',
      borderColor: isDark ? 'border-blue-500/30' : 'border-blue-500/20'
    },
    { 
      label: 'Collected', 
      value: `₹${(collectedFees / 100000).toFixed(2)}L`, 
      icon: CheckCircle, 
      color: 'green', 
      gradient: 'from-green-500 to-emerald-600',
      trend: { value: `${fullyPaidCount}`, label: 'fully paid', type: 'increase' as const },
      bgColor: isDark ? 'from-green-600/20 to-emerald-600/20' : 'from-green-500/10 to-emerald-500/10',
      borderColor: isDark ? 'border-green-500/30' : 'border-green-500/20'
    },
    { 
      label: 'Pending', 
      value: `₹${(pendingFees / 100000).toFixed(2)}L`, 
      icon: Clock, 
      color: 'amber', 
      gradient: 'from-amber-500 to-orange-600',
      trend: { value: `${totalStudents - fullyPaidCount}`, label: 'students', type: 'neutral' as const },
      bgColor: isDark ? 'from-amber-600/20 to-orange-600/20' : 'from-amber-500/10 to-orange-500/10',
      borderColor: isDark ? 'border-amber-500/30' : 'border-amber-500/20'
    },
    { 
      label: 'Overdue', 
      value: `₹${(overdueFees / 100000).toFixed(2)}L`, 
      icon: AlertTriangle, 
      color: 'red', 
      gradient: 'from-red-500 to-rose-600',
      trend: { value: `${overdueCount}`, label: 'students', type: 'decrease' as const },
      bgColor: isDark ? 'from-red-600/20 to-rose-600/20' : 'from-red-500/10 to-rose-500/10',
      borderColor: isDark ? 'border-red-500/30' : 'border-red-500/20'
    },
    // Secondary Metrics (Row 2)
    { 
      label: 'Collection Rate', 
      value: `${collectionRate.toFixed(1)}%`, 
      icon: Percent, 
      color: 'indigo', 
      gradient: 'from-indigo-500 to-purple-600',
      trend: { value: collectionRate > 80 ? 'Good' : 'Low', label: 'status', type: collectionRate > 80 ? 'increase' : 'decrease' as const },
      bgColor: isDark ? 'from-indigo-600/20 to-purple-600/20' : 'from-indigo-500/10 to-purple-500/10',
      borderColor: isDark ? 'border-indigo-500/30' : 'border-indigo-500/20'
    },
    { 
      label: 'Total Students', 
      value: totalStudents.toString(), 
      icon: Users, 
      color: 'teal', 
      gradient: 'from-teal-500 to-cyan-600',
      trend: { value: `${fullyPaidCount}`, label: 'paid', type: 'increase' as const },
      bgColor: isDark ? 'from-teal-600/20 to-cyan-600/20' : 'from-teal-500/10 to-cyan-500/10',
      borderColor: isDark ? 'border-teal-500/30' : 'border-teal-500/20'
    },
    { 
      label: 'Fully Paid', 
      value: fullyPaidCount.toString(), 
      icon: CheckCircle, 
      color: 'emerald', 
      gradient: 'from-emerald-500 to-green-600',
      trend: { value: `${totalStudents > 0 ? ((fullyPaidCount / totalStudents) * 100).toFixed(1) : 0}%`, label: 'of total', type: 'increase' as const },
      bgColor: isDark ? 'from-emerald-600/20 to-green-600/20' : 'from-emerald-500/10 to-green-500/10',
      borderColor: isDark ? 'border-emerald-500/30' : 'border-emerald-500/20'
    },
    { 
      label: 'Partially Paid', 
      value: partiallyPaidCount.toString(), 
      icon: Activity, 
      color: 'yellow', 
      gradient: 'from-yellow-500 to-amber-600',
      trend: { value: `${totalStudents > 0 ? ((partiallyPaidCount / totalStudents) * 100).toFixed(1) : 0}%`, label: 'of total', type: 'neutral' as const },
      bgColor: isDark ? 'from-yellow-600/20 to-amber-600/20' : 'from-yellow-500/10 to-amber-500/10',
      borderColor: isDark ? 'border-yellow-500/30' : 'border-yellow-500/20'
    },
    // Financial Details (Row 3)
    { 
      label: 'Total Discount', 
      value: `₹${(totalDiscount / 1000).toFixed(1)}K`, 
      icon: Gift, 
      color: 'pink', 
      gradient: 'from-pink-500 to-rose-600',
      trend: { value: 'Applied', label: 'discounts', type: 'neutral' as const },
      bgColor: isDark ? 'from-pink-600/20 to-rose-600/20' : 'from-pink-500/10 to-rose-500/10',
      borderColor: isDark ? 'border-pink-500/30' : 'border-pink-500/20'
    },
    { 
      label: 'Waived Amount', 
      value: `₹${(totalWaived / 1000).toFixed(1)}K`, 
      icon: Ban, 
      color: 'orange', 
      gradient: 'from-orange-500 to-red-600',
      trend: { value: 'Total', label: 'waived', type: 'neutral' as const },
      bgColor: isDark ? 'from-orange-600/20 to-red-600/20' : 'from-orange-500/10 to-red-500/10',
      borderColor: isDark ? 'border-orange-500/30' : 'border-orange-500/20'
    },
    { 
      label: 'Avg Fee/Student', 
      value: `₹${totalStudents > 0 ? Math.round(totalFees / totalStudents).toLocaleString() : '0'}`, 
      icon: Receipt, 
      color: 'cyan', 
      gradient: 'from-cyan-500 to-blue-600',
      trend: { value: 'Average', label: 'per student', type: 'neutral' as const },
      bgColor: isDark ? 'from-cyan-600/20 to-blue-600/20' : 'from-cyan-500/10 to-blue-500/10',
      borderColor: isDark ? 'border-cyan-500/30' : 'border-cyan-500/20'
    },
    { 
      label: 'Pending Approvals', 
      value: pendingApprovals.toString(), 
      icon: FileText, 
      color: 'violet', 
      gradient: 'from-violet-500 to-purple-600',
      trend: { value: 'Need', label: 'action', type: pendingApprovals > 0 ? 'decrease' : 'increase' as const },
      bgColor: isDark ? 'from-violet-600/20 to-purple-600/20' : 'from-violet-500/10 to-purple-500/10',
      borderColor: isDark ? 'border-violet-500/30' : 'border-violet-500/20'
    },
    // Status Metrics (Row 4)
    { 
      label: 'Overdue %', 
      value: `${totalStudents > 0 ? ((overdueCount / totalStudents) * 100).toFixed(1) : 0}%`, 
      icon: TrendingDown, 
      color: 'rose', 
      gradient: 'from-rose-500 to-red-600',
      trend: { value: `${overdueCount}`, label: 'students', type: 'decrease' as const },
      bgColor: isDark ? 'from-rose-600/20 to-red-600/20' : 'from-rose-500/10 to-red-500/10',
      borderColor: isDark ? 'border-rose-500/30' : 'border-rose-500/20'
    },
    { 
      label: 'Collection Target', 
      value: `${Math.max(0, 100 - collectionRate).toFixed(1)}%`, 
      icon: Zap, 
      color: 'fuchsia', 
      gradient: 'from-fuchsia-500 to-pink-600',
      trend: { value: 'Remaining', label: 'to reach 100%', type: 'neutral' as const },
      bgColor: isDark ? 'from-fuchsia-600/20 to-pink-600/20' : 'from-fuchsia-500/10 to-pink-500/10',
      borderColor: isDark ? 'border-fuchsia-500/30' : 'border-fuchsia-500/20'
    },
    { 
      label: 'Active Students', 
      value: (totalStudents - overdueCount).toString(), 
      icon: Users, 
      color: 'lime', 
      gradient: 'from-lime-500 to-green-600',
      trend: { value: 'No', label: 'overdue', type: 'increase' as const },
      bgColor: isDark ? 'from-lime-600/20 to-green-600/20' : 'from-lime-500/10 to-green-500/10',
      borderColor: isDark ? 'border-lime-500/30' : 'border-lime-500/20'
    },
    { 
      label: 'Net Collection', 
      value: `₹${((collectedFees - totalDiscount - totalWaived) / 100000).toFixed(2)}L`, 
      icon: CreditCard, 
      color: 'sky', 
      gradient: 'from-sky-500 to-blue-600',
      trend: { value: 'After', label: 'adjustments', type: 'increase' as const },
      bgColor: isDark ? 'from-sky-600/20 to-blue-600/20' : 'from-sky-500/10 to-blue-500/10',
      borderColor: isDark ? 'border-sky-500/30' : 'border-sky-500/20'
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    amber: 'from-amber-500 to-amber-700',
    red: 'from-red-500 to-red-700',
    purple: 'from-purple-500 to-purple-700',
  };

  const partialCount = partiallyPaidCount;

  // Get recent activities from API or use default
  const activities = stats?.recentActivities || [];

  return (
    <>
      {/* Dashboard Header with Period Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg`}
          >
            <BarChart3 className="w-5 h-5" />
          </motion.div>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Fee Dashboard
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Overview and analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={period}
              onChange={(e) => {
                const newPeriod = e.target.value as Period;
                console.log('Period selected:', newPeriod);
                setPeriod(newPeriod);
              }}
              className={`bg-transparent text-sm font-medium outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Refresh Button */}
          <button
            onClick={refetch}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
                <div key={i} className={`rounded-xl p-5 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <SkeletonLoader type="card" count={1} />
                </div>
              ))}
            </>
          ) : (
            statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl p-5 bg-gradient-to-br ${card.bgColor} border ${card.borderColor} backdrop-blur-sm hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-r ${card.gradient} text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      card.trend.type === 'increase' ? 'text-green-500' : 
                      card.trend.type === 'decrease' ? 'text-red-500' : 
                      'text-gray-500'
                    }`}>
                      {card.trend.type === 'increase' && <TrendingUp className="w-3 h-3" />}
                      {card.trend.type === 'decrease' && <TrendingUp className="w-3 h-3 rotate-180" />}
                      <span>{card.trend.value}</span>
                      <span className="text-gray-400 font-normal">{card.trend.label}</span>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {card.value}
                  </div>
                  <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {card.label}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-6 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              💳 Payment Status
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Fully Paid', value: fullyPaidCount, color: 'bg-green-500' },
                { label: 'Partially Paid', value: partialCount, color: 'bg-yellow-500' },
                { label: 'Overdue', value: overdueCount, color: 'bg-red-500' },
              ].map(g => {
                const total = totalStudents || 1;
                const pct = total > 0 ? (g.value / total) * 100 : 0;
                return (
                  <div key={g.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{g.label}</span>
                      <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                        {g.value} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className={`h-2 rounded-full ${g.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-6 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              🔔 Alerts
            </h3>
            <div className="space-y-3">
              {overdueCount > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <span className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                    {overdueCount} students with overdue fees
                  </span>
                </div>
              )}
              {partialCount > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-500 text-lg">💸</span>
                  <span className={`text-sm ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
                    {partialCount} students partially paid
                  </span>
                </div>
              )}
              {!loading && (stats?.collectionRate || 0) < 80 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-blue-500 text-lg">📊</span>
                  <span className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                    Collection rate below 80%
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-6 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              📋 Recent Activities
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activities.slice(0, 5).map((activity: any) => (
                <div key={activity.id} className={`flex items-center gap-2 p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <span className="text-sm">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {activity.message}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
              theme === 'dark' ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <span>Showing summary for {totalStudents} students</span>
                {selectedStudents?.length > 0 && (
                  <span className="text-blue-500 font-medium ml-2">{selectedStudents.length} selected</span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
