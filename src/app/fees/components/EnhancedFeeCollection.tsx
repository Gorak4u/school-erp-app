// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

export default function EnhancedFeeCollection({ theme, onClose, studentId, studentData }: EnhancedFeeCollectionProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'all-years' | 'all-types'>('current');
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'summary'>('list');
  const [selectedYear, setSelectedYear] = useState('2024-25');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [showReceipt, setShowReceipt] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState(0);

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  // Mock comprehensive fee data
  const allFeeData: FeeItem[] = [
    // Current Year Fees
    { id: '1', name: 'Tuition Fee', category: 'academic', amount: 50000, dueDate: '2024-04-05', status: 'pending', paidAmount: 0, frequency: 'monthly', academicYear: '2024-25', description: 'Monthly tuition fee for all subjects' },
    { id: '2', name: 'Transport Fee', category: 'transport', amount: 12000, dueDate: '2024-04-10', status: 'partial', paidAmount: 6000, frequency: 'yearly', academicYear: '2024-25', description: 'Annual bus service fee' },
    { id: '3', name: 'Lab Fee', category: 'academic', amount: 8000, dueDate: '2024-04-15', status: 'pending', paidAmount: 0, frequency: 'yearly', academicYear: '2024-25', description: 'Science lab equipment and maintenance' },
    { id: '4', name: 'Library Fee', category: 'academic', amount: 3000, dueDate: '2024-04-20', status: 'paid', paidAmount: 3000, frequency: 'yearly', academicYear: '2024-25', description: 'Library resources and books' },
    { id: '5', name: 'Sports Fee', category: 'extracurricular', amount: 4000, dueDate: '2024-04-25', status: 'pending', paidAmount: 0, frequency: 'yearly', academicYear: '2024-25', description: 'Sports equipment and coaching' },
    { id: '6', name: 'Exam Fee', category: 'academic', amount: 2000, dueDate: '2024-05-01', status: 'pending', paidAmount: 0, frequency: 'one-time', academicYear: '2024-25', description: 'Board examination fees' },
    
    // Previous Year Fees
    { id: '7', name: 'Tuition Fee', category: 'academic', amount: 48000, dueDate: '2023-04-05', status: 'paid', paidAmount: 48000, frequency: 'monthly', academicYear: '2023-24', description: 'Monthly tuition fee for all subjects' },
    { id: '8', name: 'Transport Fee', category: 'transport', amount: 11000, dueDate: '2023-04-10', status: 'paid', paidAmount: 11000, frequency: 'yearly', academicYear: '2023-24', description: 'Annual bus service fee' },
    { id: '9', name: 'Lab Fee', category: 'academic', amount: 7500, dueDate: '2023-04-15', status: 'paid', paidAmount: 7500, frequency: 'yearly', academicYear: '2023-24', description: 'Science lab equipment and maintenance' },
    
    // Next Year Fees (Projected)
    { id: '10', name: 'Tuition Fee', category: 'academic', amount: 52000, dueDate: '2025-04-05', status: 'pending', paidAmount: 0, frequency: 'monthly', academicYear: '2025-26', description: 'Monthly tuition fee for all subjects' },
    { id: '11', name: 'Transport Fee', category: 'transport', amount: 13000, dueDate: '2025-04-10', status: 'pending', paidAmount: 0, frequency: 'yearly', academicYear: '2025-26', description: 'Annual bus service fee' },
  ];

  const academicYears = ['2022-23', '2023-24', '2024-25', '2025-26'];
  const categories = ['all', 'academic', 'transport', 'extracurricular', 'examination', 'development'];
  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'online', label: 'Online Transfer', icon: '🏦' },
    { value: 'upi', label: 'UPI', icon: '📱' },
    { value: 'cheque', label: 'Cheque', icon: '📄' },
    { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏛️' }
  ];

  // Filter fees based on active tab and selections
  const getFilteredFees = () => {
    let filtered = [...allFeeData];
    
    if (activeTab === 'current') {
      filtered = filtered.filter(fee => fee.academicYear === '2024-25');
    } else if (activeTab === 'all-years') {
      filtered = filtered.filter(fee => fee.academicYear === selectedYear);
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(fee => fee.category === selectedCategory);
    }
    
    return filtered;
  };

  const filteredFees = getFilteredFees();

  // Calculate totals
  const totalAmount = filteredFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = filteredFees.reduce((sum, fee) => sum + fee.paidAmount, 0);
  const totalPending = totalAmount - totalPaid;
  const selectedFeesTotal = filteredFees
    .filter(fee => selectedFees.includes(fee.id))
    .reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);

  // Apply discount
  const finalAmount = discountType === 'percentage' 
    ? selectedFeesTotal * (1 - discountAmount / 100)
    : Math.max(0, selectedFeesTotal - discountAmount);

  const handleCollectFee = () => {
    if (selectedFees.length === 0) {
      alert('Please select at least one fee to collect');
      return;
    }
    
    setCollectedAmount(finalAmount);
    setShowReceipt(true);
  };

  const renderFeeCard = (fee: FeeItem) => {
    const isSelected = selectedFees.includes(fee.id);
    const pendingAmount = fee.amount - fee.paidAmount;
    const isOverdue = new Date(fee.dueDate) < new Date() && fee.status !== 'paid';

    return (
      <motion.div
        key={fee.id}
        whileHover={{ scale: 1.02 }}
        className={`p-4 rounded-xl border cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : cardCls
        }`}
        onClick={() => {
          if (fee.status !== 'paid') {
            setSelectedFees(prev => 
              isSelected 
                ? prev.filter(id => id !== fee.id)
                : [...prev, fee.id]
            );
          }
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className={`font-semibold ${textPrimary}`}>{fee.name}</h4>
            <p className={`text-sm ${textSecondary}`}>{fee.description}</p>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            fee.status === 'paid' ? 'bg-green-100 text-green-800' :
            fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
            isOverdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {fee.status === 'paid' ? 'PAID' : 
             fee.status === 'partial' ? 'PARTIAL' :
             isOverdue ? 'OVERDUE' : 'PENDING'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className={textSecondary}>Amount:</span>
            <span className={`ml-2 font-medium ${textPrimary}`}>₹{fee.amount.toLocaleString()}</span>
          </div>
          <div>
            <span className={textSecondary}>Due:</span>
            <span className={`ml-2 font-medium ${textPrimary}`}>{fee.dueDate}</span>
          </div>
          <div>
            <span className={textSecondary}>Paid:</span>
            <span className={`ml-2 font-medium text-green-600`}>₹{fee.paidAmount.toLocaleString()}</span>
          </div>
          <div>
            <span className={textSecondary}>Pending:</span>
            <span className={`ml-2 font-medium text-red-600`}>₹{pendingAmount.toLocaleString()}</span>
          </div>
        </div>
        
        {fee.status !== 'paid' && (
          <div className="mt-3 pt-3 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                className="rounded"
              />
              <span className={`text-sm ${isSelected ? 'text-blue-600' : textSecondary}`}>
                {isSelected ? 'Selected for collection' : 'Select for collection'}
              </span>
            </label>
          </div>
        )}
      </motion.div>
    );
  };

  const renderSummaryView = () => {
    const categoryTotals = categories.slice(1).map(category => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      total: filteredFees.filter(f => f.category === category).reduce((sum, f) => sum + (f.amount - f.paidAmount), 0),
      count: filteredFees.filter(f => f.category === category).length
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-6 rounded-xl ${cardCls}`}>
            <h3 className={`text-sm font-medium ${textSecondary} mb-2`}>Total Amount</h3>
            <p className={`text-2xl font-bold ${textPrimary}`}>₹{totalAmount.toLocaleString()}</p>
          </div>
          <div className={`p-6 rounded-xl ${cardCls}`}>
            <h3 className={`text-sm font-medium ${textSecondary} mb-2`}>Already Paid</h3>
            <p className={`text-2xl font-bold text-green-600`}>₹{totalPaid.toLocaleString()}</p>
          </div>
          <div className={`p-6 rounded-xl ${cardCls}`}>
            <h3 className={`text-sm font-medium ${textSecondary} mb-2`}>Pending Amount</h3>
            <p className={`text-2xl font-bold text-red-600`}>₹{totalPending.toLocaleString()}</p>
          </div>
        </div>

        <div className={`p-6 rounded-xl ${cardCls}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Pending by Category</h3>
          <div className="space-y-3">
            {categoryTotals.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div>
                  <span className={`font-medium ${textPrimary}`}>{cat.name}</span>
                  <span className={`ml-2 text-sm ${textSecondary}`}>({cat.count} fees)</span>
                </div>
                <span className={`font-bold ${textPrimary}`}>₹{cat.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl ${cardCls} p-6 max-w-6xl mx-auto`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Fee Collection</h2>
          <p className={`${textSecondary}`}>
            {studentData?.name || 'Student'} - Class {studentData?.studentClass || 'N/A'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'current'
              ? 'border-blue-500 text-blue-600'
              : `border-transparent ${textSecondary} hover:text-primary`
          }`}
        >
          Current Year
        </button>
        <button
          onClick={() => setActiveTab('all-years')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'all-years'
              ? 'border-blue-500 text-blue-600'
              : `border-transparent ${textSecondary} hover:text-primary`
          }`}
        >
          All Years
        </button>
        <button
          onClick={() => setActiveTab('all-types')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'all-types'
              ? 'border-blue-500 text-blue-600'
              : `border-transparent ${textSecondary} hover:text-primary`
          }`}
        >
          All Fee Types
        </button>
      </div>

      {/* Filters and View Options */}
      <div className="flex flex-wrap gap-4 mb-6">
        {activeTab === 'all-years' && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${inputCls}`}
          >
            {academicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${inputCls}`}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : `${cardCls} ${textPrimary}`
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'card' ? 'bg-blue-600 text-white' : `${cardCls} ${textPrimary}`
            }`}
          >
            🎴 Cards
          </button>
          <button
            onClick={() => setViewMode('summary')}
            className={`px-3 py-2 rounded-lg transition-colors ${
              viewMode === 'summary' ? 'bg-blue-600 text-white' : `${cardCls} ${textPrimary}`
            }`}
          >
            📊 Summary
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-6">
        {viewMode === 'summary' ? (
          renderSummaryView()
        ) : (
          <div className={viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredFees.map(renderFeeCard)}
          </div>
        )}
      </div>

      {/* Collection Summary */}
      {selectedFees.length > 0 && (
        <div className={`p-6 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Collection Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map(method => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`p-3 rounded-lg border transition-colors ${
                        paymentMethod === method.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : cardCls
                      }`}
                    >
                      <span className="text-lg mr-2">{method.icon}</span>
                      <span className={`text-sm ${textPrimary}`}>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Discount</label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className={`flex-1 px-3 py-2 rounded-lg border ${inputCls}`}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    placeholder={discountType === 'percentage' ? '0%' : '₹0'}
                    className={`flex-1 px-3 py-2 rounded-lg border ${inputCls}`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={textSecondary}>Selected Fees:</span>
                <span className={textPrimary}>{selectedFees.length} fees</span>
              </div>
              <div className="flex justify-between">
                <span className={textSecondary}>Total Amount:</span>
                <span className={`font-medium ${textPrimary}`}>₹{selectedFeesTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className={textSecondary}>Discount:</span>
                <span className={`font-medium text-green-600`}>
                  -{discountType === 'percentage' ? `${discountAmount}%` : `₹${discountAmount.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className={`font-semibold ${textPrimary}`}>Final Amount:</span>
                <span className={`text-xl font-bold text-blue-600`}>₹{finalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCollectFee}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              💰 Collect Payment
            </button>
            <button
              onClick={() => setSelectedFees([])}
              className={`px-6 py-3 font-medium rounded-lg transition-colors ${cardCls} ${textPrimary}`}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            onClick={() => setShowReceipt(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-xl p-6 ${cardCls}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🧾</div>
                <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Payment Receipt</h3>
                <p className={`${textSecondary}`}>Receipt No: RCP-{Date.now()}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className={textSecondary}>Student:</span>
                  <span className={textPrimary}>{studentData?.name || 'Student'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={textSecondary}>Class:</span>
                  <span className={textPrimary}>{studentData?.studentClass || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={textSecondary}>Payment Method:</span>
                  <span className={textPrimary}>{paymentMethods.find(m => m.value === paymentMethod)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className={textSecondary}>Amount Paid:</span>
                  <span className={`font-bold text-green-600`}>₹{collectedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={textSecondary}>Date:</span>
                  <span className={textPrimary}>{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Done
                </button>
                <button
                  className={`px-4 py-2 font-medium rounded-lg transition-colors ${cardCls} ${textPrimary}`}
                >
                  🖨️ Print
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
