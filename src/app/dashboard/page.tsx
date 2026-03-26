// Enterprise-Grade Production Dashboard Page
// Refactored to use modular components for better maintainability

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useSchoolSetup } from '@/hooks/useSchoolSetup';
import DashboardKPICards from './components/DashboardKPICards';
import DashboardCharts from './components/DashboardCharts';
import DashboardAnalytics from './components/DashboardAnalytics';
import DashboardPerformance from './components/DashboardPerformance';
import DashboardQuickActions from './components/DashboardQuickActions';
import DashboardAlerts from './components/DashboardAlerts';
import { dashboardApi } from '@/lib/apiClient';

// Type definitions for dashboard data
interface DashboardData {
  students?: {
    total?: number;
    active?: number;
    inactive?: number;
    [key: string]: unknown;
  };
  teachers?: {
    total?: number;
    active?: number;
    inactive?: number;
    [key: string]: unknown;
  };
  classes?: {
    total?: number;
    [key: string]: unknown;
  };
  fees?: {
    totalCollected?: number;
    pending?: number;
    [key: string]: unknown;
  };
  stats?: {
    totalStudents?: number;
    totalTeachers?: number;
    totalClasses?: number;
    totalFeeCollected?: number;
    [key: string]: unknown;
  };
  charts?: {
    enrollmentData?: unknown[];
    feeCollectionData?: unknown[];
    attendanceData?: unknown[];
    feeCollection?: {
      labels?: unknown[];
      collected?: unknown[];
      pending?: unknown[];
      [key: string]: unknown;
    };
    classDistribution?: {
      labels?: unknown[];
      data?: unknown[];
      [key: string]: unknown;
    };
    attendanceTrends?: {
      labels?: unknown[];
      present?: unknown[];
      absent?: unknown[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
  upcomingExams?: {
    subject?: string;
    name?: string;
    totalMarks?: number;
    [key: string]: unknown;
  }[];
  attendance?: {
    present?: number;
    absent?: number;
    late?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export default function DashboardPage() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { hasPermission, isAdmin } = usePermissions();
  const setupStatus = useSchoolSetup();
  const canViewFinancials = isAdmin || hasPermission('view_admin_dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupAlert, setShowSetupAlert] = useState(false);
  const [setupDismissed, setSetupDismissed] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadDashboardData();
  }, []);

  // Check setup status and redirect if needed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSetupDismissed(localStorage.getItem('schoolSetupAlertDismissed') === 'true');
    }
  }, []);

  useEffect(() => {
    if (!setupStatus.loading) {
      if (setupStatus.error) {
        console.error('Setup check error:', setupStatus.error);
        return;
      }

      if (setupStatus.redirectToSettings && isAdmin && !setupDismissed) {
        setShowSetupAlert(true);

        const redirectTimer = setTimeout(() => {
          router.push('/settings');
        }, 10000);

        return () => clearTimeout(redirectTimer);
      }
    }
  }, [setupStatus.loading, setupStatus.redirectToSettings, setupStatus.error, isAdmin, router, setupDismissed]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.stats();
      setDashboardData(response as any);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSettings = () => {
    router.push('/settings');
  };

  const handleDismissAlert = () => {
    setShowSetupAlert(false);
    setSetupDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('schoolSetupAlertDismissed', 'true');
    }
  };

