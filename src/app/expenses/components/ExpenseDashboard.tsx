// @ts-nocheck
'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface ExpenseDashboardProps {
  analytics: any;
  isDark: boolean;
  categories: any[];
  academicYear: string;
}

export default function ExpenseDashboard({ analytics, isDark, categories, academicYear }: ExpenseDashboardProps) {
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-600';
  const heading = isDark ? 'text-white' : 'text-gray-900';

  if (!analytics) {
    return (
      <div className={card}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={subtext}>Loading expense analytics...</p>
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={card}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${subtext}`}>Total Expenses</span>
              <span className="text-2xl">💸</span>
            </div>
            <p className={`text-2xl font-bold ${text}`}>
              ₹{analytics.totalExpenses?.toLocaleString('en-IN') || 0}
            </p>
            <p className={`text-xs ${subtext} mt-1`}>
              {academicYear === 'all' ? 'All Years' : `AY ${academicYear}`}
            </p>
          </div>
        </div>

        <div className={card}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${subtext}`}>This Month</span>
              <span className="text-2xl">📅</span>
            </div>
            <p className={`text-2xl font-bold ${text}`}>
              ₹{analytics.thisMonthExpenses?.toLocaleString('en-IN') || 0}
            </p>
            <p className={`text-xs ${subtext} mt-1`}>
              {analytics.monthOverMonthChange >= 0 ? '+' : ''}{analytics.monthOverMonthChange}% from last month
            </p>
          </div>
        </div>

        <div className={card}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${subtext}`}>Pending</span>
              <span className="text-2xl">⏳</span>
            </div>
            <p className={`text-2xl font-bold ${text}`}>
              ₹{analytics.pendingExpenses?.toLocaleString('en-IN') || 0}
            </p>
            <p className={`text-xs ${subtext} mt-1`}>
              {analytics.pendingCount || 0} expenses awaiting approval
            </p>
          </div>
        </div>

        <div className={card}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${subtext}`}>Categories</span>
              <span className="text-2xl">🗂️</span>
            </div>
            <p className={`text-2xl font-bold ${text}`}>
              {categories?.length || 0}
            </p>
            <p className={`text-xs ${subtext} mt-1`}>
              Active categories
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className={card}>
        <div className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${heading}`}>Category Breakdown</h3>
          <div className="space-y-3">
            {analytics.categoryBreakdown?.slice(0, 5).map((category: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: category.color || '#6366f1' }}></div>
                  <span className={`text-sm font-medium ${text}`}>{category.name}</span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${text}`}>₹{category.amount?.toLocaleString('en-IN') || 0}</p>
                  <p className={`text-xs ${subtext}`}>{category.percentage}% of total</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className={card}>
        <div className="p-6">
          <h3 className={`text-lg font-semibold mb-4 ${heading}`}>Recent Expenses</h3>
          <div className="space-y-3">
            {analytics.recentExpenses?.slice(0, 5).map((expense: any, index: number) => (
              <div key={index} className={`p-3 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${text}`}>{expense.title}</p>
                    <p className={`text-xs ${subtext}`}>{expense.category?.name} · {expense.dateIncurred}</p>
                  </div>
                  <p className={`text-sm font-semibold ${text}`}>
                    ₹{expense.amount?.toLocaleString('en-IN') || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
