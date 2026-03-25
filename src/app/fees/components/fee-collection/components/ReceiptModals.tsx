// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, QrCode } from 'lucide-react';
import PaymentReceipt from '../../PaymentReceipt';
import { PDFGenerator } from '@/utils/pdfGenerator';

interface ReceiptModalsProps {
  showReceipt: boolean;
  setShowReceipt: (show: boolean) => void;
  showDetailedReceipt: boolean;
  setShowDetailedReceipt: (show: boolean) => void;
  showHistoryReceipt: boolean;
  setShowHistoryReceipt: (show: boolean) => void;
  showUpiQr: boolean;
  setShowUpiQr: (show: boolean) => void;
  latestReceipt: any;
  selectedHistoryEntry: any;
  studentData: any;
  paymentMethod: string;
  paymentMethods: any[];
  upiQrCode: string;
  upiPaymentStatus: 'pending' | 'checking' | 'confirmed';
  checkingPayment: boolean;
  sharingQr: boolean;
  stats: any;
  upiId: string;
  isDark: boolean;
  cardCls: string;
  textPrimary: string;
  textSecondary: string;
  getCurrentUserName: () => string;
  buildReceiptStudentData: (collectedByOverride?: string) => any;
  onUpiPaymentConfirmation: () => void;
  onShareQrCode: () => void;
  onViewReceipt: () => void;
  onDownloadReceipt: () => void;
  onCopyUpiLink: () => void;
}

