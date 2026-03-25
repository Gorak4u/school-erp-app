// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, AlertCircle, Ban, Calendar, Clock } from 'lucide-react';
import { FinesStats } from '../types';

interface FinesTabProps {
  fines: any[];
  finesStats: FinesStats | null;
  loadingFines: boolean;
  isDark: boolean;
  cardCls: string;
  textPrimary: string;
  textSecondary: string;
  inputCls: string;
}

export default function FinesTab({
  fines,
  finesStats,
  loadingFines,
  isDark,
  cardCls,
  textPrimary,
  textSecondary,
  inputCls,
}: FinesTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Fines Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${cardCls} p-6 rounded-xl border relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm ${textSecondary}`}>Total Fines</p>
              <FileText className="w-5 h-5 text-orange-500" />
            </div>
            <p className={`text-2xl font-bold ${textPrimary}`}>₹{finesStats?.totalFines?.toLocaleString() || 0}</p>
            <p className={`text-xs ${textSecondary} mt-1`}>{fines?.length || 0} fines</p>
          </div>
        </div>

        <div className={`${cardCls} p-6 rounded-xl border relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm ${textSecondary}`}>Paid Amount</p>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className={`text-2xl font-bold ${textPrimary}`}>₹{finesStats?.totalFinesPaid?.toLocaleString() || 0}</p>
            <p className={`text-xs ${textSecondary} mt-1`}>Collected fines</p>
          </div>
        </div>

        <div className={`${cardCls} p-6 rounded-xl border relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm ${textSecondary}`}>Pending Amount</p>
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            </div>
            <p className={`text-2xl font-bold ${textPrimary}`}>₹{finesStats?.totalFinesPending?.toLocaleString() || 0}</p>
            <p className={`text-xs ${textSecondary} mt-1`}>{finesStats?.pendingFinesCount || 0} pending</p>
          </div>
        </div>

        <div className={`${cardCls} p-6 rounded-xl border relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm ${textSecondary}`}>Waived Amount</p>
              <Ban className="w-5 h-5 text-purple-500" />
            </div>
            <p className={`text-2xl font-bold ${textPrimary}`}>₹{finesStats?.totalFinesWaived?.toLocaleString() || 0}</p>
            <p className={`text-xs ${textSecondary} mt-1`}>Waived fines</p>
          </div>
        </div>
      </div>

      {/* Fines History */}
      <div className={`${cardCls} p-6 rounded-xl border`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${textPrimary}`}>Fine History</h3>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${textSecondary}`}>Filter by status:</span>
            <select className={`px-3 py-1 rounded-lg text-sm border ${inputCls}`}>
              <option value="all">All Fines</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="waived">Waived</option>
            </select>
          </div>
        </div>

        {loadingFines ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={`text-sm ${textSecondary}`}>Loading fines...</p>
            </div>
          </div>
        ) : fines && fines.length > 0 ? (
          <div className="space-y-2">
            {fines.map((fine: any) => (
              <motion.div
                key={fine.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-1.5 rounded border transition-all hover:scale-[1.02] ${
                  fine.status === 'paid' 
                    ? isDark ? 'border-green-800 bg-green-900/20' : 'border-green-200 bg-green-50'
                    : fine.status === 'waived'
                    ? isDark ? 'border-purple-800 bg-purple-900/20' : 'border-purple-200 bg-purple-50'
                    : isDark ? 'border-orange-800 bg-orange-900/20' : 'border-orange-200 bg-orange-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-[10px] font-semibold ${
                        fine.status === 'paid' ? 'text-green-600' :
                        fine.status === 'waived' ? 'text-purple-600' : 'text-orange-600'
                      }`}>
                        {fine.fineNumber}
                      </span>
                      <span className={`px-1 py-0 rounded-full text-[9px] font-medium ${
                        fine.status === 'paid' ? 'bg-green-100 text-green-700' :
                        fine.status === 'waived' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {fine.status.charAt(0).toUpperCase() + fine.status.slice(1)}
                      </span>
                    </div>
                    <h4 className={`font-medium ${textPrimary} text-xs truncate leading-tight`}>{fine.description}</h4>
                    <div className="flex items-center gap-2 text-[9px] leading-none">
                      <span className={`${textSecondary}`}>
                        <Calendar className="w-2.5 h-2.5 inline mr-0.5" />
                        {new Date(fine.issuedAt).toLocaleDateString()}
                      </span>
                      <span className={`${textSecondary}`}>
                        <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                        {new Date(fine.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 leading-tight">
                    <p className={`font-bold ${textPrimary} text-xs`}>₹{fine.amount.toLocaleString()}</p>
                    <p className={`text-[9px] ${fine.status === 'paid' ? 'text-green-600' : fine.status === 'waived' ? 'text-purple-600' : 'text-orange-600'}`}>
                      {fine.status === 'paid' ? 'Paid' : 
                       fine.status === 'waived' ? 'Waived' : 
                       `₹${fine.pendingAmount.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className={`${textSecondary}`}>No fines found</p>
            <p className={`text-sm ${textSecondary} mt-1`}>This student has no fines on record</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
