// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeeDashboard({ ctx }: { ctx: any }) {
  const {
    theme, showDashboard, setShowDashboard,
    calculateStatistics, setShowFeeStructureModal,     setShowBulkOperations, setShowImportModal, selectedStudents,
    studentFeeSummaries, visibleStudentFeeSummaries, filteredStudentSummaries, recentActivities, canManageFees,
    feeStatistics,
  } = ctx;

  const stats = calculateStatistics ? calculateStatistics() : { totalFees: 0, collectedFees: 0, pendingFees: 0, overdueFees: 0, collectionRate: 0 };

  const dashboardStudents = visibleStudentFeeSummaries || studentFeeSummaries || [];
  const paymentBreakdown = feeStatistics?.paymentStatusBreakdown || [];
  const totalStudents = feeStatistics?.totalStudents || dashboardStudents.length;
  const fullyPaidCount = paymentBreakdown.find((item: any) => item.status === 'fully_paid')?.count ?? dashboardStudents.filter(s => s.paymentStatus === 'fully_paid').length;
  const partiallyPaidCount = paymentBreakdown.find((item: any) => item.status === 'partially_paid')?.count ?? dashboardStudents.filter(s => s.paymentStatus === 'partially_paid').length;
  const overdueCount = paymentBreakdown.find((item: any) => item.status === 'overdue')?.count ?? dashboardStudents.filter(s => s.totalOverdue > 0).length;
  const pendingCount = Math.max(0, totalStudents - fullyPaidCount);
  
  // Calculate total discount from all student fee summaries
  const totalDiscount = feeStatistics?.totalDiscount ?? (
    dashboardStudents?.reduce((sum: number, student: any) => {
      // Calculate discount from student's fee records
      const studentDiscount = student.feeRecords?.reduce((discountSum: number, record: any) => discountSum + (record.discount || 0), 0) || 0;
      return sum + studentDiscount;
    }, 0) || 0
  );

  // Calculate total waived amounts from all student fee summaries
  const totalWaived = feeStatistics?.totalWaived ?? (
    dashboardStudents?.reduce((sum: number, student: any) => {
      // Calculate waived amounts from student's fee records and fines
      const studentWaived = student.feeRecords?.reduce((waivedSum: number, record: any) => waivedSum + (record.waivedAmount || 0), 0) || 0;
      const studentFinesWaived = student.fines?.reduce((finesWaivedSum: number, fine: any) => finesWaivedSum + (fine.waivedAmount || 0), 0) || 0;
      return sum + studentWaived + studentFinesWaived;
    }, 0) || 0
  );

  const statCards = [
    { label: 'Total Fees', value: `₹${(stats.totalFees / 1000).toFixed(0)}K`, icon: '💰', color: 'blue', trend: `${stats.collectionRate?.toFixed(1) || 0}% collected` },
    { label: 'Collected', value: `₹${(stats.collectedFees / 1000).toFixed(0)}K`, icon: '✅', color: 'green', trend: `${fullyPaidCount} fully paid` },
    { label: 'Pending', value: `₹${(stats.pendingFees / 1000).toFixed(0)}K`, icon: '⏳', color: 'amber', trend: `${pendingCount} students` },
    { label: 'Overdue', value: `₹${(stats.overdueFees / 1000).toFixed(0)}K`, icon: '⚠️', color: 'red', trend: `${overdueCount} students` },
    { label: 'Waived', value: `₹${(totalWaived / 1000).toFixed(0)}K`, icon: '🚫', color: 'purple', trend: 'Total waived amounts' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    amber: 'from-amber-500 to-amber-700',
    red: 'from-red-500 to-red-700',
    purple: 'from-purple-500 to-purple-700',
  };

  const partialCount = partiallyPaidCount;

  const activities = recentActivities || [];

  return (
    <>
      {/* Dashboard Toggle + Action Buttons — matches StudentDashboard exactly */}
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
          {canManageFees && (
            <button
              onClick={() => window.location.href = '/fee-collection'}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-opacity"
            >
              💰 Collect Fee
            </button>
          )}
          <button
            onClick={() => setShowImportModal(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            📥 Import
          </button>
          {selectedStudents?.length > 0 && (
            <button
              onClick={() => setShowBulkOperations(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            >
              ⚙️ Bulk ({selectedStudents.length})
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDashboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
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

            <div className="mb-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 border text-center ${
                  theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                }`}
              >
                <div className="text-lg font-semibold text-green-600 mb-1">🎁 Total Discount Applied</div>
                <div className="text-3xl font-bold text-green-600">₹{totalDiscount.toLocaleString()}</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Across all students
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-6 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  💳 Payment Status
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Fully Paid', value: dashboardStudents?.filter(s => s.paymentStatus === 'fully_paid').length || 0, color: 'bg-green-500' },
                    { label: 'Partially Paid', value: partialCount, color: 'bg-yellow-500' },
                    { label: 'Overdue', value: overdueCount, color: 'bg-red-500' },
                  ].map(g => {
                    const total = totalStudents || dashboardStudents?.length || 1;
                    const pct = total > 0 ? (g.value / total) * 100 : 0;
                    return (
                      <div key={g.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{g.label}</span>
                          <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                            {g.value} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className={`h-2 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div className={`h-2 rounded-full ${g.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-6 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  🔔 Alerts
                </h3>
                <div className="space-y-3">
                  {overdueCount > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <span className="text-red-500 text-lg">⚠️</span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                        {overdueCount} students with overdue fees
                      </span>
                    </div>
                  )}
                  {partialCount > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <span className="text-amber-500 text-lg">💸</span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
                        {partialCount} students partially paid
                      </span>
                    </div>
                  )}
                  {stats.collectionRate < 80 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <span className="text-blue-500 text-lg">📊</span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                        Collection rate below 80%
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl p-6 border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  📋 Recent Activities
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activities.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className={`flex items-center gap-2 p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <span className="text-sm">{activity.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {activity.message}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
                  theme === 'dark' ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>Showing {filteredStudentSummaries?.length || 0} of {totalStudents} records</span>
                    {selectedStudents?.length > 0 && (
                      <span className="text-blue-500 font-medium ml-2">{selectedStudents.length} selected</span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
