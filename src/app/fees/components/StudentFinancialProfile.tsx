// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import PaymentReceipt from './PaymentReceipt';
import StudentDiscountForm from './StudentDiscountForm';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { studentsApi } from '@/lib/apiClient';
import { usePermissions } from '@/hooks/usePermissions';
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
  canManageFees?: boolean;
}

export default function StudentFinancialProfile({ theme, onClose, studentId, studentData, canManageFees: canManageFeesProp }: StudentFinancialProfileProps) {
  const { isAdmin, hasPermission } = usePermissions();
  const canManageFees = canManageFeesProp ?? (isAdmin || hasPermission('manage_fees'));
  const canApplyDiscounts = isAdmin || hasPermission('manage_fees');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(studentId);
  const [activeTab, setActiveTab] = useState<'overview' | 'fee-details' | 'payment-history'>('overview');
  const [showDetailedReceipt, setShowDetailedReceipt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
  const chartTextColor = isDark ? '#fff' : '#000';
  const chartGridColor = isDark ? '#333' : '#ddd';

  // Fetch student data and fee records (NOT payment history - lazy loaded)
  const [studentFinancialData, setStudentFinancialData] = useState<any>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Payment history state (lazy loaded)
  const [paymentHistoryData, setPaymentHistoryData] = useState<any>(null);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [paymentHistoryPage, setPaymentHistoryPage] = useState(1);
  const [paymentHistorySearch, setPaymentHistorySearch] = useState('');
  const [paymentHistoryFilters, setPaymentHistoryFilters] = useState({
    fromDate: '',
    toDate: '',
    paymentMethod: 'all'
  });

  // Fetch student data and fee records on mount
  useEffect(() => {
    if (!studentId && !studentData?.id) { setLoadingRecords(false); return; }
    (async () => {
      try {
        const sid = studentId || studentData?.id;
        const [studentResponse, feeRecordsResponse] = await Promise.all([
          fetch(`/api/fees/students?studentId=${sid}&pageSize=1`),
          fetch(`/api/fees/records?studentId=${sid}&pageSize=10000`)
        ]);
        
        const studentData = await studentResponse.json();
        const feeRecordsData = await feeRecordsResponse.json();
        
        if (studentData.success && studentData.data?.students?.length > 0) {
          const student = studentData.data.students[0];
          if (feeRecordsData.success && feeRecordsData.data?.records) {
            student.feeRecords = feeRecordsData.data.records;
          }
          setStudentFinancialData(student);
        }
      } catch (e) { console.error('Failed to load student financial data', e); }
      finally { setLoadingRecords(false); }
    })();
  }, [studentId, studentData?.id]);

  // Lazy load payment history when tab is clicked
  const fetchPaymentHistory = async () => {
    if (!studentId && !studentData?.id) {
      return;
    }
    
    setLoadingPaymentHistory(true);
    try {
      const sid = studentId || studentData?.id;
      const params = new URLSearchParams({
        page: paymentHistoryPage.toString(),
        pageSize: '25',
        ...(paymentHistorySearch && { search: paymentHistorySearch }),
        ...(paymentHistoryFilters.fromDate && { fromDate: paymentHistoryFilters.fromDate }),
        ...(paymentHistoryFilters.toDate && { toDate: paymentHistoryFilters.toDate }),
        ...(paymentHistoryFilters.paymentMethod !== 'all' && { paymentMethod: paymentHistoryFilters.paymentMethod })
      });
      
      const apiUrl = `/api/fees/students/${sid}/payment-history?${params}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      
      if (data.success) {
        setPaymentHistoryData(data.data);
      } else {
        console.error('API returned error:', data);
      }
    } catch (e) {
      console.error('Failed to load payment history', e);
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  // Fetch payment history when tab is activated or filters change
  useEffect(() => {
    if (activeTab === 'payment-history') {
      fetchPaymentHistory();
    }
  }, [activeTab, paymentHistoryPage, paymentHistorySearch, paymentHistoryFilters]);

  // Use data from API or fallback to prop data
  const apiData = studentFinancialData || studentData;
  const feeRecords = apiData?.feeRecords || [];
  
  // Compute aggregates from API data
  const totalFees = apiData?.totalFees || 0;
  const totalPaid = apiData?.totalPaid || 0;
  const totalPending = apiData?.totalPending || 0;
  const totalOverdue = apiData?.totalOverdue || 0;
  
  // Calculate total discount from fee records
  const totalDiscount = feeRecords.reduce((sum: number, record: any) => sum + (record.discount || 0), 0);

  // Build currentStudentData from API or prop data
  const currentStudentData = apiData ? {
    name: apiData.studentName || apiData.name || 'Unknown Student',
    studentClass: apiData.studentClass || apiData.class || 'N/A',
    admissionNo: apiData.admissionNo || apiData.rollNo || 'N/A',
    rollNo: apiData.rollNo || apiData.admissionNo || 'N/A',
    parentName: apiData.parentName || 'N/A',
    contact: apiData.parentPhone || apiData.phone || 'N/A',
    email: apiData.email || 'N/A',
    feePlan: apiData.feePlan || 'Standard',
    scholarship: apiData.scholarship || '',
    totalFees,
    paid: totalPaid,
    pending: totalPending,
    lateFees: totalOverdue,
    discount: totalDiscount,
    nextDueDate: apiData.nextDueDate || '-',
    nextDueAmount: apiData.nextDueAmount || 0,
    riskLevel: totalOverdue > 0 ? 'high' : totalPending > totalFees * 0.5 ? 'medium' : 'low',
    previousYearPending: apiData.previousYearPending || {},
    paymentStatus: apiData.calculatedPaymentStatus || 'no_payment',
    lastPaymentDate: apiData.lastPaymentDate || '',
    section: apiData.section || '',
    gender: apiData.gender || '',
    medium: apiData.medium || '',
    academicYear: apiData.academicYear || '',
  } : {
    name: 'Select a student', studentClass: '-', admissionNo: '-', rollNo: '-', parentName: '-', 
    contact: '-', email: '-', feePlan: '-', scholarship: '', totalFees: 0, paid: 0, pending: 0,
    lateFees: 0, discount: 0, nextDueDate: '-', nextDueAmount: 0, riskLevel: 'low',
    previousYearPending: {}, paymentStatus: 'no_payment', lastPaymentDate: '',
  };

  // Payment history from lazy-loaded data
  const paymentHistory = useMemo(() => {
    return paymentHistoryData?.payments || [];
  }, [paymentHistoryData]);

  const openReceiptForPayment = (entry: any) => {
    const matchedRecord = feeRecords.find((record: any) => record.id === entry.feeRecordId);
    const paymentTimestamp = new Date(entry.paymentDate || entry.createdAt || Date.now()).getTime();
    const cumulativePaid = paymentHistory
      .filter((payment: any) => payment.feeRecordId === entry.feeRecordId)
      .filter((payment: any) => new Date(payment.paymentDate || payment.createdAt || Date.now()).getTime() <= paymentTimestamp)
      .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);
    const totalAmount = Number(entry.feeAmount || matchedRecord?.amount || entry.amount || 0);
    const discount = Number(entry.feeDiscount ?? matchedRecord?.discount ?? 0);
    const balance = entry.feePendingAmount !== undefined && entry.feePendingAmount !== null
      ? Number(entry.feePendingAmount || 0)
      : Math.max(0, totalAmount - cumulativePaid - discount);

    setSelectedPayment({
      receiptNumber: entry.receiptNumber,
      paymentDate: entry.paymentDate,
      paymentMethod: entry.paymentMethod,
      statementRecords: feeRecords,
      lineItems: [{
        id: entry.id,
        feeRecordId: entry.feeRecordId,
        name: entry.feeName || matchedRecord?.feeStructure?.name || 'Fee',
        category: entry.feeCategory || matchedRecord?.feeStructure?.category || 'General',
        academicYear: entry.academicYear || matchedRecord?.academicYear || '—',
        totalAmount,
        amountPaid: Number(entry.amount || 0),
        paidAmount: Number(entry.amount || 0),
        discount,
        balance,
        status: entry.feeStatus || (balance <= 0 ? 'paid' : 'partial'),
        receiptNumber: entry.receiptNumber,
        transactionId: entry.transactionId,
        remarks: entry.remarks,
        paymentDate: entry.paymentDate,
      }],
    });
    setShowDetailedReceipt(true);
  };

  // Fee breakdown chart from records - use correct category from API response
  const catAmounts = useMemo(() => {
    const ca: Record<string, number> = {};
    feeRecords.forEach(r => {
      // Get category from API response fields
      const category = r.feeCategory || r.feeStructure?.category || 'Other';
      ca[category] = (ca[category] || 0) + (r.amount || 0);
    });
    return ca;
  }, [feeRecords]);
  const feeBreakdown = {
    labels: Object.keys(catAmounts).length ? Object.keys(catAmounts) : ['No data'],
    datasets: [{
      data: Object.keys(catAmounts).length ? Object.values(catAmounts) : [1],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(251, 146, 60, 0.8)', 'rgba(147, 51, 234, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(20, 184, 166, 0.8)']
    }]
  };

  // Payment trend chart - using summary data from API
  const paymentTrend = useMemo(() => {
    if (!paymentHistoryData?.summary) {
      return {
        labels: ['No data'],
        datasets: [{
          label: 'Payment Amount (Rs)',
          data: [0],
          borderColor: 'rgb(34, 197, 94)', 
          backgroundColor: 'rgba(34, 197, 94, 0.1)', 
          tension: 0.4,
          fill: true
        }]
      };
    }

    // Group payments by date from current page data
    const groupedByDate = paymentHistory.reduce((acc, payment) => {
      const date = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : 'Unknown';
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += payment.amount || 0;
      return acc;
    }, {} as Record<string, number>);
    
    const labels = Object.keys(groupedByDate).length ? Object.keys(groupedByDate) : ['No data'];
    const data = Object.keys(groupedByDate).length ? Object.values(groupedByDate) : [0];
    
    return {
      labels,
      datasets: [{
        label: 'Payment Amount (Rs)',
        data,
        borderColor: 'rgb(34, 197, 94)', 
        backgroundColor: 'rgba(34, 197, 94, 0.1)', 
        tension: 0.4,
        fill: true
      }]
    };
  }, [paymentHistory, paymentHistoryData]);

  // No hardcoded communication log — start empty
  const communicationLog: { date: string; type: string; message: string; status: string }[] = [];

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

          {/* Quick Actions */}
          <div className={`p-6 rounded-xl border ${cardCls}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              {canApplyDiscounts && (
                <button
                  onClick={() => setShowDiscountModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  🎁 Apply Discount
                </button>
              )}
              {canManageFees && (
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                  💳 Collect Payment
                </button>
              )}
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                📧 Send Reminder
              </button>
              <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                📄 Generate Receipt
              </button>
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
                  {feeRecords.length === 0 && (
                    <tr><td colSpan={9} className={`py-6 text-center text-sm ${textSecondary}`}>No fee records found</td></tr>
                  )}
                  {feeRecords.map(r => {
                    const pending = (r.amount || 0) - (r.paidAmount || 0);
                    const statusLabel = r.status === 'paid' ? 'Paid' : pending > 0 && r.paidAmount > 0 ? 'Partial' : r.status === 'overdue' ? 'Overdue' : 'Pending';
                    const statusCls = statusLabel === 'Paid' ? (isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600')
                      : statusLabel === 'Overdue' ? (isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600')
                      : (isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600');
                    return (
                      <tr key={r.id} className={`${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'} border-b`}>
                        <td className={`py-3 px-4 text-sm font-medium ${textPrimary}`}>{r.feeStructureName || r.feeStructure?.name || 'Fee'}</td>
                        <td className={`py-3 px-4 text-sm ${textSecondary}`}>{r.feeCategory || r.feeStructure?.category || '-'}</td>
                        <td className={`py-3 px-4 text-sm ${textSecondary}`}>{r.academicYear || '-'}</td>
                        <td className={`py-3 px-4 text-sm text-right font-medium`}>₹{(r.amount || 0).toLocaleString()}</td>
                        <td className={`py-3 px-4 text-sm text-right font-medium text-green-500`}>₹{(r.paidAmount || 0).toLocaleString()}</td>
                        <td className={`py-3 px-4 text-sm text-right font-medium ${pending > 0 ? 'text-red-500' : ''}`}>₹{pending.toLocaleString()}</td>
                        <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${statusCls}`}>{statusLabel}</span></td>
                        <td className={`py-3 px-4 text-sm ${textSecondary}`}>{r.dueDate || '-'}</td>
                        <td className={`py-3 px-4 text-sm ${textSecondary}`}>-</td>
                      </tr>
                    );
                  })}
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
          {/* Payment History Summary Stats */}
          {paymentHistoryData?.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border ${cardCls}`}>
                <p className={`text-sm ${textSecondary}`}>Total Payments</p>
                <p className={`text-2xl font-bold ${textPrimary}`}>{paymentHistoryData.summary.totalPayments}</p>
              </div>
              <div className={`p-4 rounded-lg border ${cardCls}`}>
                <p className={`text-sm ${textSecondary}`}>Total Amount</p>
                <p className={`text-2xl font-bold text-green-600`}>₹{paymentHistoryData.summary.totalAmount.toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-lg border ${cardCls}`}>
                <p className={`text-sm ${textSecondary}`}>Pending</p>
                <p className={`text-2xl font-bold text-orange-600`}>
                  ₹{((apiData?.totalFees || 0) - (apiData?.totalPaid || 0) - (apiData?.totalDiscount || 0)).toLocaleString()}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${cardCls}`}>
                <p className={`text-sm ${textSecondary}`}>Payment Days</p>
                <p className={`text-2xl font-bold ${textPrimary}`}>{paymentHistoryData.summary.paymentDays}</p>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className={`p-4 rounded-lg border ${cardCls}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Search</label>
                <input
                  type="text"
                  placeholder="Receipt, fee name, collector..."
                  value={paymentHistorySearch}
                  onChange={(e) => {
                    setPaymentHistorySearch(e.target.value);
                    setPaymentHistoryPage(1);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>From Date</label>
                <input
                  type="date"
                  value={paymentHistoryFilters.fromDate}
                  onChange={(e) => {
                    setPaymentHistoryFilters({...paymentHistoryFilters, fromDate: e.target.value});
                    setPaymentHistoryPage(1);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>To Date</label>
                <input
                  type="date"
                  value={paymentHistoryFilters.toDate}
                  onChange={(e) => {
                    setPaymentHistoryFilters({...paymentHistoryFilters, toDate: e.target.value});
                    setPaymentHistoryPage(1);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Payment Method</label>
                <select
                  value={paymentHistoryFilters.paymentMethod}
                  onChange={(e) => {
                    setPaymentHistoryFilters({...paymentHistoryFilters, paymentMethod: e.target.value});
                    setPaymentHistoryPage(1);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div className={`${cardCls} rounded-xl border overflow-hidden`}>
            {loadingPaymentHistory ? (
              <div className="p-20 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className={`mt-4 ${textSecondary}`}>Loading payment history...</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <tr>
                      {['Receipt No.', 'Fee Name', 'AY', 'Amount', 'Method', 'Received By', 'Date'].map(h => (
                        <th key={h} className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide ${textSecondary}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paymentHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-10 text-center">
                          <p className={`text-4xl mb-3`}>📭</p>
                          <p className={`${textPrimary} font-medium`}>No payment history found</p>
                          <p className={`text-sm ${textSecondary} mt-1`}>
                            {paymentHistorySearch || paymentHistoryFilters.fromDate || paymentHistoryFilters.toDate || paymentHistoryFilters.paymentMethod !== 'all'
                              ? 'Try adjusting your filters'
                              : 'No paid fees yet'}
                          </p>
                        </td>
                      </tr>
                    )}
                    {paymentHistory.map((entry, i) => (
                      <tr key={entry.id} className={`${
                        i % 2 === 0 ? (isDark ? 'bg-gray-900' : 'bg-white') : (isDark ? 'bg-gray-800/50' : 'bg-gray-50/50')
                      } hover:${isDark ? 'bg-gray-700' : 'bg-blue-50/30'} transition-colors`}>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openReceiptForPayment(entry)}
                            className={`font-mono text-xs px-2 py-1 rounded ${isDark ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} transition-colors`}
                          >
                            {entry.receiptNumber}
                          </button>
                        </td>
                        <td className={`px-4 py-3 font-medium ${textPrimary}`}>
                          {entry.feeName}
                          {entry.academicYear && <span className={`block text-xs ${textSecondary}`}>{entry.academicYear}</span>}
                        </td>
                        <td className={`px-4 py-3 ${textSecondary}`}>{entry.academicYear || '-'}</td>
                        <td className={`px-4 py-3 font-semibold text-green-600`}>₹{Number(entry.amount).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                            entry.paymentMethod === 'cash'
                              ? isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
                              : entry.paymentMethod === 'online'
                                ? isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'
                                : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {entry.paymentMethod || 'cash'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 ${textSecondary}`}>
                          <div className="flex items-center gap-1">
                            <span>👤</span>
                            <span>{entry.collectedBy || 'Staff'}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${textSecondary} text-xs`}>
                          {entry.paymentDate
                            ? new Date(entry.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '-'}
                          {entry.paymentDate && (
                            <span className="block opacity-60">
                              {new Date(entry.paymentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {paymentHistoryData?.pagination && paymentHistoryData.pagination.totalPages > 1 && (
                  <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} flex items-center justify-between`}>
                    <div className={`text-sm ${textSecondary}`}>
                      Showing {((paymentHistoryData.pagination.page - 1) * paymentHistoryData.pagination.pageSize) + 1} to{' '}
                      {Math.min(paymentHistoryData.pagination.page * paymentHistoryData.pagination.pageSize, paymentHistoryData.pagination.total)} of{' '}
                      {paymentHistoryData.pagination.total} payments
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaymentHistoryPage(Math.max(1, paymentHistoryPage - 1))}
                        disabled={paymentHistoryPage === 1}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          paymentHistoryPage === 1
                            ? 'opacity-50 cursor-not-allowed'
                            : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                        } ${textPrimary}`}
                      >
                        Previous
                      </button>
                      <span className={`px-3 py-1 ${textPrimary}`}>
                        Page {paymentHistoryData.pagination.page} of {paymentHistoryData.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPaymentHistoryPage(Math.min(paymentHistoryData.pagination.totalPages, paymentHistoryPage + 1))}
                        disabled={!paymentHistoryData.pagination.hasMore}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          !paymentHistoryData.pagination.hasMore
                            ? 'opacity-50 cursor-not-allowed'
                            : isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                        } ${textPrimary}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
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
            <button 
              onClick={() => {
                if ((window as any).toast) {
                  (window as any).toast({
                    type: 'info',
                    title: 'Sending Reminder',
                    message: `Sending fee reminder to ${currentStudentData?.email || currentStudentData?.contact}`,
                    duration: 3000
                  });
                }
              }}
              className={`px-4 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Send Reminder
            </button>
            {canApplyDiscounts && (
              <button 
                onClick={() => {
                  if ((window as any).toast) {
                    (window as any).toast({
                      type: 'info',
                      title: 'Apply Discount',
                      message: 'Opening discount application form',
                      duration: 2000
                    });
                  }
                }}
                className={`px-4 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Apply Discount
              </button>
            )}
            <button 
              onClick={() => {
                window.print();
              }}
              className={`px-4 py-2 text-sm rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Generate Statement
            </button>
            {canManageFees && (
              <button 
                onClick={() => {
                  if (onClose) {
                    onClose();
                  }
                  // Navigate to fee collection page
                  window.location.href = `/fee-collection?studentId=${studentId || studentData?.id}`;
                }}
                className="px-4 py-2 text-sm rounded-lg font-medium bg-green-600 text-white hover:bg-green-700"
              >
                Collect Payment
              </button>
            )}
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
                currentYearFees: selectedPayment?.lineItems || [],
                statementRecords: selectedPayment?.statementRecords || feeRecords,
                includedReceiptNumbers: [selectedPayment?.receiptNumber].filter(Boolean)
              }}
              receiptNumber={selectedPayment?.receiptNumber || 'Receipt'}
              paymentDate={selectedPayment?.paymentDate || new Date().toISOString()}
              paymentMethod={selectedPayment?.paymentMethod || 'Unknown'}
              onDownload={() => {
  const filename = `Receipt_${(selectedPayment?.receiptNumber || 'RCPT-DEFAULT').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  PDFGenerator.generateFromElement('receipt-print', filename);
}}
              onClose={() => setShowDetailedReceipt(false)}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Discount Modal */}
      {canApplyDiscounts && showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${textPrimary}`}>Apply Discount to {currentStudentData?.name || 'Student'}</h2>
              <button
                onClick={() => setShowDiscountModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <StudentDiscountForm 
                theme={theme} 
                studentId={selectedStudent || studentId || studentData?.id}
                studentName={currentStudentData?.name || 'Student'}
                onClose={() => setShowDiscountModal(false)}
                onSuccess={() => {
                  setShowDiscountModal(false);
                  // Refresh student data
                  if (fetchStudentData) fetchStudentData();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
