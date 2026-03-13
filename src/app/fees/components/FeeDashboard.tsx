// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function FeeDashboard({ ctx }: { ctx: any }) {
  const {
    theme, dashboardCollapsed, setDashboardCollapsed,
    calculateStatistics, prepareMonthlyCollectionData,
    prepareFeeCategoryData, preparePaymentMethodData,
    setShowFeeStructureModal, setShowCollectionModal,
    setShowBulkOperations, setShowAdvancedFilters,
    showAdvancedFilters, setActiveTab, studentFeeSummaries,
  } = ctx;

  const stats = calculateStatistics();

  return (
    <>
        {/* Enhanced Dashboard Section */}
        <motion.div
          className={`backdrop-blur-sm border rounded-2xl p-6 mb-8 transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gray-900/50 border-gray-800' 
              : 'bg-white/70 border-gray-200'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Dashboard Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'
              }`}>
                📊
              </div>
              <div>
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Fee Management Dashboard
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Real-time fee collection analytics and insights
                </p>
              </div>
            </div>
            <button
              onClick={() => setDashboardCollapsed(!dashboardCollapsed)}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              {dashboardCollapsed ? '📊' : '📉'}
            </button>
          </div>

          {!dashboardCollapsed && (
            <div className="space-y-6">
              {/* Main Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border hover:shadow-lg transition-all duration-300 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                      💰
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'
                    }`}>
                      +12.5%
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Fees</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      ₹{stats.totalFees.toLocaleString()}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                      This month
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-4 rounded-xl border hover:shadow-lg transition-all duration-300 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'
                    }`}>
                      ✅
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'
                    }`}>
                      +8.3%
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Collected</p>
                    <p className={`text-2xl font-bold text-green-500`}>
                      ₹{stats.collectedFees.toLocaleString()}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                      {stats.collectionRate.toFixed(1)}% rate
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`p-4 rounded-xl border hover:shadow-lg transition-all duration-300 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      theme === 'dark' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      ⏳
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'
                    }`}>
                      -5.2%
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
                    <p className={`text-2xl font-bold text-yellow-500`}>
                      ₹{stats.pendingFees.toLocaleString()}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                      {studentFeeSummaries.filter(s => s.totalPending > 0).length} students
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`p-4 rounded-xl border hover:shadow-lg transition-all duration-300 ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'
                    }`}>
                      ⚠️
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'
                    }`}>
                      +2.1%
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Overdue</p>
                    <p className={`text-2xl font-bold text-red-500`}>
                      ₹{stats.overdueFees.toLocaleString()}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                      {studentFeeSummaries.filter(s => s.totalOverdue > 0).length} students
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Secondary Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Class Distribution */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Class Distribution
                  </h3>
                  <div className="space-y-3">
                    {['1-5', '6-8', '9-10', '11-12'].map((classGroup, index) => {
                      const count = studentFeeSummaries.filter(s => {
                        if (classGroup === '1-5') return ['1', '2', '3', '4', '5'].includes(s.studentClass.charAt(0));
                        if (classGroup === '6-8') return ['6', '7', '8'].includes(s.studentClass.charAt(0));
                        if (classGroup === '9-10') return ['9', '10'].includes(s.studentClass.charAt(0));
                        return ['11', '12'].includes(s.studentClass.charAt(0));
                      }).length;
                      const percentage = (count / studentFeeSummaries.length) * 100;
                      return (
                        <div key={classGroup} className="flex items-center justify-between">
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            Class {classGroup}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className={`w-20 h-2 rounded-full ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <div
                                className={`h-2 rounded-full ${
                                  index === 0 ? 'bg-blue-500' :
                                  index === 1 ? 'bg-green-500' :
                                  index === 2 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Payment Methods
                  </h3>
                  <div className="space-y-3">
                    {[
                      { method: 'Online', percentage: 45, color: 'bg-blue-500' },
                      { method: 'Cash', percentage: 30, color: 'bg-green-500' },
                      { method: 'Cheque', percentage: 15, color: 'bg-yellow-500' },
                      { method: 'Bank Transfer', percentage: 10, color: 'bg-purple-500' }
                    ].map((payment) => (
                      <div key={payment.method} className="flex items-center justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {payment.method}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className={`w-20 h-2 rounded-full ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                          }`}>
                            <div
                              className={`h-2 rounded-full ${payment.color}`}
                              style={{ width: `${payment.percentage}%` }}
                            />
                          </div>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {payment.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Recent Activities
                  </h3>
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <span className="text-lg">{activity.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {activity.message}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alerts & Notifications */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`text-sm font-semibold mb-3 text-red-500`}>
                  🚨 Alerts & Notifications
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>
                      Students with overdue fees
                    </span>
                    <span className={`text-sm font-bold text-red-500`}>
                      {studentFeeSummaries.filter(s => s.totalOverdue > 0).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      Pending approvals for discounts
                    </span>
                    <span className={`text-sm font-bold text-yellow-500`}>3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                      Today's collection target
                    </span>
                    <span className={`text-sm font-bold text-blue-500`}>75%</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ⚡ Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setShowCollectionModal(true)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <div className="text-lg mb-1">💰</div>
                    <div className="text-xs">Collect Fee</div>
                  </button>
                  <button
                    onClick={() => setShowBulkCollectionModal(true)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      theme === 'dark'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <div className="text-lg mb-1">📥</div>
                    <div className="text-xs">Bulk Collect</div>
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      theme === 'dark'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                  >
                    <div className="text-lg mb-1">📤</div>
                    <div className="text-xs">Import Data</div>
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      theme === 'dark'
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    <div className="text-lg mb-1">📊</div>
                    <div className="text-xs">Export Report</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

    </>
  );
}
