// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, DollarSign, CheckCircle, X, Percent } from 'lucide-react';

interface DiscountsTabProps {
  loadingDiscountHistory: boolean;
  discountHistoryData: any;
  discountSearch: string;
  setDiscountSearch: (search: string) => void;
  discountTypeFilter: string;
  setDiscountTypeFilter: (filter: string) => void;
  discountStatusFilter: string;
  setDiscountStatusFilter: (filter: string) => void;
  isDark: boolean;
  cardCls: string;
  textPrimary: string;
  textSecondary: string;
  inputCls: string;
}

export default function DiscountsTab({
  loadingDiscountHistory,
  discountHistoryData,
  discountSearch,
  setDiscountSearch,
  discountTypeFilter,
  setDiscountTypeFilter,
  discountStatusFilter,
  setDiscountStatusFilter,
  isDark,
  cardCls,
  textPrimary,
  textSecondary,
  inputCls,
}: DiscountsTabProps) {
  if (loadingDiscountHistory) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardCls} p-10 rounded-xl border text-center`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className={`${textPrimary} mt-4`}>Loading discount history...</p>
      </motion.div>
    );
  }

  const discounts = discountHistoryData?.discounts || [];
  const summary = discountHistoryData?.summary || {};

  if (discounts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardCls} p-10 rounded-xl border text-center`}
      >
        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className={`${textPrimary} font-medium text-lg`}>No Discount History</p>
        <p className={`${textSecondary} mt-2`}>This student hasn't received any discounts yet.</p>
      </motion.div>
    );
  }

  const filteredDiscounts = discounts.filter((discount: any) => {
    const matchesSearch = discountSearch === '' || 
      discount.discountName?.toLowerCase().includes(discountSearch.toLowerCase()) ||
      discount.feeName?.toLowerCase().includes(discountSearch.toLowerCase()) ||
      discount.discountDescription?.toLowerCase().includes(discountSearch.toLowerCase());
    
    const matchesType = discountTypeFilter === 'all' || discount.discountType === discountTypeFilter;
    const matchesStatus = discountStatusFilter === 'all' || 
      (discountStatusFilter === 'applied' && !discount.isReversed) ||
      (discountStatusFilter === 'reversed' && discount.isReversed);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${cardCls} p-4 rounded-xl border`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className={`text-sm ${textSecondary}`}>Total Discounts</p>
              <p className={`text-xl font-bold ${textPrimary}`}>{summary.totalDiscounts || 0}</p>
            </div>
          </div>
        </div>
        
        <div className={`${cardCls} p-4 rounded-xl border`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className={`text-sm ${textSecondary}`}>Total Saved</p>
              <p className={`text-xl font-bold ${textPrimary}`}>₹{(summary.totalDiscountAmount || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className={`${cardCls} p-4 rounded-xl border`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className={`text-sm ${textSecondary}`}>Applied</p>
              <p className={`text-xl font-bold ${textPrimary}`}>{summary.appliedDiscounts || 0}</p>
            </div>
          </div>
        </div>
        
        <div className={`${cardCls} p-4 rounded-xl border`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className={`text-sm ${textSecondary}`}>Reversed</p>
              <p className={`text-xl font-bold ${textPrimary}`}>{summary.reversedDiscounts || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${cardCls} p-4 rounded-xl border`}>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search discounts..."
            value={discountSearch}
            onChange={(e) => setDiscountSearch(e.target.value)}
            className={`flex-1 min-w-[200px] px-4 py-2 rounded-lg border ${inputCls}`}
          />
          
          <select
            value={discountTypeFilter}
            onChange={(e) => setDiscountTypeFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${inputCls}`}
          >
            <option value="all">All Types</option>
            <option value="fixed">Fixed</option>
            <option value="percentage">Percentage</option>
            <option value="full_waiver">Full Waiver</option>
          </select>
          
          <select
            value={discountStatusFilter}
            onChange={(e) => setDiscountStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${inputCls}`}
          >
            <option value="all">All Status</option>
            <option value="applied">Applied</option>
            <option value="reversed">Reversed</option>
          </select>
        </div>
      </div>

      {/* Discount List */}
      <div className={`${cardCls} rounded-xl border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Date</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Discount Name</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Type</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Fee</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Amount</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDiscounts.map((discount: any) => (
                <tr key={discount.id} className="hover:bg-gray-400 dark:hover:bg-gray-900">
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                    {new Date(discount.appliedAt).toLocaleDateString()}
                  </td>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                    <div>
                      <div className="font-medium">{discount.discountName}</div>
                      {discount.discountDescription && (
                        <div className={`text-xs ${textSecondary}`}>{discount.discountDescription}</div>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                    <div className="flex items-center gap-2">
                      <Percent className="w-3 h-3 text-gray-400" />
                      {discount.discountType === 'fixed' ? 'Fixed' : 
                       discount.discountType === 'percentage' ? `${discount.discountValue}%` :
                       discount.discountType === 'full_waiver' ? 'Full Waiver' : discount.discountType}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                    <div>
                      <div className="font-medium">{discount.feeName}</div>
                      <div className={`text-xs ${textSecondary}`}>{discount.feeCategory}</div>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                    <div className="text-right">
                      <div className="font-medium text-green-600">₹{discount.discountAmount.toLocaleString()}</div>
                      {discount.previousDiscount > 0 && (
                        <div className={`text-xs ${textSecondary}`}>Previous: ₹{discount.previousDiscount.toLocaleString()}</div>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      discount.isReversed 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {discount.isReversed ? 'Reversed' : 'Applied'}
                    </span>
                    {discount.isReversed && discount.reversalReason && (
                      <div className={`text-xs ${textSecondary} mt-1`}>{discount.reversalReason}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} text-sm ${textSecondary}`}>
          {filteredDiscounts.length} discount{filteredDiscounts.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
          Total saved: <span className="font-semibold text-green-600">₹{filteredDiscounts.reduce((s: number, d: any) => s + d.discountAmount, 0).toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
