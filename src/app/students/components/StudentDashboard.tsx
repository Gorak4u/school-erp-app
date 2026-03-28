'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  DollarSign,
  PieChart,
  BarChart3,
  UserPlus,
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  GraduationCap,
  CreditCard,
  RefreshCw,
  Download,
  Grid,
  Calendar,
  FileText,
  User,
  UserCheck,
  UserX,
  ArrowUp,
  ArrowDown,
  Minus,
  Settings,
  ChevronDown,
  Filter,
  School,
  Bell
} from 'lucide-react';
import SkeletonLoader, { ModernSpinner, LoadingOverlay } from './SkeletonLoader';

interface StudentDashboardProps {
  dashboardStats: any;
  selectedStudents: number[];
  setBulkOperations: any;
  setShowAddModal: (v: boolean) => void;
  setShowAdvancedFilters: (v: boolean) => void;
  setShowBulkOperationModal: (v: boolean) => void;
  setShowDashboard: (v: boolean) => void;
  showAdvancedFilters: boolean;
  showDashboard: boolean;
  students: any[];
  theme: 'dark' | 'light';
  filteredStudents: any[];
  canCreateStudents?: boolean;
  canManageStudentBulk?: boolean;
  themeConfig?: any;
  getCardClass?: () => string;
  getBtnClass?: (type?: 'primary' | 'secondary' | 'danger' | 'success') => string;
  getTextClass?: (type?: 'primary' | 'secondary' | 'muted' | 'accent') => string;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

export default function StudentDashboard({
  dashboardStats, selectedStudents, setBulkOperations, setShowAddModal,
  setShowAdvancedFilters, setShowBulkOperationModal, setShowDashboard,
  showAdvancedFilters, showDashboard, students, theme, filteredStudents,
  canCreateStudents = true,
  canManageStudentBulk = true,
  themeConfig,
  getCardClass,
  getBtnClass,
  getTextClass,
  isLoading = false,
  isRefreshing = false
}: StudentDashboardProps) {
  const isDark = theme === 'dark';
  
  // Independent Dashboard Period Filter - separate from Student Management filters
  const [dashboardPeriod, setDashboardPeriod] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'this_year'>('all');
  
  // Filter students based on selected period - INDEPENDENT from management filters
  const periodFilteredStudents = useMemo(() => {
    if (dashboardPeriod === 'all' || !students) return students || [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return students.filter((student: any) => {
      const enrollmentDate = student.enrollmentDate ? new Date(student.enrollmentDate) : null;
      if (!enrollmentDate) return false;
      
      switch (dashboardPeriod) {
        case 'today':
          return enrollmentDate >= today;
        case 'this_week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return enrollmentDate >= weekStart;
        case 'this_month':
          return enrollmentDate.getMonth() === now.getMonth() && 
                 enrollmentDate.getFullYear() === now.getFullYear();
        case 'this_year':
          return enrollmentDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [students, dashboardPeriod]);

  // Calculate dashboard stats from period-filtered students (NOT management filtered)
  const currentDashboardStats = useMemo(() => {
    const filtered = periodFilteredStudents;
    if (!filtered || filtered.length === 0) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        averageAttendance: 0,
        lowAttendanceStudents: 0,
        totalFeesCollected: 0,
        pendingFees: 0,
        newStudentsThisMonth: 0,
        graduatedStudents: 0,
        totalSections: 0,
        avgStudentsPerSection: 0,
        feeDefaulters: 0,
        feeDefaultersAmount: 0,
        recentActivities: []
      };
    }

    const totalStudents = filtered.length;
    const activeStudents = filtered.filter((s: any) => s.status === 'active').length;
    const inactiveStudents = filtered.filter((s: any) => s.status === 'inactive').length;
    const graduatedStudents = filtered.filter((s: any) => s.status === 'graduated').length;
    
    // Calculate average attendance
    const attendanceValues = filtered
      .map((s: any) => s.attendance?.percentage)
      .filter((v: number) => typeof v === 'number');
    const averageAttendance = attendanceValues.length > 0 
      ? attendanceValues.reduce((a: number, b: number) => a + b, 0) / attendanceValues.length 
      : 0;
    const lowAttendanceStudents = filtered.filter((s: any) => (s.attendance?.percentage || 0) < 75).length;
    
    // Fee calculations
    const totalFeesCollected = filtered.reduce((sum: number, s: any) => sum + (s.fees?.paid || 0), 0);
    const pendingFees = filtered.reduce((sum: number, s: any) => sum + (s.fees?.pending || 0), 0);
    
    // New students this month
    const now = new Date();
    const newStudentsThisMonth = filtered.filter((s: any) => {
      if (!s.enrollmentDate) return false;
      const date = new Date(s.enrollmentDate);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    
    // Sections
    const uniqueSections = new Set(filtered.map((s: any) => `${s.class}-${s.section || 'A'}`));
    const totalSections = uniqueSections.size;
    const avgStudentsPerSection = totalSections > 0 ? Math.round(totalStudents / totalSections) : 0;
    
    // Fee defaulters
    const feeDefaultersList = filtered.filter((s: any) => (s.fees?.pending || 0) > 0);
    const feeDefaulters = feeDefaultersList.length;
    const feeDefaultersAmount = feeDefaultersList.reduce((sum: number, s: any) => sum + (s.fees?.pending || 0), 0);

    return {
      totalStudents,
      activeStudents,
      inactiveStudents,
      averageAttendance,
      lowAttendanceStudents,
      totalFeesCollected,
      pendingFees,
      newStudentsThisMonth,
      graduatedStudents,
      totalSections,
      avgStudentsPerSection,
      feeDefaulters,
      feeDefaultersAmount,
      recentActivities: dashboardStats?.recentActivities || []
    };
  }, [periodFilteredStudents, dashboardStats?.recentActivities]);

  // Use provided theme functions or fallback
  const cardClass = getCardClass?.() || (isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200');
  const primaryBtnClass = getBtnClass?.('primary') || 'bg-gradient-to-r from-blue-600 to-purple-600 text-white';
  const secondaryBtnClass = getBtnClass?.('secondary') || (isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800');
  const dangerBtnClass = getBtnClass?.('danger') || 'bg-orange-600 text-white';
  const primaryTextClass = getTextClass?.('primary') || (isDark ? 'text-white' : 'text-gray-900');
  const secondaryTextClass = getTextClass?.('secondary') || (isDark ? 'text-gray-400' : 'text-gray-600');
  const mutedTextClass = getTextClass?.('muted') || (isDark ? 'text-gray-500' : 'text-gray-500');
  
  const statCards = [
    { 
      label: 'Total Students', 
      value: currentDashboardStats.totalStudents.toString(), 
      icon: Users, 
      color: 'blue', 
      gradient: 'from-blue-500 to-cyan-600',
      trend: { value: `+${currentDashboardStats.newStudentsThisMonth}`, label: 'this month', type: 'increase' as const },
      bgColor: isDark ? 'from-blue-600/20 to-cyan-600/20' : 'from-blue-500/10 to-cyan-500/10',
      borderColor: isDark ? 'border-blue-500/30' : 'border-blue-500/20'
    },
    { 
      label: 'Active Students', 
      value: currentDashboardStats.activeStudents.toString(), 
      icon: CheckCircle, 
      color: 'green', 
      gradient: 'from-green-500 to-emerald-600',
      trend: { value: `${((currentDashboardStats.activeStudents / currentDashboardStats.totalStudents) * 100).toFixed(1)}%`, label: 'active rate', type: 'increase' as const },
      bgColor: isDark ? 'from-green-600/20 to-emerald-600/20' : 'from-green-500/10 to-emerald-500/10',
      borderColor: isDark ? 'border-green-500/30' : 'border-green-500/20'
    },
    { 
      label: 'Avg Attendance', 
      value: `${currentDashboardStats.averageAttendance.toFixed(1)}%`, 
      icon: BarChart3, 
      color: 'purple', 
      gradient: 'from-purple-500 to-pink-600',
      trend: { value: currentDashboardStats.lowAttendanceStudents, label: 'low attendance', type: 'decrease' as const },
      bgColor: isDark ? 'from-purple-600/20 to-pink-600/20' : 'from-purple-500/10 to-pink-500/10',
      borderColor: isDark ? 'border-purple-500/30' : 'border-purple-500/20'
    },
    { 
      label: 'Fees Collected', 
      value: `₹${(currentDashboardStats.totalFeesCollected / 1000).toFixed(0)}K`, 
      icon: DollarSign, 
      color: 'amber', 
      gradient: 'from-amber-500 to-orange-600',
      trend: { value: `₹${(currentDashboardStats.pendingFees / 1000).toFixed(0)}K`, label: 'pending', type: 'neutral' as const },
      bgColor: isDark ? 'from-amber-600/20 to-orange-600/20' : 'from-amber-500/10 to-orange-500/10',
      borderColor: isDark ? 'border-amber-500/30' : 'border-amber-500/20'
    },
    { 
      label: 'Graduated', 
      value: currentDashboardStats.graduatedStudents?.toString() || '0', 
      icon: GraduationCap, 
      color: 'indigo', 
      gradient: 'from-indigo-500 to-purple-600',
      trend: { value: `${currentDashboardStats.graduationRate || 0}%`, label: 'grad rate', type: 'increase' as const },
      bgColor: isDark ? 'from-indigo-600/20 to-purple-600/20' : 'from-indigo-500/10 to-purple-500/10',
      borderColor: isDark ? 'border-indigo-500/30' : 'border-indigo-500/20'
    },
    { 
      label: 'Class Sections', 
      value: currentDashboardStats.totalSections?.toString() || '0', 
      icon: Grid, 
      color: 'teal', 
      gradient: 'from-teal-500 to-cyan-600',
      trend: { value: `${currentDashboardStats.avgStudentsPerSection || 0}`, label: 'avg per section', type: 'neutral' as const },
      bgColor: isDark ? 'from-teal-600/20 to-cyan-600/20' : 'from-teal-500/10 to-cyan-500/10',
      borderColor: isDark ? 'border-teal-500/30' : 'border-teal-500/20'
    },
    { 
      label: 'Fee Defaulters', 
      value: currentDashboardStats.feeDefaulters?.toString() || '0', 
      icon: AlertTriangle, 
      color: 'red', 
      gradient: 'from-red-500 to-orange-600',
      trend: { value: `₹${((currentDashboardStats.feeDefaultersAmount || 0) / 1000).toFixed(0)}K`, label: 'outstanding', type: 'decrease' as const },
      bgColor: isDark ? 'from-red-600/20 to-orange-600/20' : 'from-red-500/10 to-orange-500/10',
      borderColor: isDark ? 'border-red-500/30' : 'border-red-500/20'
    },
    { 
      label: 'New Admissions', 
      value: currentDashboardStats.newStudentsThisMonth?.toString() || '0', 
      icon: UserPlus, 
      color: 'emerald', 
      gradient: 'from-emerald-500 to-teal-600',
      trend: { value: `${((currentDashboardStats.newStudentsThisMonth || 0) / Math.max(currentDashboardStats.totalStudents, 1) * 100).toFixed(1)}%`, label: 'of total', type: 'increase' as const },
      bgColor: isDark ? 'from-emerald-600/20 to-teal-600/20' : 'from-emerald-500/10 to-teal-500/10',
      borderColor: isDark ? 'border-emerald-500/30' : 'border-emerald-500/20'
    },
  ];

  return (
    <>
      {/* Loading Overlay for Refresh */}
      <AnimatePresence>
        {isRefreshing && (
          <LoadingOverlay message="Refreshing data..." theme={theme} />
        )}
      </AnimatePresence>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            className={`p-3 rounded-xl bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <TrendingUp className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className={`text-2xl font-bold ${primaryTextClass}`}>Student Dashboard</h2>
            <p className={`text-sm ${secondaryTextClass}`}>Overview and analytics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Dashboard Period Filter - Independent from Management filters */}
          <div className="relative">
            <select
              value={dashboardPeriod}
              onChange={(e) => setDashboardPeriod(e.target.value as any)}
              className={`appearance-none px-4 py-2 pr-8 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
            </select>
            <Calendar className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          
          {canCreateStudents && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all transform ${primaryBtnClass} shadow-lg flex items-center gap-2`}
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </motion.button>
          )}
          {canCreateStudents && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBulkOperations((prev: any) => ({ ...prev, showImportModal: true }))}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all transform border-2 ${secondaryBtnClass} flex items-center gap-2`}
            >
              <Download className="w-4 h-4" />
              Import
            </motion.button>
          )}
          {canManageStudentBulk && selectedStudents.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBulkOperationModal(true)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all transform ${dangerBtnClass} shadow-lg flex items-center gap-2`}
            >
              <Settings className="w-4 h-4" />
              Bulk ({selectedStudents.length})
            </motion.button>
          )}
        </div>
      </div>

      {/* Enhanced Dashboard */}
      <AnimatePresence>
        {showDashboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Modern Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
              {isLoading ? (
                <SkeletonLoader type="card" count={8} theme={theme} getCardClass={getCardClass} />
              ) : (
                statCards.map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${card.bgColor} border ${card.borderColor} backdrop-blur-sm shadow-lg`}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10`} />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                          <card.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center gap-1">
                          {card.trend.type === 'increase' && <ArrowUp className="w-4 h-4 text-green-500" />}
                          {card.trend.type === 'decrease' && <ArrowDown className="w-4 h-4 text-red-500" />}
                          {card.trend.type === 'neutral' && <Minus className="w-4 h-4 text-gray-500" />}
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            card.trend.type === 'increase' ? 'bg-green-500/20 text-green-600 border border-green-500/30' :
                            card.trend.type === 'decrease' ? 'bg-red-500/20 text-red-600 border border-red-500/30' :
                            'bg-gray-500/20 text-gray-600 border border-gray-500/30'
                          }`}>
                            {card.trend.value} {card.trend.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`text-3xl font-black mb-2 ${primaryTextClass}`}>
                        {card.value}
                      </div>
                      <div className={`text-sm font-medium ${secondaryTextClass}`}>
                        {card.label}
                      </div>
                    </div>
                    
                    {/* Animated Glow Effect */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-5`}
                      animate={{
                        opacity: [0.05, 0.1, 0.05],
                        scale: [1, 1.02, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                ))
              )}
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading ? (
                <SkeletonLoader type="card" count={4} theme={theme} getCardClass={getCardClass} />
              ) : (
                <>
                  {/* Attendance Performance */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`rounded-xl p-4 ${cardClass} shadow-lg border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${isDark ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500'}`}>
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${primaryTextClass}`}>Attendance</h4>
                        <p className={`text-xs ${secondaryTextClass}`}>This month</p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${primaryTextClass}`}>
                      {dashboardStats.monthlyAttendance || '85.2'}%
                    </div>
                    <div className={`text-xs ${dashboardStats.monthlyAttendance > 80 ? 'text-green-500' : 'text-orange-500'}`}>
                      {dashboardStats.monthlyAttendance > 80 ? 'Excellent' : 'Needs Improvement'}
                    </div>
                  </motion.div>

                  {/* Fee Collection Rate */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`rounded-xl p-4 ${cardClass} shadow-lg border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'}`}>
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${primaryTextClass}`}>Collection Rate</h4>
                        <p className={`text-xs ${secondaryTextClass}`}>This month</p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${primaryTextClass}`}>
                      {dashboardStats.collectionRate || '78.5'}%
                    </div>
                    <div className={`text-xs ${dashboardStats.collectionRate > 75 ? 'text-green-500' : 'text-orange-500'}`}>
                      {dashboardStats.collectionRate > 75 ? 'On Track' : 'Below Target'}
                    </div>
                  </motion.div>

                  {/* Pending Approvals */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`rounded-xl p-4 ${cardClass} shadow-lg border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${isDark ? 'from-orange-600 to-red-600' : 'from-orange-500 to-red-500'}`}>
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${primaryTextClass}`}>Pending</h4>
                        <p className={`text-xs ${secondaryTextClass}`}>Approvals</p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${primaryTextClass}`}>
                      {dashboardStats.pendingApprovals || '12'}
                    </div>
                    <div className="text-xs text-orange-500">
                      Action Required
                    </div>
                  </motion.div>

                  {/* System Health */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`rounded-xl p-4 ${cardClass} shadow-lg border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${isDark ? 'from-teal-600 to-cyan-600' : 'from-teal-500 to-cyan-500'}`}>
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${primaryTextClass}`}>System</h4>
                        <p className={`text-xs ${secondaryTextClass}`}>Health</p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${primaryTextClass}`}>
                      {dashboardStats.systemHealth || '98'}%
                    </div>
                    <div className="text-xs text-green-500">
                      Optimal
                    </div>
                  </motion.div>
                </>
              )}
            </div>

            {/* Modern Secondary Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <>
                  <SkeletonLoader type="card" theme={theme} getCardClass={getCardClass} />
                  <SkeletonLoader type="card" theme={theme} getCardClass={getCardClass} />
                  <SkeletonLoader type="card" theme={theme} getCardClass={getCardClass} />
                </>
              ) : (
                <>
                  {/* Gender Distribution */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`rounded-2xl p-6 ${cardClass} shadow-lg border-2 ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}
                  >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'}`}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${primaryTextClass}`}>Gender Distribution</h3>
                    <p className={`text-xs ${secondaryTextClass}`}>Student demographics</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: 'Male', value: dashboardStats.genderDistribution.male, color: 'bg-blue-500', icon: User },
                    { label: 'Female', value: dashboardStats.genderDistribution.female, color: 'bg-pink-500', icon: User },
                    { label: 'Other', value: dashboardStats.genderDistribution.other, color: 'bg-purple-500', icon: User },
                  ].map((g, index) => {
                    const total = dashboardStats.genderDistribution.male + dashboardStats.genderDistribution.female + dashboardStats.genderDistribution.other;
                    const pct = total > 0 ? (g.value / total) * 100 : 0;
                    return (
                      <motion.div
                        key={g.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${g.color} bg-opacity-20`}>
                              <g.icon className="w-4 h-4" style={{ color: g.color.replace('bg-', '') }} />
                            </div>
                            <span className={`text-sm font-medium ${secondaryTextClass}`}>{g.label}</span>
                          </div>
                          <span className={`text-sm font-bold ${primaryTextClass}`}>{g.value} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                          <motion.div
                            className={`h-full rounded-full ${g.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Modern Alerts */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className={`rounded-2xl p-6 ${cardClass} shadow-lg border-2 ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${isDark ? 'from-orange-600 to-red-600' : 'from-orange-500 to-red-500'}`}>
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${primaryTextClass}`}>Alerts</h3>
                    <p className={`text-xs ${secondaryTextClass}`}>Important notifications</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {dashboardStats.lowAttendanceStudents > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20"
                    >
                      <div className="p-2 rounded-xl bg-red-500/20">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                          {dashboardStats.lowAttendanceStudents} students with low attendance
                        </p>
                        <p className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>Requires attention</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {dashboardStats.pendingFees > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                    >
                      <div className="p-2 rounded-xl bg-amber-500/20">
                        <DollarSign className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                          ₹{dashboardStats.pendingFees.toLocaleString()} in pending fees
                        </p>
                        <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Payment required</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {dashboardStats.inactiveStudents > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/20"
                    >
                      <div className="p-2 rounded-xl bg-gray-500/20">
                        <UserX className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${mutedTextClass}`}>
                          {dashboardStats.inactiveStudents} inactive students
                        </p>
                        <p className={`text-xs ${mutedTextClass}`}>Status review needed</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {dashboardStats.lowAttendanceStudents === 0 && dashboardStats.pendingFees === 0 && dashboardStats.inactiveStudents === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="p-3 rounded-xl bg-green-500/20 inline-block mb-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                      <p className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>All systems operational</p>
                      <p className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>No alerts at this time</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Recent Activities */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className={`rounded-2xl p-6 ${cardClass} shadow-lg border-2 ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${isDark ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500'}`}>
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${primaryTextClass}`}>Recent Activities</h3>
                    <p className={`text-xs ${secondaryTextClass}`}>Latest student actions</p>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {dashboardStats.recentActivities.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="p-3 rounded-xl bg-gray-500/20 inline-block mb-3">
                        <Clock className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className={`text-sm font-medium ${mutedTextClass}`}>No recent activities</p>
                      <p className={`text-xs ${mutedTextClass}`}>Student actions will appear here</p>
                    </motion.div>
                  ) : (
                    dashboardStats.recentActivities.slice(0, 5).map((activity: any, index: number) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'} border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} hover:scale-[1.02] transition-transform`}
                      >
                        <div className={`p-2 rounded-xl ${
                          activity.type === 'admission' ? 'bg-blue-500/20' :
                          activity.type === 'fee_payment' ? 'bg-green-500/20' :
                          activity.type === 'status_change' ? 'bg-purple-500/20' :
                          'bg-gray-500/20'
                        }`}>
                          {activity.type === 'admission' && <GraduationCap className="w-4 h-4 text-blue-500" />}
                          {activity.type === 'fee_payment' && <DollarSign className="w-4 h-4 text-green-500" />}
                          {activity.type === 'status_change' && <RefreshCw className="w-4 h-4 text-purple-500" />}
                          {(!activity.type || activity.type === 'default') && <FileText className="w-4 h-4 text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${primaryTextClass}`}>{activity.description}</p>
                          <p className={`text-xs ${secondaryTextClass}`}>{activity.studentName}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
                </>
              )}
            </div>

            {/* Modern Results Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-100/50 border-gray-200/50'} backdrop-blur-sm border`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-600/20' : 'bg-blue-500/20'}`}>
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${primaryTextClass}`}>
                    Showing {filteredStudents.length} of {students.length} students
                  </p>
                  <p className={`text-xs ${secondaryTextClass}`}>Filtered results</p>
                </div>
              </div>
              
              {selectedStudents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30"
                >
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold text-blue-600">{selectedStudents.length} selected</span>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
