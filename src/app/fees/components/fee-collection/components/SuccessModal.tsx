// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, FileText, Printer, X, Sparkles, Receipt, Download } from 'lucide-react';

interface SuccessModalProps {
  showSuccessModal: boolean;
  setShowSuccessModal: (show: boolean) => void;
  setShowDetailedReceipt: (show: boolean) => void;
  latestReceipt: any;
  paymentMethod: string;
  isDark: boolean;
  cardCls: string;
  textPrimary: string;
  textSecondary: string;
}

export default function SuccessModal({
  showSuccessModal,
  setShowSuccessModal,
  setShowDetailedReceipt,
  latestReceipt,
  paymentMethod,
  isDark,
  cardCls,
  textPrimary,
  textSecondary,
}: SuccessModalProps) {
  if (!showSuccessModal) return null;

  const totalAmount = (latestReceipt?.paymentData?.currentYearFees || []).reduce(
    (sum: number, item: any) => sum + Number(item.amountPaid || item.paidAmount || 0),
    0
  );

  const handleViewReceipt = () => {
    setShowSuccessModal(false);
    setShowDetailedReceipt(true);
  };

  return (
    <AnimatePresence>
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
          onClick={() => setShowSuccessModal(false)}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-lg mx-4 ${cardCls} rounded-3xl border shadow-2xl overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Animation Background */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-green-500/30"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-green-400/20"
              />
            </div>

            {/* Confetti-like sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    x: '50%', 
                    y: '50%',
                    scale: 0 
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    x: `${50 + (Math.random() - 0.5) * 60}%`,
                    y: `${50 + (Math.random() - 0.5) * 60}%`,
                    scale: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    delay: 0.3 + i * 0.1,
                    ease: "easeOut"
                  }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </motion.div>
              ))}
            </div>

            <div className="relative p-8 text-center">
              {/* Close button */}
              <button
                onClick={() => setShowSuccessModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Success Icon with Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, delay: 0.2 }}
                className="relative mb-6"
              >
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
                  isDark ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, delay: 0.3 }}
                  >
                    <CheckCircle className="w-14 h-14 text-green-500" />
                  </motion.div>
                </div>
                
                {/* Animated ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                  className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-green-500/50"
                />
              </motion.div>

              {/* Greeting Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className={`text-3xl font-bold mb-2 ${textPrimary}`}>
                  Payment Successful!
                </h2>
                <p className={`text-lg mb-6 ${textSecondary}`}>
                  Thank you for your payment
                </p>
              </motion.div>

              {/* Amount Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className={`p-6 rounded-2xl mb-6 ${
                  isDark ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'
                }`}
              >
                <p className={`text-sm mb-1 ${textSecondary}`}>Amount Paid</p>
                <p className={`text-4xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  ₹{totalAmount.toLocaleString()}
                </p>
                <p className={`text-sm mt-2 ${textSecondary}`}>
                  via {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                </p>
              </motion.div>

              {/* Receipt Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`p-4 rounded-xl mb-6 ${
                  isDark ? 'bg-gray-700/50' : 'bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Receipt className={`w-4 h-4 ${textSecondary}`} />
                  <span className={`text-sm ${textSecondary}`}>Receipt Number</span>
                </div>
                <p className={`font-mono font-semibold ${textPrimary}`}>
                  {latestReceipt?.receiptNumber || 'Processing...'}
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                <button
                  onClick={handleViewReceipt}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
                >
                  <FileText className="w-5 h-5" />
                  View & Print Receipt
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleViewReceipt}
                    className={`py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    Quick Print
                  </button>
                  <button
                    onClick={handleViewReceipt}
                    className={`py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className={`w-full py-3 px-6 rounded-xl font-medium transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Close & Continue
                </button>
              </motion.div>

              {/* Footer message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className={`mt-4 text-xs ${textSecondary}`}
              >
                A confirmation email has been sent to the registered email address
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
