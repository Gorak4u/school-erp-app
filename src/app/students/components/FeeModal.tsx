// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface FeeModalProps {
  createInstallmentPlan: any; feeManagement: any; generateFeeReport: any; processPayment: any; selectedStudents: any; sendAutomatedReminders: any; setFeeManagement: any; students: any; theme: any;
}

export default function FeeModal({ createInstallmentPlan, feeManagement, generateFeeReport, processPayment, selectedStudents, sendAutomatedReminders, setFeeManagement, students, theme }: FeeModalProps) {
  return (
    <>
      {/* Fee Management Modal */}
      <AnimatePresence>
        {feeManagement.showFeeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]"
            onClick={() => setFeeManagement(prev => ({ ...prev, showFeeModal: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl border ${
                theme === 'dark' 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      💰 Fee Management
                    </h3>
                    <button
                      onClick={() => setFeeManagement(prev => ({ ...prev, showFeeModal: false }))}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {/* Fee Analytics Overview */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>Total Collected</div>
                      <div className={`text-xl font-bold text-green-500`}>
                        ₹{feeManagement.feeAnalytics.totalCollected.toLocaleString()}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>Total Pending</div>
                      <div className={`text-xl font-bold text-yellow-500`}>
                        ₹{feeManagement.feeAnalytics.totalPending.toLocaleString()}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>Total Overdue</div>
                      <div className={`text-xl font-bold text-red-500`}>
                        ₹{feeManagement.feeAnalytics.totalOverdue.toLocaleString()}
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>Collection Rate</div>
                      <div className={`text-xl font-bold ${
                        feeManagement.feeAnalytics.collectionRate >= 80 ? 'text-green-500' :
                        feeManagement.feeAnalytics.collectionRate >= 60 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {feeManagement.feeAnalytics.collectionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                      {/* Payment Gateways */}
                      <div className="lg:col-span-1 space-y-4">
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Payment Gateways
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(feeManagement.paymentGateways).map(([gateway, config]) => (
                              <div
                                key={gateway}
                                className={`p-3 rounded-lg border flex items-center justify-between ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    config.enabled ? 'bg-green-500' : 'bg-gray-400'
                                  }`}></div>
                                  <span className={`text-sm font-medium capitalize ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {gateway}
                                  </span>
                                </div>
                                <div className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {config.fees.percentage}% + ₹{config.fees.fixed}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Automated Reminders */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Automated Reminders
                          </h4>
                          <div className={`p-3 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>Status</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                feeManagement.automatedReminders.enabled
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {feeManagement.automatedReminders.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className={`text-xs space-y-1 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <div>{feeManagement.automatedReminders.schedules.length} schedules</div>
                              <div>SMS, Email, Push notifications</div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Quick Actions
                          </h4>
                          <div className="space-y-2">
                            <button
                              onClick={() => sendAutomatedReminders()}
                              className={`w-full px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                                theme === 'dark'
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                            >
                              📧 Send Reminders
                            </button>
                            <button
                              onClick={() => {
                                selectedStudents.forEach(studentId => {
                                  generateFeeReport(studentId, 'summary');
                                });
                              }}
                              className={`w-full px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                                theme === 'dark'
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                              }`}
                            >
                              📊 Generate Reports
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Fee Records */}
                      <div className="lg:col-span-2">
                        <div>
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Recent Fee Records
                          </h4>
                          <div className={`rounded-lg border overflow-hidden ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-white border-gray-200'
                          }`}>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className={`${
                                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                                }`}>
                                  <tr>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Student</th>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Type</th>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Amount</th>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Due Date</th>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Status</th>
                                    <th className={`px-4 py-2 text-left text-xs font-medium ${
                                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody className={`divide-y ${
                                  theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                                }`}>
                                  {students.slice(0, 5).map((student) => {
                                    const mockFeeRecord = {
                                      id: `fee_${student.id}`,
                                      studentId: student.id,
                                      feeType: 'tuition' as const,
                                      amount: 25000,
                                      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                      paidAmount: 0,
                                      balance: 25000,
                                      status: student.id % 3 === 0 ? 'paid' as const : 
                                               student.id % 3 === 1 ? 'partial' as const : 'pending' as const
                                    };
                                    
                                    return (
                                      <tr key={student.id} className={`${
                                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                      }`}>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                              {student.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                              <div className={`text-sm font-medium ${
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                              }`}>
                                                {student.name}
                                              </div>
                                              <div className={`text-xs ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                              }`}>
                                                {student.rollNo}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className={`px-4 py-3 text-sm capitalize ${
                                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                          {mockFeeRecord.feeType}
                                        </td>
                                        <td className={`px-4 py-3 text-sm font-medium ${
                                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        }`}>
                                          ₹{mockFeeRecord.amount.toLocaleString()}
                                        </td>
                                        <td className={`px-4 py-3 text-sm ${
                                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                          {mockFeeRecord.dueDate}
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                            mockFeeRecord.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            mockFeeRecord.status === 'partial' ? 'bg-blue-100 text-blue-800' :
                                            mockFeeRecord.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {mockFeeRecord.status.charAt(0).toUpperCase() + mockFeeRecord.status.slice(1)}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => processPayment(mockFeeRecord.id, 'online', 'razorpay', mockFeeRecord.balance)}
                                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                                theme === 'dark'
                                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                                  : 'bg-green-500 hover:bg-green-600 text-white'
                                              }`}
                                            >
                                              💳 Pay
                                            </button>
                                            <button
                                              onClick={() => createInstallmentPlan(mockFeeRecord.id, 3, 'monthly')}
                                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                                theme === 'dark'
                                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                                              }`}
                                            >
                                              📅 EMI
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* Payment Method Statistics */}
                        <div className="mt-6">
                          <h4 className={`text-sm font-medium mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            Payment Method Statistics
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['Online', 'Cash', 'Bank Transfer', 'Card'].map((method, index) => (
                              <div
                                key={method}
                                className={`p-3 rounded-lg border ${
                                  theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {method}
                                </div>
                                <div className={`text-lg font-bold ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {Math.floor(Math.random() * 50 + 10)}
                                </div>
                                <div className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  transactions
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
