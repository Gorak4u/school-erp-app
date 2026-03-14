// @ts-nocheck
'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

interface FeeReportsTabProps {
  studentFeeSummaries: any[];
  theme: 'dark' | 'light';
}

export default function FeeReportsTab({ studentFeeSummaries, theme }: FeeReportsTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  const isDark = theme === 'dark';

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
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
  }, [studentFeeSummaries]);

  // Monthly collection trend (simulated data)
  const monthlyTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Collections',
        data: [45000, 52000, 48000, 61000, 55000, 67000, 72000, 68000, 75000, 82000, 78000, stats.totalCollected / 12],
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
    </motion.div>
  );
}
