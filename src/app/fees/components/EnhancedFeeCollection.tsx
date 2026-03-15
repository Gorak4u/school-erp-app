// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Shield, 
  Award, 
  Target 
} from 'lucide-react';
import PaymentReceipt from './PaymentReceipt';
import { PDFGenerator } from '@/utils/pdfGenerator';

interface EnhancedFeeCollectionProps {
  theme: 'dark' | 'light';
  onClose?: () => void;
  studentId?: string;
  studentData?: any;
}

interface FeeItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  paidAmount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  academicYear: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  lateFee?: number;
  discountAvailable?: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  fee?: number;
}

export default function EnhancedFeeCollection({ theme, onClose, studentId, studentData }: EnhancedFeeCollectionProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Get current user's full name
  const getCurrentUserName = () => {
    if (session?.user) {
      const firstName = session.user.firstName || session.user.name?.split(' ')[0] || '';
      const lastName = session.user.lastName || session.user.name?.split(' ')[1] || '';
      return firstName && lastName ? `${firstName} ${lastName}` : session.user.name || 'Unknown User';
    }
    return 'Unknown User';
  };
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'payment' | 'history'>('overview');
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customAmounts, setCustomAmounts] = useState<{[key: string]: number}>({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetailedReceipt, setShowDetailedReceipt] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null);
  const [showHistoryReceipt, setShowHistoryReceipt] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [installmentPlan, setInstallmentPlan] = useState(false);
  
  // Optimized payment history state
  const [paymentHistoryData, setPaymentHistoryData] = useState<any>(null);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);

  // Fetch optimized payment history when history tab is activated
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (activeTab !== 'history' || !studentId) return;
      
      setLoadingPaymentHistory(true);
      try {
        const params = new URLSearchParams({
          page: '1',
          pageSize: '1000', // Get all records for history tab
        });
        
        const response = await fetch(`/api/fees/students/${studentId}/payment-history?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setPaymentHistoryData(data.data);
        }
      } catch (e) {
        console.error('Failed to load payment history', e);
      } finally {
        setLoadingPaymentHistory(false);
      }
    };
    
    fetchPaymentHistory();
  }, [activeTab, studentId]);

  const isDark = theme === 'dark';
  
  // Enhanced color scheme
  const colors = {
    primary: isDark ? '#3b82f6' : '#2563eb',
    success: isDark ? '#10b981' : '#059669',
    warning: isDark ? '#f59e0b' : '#d97706',
    danger: isDark ? '#ef4444' : '#dc2626',
    purple: isDark ? '#8b5cf6' : '#7c3aed',
    cyan: isDark ? '#06b6d4' : '#0891b2',
    pink: isDark ? '#ec4899' : '#db2777',
  };

  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  // Enhanced payment methods
  const paymentMethods: PaymentMethod[] = [
    { 
      id: 'cash', 
      name: 'Cash Payment', 
      icon: <DollarSign className="w-5 h-5" />, 
      color: colors.success,
      description: 'Pay with cash at the counter',
      fee: 0
    },
    { 
      id: 'card', 
      name: 'Credit/Debit Card', 
      icon: <CreditCard className="w-5 h-5" />, 
      color: colors.primary,
      description: 'Secure card payment (2% processing fee)',
      fee: 50
    },
    { 
      id: 'upi', 
      name: 'UPI Payment', 
      icon: <Zap className="w-5 h-5" />, 
      color: colors.cyan,
      description: 'Instant UPI transfer (1% processing fee)',
      fee: 25
    },
    { 
      id: 'netbanking', 
      name: 'Net Banking', 
      icon: <Shield className="w-5 h-5" />, 
      color: colors.purple,
      description: 'Bank transfer (₹10 processing fee)',
      fee: 10
    },
    { 
      id: 'wallet', 
      name: 'Digital Wallet', 
      icon: <Award className="w-5 h-5" />, 
      color: colors.pink,
      description: 'PayTM, PhonePe etc. (₹5 processing fee)',
      fee: 5
    },
  ];

  // Get real fee data from studentData prop (comes from database via fees page)
  const allFeeData: FeeItem[] = useMemo(() => {
    if (!studentData?.feeRecords || studentData.feeRecords.length === 0) {
      return [];
    }
    
    return studentData.feeRecords.map((record: any) => ({
      id: record.id,
      name: record.feeStructure?.name || record.feeStructureName || 'Fee',
      category: record.feeStructure?.category || 'academic',
      amount: record.amount || 0,
      dueDate: record.dueDate || '',
      status: record.status || 'pending',
      paidAmount: record.paidAmount || 0,
      frequency: record.feeStructure?.frequency || 'one-time',
      academicYear: record.academicYear || '2024-25',
      description: record.feeStructure?.description || '',
      priority: record.status === 'overdue' ? 'high' : 'medium',
      lateFee: record.feeStructure?.lateFee || 0,
      discountAvailable: false,
    }));
  }, [studentData]);

  // Computed values for enhanced UI
  const filteredFees = useMemo(() => {
    const filtered = allFeeData.filter(fee => {
      const yearMatch = selectedYear === 'all' || fee.academicYear === selectedYear;
      const categoryMatch = selectedCategory === 'all' || fee.category === selectedCategory;
      return yearMatch && categoryMatch;
    });
        return filtered;
  }, [allFeeData, selectedYear, selectedCategory]);

  const totalAmount = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + fee.amount, 0);
  }, [filteredFees]);

  const totalPaid = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + fee.paidAmount, 0);
  }, [filteredFees]);

  const totalPending = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + (fee.fee.pendingAmount), 0);
  }, [filteredFees]);

  const selectedFeesTotal = useMemo(() => {
    return filteredFees
      .filter(fee => selectedFees.includes(fee.id))
      .reduce((sum, fee) => sum + (customAmounts[fee.id] || fee.amount), 0);
  }, [filteredFees, selectedFees, customAmounts]);

  const overdueFees = useMemo(() => {
    return filteredFees.filter(fee => fee.status === 'overdue');
  }, [filteredFees]);

  const stats = useMemo(() => ({
    totalFees: filteredFees.length,
    pendingFees: filteredFees.filter(f => f.status === 'pending').length,
    paidFees: filteredFees.filter(f => f.status === 'paid').length,
    overdueFees: overdueFees.length,
    totalAmount,
    totalPaid,
    totalPending,
    selectedFeesTotal
  }), [filteredFees, overdueFees, totalAmount, totalPaid, totalPending, selectedFeesTotal]);

  const handleFeeSelection = (feeId: string) => {
    const wasSelected = selectedFees.includes(feeId);
    const newSelection = wasSelected 
      ? selectedFees.filter(id => id !== feeId)
      : [...selectedFees, feeId];
    
    setSelectedFees(newSelection);
    
    // Show toast for fee selection/deselection
    if ((window as any).toast) {
      const fee = filteredFees.find(f => f.id === feeId);
      if (fee) {
        (window as any).toast({
          type: wasSelected ? 'info' : 'success',
          title: wasSelected ? 'Fee Deselected' : 'Fee Selected',
          message: `${fee.name} ${wasSelected ? 'removed from' : 'added to'} payment`,
          duration: 2000
        });
      }
    }
  };

  const handleSelectAll = () => {
    const unpaidFees = filteredFees.filter(fee => fee.status !== 'paid');
    const unpaidIds = unpaidFees.map(fee => fee.id);
    setSelectedFees(unpaidIds);
    
    // Show toast for select all
    if ((window as any).toast) {
      (window as any).toast({
        type: 'success',
        title: 'All Fees Selected',
        message: `${unpaidIds.length} unpaid fees added to payment`,
        duration: 2000
      });
    }
  };

  const handleClearSelection = () => {
    const count = selectedFees.length;
    setSelectedFees([]);
    setCustomAmounts({});
    
    // Show toast for clear selection
    if ((window as any).toast && count > 0) {
      (window as any).toast({
        type: 'info',
        title: 'Selection Cleared',
        message: `${count} fees removed from payment`,
        duration: 2000
      });
    }
  };

  const handleCustomAmountChange = (feeId: string, amount: number) => {
    const fee = filteredFees.find(f => f.id === feeId);
    if (!fee) return;
    
    const maxAmount = fee.fee.pendingAmount;
    const validAmount = Math.min(Math.max(0, amount), maxAmount);
    
    setCustomAmounts(prev => ({
      ...prev,
      [feeId]: validAmount
    }));
    
    // Auto-select the fee if custom amount is set
    if (validAmount > 0 && !selectedFees.includes(feeId)) {
      setSelectedFees(prev => [...prev, feeId]);
    } else if (validAmount === 0) {
      setSelectedFees(prev => prev.filter(id => id !== feeId));
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    if ((window as any).toast) {
      (window as any).toast({
        type: 'info',
        title: 'Processing Payment',
        message: `Processing ₹${stats.selectedFeesTotal.toLocaleString()} payment via ${paymentMethods.find(m => m.id === paymentMethod)?.name}`,
        duration: 3000
      });
    }
    
    try {
      // Process each selected fee via the real payments API
      const { paymentsApi } = await import('@/lib/apiClient');
      for (const feeId of selectedFees) {
        const fee = filteredFees.find(f => f.id === feeId);
        if (!fee || fee.status === 'paid') continue;
        const amount = customAmounts[feeId] || (fee.fee.pendingAmount);
        await paymentsApi.process({
          feeRecordId: feeId,
          amount,
          paymentMethod: paymentMethod,
          collectedBy: getCurrentUserName(),
          remarks: promoCode ? `Promo: ${promoCode}` : undefined,
        });
      }

      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Payment Successful',
          message: `Payment of ₹${stats.selectedFeesTotal.toLocaleString()} processed successfully`,
          action: { label: 'View Receipt', onClick: () => setShowReceipt(true) }
        });
      }
      setShowReceipt(true);
    } catch (err: any) {
      if ((window as any).toast) {
        (window as any).toast({ type: 'error', title: 'Payment Failed', message: err.message || 'Something went wrong' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced UI helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'pending': return colors.warning;
      case 'partial': return colors.primary;
      case 'overdue': return colors.danger;
      default: return colors.primary;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.primary;
    }
  };

  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/fees')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Fees
      </button>
      
      {/* Tab Navigation */}
      <div className={`rounded-xl border overflow-hidden ${cardCls}`}>
        <div className={`flex gap-1 p-2 border-b ${isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-100 bg-gray-50'}`}>
          {[
            { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'fees', label: 'Fee Details', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'payment', label: 'Make Payment', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-white text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`${cardCls} p-6 rounded-xl border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Total Fees</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className={`${cardCls} p-6 rounded-xl border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Paid Amount</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className={`${cardCls} p-6 rounded-xl border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Pending</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.totalPending.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              
              <div className={`${cardCls} p-6 rounded-xl border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Overdue</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>{stats.overdueFees}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${cardCls} p-6 rounded-xl border`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleSelectAll}
                  className={`p-4 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <Target className="w-6 h-6 mb-2 mx-auto text-blue-600" />
                  <p className="font-medium">Select All Pending</p>
                  <p className={`text-sm ${textSecondary}`}>Select all pending fees</p>
                </button>
                
                <button
                  onClick={handleClearSelection}
                  className={`p-4 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <Users className="w-6 h-6 mb-2 mx-auto text-purple-600" />
                  <p className="font-medium">Clear Selection</p>
                  <p className={`text-sm ${textSecondary}`}>Clear all selections</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('payment')}
                  disabled={selectedFees.length === 0}
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedFees.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark 
                        ? 'bg-green-900/20 border-green-700 hover:bg-green-900/30 text-green-400' 
                        : 'bg-green-50 border-green-200 hover:bg-green-100 text-green-600'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mb-2 mx-auto" />
                  <p className="font-medium">Proceed to Payment</p>
                  <p className={`text-sm ${textSecondary}`}>₹{stats.selectedFeesTotal.toLocaleString()}</p>
                </button>
              </div>
            </div>

                      </motion.div>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters and Actions */}
            <div className={`flex flex-wrap gap-4 items-center justify-between ${cardCls} p-4 rounded-xl border`}>
              <div className="flex flex-wrap gap-4">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${inputCls}`}
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2023-24">2023-24</option>
                  <option value="2022-23">2022-23</option>
                </select>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${inputCls}`}
                >
                  <option value="all">All Categories</option>
                  <option value="academic">Academic</option>
                  <option value="transport">Transport</option>
                  <option value="extracurricular">Extracurricular</option>
                  <option value="other">Other</option>
                  <option value="accommodation">Accommodation</option>
                </select>
              </div>

              {/* Selection Actions */}
              <div className="flex gap-2 items-center">
                {selectedFees.length > 0 && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDark 
                      ? 'bg-green-900/30 text-green-400 border border-green-700' 
                      : 'bg-green-100 text-green-700 border border-green-300'
                  }`}>
                    {selectedFees.length} selected
                  </span>
                )}
                <button
                  onClick={handleSelectAll}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Select All Unpaid
                </button>
                <button
                  onClick={handleClearSelection}
                  disabled={selectedFees.length === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedFees.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Fee Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFees.map((fee) => {
                const isSelected = selectedFees.includes(fee.id);
                const pendingAmount = fee.fee.pendingAmount;
                
                return (
                  <motion.div
                    key={fee.id}
                    whileHover={{ scale: 1.02 }}
                    className={`${cardCls} p-6 rounded-xl border-2 cursor-pointer transition-all relative ${
                      isSelected 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                        : fee.status === 'paid'
                          ? 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:shadow-md'
                    }`}
                    onClick={() => fee.status !== 'paid' && handleFeeSelection(fee.id)}
                  >
                    {/* Selection Indicator */}
                    {fee.status === 'paid' ? (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`font-semibold ${textPrimary}`}>{fee.name}</h3>
                        <p className={`text-sm ${textSecondary}`}>{fee.description}</p>
                      </div>
                      {fee.priority && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full`}
                          style={{ backgroundColor: getPriorityColor(fee.priority) + '20', color: getPriorityColor(fee.priority) }}
                        >
                          {fee.priority}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={`text-sm ${textSecondary}`}>Amount:</span>
                        <span className={`font-medium ${textPrimary}`}>₹{fee.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${textSecondary}`}>Paid:</span>
                        <span className="font-medium text-green-500">₹{fee.paidAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${textSecondary}`}>Pending:</span>
                        <span className="font-medium text-red-500">₹{pendingAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${textSecondary}`}>Status:</span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full`}
                          style={{ backgroundColor: getStatusColor(fee.status) + '20', color: getStatusColor(fee.status) }}
                        >
                          {fee.status}
                        </span>
                      </div>
                      {fee.lateFee && fee.status === 'overdue' && (
                        <div className="flex justify-between">
                          <span className={`text-sm ${textSecondary}`}>Late Fee:</span>
                          <span className="text-red-600 font-medium">+₹{fee.lateFee}</span>
                        </div>
                      )}
                      
                      {/* Custom Amount Input */}
                      {fee.status !== 'paid' && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <label className={`text-xs font-medium ${textSecondary} block mb-2`}>
                            Pay Custom Amount:
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">₹</span>
                            <input
                              type="number"
                              min="0"
                              max={pendingAmount}
                              value={customAmounts[fee.id] || ''}
                              onChange={(e) => handleCustomAmountChange(fee.id, parseInt(e.target.value) || 0)}
                              onClick={(e) => e.stopPropagation()}
                              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${inputCls}`}
                              placeholder={`Max: ₹${pendingAmount.toLocaleString()}`}
                            />
                          </div>
                          <p className={`text-xs mt-1 ${textSecondary}`}>
                            Max: ₹{pendingAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {fee.discountAvailable && (
                      <div className={`mt-4 p-2 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                        <p className={`text-xs ${textSecondary}`}>Discount Available</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Fees Summary */}
            {selectedFees.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${cardCls} p-6 rounded-xl border border-green-500 ${isDark ? 'bg-green-900/10' : 'bg-green-50'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${textPrimary}`}>Selected Fees</h3>
                    <p className={`text-sm ${textSecondary}`}>{selectedFees.length} fees selected</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.selectedFeesTotal.toLocaleString()}</p>
                    <button
                      onClick={() => setActiveTab('payment')}
                      className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors`}
                    >
                      Proceed to Payment
                    </button>
                  </div>
                </div>
                
                {/* Fee breakdown */}
                <div className="space-y-2 pt-4 border-t border-green-200 dark:border-green-800">
                  {selectedFees.map(feeId => {
                    const fee = filteredFees.find(f => f.id === feeId);
                    if (!fee) return null;
                    const customAmount = customAmounts[feeId] || fee.amount;
                    const isCustom = customAmounts[feeId] && customAmounts[feeId] !== fee.amount;
                    
                    return (
                      <div key={feeId} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className={textSecondary}>{fee.name}</span>
                          {isCustom && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isCustom && (
                            <span className={`line-through ${textSecondary}`}>₹{fee.amount.toLocaleString()}</span>
                          )}
                          <span className={`font-medium ${textPrimary}`}>₹{customAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Payment Methods */}
            <div className={`${cardCls} p-6 rounded-xl border`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Select Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border transition-all ${
                      paymentMethod === method.id
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : cardCls
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: method.color + '20' }}
                      >
                        {method.icon}
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${textPrimary}`}>{method.name}</p>
                        <p className={`text-sm ${textSecondary}`}>{method.description}</p>
                        {method.fee && (
                          <p className={`text-xs ${textSecondary}`}>Processing fee: ₹{method.fee}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className={`${cardCls} p-6 rounded-xl border`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`${textSecondary}`}>Selected Fees:</span>
                  <span className={`${textPrimary}`}>{selectedFees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${textSecondary}`}>Subtotal:</span>
                  <span className={`${textPrimary}`}>₹{stats.selectedFeesTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${textSecondary}`}>Processing Fee:</span>
                  <span className={`${textPrimary}`}>₹{paymentMethods.find(m => m.id === paymentMethod)?.fee || 0}</span>
                </div>
                <div className={`pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between">
                    <span className={`font-semibold ${textPrimary}`}>Total Amount:</span>
                    <span className={`font-bold text-xl ${textPrimary}`}>
                      ₹{(stats.selectedFeesTotal + (paymentMethods.find(m => m.id === paymentMethod)?.fee || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className={`${cardCls} p-6 rounded-xl border`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Promo Code</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className={`flex-1 px-4 py-2 rounded-lg border ${inputCls}`}
                />
                <button
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing || selectedFees.length === 0}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${
                isProcessing || selectedFees.length === 0
                  ? 'opacity-50 cursor-not-allowed bg-gray-400'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isProcessing ? 'Processing...' : `Pay ₹${(stats.selectedFeesTotal + (paymentMethods.find(m => m.id === paymentMethod)?.fee || 0)).toLocaleString()}`}
            </button>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Search + Print All */}
            <div className={`flex flex-wrap gap-3 items-center justify-between ${cardCls} p-4 rounded-xl border`}>
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by fee name, receipt no, method..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border text-sm ${inputCls}`}
                />
              </div>
              <button
                onClick={() => window.print()}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                🖨️ Print All
              </button>
            </div>

            {/* Payment history entries */}
            {(() => {
              // Use optimized payment history data if available, otherwise fall back to feeRecords
              if (loadingPaymentHistory) {
                return (
                  <div className={`${cardCls} p-10 rounded-xl border text-center`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className={`${textPrimary} mt-4`}>Loading payment history...</p>
                  </div>
                );
              }

              const entries: any[] = paymentHistoryData?.payments?.map((payment: any) => ({
                id: payment.id,
                feeRecordId: payment.feeRecordId,
                feeName: payment.feeName || 'Fee',
                academicYear: payment.academicYear || '',
                amount: payment.amount || 0,
                totalAmount: payment.feeAmount || 0,
                cumulativePaid: payment.amount || 0, // Will be calculated when receipt is clicked
                paymentMethod: payment.paymentMethod || 'cash',
                paidDate: payment.paymentDate || payment.createdAt || '',
                receiptNumber: payment.receiptNumber || '',
                collectedBy: payment.collectedBy || 'Staff',
                transactionId: payment.transactionId || '',
                remarks: payment.remarks || '',
                status: 'paid',
              })) || [];

              const filteredEntries = entries
                .filter(e => {
                  const q = historySearch.toLowerCase();
                  return !q || e.feeName.toLowerCase().includes(q)
                    || e.receiptNumber.toLowerCase().includes(q)
                    || (e.paymentMethod || '').toLowerCase().includes(q)
                    || (e.collectedBy || '').toLowerCase().includes(q);
                })
                .sort((a, b) => {
                  // Sort by date descending (newest first)
                  const dateA = new Date(a.paidDate || 0).getTime();
                  const dateB = new Date(b.paidDate || 0).getTime();
                  return dateB - dateA;
                });

              if (filteredEntries.length === 0) {
                return (
                  <div className={`${cardCls} p-10 rounded-xl border text-center`}>
                    <p className={`text-4xl mb-3`}>📭</p>
                    <p className={`${textPrimary} font-medium`}>No payment history found</p>
                    <p className={`text-sm ${textSecondary} mt-1`}>{historySearch ? 'Try a different search term' : 'No paid fees yet'}</p>
                  </div>
                );
              }

              return (
                <div className={`${cardCls} rounded-xl border overflow-hidden`}>
                  <table className="w-full text-sm">
                    <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <tr>
                        {['Receipt No.', 'Fee Name', 'AY', 'Amount', 'Method', 'Received By', 'Date', 'Action'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide ${textSecondary}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredEntries.map((entry, i) => (
                        <tr key={entry.id} className={`${
                          i % 2 === 0 ? (isDark ? 'bg-gray-900' : 'bg-white') : (isDark ? 'bg-gray-800/50' : 'bg-gray-50/50')
                        } hover:${isDark ? 'bg-gray-700' : 'bg-blue-50/30'} transition-colors`}>
                          <td className="px-4 py-3">
                            <span className={`font-mono text-xs px-2 py-1 rounded ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                              {entry.receiptNumber}
                            </span>
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
                            {entry.paidDate
                              ? new Date(entry.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '-'}
                            {entry.paidDate && (
                              <span className="block opacity-60">
                                {new Date(entry.paidDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                // Calculate cumulative paid amount up to this payment's date
                                const paymentDate = new Date(entry.paidDate);
                                const cumulativePaid = paymentHistoryData?.payments
                                  ?.filter((p: any) => {
                                    const pDate = new Date(p.paymentDate);
                                    return pDate <= paymentDate && p.feeRecordId === entry.feeRecordId;
                                  })
                                  .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || entry.amount;
                                
                                setSelectedHistoryEntry({
                                  ...entry,
                                  cumulativePaid: cumulativePaid
                                });
                                setShowHistoryReceipt(true);
                              }}
                              title="View Receipt"
                              className={`p-1.5 rounded-lg text-sm transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                            >
                              🧾
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} text-sm ${textSecondary}`}>
                    {filteredEntries.length} transaction{filteredEntries.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                    Total paid: <span className="font-semibold text-green-600">₹{filteredEntries.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReceipt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${cardCls} p-6 rounded-xl max-w-md w-full`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>Payment Successful!</h3>
                <p className={`${textSecondary} mb-6`}>Your payment has been processed successfully.</p>
                
                {/* Receipt Actions */}
                <div className="space-y-3 mb-6">
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm ${textSecondary} mb-2`}>Receipt Number</p>
                    <p className={`font-mono font-bold ${textPrimary}`}>RCPT-2024-0313-0847</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Amount Paid</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.selectedFeesTotal.toLocaleString()}</p>
                    <p className={`text-sm ${textSecondary}`}>via {paymentMethods.find(m => m.id === paymentMethod)?.name}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowReceipt(false);
                        setShowDetailedReceipt(true);
                      }}
                      className={`px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Detailed Receipt
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                        setShowReceipt(false);
                      }}
                      className={`px-4 py-3 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary} rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Quick Print
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowReceipt(false)}
                  className={`w-full mt-3 px-6 py-3 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} ${textPrimary} rounded-lg font-medium transition-colors`}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Receipt Modal */}
      <AnimatePresence>
        {showDetailedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full h-full max-w-6xl max-h-[90vh] overflow-hidden bg-white rounded-xl"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Receipt</h3>
                  <button
                    onClick={() => setShowDetailedReceipt(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <PaymentReceipt
                  theme={theme}
                  studentData={{
                    studentName: studentData?.name || studentData?.studentName || 'N/A',
                    studentClass: studentData?.class || studentData?.studentClass || 'N/A',
                    admissionNo: studentData?.admissionNo || studentData?.rollNo || 'N/A',
                    rollNo: studentData?.rollNo || studentData?.admissionNo || 'N/A',
                    fatherName: studentData?.fatherName || studentData?.parentName || 'Parent',
                    parentName: studentData?.parentName || studentData?.fatherName || 'Parent',
                    collectedBy: studentData?.collectedBy || getCurrentUserName()
                  }}
                  paymentData={{
                    currentYearFees: selectedFees.map(feeId => {
                      const fee = filteredFees.find(f => f.id === feeId);
                      if (!fee) return null;
                      return {
                        name: fee.name,
                        category: fee.category,
                        academicYear: fee.academicYear || new Date().getFullYear().toString(),
                        totalAmount: fee.amount,
                        paidAmount: customAmounts[feeId] || fee.amount,
                        discount: 0,
                        balance: 0,
                        status: 'paid'
                      };
                    }).filter(Boolean)
                  }}
                  receiptNumber={`RCPT-2024-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`}
                  paymentDate={new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  paymentMethod={paymentMethods.find(m => m.id === paymentMethod)?.name || 'Unknown'}
                  onPrint={() => window.print()}
                  onDownload={() => {
                    const receiptNum = `RCPT-2024-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                    const filename = `Receipt_${receiptNum.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                    PDFGenerator.generateFromElement('receipt-print', filename);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Receipt Modal */}
      <AnimatePresence>
        {showHistoryReceipt && selectedHistoryEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[900px] max-h-[90vh] overflow-hidden bg-white rounded-xl"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg p-0 w-full max-w-[900px] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Receipt</h3>
                  <button
                    onClick={() => setShowHistoryReceipt(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <PaymentReceipt
                  theme={theme}
                  studentData={{
                    studentName: studentData?.name || studentData?.studentName || 'N/A',
                    studentClass: studentData?.class || studentData?.studentClass || 'N/A',
                    admissionNo: studentData?.admissionNo || studentData?.rollNo || 'N/A',
                    rollNo: studentData?.rollNo || studentData?.admissionNo || 'N/A',
                    fatherName: studentData?.fatherName || studentData?.parentName || 'Parent',
                    parentName: studentData?.parentName || studentData?.fatherName || 'Parent',
                    collectedBy: selectedHistoryEntry.collectedBy || 'Accounts Department'
                  }}
                  paymentData={{
                    currentYearFees: (studentData?.feeRecords || []).map((record: any) => {
                      // Find if this fee record matches the selected history entry
                      const isSelectedFee = record.id === selectedHistoryEntry.feeRecordId;
                      
                      return {
                        name: record.feeStructure?.name || record.feeStructureName || 'Fee',
                        category: record.feeStructure?.category || 'General',
                        academicYear: record.academicYear || new Date().getFullYear().toString(),
                        totalAmount: record.amount || 0,
                        // Use cumulative paid if this is the selected fee, otherwise use current paidAmount
                        paidAmount: isSelectedFee ? (selectedHistoryEntry.cumulativePaid || 0) : (record.paidAmount || 0),
                        discount: record.discount || 0,
                        status: record.status || 'pending'
                      };
                    })
                  }}
                  receiptNumber={selectedHistoryEntry.receiptNumber}
                  paymentDate={selectedHistoryEntry.paidDate}
                  paymentMethod={selectedHistoryEntry.paymentMethod}
                  onPrint={() => {
                    // Create a clean print version
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      const receiptContent = document.querySelector('#receipt-print')?.innerHTML;
                      if (receiptContent) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Receipt ${selectedHistoryEntry.receiptNumber}</title>
                              <style>
                                @page { margin: 10mm; size: A4; }
                                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                                #receipt-print { width: 100%; max-width: 800px; margin: 0 auto; }
                                @media print { 
                                  body { margin: 0; padding: 0; }
                                  #receipt-print { width: 100%; max-width: 100%; margin: 0; }
                                }
                              </style>
                            </head>
                            <body>${receiptContent}</body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                        printWindow.close();
                      }
                    }
                  }}
                  onDownload={() => {
                    const receiptNum = selectedHistoryEntry.receiptNumber;
                    const filename = `Receipt_${receiptNum.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                    // PDFGenerator.generateFromElement('receipt-print', filename);
                    alert('PDF download would be implemented here');
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}
