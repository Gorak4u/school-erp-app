// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, Award, Ban, AlertCircle, Target, Users, CreditCard, FileText } from 'lucide-react';
import { FeeStats, FinesStats } from '../types';

interface OverviewTabProps {
  stats: FeeStats;
  finesStats: FinesStats | null;
  filteredFees: any[];
  selectedFees: string[];
  selectedFeesTotal: number;
  isDark: boolean;
  cardCls: string;
  textPrimary: string;
  textSecondary: string;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onProceedToPayment: () => void;
}

export default function OverviewTab({
  stats,
  finesStats,
  filteredFees,
  selectedFees,
  selectedFeesTotal,
  isDark,
  cardCls,
  textPrimary,
  textSecondary,
  onSelectAll,
  onClearSelection,
  onProceedToPayment,
}: OverviewTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6`}>
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
              <p className={`text-sm ${textSecondary}`}>Discount</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.totalDiscount.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className={`${cardCls} p-6 rounded-xl border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${textSecondary}`}>Waived</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>₹{filteredFees.reduce((sum, fee) => sum + (fee.waivedAmount || 0), 0).toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <Ban className="w-6 h-6 text-purple-600" />
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

      {/* Fines Tile Card - Only show if fines are present */}
      {finesStats && (
        <div className={`${cardCls} p-3 rounded-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[10px] ${textSecondary}`}>Fines</p>
              <p className={`text-lg font-bold ${textPrimary}`}>₹{finesStats.totalFinesPending.toLocaleString()}</p>
              <p className={`text-[9px] ${textSecondary}`}>
                Total: ₹{finesStats.totalFines.toLocaleString()}
              </p>
            </div>
            <div className={`p-1.5 rounded ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
              <FileText className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded-full overflow-hidden flex">
              {finesStats.totalFinesPaid > 0 && (
                <div className="bg-green-500 h-full" style={{ width: `${(finesStats.totalFinesPaid / finesStats.totalFines) * 100}%` }} />
              )}
              {finesStats.totalFinesWaived > 0 && (
                <div className="bg-purple-500 h-full" style={{ width: `${(finesStats.totalFinesWaived / finesStats.totalFines) * 100}%` }} />
              )}
              {finesStats.totalFinesPending > 0 && (
                <div className="bg-orange-500 h-full" style={{ width: `${(finesStats.totalFinesPending / finesStats.totalFines) * 100}%` }} />
              )}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-[9px] leading-tight">
              {finesStats.totalFinesPending > 0 && (
                <span className="text-orange-600 font-medium">Pending: ₹{finesStats.totalFinesPending.toLocaleString()}</span>
              )}
              {finesStats.totalFinesPaid > 0 && (
                <span className="text-green-600">Paid: ₹{finesStats.totalFinesPaid.toLocaleString()}</span>
              )}
              {finesStats.totalFinesWaived > 0 && (
                <span className="text-purple-600">Waived: ₹{finesStats.totalFinesWaived.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={`${cardCls} p-6 rounded-xl border`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onSelectAll}
            className={`p-4 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
            }`}
          >
            <Target className="w-6 h-6 mb-2 mx-auto text-blue-600" />
            <p className="font-medium">Select All Pending</p>
            <p className={`text-sm ${textSecondary}`}>Select all pending fees</p>
          </button>
          
          <button
            onClick={onClearSelection}
            className={`p-4 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
            }`}
          >
            <Users className="w-6 h-6 mb-2 mx-auto text-purple-600" />
            <p className="font-medium">Clear Selection</p>
            <p className={`text-sm ${textSecondary}`}>Clear all selections</p>
          </button>
          
          <button
            onClick={onProceedToPayment}
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
            <p className={`text-sm ${textSecondary}`}>₹{selectedFeesTotal.toLocaleString()}</p>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