export default function ReceiptModals({
  showReceipt,
  setShowReceipt,
  showDetailedReceipt,
  setShowDetailedReceipt,
  showHistoryReceipt,
  setShowHistoryReceipt,
  showUpiQr,
  setShowUpiQr,
  latestReceipt,
  selectedHistoryEntry,
  studentData,
  paymentMethod,
  paymentMethods,
  upiQrCode,
  upiPaymentStatus,
  checkingPayment,
  sharingQr,
  stats,
  upiId,
  isDark,
  cardCls,
  textPrimary,
  textSecondary,
  getCurrentUserName,
  buildReceiptStudentData,
  onUpiPaymentConfirmation,
  onShareQrCode,
  onViewReceipt,
  onDownloadReceipt,
  onCopyUpiLink,
}: ReceiptModalsProps) {
  return (
    <>
      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            key="receipt-modal"
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
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <p className={`text-sm ${textSecondary} mb-2`}>Receipt Number</p>
                    <p className={`font-mono font-bold ${textPrimary}`}>{latestReceipt?.receiptNumber || 'Receipt Ready'}</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Amount Paid</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{(latestReceipt?.paymentData?.currentYearFees || []).reduce((sum: number, item: any) => sum + Number(item.amountPaid || item.paidAmount || 0), 0).toLocaleString()}</p>
                    <p className={`text-sm ${textSecondary}`}>via {paymentMethods.find(m => m.id === latestReceipt?.paymentMethod)?.name || paymentMethods.find(m => m.id === paymentMethod)?.name}</p>
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
                        setShowReceipt(false);
                        setShowDetailedReceipt(true);
                      }}
                      className={`px-4 py-3 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} ${textPrimary} rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
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
            key="detailed-receipt-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full h-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl"
            >
              <div className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                  theme={isDark ? 'dark' : 'light'}
                  studentData={latestReceipt?.studentData || buildReceiptStudentData()}
                  paymentData={latestReceipt?.paymentData || { currentYearFees: [] }}
                  receiptNumber={latestReceipt?.receiptNumber || 'Receipt'}
                  paymentDate={latestReceipt?.paymentDate || new Date().toISOString()}
                  paymentMethod={latestReceipt?.paymentMethod || paymentMethod}
                  onDownload={() => {
                    const receiptNum = latestReceipt?.receiptNumber || 'Receipt';
                    const filename = `Receipt_${receiptNum.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                    PDFGenerator.generateFromElement('receipt-print', filename);
                  }}
                  onClose={() => setShowDetailedReceipt(false)}
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
            key="history-receipt-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[900px] max-h-[90vh] overflow-hidden rounded-xl"
            >
              <div className="rounded-lg p-0 w-full max-w-[900px] max-h-[90vh] overflow-y-auto">
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
                  theme={isDark ? 'dark' : 'light'}
                  studentData={buildReceiptStudentData(selectedHistoryEntry.collectedBy || 'Accounts Department')}
                  paymentData={{
                    currentYearFees: [(() => {
                      const matchedRecord = (studentData?.feeRecords || []).find((record: any) => record.id === selectedHistoryEntry.feeRecordId);
                      const recordDiscount = Number(selectedHistoryEntry.feeDiscount ?? matchedRecord?.discount ?? 0);
                      const totalAmount = Number(selectedHistoryEntry.feeAmount || matchedRecord?.amount || selectedHistoryEntry.amount || 0);
                      const balance = selectedHistoryEntry.feePendingAmount !== undefined && selectedHistoryEntry.feePendingAmount !== null
                        ? Number(selectedHistoryEntry.feePendingAmount || 0)
                        : Math.max(0, totalAmount - Number(selectedHistoryEntry.cumulativePaid || selectedHistoryEntry.amount || 0) - recordDiscount);

                      return {
                        id: selectedHistoryEntry.id,
                        name: selectedHistoryEntry.feeName || matchedRecord?.feeStructure?.name || 'Fee',
                        category: selectedHistoryEntry.feeCategory || matchedRecord?.feeStructure?.category || 'General',
                        academicYear: selectedHistoryEntry.academicYear || matchedRecord?.academicYear || new Date().getFullYear().toString(),
                        totalAmount,
                        amountPaid: Number(selectedHistoryEntry.amount || 0),
                        paidAmount: Number(selectedHistoryEntry.amount || 0),
                        discount: recordDiscount,
                        balance,
                        status: selectedHistoryEntry.feeStatus || (balance <= 0 ? 'paid' : 'partial'),
                        receiptNumber: selectedHistoryEntry.receiptNumber,
                        transactionId: selectedHistoryEntry.transactionId,
                        remarks: selectedHistoryEntry.remarks,
                        paymentDate: selectedHistoryEntry.paymentDate,
                      };
                    })()],
                    statementRecords: studentData?.feeRecords || [],
                    includedReceiptNumbers: [selectedHistoryEntry.receiptNumber].filter(Boolean)
                  }}
                  receiptNumber={selectedHistoryEntry.receiptNumber}
                  paymentDate={selectedHistoryEntry.paymentDate}
                  paymentMethod={selectedHistoryEntry.paymentMethod}
                  onDownload={() => {
                    const receiptNum = selectedHistoryEntry.receiptNumber;
                    const filename = `Receipt_${receiptNum.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                    PDFGenerator.generateFromElement('receipt-print', filename);
                  }}
                  onClose={() => setShowHistoryReceipt(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPI QR Code Modal */}
      <AnimatePresence>
        {showUpiQr && (
          <motion.div
            key="upi-qr-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000]"
            onClick={() => setShowUpiQr(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-md mx-4 ${cardCls} rounded-2xl border shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                      <QrCode className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${textPrimary}`}>UPI Payment</h3>
                      <p className={`text-sm ${textSecondary}`}>Scan QR to pay</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUpiQr(false)}
                    className={`p-2 rounded-lg hover:text-gray-900 dark:hover:text-white ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-xl inline-block relative">
                    {upiQrCode && (
                      <img 
                        src={upiQrCode} 
                        alt="UPI QR Code" 
                        className="w-64 h-64"
                      />
                    )}
                    {upiPaymentStatus === 'checking' && (
                      <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-gray-600">Confirming payment...</p>
                        </div>
                      </div>
                    )}
                    {upiPaymentStatus === 'confirmed' && (
                      <div className="absolute inset-0 bg-green-50/90 flex items-center justify-center rounded-xl">
                        <div className="text-center">
                          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-2" />
                          <p className="text-green-600 font-semibold">Payment Confirmed!</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className={`text-lg font-semibold ${textPrimary}`}>
                      Amount: ₹{stats.selectedFeesTotal.toLocaleString()}
                    </p>
                    <p className={`text-sm ${textSecondary}`}>
                      Pay to: {upiId}
                    </p>
                    <p className={`text-xs ${textSecondary}`}>
                      Scan with any UPI app (PhonePe, PayTM, Google Pay, etc.)
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    {upiPaymentStatus === 'pending' && (
                      <>
                        <button
                          onClick={onCopyUpiLink}
                          className="flex-1 py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                        >
                          Copy UPI Link
                        </button>
                        <button
                          onClick={onShareQrCode}
                          disabled={sharingQr}
                          className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sharingQr ? 'Sharing...' : 'Share QR'}
                        </button>
                        <button
                          onClick={onUpiPaymentConfirmation}
                          disabled={checkingPayment}
                          className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkingPayment ? 'Confirming...' : 'Mark as Paid'}
                        </button>
                      </>
                    )}
                    {upiPaymentStatus === 'confirmed' && (
                      <button
                        onClick={onViewReceipt}
                        className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        View Receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
