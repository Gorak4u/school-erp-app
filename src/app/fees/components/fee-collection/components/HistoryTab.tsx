// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HistoryTabProps {
  loadingPaymentHistory: boolean;
  paymentHistoryData: any;
  historySearch: string;
  setHistorySearch: (search: string) => void;
  studentData: any;
  isDark: boolean;
  cardCls: string;
  textPrimary: string;
  textSecondary: string;
  inputCls: string;
  onViewReceipt: (entry: any) => void;
}

export default function HistoryTab({
  loadingPaymentHistory,
  paymentHistoryData,
  historySearch,
  setHistorySearch,
  studentData,
  isDark,
  cardCls,
  textPrimary,
  textSecondary,
  inputCls,
  onViewReceipt,
}: HistoryTabProps) {
  return (
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
            onChange={(e) => setHistorySearch(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${inputCls}`}
          />
        </div>
        <button
          onClick={() => window.print()}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:text-gray-900 dark:hover:text-white ${
            isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          🖨️ Print All
        </button>
      </div>

      {/* Payment history entries */}
      {(() => {
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
          feeCategory: payment.feeCategory || 'General',
          academicYear: payment.academicYear || '',
          amount: payment.amount || 0,
          totalAmount: payment.feeAmount || 0,
          feeAmount: payment.feeAmount || 0,
          feeDiscount: payment.feeDiscount || 0,
          feePendingAmount: payment.feePendingAmount,
          feeStatus: payment.feeStatus,
          cumulativePaid: payment.amount || 0,
          paymentMethod: payment.paymentMethod || 'cash',
          paymentDate: payment.paymentDate || payment.createdAt || '',
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
            const dateA = new Date(a.paymentDate || 0).getTime();
            const dateB = new Date(b.paymentDate || 0).getTime();
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
                    <td className="px-4 py-3 hover:text-gray-900 dark:hover:text-white">
                      <span className={`font-mono text-xs px-2 py-1 rounded ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                        {entry.receiptNumber}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${textPrimary} hover:text-gray-900 dark:hover:text-white`}>
                      {entry.feeName}
                      {entry.academicYear && <span className={`block text-xs ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`}>{entry.academicYear}</span>}
                    </td>
                    <td className={`px-4 py-3 ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`}>{entry.academicYear || '-'}</td>
                    <td className={`px-4 py-3 font-semibold text-green-600 hover:text-green-700`}>₹{Number(entry.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 hover:text-gray-900 dark:hover:text-white">
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
                    <td className={`px-4 py-3 ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`}>
                      <div className="flex items-center gap-1">
                        <span>👤</span>
                        <span>{entry.collectedBy || 'Staff'}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${textSecondary} text-xs hover:text-gray-700 dark:hover:text-gray-300`}>
                      {entry.paymentDate
                        ? new Date(entry.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '-'}
                      {entry.paymentDate && (
                        <span className="block opacity-60">
                          {new Date(entry.paymentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewReceipt(entry)}
                        title="View Receipt"
                        className={`p-1.5 rounded-lg text-sm transition-colors hover:text-gray-900 dark:hover:text-white ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
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
  );
}
