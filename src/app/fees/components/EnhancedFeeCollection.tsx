// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Calendar, DollarSign, TrendingUp, Users, Clock, CheckCircle, AlertCircle, Zap, Shield, Award, Target } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'payment' | 'history'>('overview');
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('2024-25');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customAmounts, setCustomAmounts] = useState<{[key: string]: number}>({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [installmentPlan, setInstallmentPlan] = useState(false);

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
      description: 'Secure card payment',
      fee: 0
    },
    { 
      id: 'upi', 
      name: 'UPI Payment', 
      icon: <Zap className="w-5 h-5" />, 
      color: colors.cyan,
      description: 'Instant UPI transfer',
      fee: 0
    },
    { 
      id: 'netbanking', 
      name: 'Net Banking', 
      icon: <Shield className="w-5 h-5" />, 
      color: colors.purple,
      description: 'Bank transfer',
      fee: 10
    },
    { 
      id: 'wallet', 
      name: 'Digital Wallet', 
      icon: <Award className="w-5 h-5" />, 
      color: colors.pink,
      description: 'PayTM, PhonePe etc.',
      fee: 5
    },
  ];

  // Enhanced comprehensive fee data with priority and discount info
  const allFeeData: FeeItem[] = [
    // Current Year Fees - High Priority
    { id: '1', name: 'Tuition Fee', category: 'academic', amount: 50000, dueDate: '2024-04-05', status: 'pending', paidAmount: 0, frequency: 'monthly', academicYear: '2024-25', description: 'Monthly tuition fee for all subjects', priority: 'high', lateFee: 500, discountAvailable: true },
    { id: '2', name: 'Transport Fee', category: 'transport', amount: 12000, dueDate: '2024-04-10', status: 'partial', paidAmount: 6000, frequency: 'yearly', academicYear: '2024-25', description: 'Annual bus service fee', priority: 'medium', lateFee: 200, discountAvailable: false },
    { id: '3', name: 'Lab Fee', category: 'academic', amount: 8000, dueDate: '2024-04-15', status: 'pending', paidAmount: 0, frequency: 'yearly', academicYear: '2024-25', description: 'Science lab equipment and maintenance', priority: 'medium', lateFee: 100, discountAvailable: true },
    { id: '4', name: 'Library Fee', category: 'academic', amount: 3000, dueDate: '2024-04-20', status: 'paid', paidAmount: 3000, frequency: 'yearly', academicYear: '2024-25', description: 'Library resources and books', priority: 'low', discountAvailable: false },
    { id: '5', name: 'Sports Fee', category: 'extracurricular', amount: 4000, dueDate: '2024-04-25', status: 'pending', paidAmount: 0, frequency: 'yearly', academicYear: '2024-25', description: 'Sports equipment and coaching', priority: 'low', lateFee: 50, discountAvailable: true },
    { id: '6', name: 'Exam Fee', category: 'academic', amount: 2000, dueDate: '2024-05-01', status: 'pending', paidAmount: 0, frequency: 'one-time', academicYear: '2024-25', description: 'Board examination fees', priority: 'high', lateFee: 300, discountAvailable: false },
    
    // Additional fees for comprehensive view
    { id: '7', name: 'Hostel Fee', category: 'accommodation', amount: 60000, dueDate: '2024-04-01', status: 'overdue', paidAmount: 0, frequency: 'yearly', academicYear: '2024-25', description: 'Hostel accommodation and meals', priority: 'high', lateFee: 1000, discountAvailable: true },
    { id: '8', name: 'Computer Lab Fee', category: 'academic', amount: 5000, dueDate: '2024-04-12', status: 'pending', paidAmount: 0, frequency: 'yearly', academicYear: '2024-25', description: 'Computer lab maintenance and software', priority: 'medium', discountAvailable: true },
    { id: '9', name: 'Medical Insurance', category: 'other', amount: 2500, dueDate: '2024-04-08', status: 'paid', paidAmount: 2500, frequency: 'yearly', academicYear: '2024-25', description: 'Student medical insurance coverage', priority: 'medium', discountAvailable: false },
    { id: '10', name: 'Uniform Fee', category: 'other', amount: 3500, dueDate: '2024-04-18', status: 'pending', paidAmount: 0, frequency: 'one-time', academicYear: '2024-25', description: 'School uniform and accessories', priority: 'low', discountAvailable: true },
    
    // Previous Year Fees for history
    { id: '11', name: 'Tuition Fee', category: 'academic', amount: 45000, dueDate: '2023-03-05', status: 'paid', paidAmount: 45000, frequency: 'monthly', academicYear: '2023-24', description: 'Monthly tuition fee for all subjects', priority: 'high', discountAvailable: false },
    { id: '12', name: 'Annual Function Fee', category: 'extracurricular', amount: 1500, dueDate: '2023-02-15', status: 'paid', paidAmount: 1500, frequency: 'one-time', academicYear: '2023-24', description: 'Annual day celebration fee', priority: 'low', discountAvailable: false },
  ];

  // Computed values for enhanced UI
  const filteredFees = useMemo(() => {
    return allFeeData.filter(fee => {
      const yearMatch = selectedYear === 'all' || fee.academicYear === selectedYear;
      const categoryMatch = selectedCategory === 'all' || fee.category === selectedCategory;
      return yearMatch && categoryMatch;
    });
  }, [selectedYear, selectedCategory]);

  const totalAmount = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + fee.amount, 0);
  }, [filteredFees]);

  const totalPaid = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + fee.paidAmount, 0);
  }, [filteredFees]);

  const totalPending = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);
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
    setSelectedFees(prev => 
      prev.includes(feeId) 
        ? prev.filter(id => id !== feeId)
        : [...prev, feeId]
    );
  };

  const handleSelectAll = () => {
    const pendingFees = filteredFees.filter(fee => fee.status === 'pending' || fee.status === 'overdue');
    const pendingIds = pendingFees.map(fee => fee.id);
    setSelectedFees(pendingIds);
  };

  const handleClearSelection = () => {
    setSelectedFees([]);
    setCustomAmounts({});
  };

  const handleCustomAmountChange = (feeId: string, amount: number) => {
    const fee = filteredFees.find(f => f.id === feeId);
    if (!fee) return;
    
    const maxAmount = fee.amount - fee.paidAmount;
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
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setShowReceipt(true);
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

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className={`flex flex-wrap gap-4 ${cardCls} p-4 rounded-xl border`}>
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
              </select>
            </div>

            {/* Fee Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFees.map((fee) => {
                const isSelected = selectedFees.includes(fee.id);
                const pendingAmount = fee.amount - fee.paidAmount;
                
                return (
                  <motion.div
                    key={fee.id}
                    whileHover={{ scale: 1.02 }}
                    className={`${cardCls} p-6 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : ''
                    }`}
                    onClick={() => fee.status !== 'paid' && handleFeeSelection(fee.id)}
                  >
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
            className="space-y-6"
          >
            <div className={`${cardCls} p-6 rounded-xl border`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Payment History</h3>
              <div className="space-y-4">
                {allFeeData
                  .filter(fee => fee.status === 'paid' || fee.status === 'partial')
                  .map((fee) => (
                    <div key={fee.id} className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-medium ${textPrimary}`}>{fee.name}</h4>
                          <p className={`text-sm ${textSecondary}`}>{fee.academicYear}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${textPrimary}`}>₹{fee.paidAmount.toLocaleString()}</p>
                          <p className={`text-sm ${textSecondary}`}>{fee.dueDate}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
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
                <button
                  onClick={() => setShowReceipt(false)}
                  className={`w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors`}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}
