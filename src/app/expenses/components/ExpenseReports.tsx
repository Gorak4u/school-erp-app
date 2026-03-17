// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ExpenseReportsProps {
  analytics: any;
  isDark: boolean;
  onExport: () => void;
  academicYear: string;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  categories: any[];
  refreshAnalytics: () => void;
}

export default function ExpenseReports({
  analytics,
  isDark,
  onExport,
  academicYear,
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  categoryFilter,
  setCategoryFilter,
  categories,
  refreshAnalytics
}: ExpenseReportsProps) {
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-600';
  const heading = isDark ? 'text-white' : 'text-gray-900';
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  if (!analytics) {
    return (
      <div className={card}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={subtext}>Loading reports data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header and Filters */}
      <div className={card}>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${heading}`}>Expense Reports</h3>
              <p className={`text-sm ${subtext}`}>Generate and analyze expense reports</p>
            </div>
            <div className="flex gap-2">
              <button onClick={refreshAnalytics} className={btnSecondary}>
                🔄 Refresh
              </button>
              <button onClick={onExport} className={btnPrimary}>
                📊 Export Report
              </button>
            </div>
          </div>

          {/* Report Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={label}>Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={input}
              >
                <option value="">All Categories</option>
                {categories?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Academic Year</label>
              <select
                value={academicYear}
                className={input}
                disabled
              >
                <option value={academicYear}>
                  {academicYear === 'all' ? 'All Years' : `AY ${academicYear}`}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={card}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${subtext}`}>Total Expenses</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className={`text-2xl font-bold ${text}`}>
              ₹{analytics.totalExpenses?.toLocaleString('en-IN') || 0}
            </p>
            <p className={`text-xs ${subtext} mt-1`}>Selected period</p>
          </div>
        </div>

        <div className={card}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${subtext}`}>Average Expense</span>
              <span className="text-2xl">📊</span>
            </div>
            <p className={`text-2xl font-bold ${text}`}>
              ₹{analytics.averageExpense?.toLocaleString('en-IN') || 0}
            </p>
            <p className={`text-xs ${subtext} mt-1`}>Per transaction</p>
          </div>
        </div>

        <div className={card}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${subtext}`}>Highest Category</span>
              <span className="text-2xl">🏆</span>
            </div>
            <p className={`text-2xl font-bold ${text}`}>
              {analytics.highestCategory?.name || '—'}
            </p>
            <p className={`text-xs ${subtext} mt-1`}>
              ₹{analytics.highestCategory?.amount?.toLocaleString('en-IN') || 0}
            </p>
          </div>
        </div>

        <div className={card}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${subtext}`}>Transaction Count</span>
              <span className="text-2xl">📈</span>
            </div>
            <p className={`text-2xl font-bold ${text}`}>
              {analytics.transactionCount || 0}
            </p>
            <p className={`text-xs ${subtext} mt-1`}>Total expenses</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      <div className={card}>
        <div className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${heading}`}>Category Breakdown</h3>
          <div className="space-y-4">
            {analytics.categoryBreakdown?.map((category: any, index: number) => {
              const percentage = category.percentage || 0;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color || '#6366f1' }}
                      ></div>
                      <span className={`text-sm font-medium ${text}`}>{category.name}</span>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${text}`}>
                        ₹{category.amount?.toLocaleString('en-IN') || 0}
                      </p>
                      <p className={`text-xs ${subtext}`}>{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: category.color || '#6366f1'
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className={card}>
        <div className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${heading}`}>Monthly Trend</h3>
          <div className="space-y-3">
            {analytics.monthlyTrend?.slice(0, 6).map((month: any, index: number) => (
              <div key={index} className={`p-3 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm font-medium ${text}`}>{month.month}</p>
                    <p className={`text-xs ${subtext}`}>{month.count} transactions</p>
                  </div>
                  <p className={`text-sm font-semibold ${text}`}>
                    ₹{month.amount?.toLocaleString('en-IN') || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Expenses */}
      <div className={card}>
        <div className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${heading}`}>Top Expenses</h3>
          <div className="space-y-3">
            {analytics.topExpenses?.slice(0, 10).map((expense: any, index: number) => (
              <div key={index} className={`p-3 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${text}`}>{expense.title}</p>
                    <p className={`text-xs ${subtext}`}>{expense.category?.name} · {expense.dateIncurred}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${text}`}>
                      ₹{expense.amount?.toLocaleString('en-IN') || 0}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      expense.status === 'approved' ? 'bg-green-100 text-green-700' :
                      expense.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      expense.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {expense.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
