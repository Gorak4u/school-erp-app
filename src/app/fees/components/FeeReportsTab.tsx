// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import DiscountAnalytics from './discount/DiscountAnalytics';

interface FeeReportsTabProps {
  studentFeeSummaries: any[];
  theme: 'dark' | 'light';
  onClose: () => void;
}

export default function FeeReportsTab({ studentFeeSummaries, theme, onClose }: FeeReportsTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportsData, setReportsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date range filtering state
  const [academicYear, setAcademicYear] = useState('all');
  const [studentClass, setStudentClass] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const isDark = theme === 'dark';

  // Calculate date range based on selected period and year
  const calculateDateRange = useCallback(() => {
    const year = parseInt(selectedYear);
    const currentYear = new Date().getFullYear();
    
    if (selectedPeriod === 'daily') {
      // Today
      const today = new Date();
      return {
        fromDate: today.toISOString().split('T')[0],
        toDate: today.toISOString().split('T')[0]
      };
    } else if (selectedPeriod === 'weekly') {
      // Current week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        fromDate: startOfWeek.toISOString().split('T')[0],
        toDate: endOfWeek.toISOString().split('T')[0]
      };
    } else if (selectedPeriod === 'monthly') {
      // Selected month of selected year
      return {
        fromDate: `${year}-01-01`,
        toDate: `${year}-12-31`
      };
    } else if (selectedPeriod === 'yearly') {
      // Selected year only
      return {
        fromDate: `${year}-01-01`,
        toDate: `${year}-12-31`
      };
    }
    
    // Default to current year
    return {
      fromDate: `${currentYear}-01-01`,
      toDate: `${currentYear}-12-31`
    };
  }, [selectedPeriod, selectedYear]);

  // Load reports data from API
  useEffect(() => {
    const loadReportsData = async () => {
      try {
        setIsLoading(true);
        
        // Build API parameters for date range filtering
        const params = new URLSearchParams();
        
        if (academicYear !== 'all') {
          params.append('academicYear', academicYear);
        }
        
        if (studentClass !== 'all') {
          params.append('class', studentClass);
        }
        
        // Use calculated date range from period/year selectors
        const dateRange = calculateDateRange();
        const effectiveFromDate = fromDate || dateRange.fromDate;
        const effectiveToDate = toDate || dateRange.toDate;
        
        if (effectiveFromDate) {
          params.append('fromDate', effectiveFromDate);
        }
        
        if (effectiveToDate) {
          params.append('toDate', effectiveToDate);
        }
        
        const response = await fetch(`/api/fees/statistics?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setReportsData(result.data);
        } else {
          console.error('Failed to load reports data:', result.error);
        }
      } catch (error) {
        console.error('Error loading reports data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReportsData();
  }, [academicYear, studentClass, fromDate, toDate, selectedPeriod, selectedYear, calculateDateRange]);

  // Use API data or fall back to client-side calculations for compatibility
  const stats = useMemo(() => {
    if (reportsData) {
      return {
        totalStudents: reportsData.totalStudents,
        totalFees: reportsData.totalFees,
        totalCollected: reportsData.totalCollected,
        totalPending: reportsData.totalPending,
        totalOverdue: reportsData.paymentStatusBreakdown?.find((s: any) => s.status === 'overdue')?.count || 0,
        collectionRate: reportsData.collectionRate,
        fullyPaid: reportsData.paymentStatusBreakdown?.find((s: any) => s.status === 'fully_paid')?.count || 0,
        partiallyPaid: reportsData.paymentStatusBreakdown?.find((s: any) => s.status === 'partially_paid')?.count || 0,
        noPayment: reportsData.paymentStatusBreakdown?.find((s: any) => s.status === 'no_payment')?.count || 0,
        overdue: reportsData.paymentStatusBreakdown?.find((s: any) => s.status === 'overdue')?.count || 0,
        classwiseData: reportsData.classBreakdown?.reduce((acc: any, item: any) => {
          acc[item.class] = {
            total: item.totalFees,
            collected: item.totalPaid,
            pending: item.totalPending,
            students: item.studentCount
          };
          return acc;
        }, {}) || {}
      };
    }

    // Fallback to client-side calculations
    const totalStudents = studentFeeSummaries.length;
    const totalFees = studentFeeSummaries.reduce((sum, s) => sum + (s.totalFees || 0), 0);
    const totalCollected = studentFeeSummaries.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
    const totalPending = studentFeeSummaries.reduce((sum, s) => sum + (s.totalPending || 0), 0);
    const totalOverdue = studentFeeSummaries.reduce((sum, s) => sum + (s.totalOverdue || 0), 0);
    const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0;
    
    const fullyPaid = studentFeeSummaries.filter(s => s.paymentStatus === 'fully_paid').length;
    const partiallyPaid = studentFeeSummaries.filter(s => s.paymentStatus === 'partially_paid').length;
    const noPayment = studentFeeSummaries.filter(s => s.paymentStatus === 'no_payment').length;
    const overdue = studentFeeSummaries.filter(s => s.paymentStatus === 'overdue').length;

    // Class-wise breakdown
    const classwiseData = studentFeeSummaries.reduce((acc, student) => {
      const cls = student.studentClass || 'Unknown';
      if (!acc[cls]) {
        acc[cls] = { total: 0, collected: 0, pending: 0, students: 0 };
      }
      acc[cls].total += student.totalFees || 0;
      acc[cls].collected += student.totalPaid || 0;
      acc[cls].pending += student.totalPending || 0;
      acc[cls].students += 1;
      return acc;
    }, {});

    return {
      totalStudents,
      totalFees,
      totalCollected,
      totalPending,
      totalOverdue,
      collectionRate,
      fullyPaid,
      partiallyPaid,
      noPayment,
      overdue,
      classwiseData
    };
  }, [reportsData, studentFeeSummaries]);

  // Monthly collection trend (API data with fallback)
  const monthlyTrendData = useMemo(() => {
    // Use API data if available
    if (reportsData?.monthlyTrend) {
      const monthlyData = reportsData.monthlyTrend.map((item: any) => item.amount || 0);
      
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Collections',
            data: monthlyData,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Target',
            data: Array(12).fill(stats.totalFees / 12),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderDash: [5, 5],
            tension: 0.4
          }
        ]
      };
    }

    // Fallback to client-side processing
    const monthlyData = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    // Extract real monthly data from payment records
    studentFeeSummaries?.forEach(student => {
      student.feeRecords?.forEach(record => {
        record.payments?.forEach(payment => {
          const paymentDate = payment.paidDate || payment.date || payment.createdAt;
          if (paymentDate) {
            const date = new Date(paymentDate);
            if (date.getFullYear() === currentYear) {
              const month = date.getMonth();
              monthlyData[month] += payment.amount || 0;
            }
          }
        });
      });
    });

    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Collections',
          data: monthlyData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Target',
          data: Array(12).fill(stats.totalFees / 12),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderDash: [5, 5],
          tension: 0.4
        }
      ]
    };
  }, [reportsData, studentFeeSummaries, stats.totalFees]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600 dark:text-gray-400">Loading reports...</span>
      </div>
    );
  }

  // Payment status distribution
  const paymentStatusData = {
    labels: ['Fully Paid', 'Partially Paid', 'No Payment', 'Overdue'],
    datasets: [{
      data: [stats.fullyPaid, stats.partiallyPaid, stats.noPayment, stats.overdue],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(156, 163, 175, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(251, 191, 36)',
        'rgb(156, 163, 175)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2
    }]
  };

  // Class-wise collection
  const classwiseChartData = {
    labels: Object.keys(stats.classwiseData),
    datasets: [
      {
        label: 'Collected',
        data: Object.values(stats.classwiseData).map((d: any) => d.collected),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: 'Pending',
        data: Object.values(stats.classwiseData).map((d: any) => d.pending),
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
      }
    ]
  };

  // Collection vs Target
  const collectionVsTargetData = {
    labels: ['Collected', 'Pending', 'Overdue'],
    datasets: [{
      data: [stats.totalCollected, stats.totalPending - stats.totalOverdue, stats.totalOverdue],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(251, 191, 36)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? '#e5e7eb' : '#374151'
        }
      }
    },
    scales: {
      x: {
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
        grid: { color: isDark ? '#374151' : '#e5e7eb' }
      },
      y: {
        ticks: { color: isDark ? '#9ca3af' : '#6b7280' },
        grid: { color: isDark ? '#374151' : '#e5e7eb' }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151',
          padding: 15
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Header with Filters */}
      <div className={`rounded-xl border p-6 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              📈 Fee Reports & Analytics
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Comprehensive financial insights and performance metrics
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <button className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}>
              📥 Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                  Total Revenue
                </p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ₹{stats.totalFees.toLocaleString()}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stats.totalStudents} students
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                  Total Collected
                </p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ₹{stats.totalCollected.toLocaleString()}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stats.collectionRate.toFixed(1)}% collection rate
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>
                  Total Pending
                </p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ₹{stats.totalPending.toLocaleString()}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {((stats.totalPending / stats.totalFees) * 100).toFixed(1)}% pending
                </p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                  Total Overdue
                </p>
                <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ₹{stats.totalOverdue.toLocaleString()}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stats.overdue} students
                </p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Collection Trend */}
        <div className={`rounded-xl border p-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            📊 Monthly Collection Trend
          </h3>
          <div style={{ height: '300px' }}>
            <Line data={monthlyTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Payment Status Distribution */}
        <div className={`rounded-xl border p-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🎯 Payment Status Distribution
          </h3>
          <div style={{ height: '300px' }}>
            <Doughnut data={paymentStatusData} options={pieChartOptions} />
          </div>
        </div>

        {/* Class-wise Collection */}
        <div className={`rounded-xl border p-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🏫 Class-wise Collection Analysis
          </h3>
          <div style={{ height: '300px' }}>
            <Bar data={classwiseChartData} options={chartOptions} />
          </div>
        </div>

        {/* Collection vs Target */}
        <div className={`rounded-xl border p-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🎯 Collection vs Target
          </h3>
          <div style={{ height: '300px' }}>
            <Pie data={collectionVsTargetData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Class-wise Table */}
      <div className={`rounded-xl border p-6 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          📋 Detailed Class-wise Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${
              isDark ? 'bg-gray-700' : 'bg-gray-50'
            } border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>Class</th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>Students</th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>Total Fees</th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>Collected</th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>Pending</th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>Collection %</th>
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-300' : 'text-gray-500'
                }`}>Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDark ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {Object.entries(stats.classwiseData).map(([className, data]: [string, any]) => {
                const collectionPct = data.total > 0 ? (data.collected / data.total) * 100 : 0;
                return (
                  <tr key={className} className={`${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } transition-colors`}>
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {className}
                    </td>
                    <td className={`px-4 py-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {data.students}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ₹{data.total.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium text-green-500`}>
                      ₹{data.collected.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium text-orange-500`}>
                      ₹{data.pending.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${
                      collectionPct >= 80 ? 'text-green-500' : collectionPct >= 50 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {collectionPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        collectionPct >= 80
                          ? 'bg-green-100 text-green-800'
                          : collectionPct >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {collectionPct >= 80 ? 'Excellent' : collectionPct >= 50 ? 'Good' : 'Needs Attention'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-xl border p-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🏆</div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Top Performing Classes
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.classwiseData)
              .sort(([, a]: any, [, b]: any) => (b.collected / b.total) - (a.collected / a.total))
              .slice(0, 5)
              .map(([className, data]: [string, any]) => (
                <div key={className} className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {className}
                  </span>
                  <span className="text-green-500 font-semibold">
                    {((data.collected / data.total) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className={`rounded-xl border p-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">⚡</div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Quick Stats
            </h3>
          </div>
          <div className="space-y-3">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg. Fee per Student</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{(stats.totalFees / stats.totalStudents).toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg. Collection per Student</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{(stats.totalCollected / stats.totalStudents).toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Students with Full Payment</p>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.fullyPaid} ({((stats.fullyPaid / stats.totalStudents) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl border p-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🎯</div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Collection Goals
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Target</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.collectionRate.toFixed(1)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600"
                  style={{ width: `${Math.min(stats.collectionRate, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Full Payment Rate</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {((stats.fullyPaid / stats.totalStudents) * 100).toFixed(1)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{ width: `${(stats.fullyPaid / stats.totalStudents) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Overdue Reduction</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {(100 - (stats.overdue / stats.totalStudents) * 100).toFixed(1)}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                  style={{ width: `${100 - (stats.overdue / stats.totalStudents) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className={`mt-6 p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className={`px-3 py-2 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="all">All Years</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Class</label>
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className={`px-3 py-2 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="all">All Classes</option>
                <option value="1">Class 1</option>
                <option value="2">Class 2</option>
                <option value="3">Class 3</option>
                <option value="4">Class 4</option>
                <option value="5">Class 5</option>
                <option value="6">Class 6</option>
                <option value="7">Class 7</option>
                <option value="8">Class 8</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={`px-3 py-2 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={`px-3 py-2 rounded border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                setAcademicYear('all');
                setStudentClass('all');
                setSelectedPeriod('monthly');
                setSelectedYear(new Date().getFullYear().toString());
              }}
              className={`px-4 py-2 rounded text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        <div className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {reportsData ? `Showing data for ${reportsData.totalStudents} students` : 'Loading data...'}
          {(fromDate || toDate) && ` from ${fromDate || 'start'} to ${toDate || 'end'}`}
        </div>
      </div>

      {/* Discount Analytics & Reports Section */}
      <div className="mt-8">
        <div className={`mb-4 p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>💰 Discount Analytics & Reports</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Comprehensive discount request analytics and financial impact analysis</p>
        </div>
        <DiscountAnalytics theme={theme} />
      </div>
    </motion.div>
  );
}
