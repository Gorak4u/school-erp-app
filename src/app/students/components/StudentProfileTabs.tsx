// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface StudentProfileTabsProps {
  activeTab: string;
  selectedStudent: any;
  setFeeManagement: any;
  setAttendanceTracking: any;
  setParentPortal: any;
  setCommunicationCenter: any;
  theme: 'dark' | 'light';
}

export default function StudentProfileTabs({
  activeTab, selectedStudent, setFeeManagement, setAttendanceTracking,
  setParentPortal, setCommunicationCenter, theme
}: StudentProfileTabsProps) {
  const [feeData, setFeeData] = useState({
    totalFees: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    feeRecords: []
  });

  // Load fee data when student changes
  useEffect(() => {
    if (selectedStudent && activeTab === 'fees') {
      loadFeeData();
    }
  }, [selectedStudent, activeTab]);

  const loadFeeData = async () => {
    try {
      // Fetch fee records for this student
      const response = await fetch(`/api/fees/records?studentId=${selectedStudent.id}`);
      const data = await response.json();
      
      if (data.records) {
        const totalFees = data.records.reduce((sum: number, record: any) => sum + record.amount, 0);
        const paidAmount = data.records.reduce((sum: number, record: any) => sum + record.paidAmount, 0);
        const pendingAmount = data.records.reduce((sum: number, record: any) => sum + record.pendingAmount, 0);
        const overdueAmount = data.records
          .filter((record: any) => record.status === 'overdue')
          .reduce((sum: number, record: any) => sum + record.pendingAmount, 0);

        setFeeData({
          totalFees,
          paidAmount,
          pendingAmount,
          overdueAmount,
          feeRecords: data.records
        });
      }
    } catch (error) {
      console.error('Failed to load fee data:', error);
    }
  };
  return (
    <>
                  {/* Fees Tab */}
                  {activeTab === 'fees' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className={`text-xl font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Fee Management</h3>
                        <button
                          onClick={() => setFeeManagement(prev => ({ ...prev, showFeeModal: true, selectedStudent }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            theme === 'dark'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          💰 Manage Fees
                        </button>
                      </div>

                      {/* Fee Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Total Fees</p>
                          <p className={`text-xl font-bold mt-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>₹{feeData.totalFees.toLocaleString()}</p>
                        </div>
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Paid Amount</p>
                          <p className={`text-xl font-bold mt-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>₹{feeData.paidAmount.toLocaleString()}</p>
                        </div>
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Pending Amount</p>
                          <p className={`text-xl font-bold mt-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>₹{feeData.pendingAmount.toLocaleString()}</p>
                        </div>
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Next Due Date</p>
                          <p className={`text-xl font-bold mt-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>15 Mar</p>
                        </div>
                      </div>

                      {/* Fee Records */}
                      <div className={`rounded-lg border overflow-hidden ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className={`${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                            }`}>
                              <tr>
                                <th className={`text-left py-3 px-4 text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>Fee Type</th>
                                <th className={`text-left py-3 px-4 text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>Amount</th>
                                <th className={`text-left py-3 px-4 text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>Due Date</th>
                                <th className={`text-left py-3 px-4 text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>Status</th>
                                <th className={`text-left py-3 px-4 text-sm font-medium ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>Actions</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${
                              theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                            }`}>
                              {feeData.feeRecords.length > 0 ? feeData.feeRecords.map((record: any, index: number) => (
                                <tr key={index}>
                                  <td className={`py-3 px-4 ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>{record.feeStructure?.name || 'Fee'}</td>
                                  <td className={`py-3 px-4 ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>₹{record.amount.toLocaleString()}</td>
                                  <td className={`py-3 px-4 ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>{new Date(record.dueDate).toLocaleDateString()}</td>
                                  <td className={`py-3 px-4`}>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      record.status === 'paid' ? (theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') :
                                      record.status === 'partially_paid' ? (theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700') :
                                      record.status === 'overdue' ? (theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700') :
                                      (theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700')
                                    }`}>
                                      {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className={`py-3 px-4`}>
                                    <button className={`text-blue-500 hover:text-blue-600 text-sm font-medium`}>
                                      {record.status === 'paid' ? 'View Receipt' : 'Pay Now'}
                                    </button>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={5} className={`py-8 text-center ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    No fee records found. Click "Manage Fees" to add fee structures.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Attendance Tab */}
                  {activeTab === 'attendance' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className={`text-xl font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Attendance Tracking</h3>
                        <button
                          onClick={() => setAttendanceTracking(prev => ({ ...prev, showAttendanceModal: true, selectedStudent }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            theme === 'dark'
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }`}
                        >
                          📊 View Detailed Attendance
                        </button>
                      </div>

                      {/* Attendance Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Total Days</p>
                          <p className={`text-xl font-bold mt-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>120</p>
                        </div>
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Present</p>
                          <p className={`text-xl font-bold mt-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>110</p>
                        </div>
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Absent</p>
                          <p className={`text-xl font-bold mt-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>8</p>
                        </div>
                        <div className={`rounded-lg border p-4 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <p className={`text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Late</p>
                          <p className={`text-xl font-bold mt-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>2</p>
                        </div>
                      </div>

                      {/* Recent Attendance */}
                      <div className={`rounded-lg border p-6 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h4 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Recent Attendance</h4>
                        <div className="space-y-3">
                          {['Present', 'Present', 'Late', 'Present', 'Absent', 'Present'].map((status, index) => (
                            <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                              theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  status === 'Present' ? 'bg-green-500' :
                                  status === 'Late' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
                                <span className={`text-sm ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{status}</span>
                              </div>
                              <span className={`text-xs ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Mar {10 - index}, 2024</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parents Tab */}
                  {activeTab === 'parents' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className={`text-xl font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Parent Portal</h3>
                        <button
                          onClick={() => setParentPortal(prev => ({ ...prev, showParentPortalModal: true, selectedStudent }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            theme === 'dark'
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-purple-500 hover:bg-purple-600 text-white'
                          }`}
                        >
                          👨‍👩‍👧 Manage Parent Portal
                        </button>
                      </div>

                      {/* Parent Accounts */}
                      <div className={`rounded-lg border p-6 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h4 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Parent Accounts</h4>
                        <div className="space-y-4">
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`font-medium ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{selectedStudent.fatherName}</p>
                                <p className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>{selectedStudent.fatherPhone}</p>
                                <p className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>Username: {selectedStudent.fatherName.toLowerCase().replace(/\s+/g, '.')}.{selectedStudent.id}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                                }`}>Active</span>
                                <button className={`px-3 py-1 rounded text-xs font-medium ${
                                  theme === 'dark'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}>
                                  Reset Password
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Notifications */}
                      <div className={`rounded-lg border p-6 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h4 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Recent Notifications</h4>
                        <div className="space-y-3">
                          <div className={`p-3 rounded-lg ${
                            theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-medium ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Grade Posted: Mathematics</p>
                                <p className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>Student received A+ grade in Mid Term Exam</p>
                              </div>
                              <span className={`text-xs ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>2 hours ago</span>
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg ${
                            theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-medium ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Fee Payment Reminder</p>
                                <p className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {feeData.overdueAmount > 0 
                                    ? `₹${feeData.overdueAmount.toLocaleString()} in overdue fees`
                                    : feeData.pendingAmount > 0 
                                    ? `₹${feeData.pendingAmount.toLocaleString()} in pending fees`
                                    : 'All fees are up to date'
                                  }
                                </p>
                              </div>
                              <span className={`text-xs ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>1 day ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Communication Tab */}
                  {activeTab === 'communication' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className={`text-xl font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Communication Center</h3>
                        <button
                          onClick={() => setCommunicationCenter(prev => ({ ...prev, showCommunicationModal: true, selectedStudent }))}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            theme === 'dark'
                              ? 'bg-teal-600 hover:bg-teal-700 text-white'
                              : 'bg-teal-500 hover:bg-teal-600 text-white'
                          }`}
                        >
                          💬 Open Communication Center
                        </button>
                      </div>

                      {/* Communication Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`rounded-lg border p-6 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Messages Sent</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>24</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                            }`}>
                              💬
                            </div>
                          </div>
                        </div>
                        
                        <div className={`rounded-lg border p-6 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Parent Responses</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>18</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                            }`}>
                              ✅
                            </div>
                          </div>
                        </div>
                        
                        <div className={`rounded-lg border p-6 ${
                          theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>Pending Replies</p>
                              <p className={`text-2xl font-bold mt-1 ${
                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>6</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                            }`}>
                              ⏰
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Communications */}
                      <div className={`rounded-lg border p-6 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h4 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Recent Communications</h4>
                        <div className="space-y-3">
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-medium ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Fee Payment Reminder</p>
                                <p className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>Sent to father via SMS and Email</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                                }`}>Delivered</span>
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>2 days ago</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-medium ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Grade Update Notification</p>
                                <p className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>Mathematics Mid Term Results</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                }`}>Read</span>
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>5 days ago</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark' ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-medium ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>Attendance Alert</p>
                                <p className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>Low attendance warning sent</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                }`}>Pending</span>
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>1 week ago</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className={`rounded-lg border p-6 ${
                        theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <h4 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>Quick Actions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button
                            onClick={() => sendStudentSMS(selectedStudent)}
                            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                              theme === 'dark'
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                            }`}
                          >
                            📱 Send SMS
                          </button>
                          
                          <button
                            onClick={() => {
                              // Send email to parents
                              const emailSubject = `Update regarding ${selectedStudent.name}`;
                              const emailBody = `Dear Parent,\n\nThis is an update regarding ${selectedStudent.name}'s progress at school. Please contact us for more details.\n\nBest regards\nSchool Management`;
                              window.location.href = `mailto:${selectedStudent.fatherEmail},${selectedStudent.motherEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
                            }}
                            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                              theme === 'dark'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            📧 Send Email
                          </button>
                          
                          <button
                            onClick={() => setCommunicationCenter(prev => ({ ...prev, showCommunicationModal: true, selectedStudent }))}
                            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                              theme === 'dark'
                                ? 'bg-teal-600 hover:bg-teal-700 text-white'
                                : 'bg-teal-500 hover:bg-teal-600 text-white'
                            }`}
                          >
                            📋 View All Messages
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
    </>
  );
}