  // Chart data built from real API response
  const chartData = {
    overview: {
      studentGrowth: {
        labels: ['Total', 'Active', 'Inactive'],
        datasets: [{
          label: 'Students',
          data: [
            dashboardData?.students?.total || 0,
            dashboardData?.students?.active || 0,
            dashboardData?.students?.inactive || 0,
          ],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      },
      feeCollection: {
        labels: (dashboardData?.charts?.feeCollection?.labels as string[]) || ['No data'],
        datasets: [{
          label: 'Fees Collected',
          data: (dashboardData?.charts?.feeCollection?.collected as number[]) || [0],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        }]
      },
      classDistribution: {
        labels: (dashboardData?.charts?.classDistribution?.labels as string[]) || ['No data'],
        datasets: [{
          label: 'Students per Class',
          data: (dashboardData?.charts?.classDistribution?.data as number[]) || [0],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(147, 51, 234, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)',
          ]
        }]
      },
      subjectPerformance: {
        labels: (dashboardData?.upcomingExams || []).map((e: { subject?: string; name?: string }) => e.subject || e.name || ''),
        datasets: [{
          label: 'Upcoming Exams (Total Marks)',
          data: (dashboardData?.upcomingExams || []).map((e: { totalMarks?: number }) => e.totalMarks || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
        }]
      },
      attendanceTrend: {
        labels: (dashboardData?.charts?.attendanceTrends?.labels as string[]) || ['Present', 'Absent', 'Late'],
        datasets: [{
          label: 'Today\'s Attendance',
          data: [
            dashboardData?.attendance?.present || 0,
            dashboardData?.attendance?.absent || 0,
            dashboardData?.attendance?.late || 0,
          ],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4
        }]
      }
    }
  };

  // Real KPI data from API
  const kpiData = dashboardData ? {
    academic: {
      totalStudents: dashboardData.students?.total || 0,
      activeStudents: dashboardData.students?.active || 0,
      averageAttendance: dashboardData.attendance?.total && dashboardData.attendance.present ? 
        Math.round((dashboardData.attendance.present / dashboardData.attendance.total) * 100) : 0,
      passRate: 0 // Will be calculated when exam results are available
    },
    financial: {
      totalRevenue: (dashboardData.fees?.totalAmount as number) || 0,
      feesCollected: dashboardData.fees?.totalCollected || 0,
      pendingFees: (dashboardData.fees?.totalPending as number) || 0,
      collectionRate: (dashboardData.fees?.collectionRate as number) || 0,
      finesWaived: (dashboardData.fees?.finesWaived as number) || 0
    },
    operational: {
      totalTeachers: dashboardData.teachers?.total || 0,
      activeTeachers: dashboardData.teachers?.active || 0,
      satisfactionScore: 0, // Will be calculated when feedback data is available
      efficiency: 0 // Will be calculated when operational metrics are available
    }
  } : {
    academic: { totalStudents: 0, activeStudents: 0, averageAttendance: 0, passRate: 0 },
    financial: { totalRevenue: 0, feesCollected: 0, pendingFees: 0, collectionRate: 0, finesWaived: 0 },
    operational: { totalTeachers: 0, activeTeachers: 0, satisfactionScore: 0, efficiency: 0 }
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout 
      currentPage="dashboard" 
      title="Dashboard"
    >
      {/* Setup Alert - Only show for admins when setup is incomplete */}
      {showSetupAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`mb-6 p-4 rounded-xl border-l-4 ${
            theme === 'dark' 
              ? 'bg-yellow-900/20 border-yellow-600 text-yellow-300' 
              : 'bg-yellow-50 border-yellow-400 text-yellow-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium">
                  ⚠️ School Setup Required
                </h3>
                <div className="mt-2 text-sm">
                  <p>
                    Your school needs essential configuration to function properly. 
                    {!setupStatus.isConfigured && (
                      <span> Missing settings: {setupStatus.missingEssential.join(', ')}.</span>
                    )}
                    {!setupStatus.hasAcademicYears && (
                      <span> No academic years configured.</span>
                    )}
                  </p>
                  <p className="mt-1">
                    You will be automatically redirected to Settings in 10 seconds, or you can go there now.
                  </p>
                </div>
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={handleGoToSettings}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      theme === 'dark'
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-yellow-600 text-white hover:bg-yellow-700'
                    }`}
                  >
                    Go to Settings Now
                  </button>
                  <button
                    onClick={handleDismissAlert}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      theme === 'dark'
                        ? 'border-yellow-600 text-yellow-400 hover:bg-yellow-600/20'
                        : 'border-yellow-400 text-yellow-700 hover:bg-yellow-100'
                    }`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advanced Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Main Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Section - Welcome & Title */}
          <div className="flex-1">
            <motion.div
              className="flex items-center gap-4 mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Animated Welcome Icon */}
              <motion.div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600' 
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                } shadow-lg`}
                whileHover={{ 
                  scale: 1.05, 
                  rotate: 5,
                  boxShadow: '0 20px 40px -15px rgba(59, 130, 246, 0.5)'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </motion.div>
              
              <div>
                <motion.h1
                  className={`text-3xl lg:text-4xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                  whileHover={{ x: 2 }}
                >
                  Welcome back, {(user as any)?.firstName || (user as any)?.name?.split(' ')[0] || 'Admin'}!
                </motion.h1>
                <motion.p
                  className={`text-lg ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Here's what's happening at your school today
                </motion.p>
              </div>
            </motion.div>

            {/* Quick Stats Bar */}
            <motion.div
              className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-gray-100/50 border border-gray-200'
              } backdrop-blur-sm`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {[
                {
                  label: 'Total Students',
                  value: kpiData.academic.totalStudents,
                  icon: '�',
                  color: 'blue'
                },
                {
                  label: 'Active Teachers',
                  value: kpiData.operational.activeTeachers,
                  icon: '👨‍🏫',
                  color: 'green'
                },
                {
                  label: 'Revenue',
                  value: `$${(kpiData.financial.totalRevenue / 1000).toFixed(1)}k`,
                  icon: '💰',
                  color: 'emerald'
                },
                {
                  label: 'Attendance',
                  value: `${kpiData.academic.averageAttendance}%`,
                  icon: '📊',
                  color: 'purple'
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stat.value}
                  </div>
                  <div className={`text-xs ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Section - Actions */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 lg:flex-col"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Date & Time Display */}
            <motion.div
              className={`px-4 py-3 rounded-xl text-center ${
                theme === 'dark' 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              } shadow-lg`}
              whileHover={{ scale: 1.02 }}
            >
              <div className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <motion.div
                className={`text-2xl font-bold font-mono ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}
                animate={{
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </motion.div>
            </motion.div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <motion.button
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } shadow-lg`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/settings')}
              >
                ⚙️ Settings
              </motion.button>
              <motion.button
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } shadow-lg`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/reports')}
              >
                � Reports
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Navigation Tabs */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="relative">
            {/* Tab Background */}
            <motion.div
              className={`absolute inset-0 rounded-xl ${
                theme === 'dark' 
                  ? 'bg-gray-800/30' 
                  : 'bg-gray-100/30'
              } backdrop-blur-sm`}
            />
            
            <nav className="relative flex flex-wrap gap-2 p-2">
              {[
                { id: 'overview', label: 'Overview', icon: '📊', color: 'blue' },
                ...(canViewFinancials ? [
                  { id: 'analytics', label: 'Analytics', icon: '📈', color: 'emerald' },
                  { id: 'performance', label: 'Performance', icon: '🎯', color: 'purple' },
                  { id: 'kpi', label: 'KPI', icon: '📊', color: 'orange' }
                ] : [])
              ].map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? theme === 'dark'
                        ? 'bg-gray-700 text-white shadow-lg'
                        : 'bg-white text-gray-900 shadow-lg'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active Indicator */}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className={`absolute inset-0 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30'
                          : 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200'
                      }`}
                      transition={{
                        type: "spring" as const,
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                  
                  <div className="relative z-10 flex items-center gap-2">
                    <motion.span
                      animate={{
                        rotate: activeTab === tab.id ? [0, 10, -10, 0] : 0
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: activeTab === tab.id ? Infinity : 0,
                        repeatDelay: 2
                      }}
                    >
                      {tab.icon}
                    </motion.span>
                    <span>{tab.label}</span>
                    
                    {/* Tab Badge */}
                    {tab.id === 'overview' && (
                      <motion.div
                        className={`w-2 h-2 rounded-full ${
                          theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
                        }`}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [1, 0.7, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </div>
                </motion.button>
              ))}
            </nav>
          </div>
        </motion.div>
      </motion.div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <DashboardKPICards theme={theme} kpiData={kpiData} canViewFinancials={canViewFinancials} />
          
          {/* Quick Actions */}
          <DashboardQuickActions theme={theme} dashboardData={dashboardData} />
          
          {/* Charts Section */}
          <DashboardCharts theme={theme} chartData={chartData} />
          
          {/* Alerts */}
          <DashboardAlerts theme={theme} />
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <DashboardAnalytics theme={theme} />
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <DashboardPerformance theme={theme} />
      )}

      {/* KPI Tab - Reuse Overview with focus on metrics */}
      {activeTab === 'kpi' && (
        <div className="space-y-6">
          <DashboardKPICards theme={theme} kpiData={kpiData} canViewFinancials={canViewFinancials} />
          <DashboardPerformance theme={theme} />
        </div>
      )}
    </AppLayout>
  );
}
