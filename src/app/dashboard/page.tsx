// Enterprise-Grade Production Dashboard Page
// Refactored to use modular components for better maintainability

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardKPICards from './components/DashboardKPICards';
import DashboardCharts from './components/DashboardCharts';
import DashboardAnalytics from './components/DashboardAnalytics';
import DashboardPerformance from './components/DashboardPerformance';
import DashboardQuickActions from './components/DashboardQuickActions';
import DashboardAlerts from './components/DashboardAlerts';

export default function DashboardPage() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [isClient, setIsClient] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Mock data for charts
  const [chartData] = useState({
    overview: {
      studentGrowth: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Total Students',
          data: [1200, 1250, 1300, 1280, 1350, 1400],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      },
      feeCollection: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Collected',
            data: [45000, 52000, 48000, 58000, 62000, 68000],
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
          },
          {
            label: 'Pending',
            data: [5000, 3000, 7000, 2000, 3000, 2000],
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
          }
        ]
      },
      classDistribution: {
        labels: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'],
        datasets: [{
          data: [120, 115, 130, 125, 140, 135],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(147, 51, 234, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(20, 184, 166, 0.8)'
          ]
        }]
      },
      subjectPerformance: {
        labels: ['Math', 'Science', 'English', 'History', 'Geography'],
        datasets: [{
          label: 'Class Average',
          data: [78, 82, 85, 75, 80],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)'
        }]
      },
      attendanceTrend: {
        labels: Array.from({length: 30}, (_, i) => `Day ${i + 1}`),
        datasets: [{
          label: 'Attendance %',
          data: Array.from({length: 30}, () => Math.floor(Math.random() * 15) + 85),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4
        }]
      }
    }
  });

  // Mock KPI data
  const [kpiData] = useState({
    academic: {
      totalStudents: 1400,
      activeStudents: 1350,
      averageAttendance: 92,
      passRate: 95
    },
    financial: {
      totalRevenue: 2800000,
      feesCollected: 2680000,
      pendingFees: 120000,
      collectionRate: 96
    },
    operational: {
      totalTeachers: 85,
      activeTeachers: 82,
      satisfactionScore: 4.5,
      efficiency: 88
    }
  });

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
