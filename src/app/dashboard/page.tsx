// Enterprise-Grade Production Dashboard Page
// Refactored to use modular components for better maintainability

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { dashboardApi } from '@/lib/apiClient';
import DashboardKPICards from './components/DashboardKPICards';
import DashboardCharts from './components/DashboardCharts';
import DashboardAnalytics from './components/DashboardAnalytics';
import DashboardPerformance from './components/DashboardPerformance';
import DashboardQuickActions from './components/DashboardQuickActions';
import DashboardAlerts from './components/DashboardAlerts';

export default function DashboardPage() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.stats();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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
        labels: dashboardData?.charts?.feeCollection?.labels || ['No data'],
        datasets: [{
          label: 'Fees Collected',
          data: dashboardData?.charts?.feeCollection?.collected || [0],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
        }]
      },
      classDistribution: {
        labels: dashboardData?.charts?.classDistribution?.labels || ['No data'],
        datasets: [{
          label: 'Students per Class',
          data: dashboardData?.charts?.classDistribution?.data || [0],
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
        labels: (dashboardData?.upcomingExams || []).map((e: any) => e.subject || e.name),
        datasets: [{
          label: 'Upcoming Exams (Total Marks)',
          data: (dashboardData?.upcomingExams || []).map((e: any) => e.totalMarks || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
        }]
      },
      attendanceTrend: {
        labels: ['Present', 'Absent', 'Late'],
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
      averageAttendance: dashboardData.attendance?.total ? 
        Math.round((dashboardData.attendance.present / dashboardData.attendance.total) * 100) : 0,
      passRate: 95 // TODO: Calculate from exam results
    },
    financial: {
      totalRevenue: dashboardData.fees?.totalAmount || 0,
      feesCollected: dashboardData.fees?.totalCollected || 0,
      pendingFees: dashboardData.fees?.totalPending || 0,
      collectionRate: dashboardData.fees?.collectionRate || 0
    },
    operational: {
      totalTeachers: dashboardData.teachers?.total || 0,
      activeTeachers: dashboardData.teachers?.active || 0,
      satisfactionScore: 85, // TODO: Calculate from real data
      efficiency: 92 // TODO: Calculate from real data
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
        </nav>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <DashboardKPICards theme={theme} kpiData={kpiData} />
          
          {/* Quick Actions */}
          <DashboardQuickActions theme={theme} />
          
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
          <DashboardKPICards theme={theme} kpiData={kpiData} />
          <DashboardPerformance theme={theme} />
        </div>
      )}
    </AppLayout>
  );
}
