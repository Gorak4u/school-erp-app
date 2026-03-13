// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
}

export default function StudentFinancialProfile({ theme, onClose }: StudentFinancialProfileProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>('STU-001');

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
  const chartTextColor = isDark ? '#fff' : '#000';
  const chartGridColor = isDark ? '#333' : '#ddd';

  // Mock student financial data
  const studentData = {
    name: 'Rahul Sharma',
    class: '10-A',
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
              <span className="text-white text-2xl font-bold">{studentData.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${textPrimary}`}>{studentData.name}</h3>
              <p className={`text-sm ${textSecondary}`}>Class {studentData.class} | {studentData.admissionNo}</p>
              <p className={`text-sm ${textSecondary}`}>Parent: {studentData.parentName} | {studentData.contact}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm ${
              studentData.riskLevel === 'low' ? isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'
              : studentData.riskLevel === 'medium' ? isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
              : isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'
            }`}>
              {studentData.riskLevel.charAt(0).toUpperCase() + studentData.riskLevel.slice(1)} Risk
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              {studentData.feePlan} Plan
            </span>
            {studentData.scholarship && (
              <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                {studentData.scholarship}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Total Fees</p>
          <p className={`text-xl font-bold ${textPrimary}`}>Rs.{studentData.totalFees.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Paid</p>
          <p className="text-xl font-bold text-green-500">Rs.{studentData.paid.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Pending</p>
          <p className="text-xl font-bold text-red-500">Rs.{studentData.pending.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Discount</p>
          <p className="text-xl font-bold text-blue-500">Rs.{studentData.discount.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Next Due</p>
          <p className={`text-xl font-bold ${textPrimary}`}>{studentData.nextDueDate}</p>
          <p className={`text-xs ${textSecondary}`}>Rs.{studentData.nextDueAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts + Payment History */}
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

      {/* Payment History Table */}
      <div className={`p-6 rounded-xl border ${cardCls}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${textPrimary}`}>Payment History</h3>
          <button className={`px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Export</button>
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
                    <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'} cursor-pointer hover:underline`}>{payment.receipt}</span>
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
    </div>
  );
}
