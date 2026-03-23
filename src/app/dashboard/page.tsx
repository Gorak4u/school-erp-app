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
      setDashboardData(response.data);
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
      collectionRate: (dashboardData.fees?.collectionRate as number) || 0
    },
    operational: {
      totalTeachers: dashboardData.teachers?.total || 0,
      activeTeachers: dashboardData.teachers?.active || 0,
      satisfactionScore: 0, // Will be calculated when feedback data is available
      efficiency: 0 // Will be calculated when operational metrics are available
    }
  } : {
    academic: { totalStudents: 0, activeStudents: 0, averageAttendance: 0, passRate: 0 },
    financial: { totalRevenue: 0, feesCollected: 0, pendingFees: 0, collectionRate: 0 },
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

      {/* Dashboard Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 capitalize ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            📊 Overview
          </button>
          {canViewFinancials && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 capitalize ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              📈 Analytics
            </button>
          )}
          {canViewFinancials && (
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 capitalize ${
                activeTab === 'performance'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              🎯 Performance
            </button>
          )}
          {canViewFinancials && (
            <button
              onClick={() => setActiveTab('kpi')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 capitalize ${
                activeTab === 'kpi'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              📊 KPI
            </button>
          )}
        </nav>
      </div>

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
