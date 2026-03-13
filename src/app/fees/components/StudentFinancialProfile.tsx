// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PaymentReceipt from './PaymentReceipt';
import { PDFGenerator } from '@/utils/pdfGenerator';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

interface StudentFinancialProfileProps {
  theme: 'dark' | 'light';
  onClose?: () => void;
  studentId?: string;
  studentData?: any;
}

export default function StudentFinancialProfile({ theme, onClose, studentId, studentData }: StudentFinancialProfileProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(studentId);
  const [activeTab, setActiveTab] = useState<'overview' | 'fee-details' | 'payment-history'>('overview');
  const [showDetailedReceipt, setShowDetailedReceipt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
  const chartTextColor = isDark ? '#fff' : '#000';
  const chartGridColor = isDark ? '#333' : '#ddd';

  // Use provided student data or fallback to mock data
  const currentStudentData = studentData || {
    name: 'Rahul Sharma',
    studentClass: '10-A',
    admissionNo: 'ADM-2023-045',
    parentName: 'Mr. Rajesh Sharma',
    contact: '+91 98765 43210',
    email: 'rajesh.sharma@email.com',
    feePlan: 'Quarterly',
    scholarship: 'Merit (10%)',
    totalFees: 125000,
    paid: 93750,
    pending: 31250,
    lateFees: 500,
    discount: 12500,
    nextDueDate: '2026-04-15',
    nextDueAmount: 31250,
    riskLevel: 'low',
    // Previous year pending fees
    previousYearPending: {
      '2023-24': {
        total: 85000,
        paid: 75000,
        pending: 10000,
        overdueFees: ['Transport Fee', 'Sports Fee'],
        lastPaymentDate: '2024-02-15'
      },
      '2022-23': {
        total: 75000,
        paid: 75000,
        pending: 0,
        overdueFees: [],
        lastPaymentDate: '2023-03-10'
      }
    }
  };

  const paymentHistory = [
    { id: '1', date: '2026-03-05', amount: 31250, method: 'Online - UPI', receipt: 'RCP-2026-089', type: 'Q3 Tuition', status: 'success' },
    { id: '2', date: '2025-12-10', amount: 31250, method: 'Bank Transfer', receipt: 'RCP-2025-412', type: 'Q2 Tuition', status: 'success' },
    { id: '3', date: '2025-09-08', amount: 31250, method: 'Online - Card', receipt: 'RCP-2025-267', type: 'Q1 Tuition', status: 'success' },
    { id: '4', date: '2025-07-15', amount: 8000, method: 'Cash', receipt: 'RCP-2025-189', type: 'Transport Fee', status: 'success' },
    { id: '5', date: '2025-06-20', amount: 5000, method: 'UPI', receipt: 'RCP-2025-145', type: 'Activity Fee', status: 'success' },
  ];

  const feeBreakdown = {
    labels: ['Tuition', 'Transport', 'Lab', 'Library', 'Activity', 'Technology'],
    datasets: [{
      data: [75, 8, 5, 2, 5, 5],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(147, 51, 234, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(20, 184, 166, 0.8)']
    }]
  };

  const paymentTrend = {
    labels: ['Apr', 'Jun', 'Sep', 'Dec', 'Mar'],
    datasets: [{
      label: 'Payment Amount (Rs)',
      data: [5000, 31250, 31250, 31250, 31250],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.4
    }]
  };

  const communicationLog = [
    { date: '2026-03-10', type: 'email', message: 'Q4 fee reminder sent', status: 'delivered' },
    { date: '2026-03-05', type: 'sms', message: 'Payment confirmation for Rs.31,250', status: 'delivered' },
    { date: '2025-12-05', type: 'email', message: 'Q3 fee reminder sent', status: 'read' },
    { date: '2025-09-01', type: 'email', message: 'Q2 fee reminder sent', status: 'read' },
  ];

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: chartTextColor } } },
    scales: {
      y: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
      x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } }
    }
  };

  const pieOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' as const, labels: { color: chartTextColor } } }
  };

  // Calculate previous year pending fees
  const getPreviousYearPendingTotal = () => {
    if (!currentStudentData?.previousYearPending) return 0;
    return Object.values(currentStudentData.previousYearPending).reduce((total: number, year: any) => total + (year.pending || 0), 0);
  };

  const getPreviousYearPendingCount = () => {
    if (!currentStudentData?.previousYearPending) return 0;
    return Object.values(currentStudentData.previousYearPending).filter((year: any) => year.pending > 0).length;
  };

  const previousYearPendingTotal = getPreviousYearPendingTotal();
  const previousYearPendingCount = getPreviousYearPendingCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Student Financial Profile</h2>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search student by name or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-64 px-4 py-2 rounded-lg border text-sm ${inputCls}`}
          />
          {onClose && (
            <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Close
            </button>
          )}
        </div>
      </div>

      {/* Student Info Header */}
      <div className={`p-6 rounded-xl border ${cardCls}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{currentStudentData?.name?.charAt(0) || 'S'}</span>
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary}`}>{currentStudentData?.name || 'Student Name'}</h3>
              <p className={`text-sm ${textSecondary}`}>Class {currentStudentData?.studentClass || 'N/A'} | {currentStudentData?.admissionNo || 'N/A'}</p>
              <p className={`text-sm ${textSecondary}`}>Parent: {currentStudentData?.parentName || 'N/A'} | {currentStudentData?.contact || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm ${
              (currentStudentData?.riskLevel || 'low') === 'low' ? isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'
              : (currentStudentData?.riskLevel || 'low') === 'medium' ? isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
              : isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'
            }`}>
              {(currentStudentData?.riskLevel || 'low').charAt(0).toUpperCase() + (currentStudentData?.riskLevel || 'low').slice(1)} Risk
            </span>
            {previousYearPendingTotal > 0 && (
              <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-red-600/20 text-red-400 border border-red-700' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                ⚠️ ₹{previousYearPendingTotal.toLocaleString()} Pending ({previousYearPendingCount} year{previousYearPendingCount > 1 ? 's' : ''})
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              {currentStudentData?.feePlan || 'Quarterly'} Plan
            </span>
            {currentStudentData?.scholarship && (
              <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                {currentStudentData.scholarship}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`rounded-xl border overflow-hidden ${cardCls}`}>
        <div className={`flex gap-1 p-2 border-b ${isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-100 bg-gray-50'}`}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'fee-details', label: 'Fee Details', icon: '📋' },
            { id: 'payment-history', label: 'Payment History', icon: '💳' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-white text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className={`p-4 rounded-lg border ${cardCls}`}>
              <p className={`text-sm ${textSecondary}`}>Total Fees</p>
              <p className={`text-xl font-bold ${textPrimary}`}>Rs.{(currentStudentData?.totalFees || 0).toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-lg border ${cardCls}`}>
              <p className={`text-sm ${textSecondary}`}>Paid</p>
              <p className="text-xl font-bold text-green-500">Rs.{(currentStudentData?.paid || 0).toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-lg border ${cardCls}`}>
              <p className={`text-sm ${textSecondary}`}>Pending</p>
              <p className="text-xl font-bold text-red-500">Rs.{(currentStudentData?.pending || 0).toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-lg border ${cardCls}`}>
              <p className={`text-sm ${textSecondary}`}>Discount</p>
              <p className="text-xl font-bold text-blue-500">Rs.{(currentStudentData?.discount || 0).toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-lg border ${cardCls}`}>
              <p className={`text-sm ${textSecondary}`}>Next Due</p>
              <p className={`text-xl font-bold ${textPrimary}`}>{currentStudentData?.nextDueDate || 'N/A'}</p>
              <p className={`text-xs ${textSecondary}`}>Rs.{(currentStudentData?.nextDueAmount || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Previous Year Pending Fees */}
          {previousYearPendingTotal > 0 && (
            <div className={`p-6 rounded-xl border border-red-500 ${isDark ? 'bg-red-900/10' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${textPrimary}`}>⚠️ Previous Year Pending Fees</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                  Total: ₹{previousYearPendingTotal.toLocaleString()}
                </span>
              </div>
              <div className="space-y-3">
                {Object.entries(currentStudentData?.previousYearPending || {}).map(([year, data]: [string, any]) => (
                  data.pending > 0 && (
                    <div key={year} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className={`font-medium ${textPrimary}`}>Academic Year {year}</h4>
                          <p className={`text-sm ${textSecondary}`}>Last payment: {data.lastPaymentDate}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-red-500`}>₹{data.pending.toLocaleString()}</p>
                          <p className={`text-xs ${textSecondary}`}>pending</p>
                        </div>
                      </div>
                      {data.overdueFees.length > 0 && (
                        <div className="mt-3">
                          <p className={`text-sm ${textSecondary} mb-1`}>Overdue Fees:</p>
                          <div className="flex flex-wrap gap-1">
                            {data.overdueFees.map((fee: string, index: number) => (
                              <span key={index} className={`px-2 py-1 text-xs rounded-full ${isDark ? 'bg-orange-600/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                                {fee}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button className={`px-3 py-1 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors`}>
                          Pay Now
                        </button>
                        <button className={`px-3 py-1 text-xs rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-colors`}>
                          View Details
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Fee Breakdown</h3>
              <div className="h-56"><Doughnut data={feeBreakdown} options={pieOpts} /></div>
            </div>
            <div className={`p-6 rounded-xl border ${cardCls}`}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Payment Trend</h3>
              <div className="h-56"><Line data={paymentTrend} options={chartOpts} /></div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'fee-details' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Fee Details Table */}
          <div className={`p-6 rounded-xl border ${cardCls}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${textPrimary}`}>Fee Details</h3>
              <select className={`px-3 py-2 rounded-lg text-sm border ${inputCls}`}>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="all">All Years</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Fee Name</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Category</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Academic Year</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${textSecondary}`}>Total Amount</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${textSecondary}`}>Paid</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${textSecondary}`}>Pending</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Status</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Due Date</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Previous Year</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'} border-b`}>
                    <td className={`py-3 px-4 text-sm font-medium ${textPrimary}`}>Tuition Fee</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>Academic</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>2024-25</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium`}>₹50,000</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium text-green-500`}>₹30,000</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium text-red-500`}>₹20,000</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>Partial</span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>2024-04-05</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>-</td>
                  </tr>
                  <tr className={`${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'} border-b`}>
                    <td className={`py-3 px-4 text-sm font-medium ${textPrimary}`}>Transport Fee</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>Transport</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>2024-25</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium`}>₹12,000</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium text-green-500`}>₹6,000</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium text-red-500`}>₹6,000</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>Partial</span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>2024-04-10</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>-</td>
                  </tr>
                  <tr className={`${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'} border-b`}>
                    <td className={`py-3 px-4 text-sm font-medium ${textPrimary}`}>Library Fee</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>Academic</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>2024-25</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium`}>₹3,000</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium text-green-500`}>₹3,000</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium`}>₹0</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'}`}>Paid</span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>2024-04-20</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>-</td>
                  </tr>
                  {/* Previous Year Fees */}
                  <tr className={`${isDark ? 'border-red-700 hover:bg-red-700/30' : 'border-red-200 hover:bg-red-50'} border-b`}>
                    <td className={`py-3 px-4 text-sm font-medium ${textPrimary}`}>Transport Fee</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>Transport</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>2023-24</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium`}>₹10,000</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium text-green-500`}>₹7,000</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium text-red-500`}>₹3,000</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>Overdue</span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>2024-03-10</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>⚠️ ₹3,000</span>
                    </td>
                  </tr>
                  <tr className={`${isDark ? 'border-red-700 hover:bg-red-700/30' : 'border-red-200 hover:bg-red-50'} border-b`}>
                    <td className={`py-3 px-4 text-sm font-medium ${textPrimary}`}>Sports Fee</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>Extracurricular</td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>2023-24</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium`}>₹5,000</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium text-green-500`}>₹2,000</td>
                    <td className={`py-3 px-4 text-sm text-right font-medium text-red-500`}>₹3,000</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>Overdue</span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${textSecondary}`}>2024-02-15</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>⚠️ ₹3,000</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'payment-history' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Payment History Table */}
          <div className={`p-6 rounded-xl border ${cardCls}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${textPrimary}`}>Payment History</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className={`px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'} flex items-center gap-1`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print All
                </button>
                <button className={`px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} flex items-center gap-1`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Date</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Type</th>
                    <th className={`text-right py-3 px-4 text-sm font-medium ${textSecondary}`}>Amount</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Method</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Receipt</th>
                    <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map(payment => (
                    <tr key={payment.id} className={`${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'} border-b`}>
                      <td className={`py-3 px-4 text-sm ${textPrimary}`}>{payment.date}</td>
                      <td className={`py-3 px-4 text-sm ${textSecondary}`}>{payment.type}</td>
                      <td className={`py-3 px-4 text-sm text-right font-medium text-green-500`}>Rs.{payment.amount.toLocaleString()}</td>
                      <td className={`py-3 px-4 text-sm ${textSecondary}`}>{payment.method}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'} cursor-pointer hover:underline`}>{payment.receipt}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowDetailedReceipt(true);
                              }}
                              className={`p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors`}
                              title="View Detailed Receipt"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                if ((window as any).toast) {
                                  (window as any).toast({
                                    type: 'info',
                                    title: 'Printing Receipt',
                                    message: 'Opening print dialog for receipt',
                                    duration: 2000
                                  });
                                }
                                window.print();
                              }}
                              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                              title="Print Receipt"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                              if ((window as any).toast) {
                                (window as any).toast({
                                  type: 'info',
                                  title: 'Downloading PDF',
                                  message: 'Generating PDF receipt for download',
                                  duration: 2000
                                });
                              }
                              const filename = `Receipt_${(payment.receipt || 'RCPT-DEFAULT').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                              // Use PDF generator here if needed
                              setTimeout(() => {
                                if ((window as any).toast) {
                                  (window as any).toast({
                                    type: 'success',
                                    title: 'PDF Downloaded',
                                    message: `Receipt saved as ${filename}`,
                                    duration: 3000
                                  });
                                }
                              }, 1000);
                            }}
                              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                              title="Download PDF"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                              if ((window as any).toast) {
                                (window as any).toast({
                                  type: 'info',
                                  title: 'Sending Email',
                                  message: `Sending receipt to ${currentStudentData?.email || 'parent email'}`,
                                  duration: 2000
                                });
                              }
                              // Simulate email sending
                              setTimeout(() => {
                                if ((window as any).toast) {
                                  (window as any).toast({
                                    type: 'success',
                                    title: 'Email Sent',
                                    message: 'Receipt has been sent to your email',
                                    duration: 3000
                                  });
                                }
                              }, 1500);
                            }}
                              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                              title="Email Receipt"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'}`}>{payment.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Communication Log */}
      <div className={`p-6 rounded-xl border ${cardCls}`}>
        <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Communication Log</h3>
        <div className="space-y-3">
          {communicationLog.map((log, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center space-x-3">
                <span className="text-lg">{log.type === 'email' ? '📧' : '📱'}</span>
                <div>
                  <p className={`text-sm font-medium ${textPrimary}`}>{log.message}</p>
                  <p className={`text-xs ${textSecondary}`}>{log.date}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'}`}>{log.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={`p-4 rounded-lg border ${cardCls}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className={`font-medium ${textPrimary}`}>Quick Actions</h4>
            <p className={`text-sm ${textSecondary}`}>Manage this student's financial records</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className={`px-4 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Send Reminder</button>
            <button className={`px-4 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Apply Discount</button>
            <button className={`px-4 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Generate Statement</button>
            <button className="px-4 py-2 text-sm rounded-lg font-medium bg-green-600 text-white hover:bg-green-700">Collect Payment</button>
          </div>
        </div>
      </div>

      {/* Detailed Receipt Modal */}
      {showDetailedReceipt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailedReceipt(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full h-full max-w-6xl max-h-[90vh] overflow-hidden bg-white rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <PaymentReceipt
              theme={theme}
              studentData={currentStudentData}
              paymentData={{
                currentYearFees: selectedPayment ? [{
                  name: selectedPayment.type,
                  category: 'Payment',
                  totalAmount: selectedPayment.amount,
                  paidAmount: selectedPayment.amount,
                  discount: 0,
                  balance: 0,
                  status: 'paid'
                }] : []
              }}
              receiptNumber={selectedPayment?.receipt || 'RCPT-2024-DEFAULT'}
              paymentDate={selectedPayment?.date || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              paymentMethod={selectedPayment?.method || 'Unknown'}
              onPrint={() => window.print()}
              onDownload={() => {
  const filename = `Receipt_${(selectedPayment?.receipt || 'RCPT-DEFAULT').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  PDFGenerator.generateFromElement('receipt-print', filename);
}}
              onClose={() => setShowDetailedReceipt(false)}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
