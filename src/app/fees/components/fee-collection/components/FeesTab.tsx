// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FeeItem, FeeStats } from '../types';

interface FeesTabProps {
  filteredFees: FeeItem[];
  selectedFees: string[];
  customAmounts: {[key: string]: number};
  stats: FeeStats;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  academicYears: Array<{id: string; year: string; name: string}>;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  feeCategories: string[];
  isDark: boolean;
  cardCls: string;
  textPrimary: string;
  textSecondary: string;
  inputCls: string;
  onFeeSelection: (feeId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onCustomAmountChange: (feeId: string, amount: number) => void;
  onProceedToPayment: () => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority?: string) => string;
}

export default function FeesTab({
  filteredFees,
  selectedFees,
  customAmounts,
  stats,
  selectedYear,
  setSelectedYear,
  academicYears,
  selectedCategory,
  setSelectedCategory,
  feeCategories,
  isDark,
  cardCls,
  textPrimary,
  textSecondary,
  inputCls,
  onFeeSelection,
  onSelectAll,
  onClearSelection,
  onCustomAmountChange,
  onProceedToPayment,
  getStatusColor,
  getPriorityColor,
}: FeesTabProps) {
  // Helper to determine if discount is actually a waived amount
  const getDiscountLabel = (fee: any) => {
    // Check if this fee has a waived amount
    if (fee.waivedAmount > 0) {
      return 'Waived Off';
    }
    return 'Discount';
  };

  const getDiscountValue = (fee: any) => {
    return fee.discount || 0;
  };
  return (
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
            <option value="all">All Years</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.year}>
                {year.name || year.year}
              </option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${inputCls}`}
          >
            <option value="all">All Categories</option>
            {feeCategories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
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
            onClick={onSelectAll}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Select All Unpaid
          </button>
          <button
            onClick={onClearSelection}
            disabled={selectedFees.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFees.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
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
          const pendingAmount = fee.amount - fee.paidAmount - (fee.discount || 0) - (fee.waivedAmount || 0);
          
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
              onClick={() => fee.status !== 'paid' && onFeeSelection(fee.id)}
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
                {fee.discount && fee.discount > 0 && (
                  <div className="flex justify-between">
                    <span className={`text-sm ${textSecondary}`}>{getDiscountLabel(fee)}:</span>
                    <span className={`font-medium ${getDiscountLabel(fee) === 'Waived Off' ? 'text-orange-500' : 'text-purple-500'}`}>
                      -₹{fee.discount.toLocaleString()}
                    </span>
                  </div>
                )}
                {fee.waivedAmount && fee.waivedAmount > 0 && (
                  <div className="flex justify-between">
                    <span className={`text-sm ${textSecondary}`}>{getDiscountLabel(fee)}:</span>
                    <span className={`font-medium text-orange-500`}>
                      -₹{fee.waivedAmount.toLocaleString()}
                    </span>
                  </div>
                )}
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
                        onChange={(e) => onCustomAmountChange(fee.id, parseInt(e.target.value) || 0)}
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
                onClick={onProceedToPayment}
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
              const customAmount = customAmounts[feeId] || (fee.amount - fee.paidAmount - (fee.discount || 0) - (fee.waivedAmount || 0));
              const isCustom = customAmounts[feeId] && customAmounts[feeId] !== (fee.amount - fee.paidAmount - (fee.discount || 0) - (fee.waivedAmount || 0));
              
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
  );
}
