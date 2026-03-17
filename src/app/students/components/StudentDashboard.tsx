// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  canManageStudents?: boolean;
}

export default function StudentDashboard({
  dashboardStats, selectedStudents, setBulkOperations, setShowAddModal,
  setShowAdvancedFilters, setShowBulkOperationModal, setShowDashboard,
  showAdvancedFilters, showDashboard, students, theme, filteredStudents,
  canManageStudents = true
}: StudentDashboardProps) {
  const statCards = [
    { label: 'Total Students', value: dashboardStats.totalStudents, icon: '👨‍🎓', color: 'blue', trend: `${dashboardStats.recentAdmissions} new` },
    { label: 'Active Students', value: dashboardStats.activeStudents, icon: '✅', color: 'green', trend: `${Math.round((dashboardStats.activeStudents / Math.max(dashboardStats.totalStudents, 1)) * 100)}%` },
    { label: 'Avg Attendance', value: `${dashboardStats.averageAttendance.toFixed(1)}%`, icon: '📊', color: 'purple', trend: `${dashboardStats.lowAttendanceStudents} low` },
    { label: 'Fees Collected', value: `₹${(dashboardStats.totalFeesCollected / 1000).toFixed(0)}K`, icon: '💰', color: 'amber', trend: `₹${(dashboardStats.pendingFees / 1000).toFixed(0)}K pending` },
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    purple: 'from-purple-500 to-purple-700',
    amber: 'from-amber-500 to-amber-700',
  };

  return (
    <>
      {/* Dashboard Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowDashboard(!showDashboard)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {showDashboard ? '📊 Hide Dashboard' : '📊 Show Dashboard'}
        </button>
        <div className="flex gap-2">
          {canManageStudents && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-opacity"
            >
              ➕ Add Student
            </button>
          )}
          {canManageStudents && (
            <button
              onClick={() => setBulkOperations(prev => ({ ...prev, showImportModal: true }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              📥 Import
            </button>
          )}
          {canManageStudents && selectedStudents.length > 0 && (
            <button
              onClick={() => setShowBulkOperationModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            >
              ⚙️ Bulk ({selectedStudents.length})
            </button>
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
            className="mb-6 overflow-hidden"
          >
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-xl p-5 bg-gradient-to-br ${colorMap[card.color]} text-white shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{card.icon}</span>
                    <span className="text-xs opacity-80 bg-white/20 px-2 py-1 rounded-full">{card.trend}</span>
                  </div>
                  <div className="text-3xl font-black">{card.value}</div>
                  <div className="text-sm opacity-90 mt-1">{card.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Gender Distribution */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-6 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  👥 Gender Distribution
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Male', value: dashboardStats.genderDistribution.male, color: 'bg-blue-500' },
                    { label: 'Female', value: dashboardStats.genderDistribution.female, color: 'bg-pink-500' },
                    { label: 'Other', value: dashboardStats.genderDistribution.other, color: 'bg-purple-500' },
                  ].map(g => {
                    const total = dashboardStats.genderDistribution.male + dashboardStats.genderDistribution.female + dashboardStats.genderDistribution.other;
                    const pct = total > 0 ? (g.value / total) * 100 : 0;
                    return (
                      <div key={g.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{g.label}</span>
                          <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{g.value} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div className={`h-2 rounded-full ${g.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Alerts */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-6 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  🔔 Alerts
                </h3>
                <div className="space-y-3">
                  {dashboardStats.lowAttendanceStudents > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <span className="text-red-500 text-lg">⚠️</span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                        {dashboardStats.lowAttendanceStudents} students with low attendance
                      </span>
                    </div>
                  )}
                  {dashboardStats.pendingFees > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-amber-500 text-lg">💸</span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
                        ₹{dashboardStats.pendingFees.toLocaleString()} in pending fees
                      </span>
                    </div>
                  )}
                  {dashboardStats.inactiveStudents > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
                      <span className="text-gray-500 text-lg">👤</span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {dashboardStats.inactiveStudents} inactive students
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Recent Activities */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-6 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  📋 Recent Activities
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dashboardStats.recentActivities.length === 0 ? (
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No recent activities</p>
                  ) : (
                    dashboardStats.recentActivities.slice(0, 5).map((activity: any) => (
                      <div key={activity.id} className={`flex items-center gap-2 p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <span className="text-sm">
                          {activity.type === 'admission' ? '🎓' : activity.type === 'fee_payment' ? '💰' : activity.type === 'status_change' ? '🔄' : '📄'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{activity.description}</p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{activity.studentName}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* Results Summary */}
            <div className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
              theme === 'dark' ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              <span>Showing {filteredStudents.length} of {students.length} students</span>
              {selectedStudents.length > 0 && (
                <span className="text-blue-500 font-medium">{selectedStudents.length} selected</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
