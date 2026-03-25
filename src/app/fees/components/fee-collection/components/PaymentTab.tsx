// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, Zap, Shield, Award } from 'lucide-react';
import { PaymentMethod } from '../types';

interface PaymentTabProps {
  paymentMethods: PaymentMethod[];
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  selectedFees: string[];
  stats: any;
  promoCode: string;
  setPromoCode: (code: string) => void;
  isProcessing: boolean;
  isDark: boolean;
  cardCls: string;
  textPrimary: string;
  textSecondary: string;
  inputCls: string;
  paymentGatewayEnabled: boolean;
  upiId: string;
  razorpayKeyId: string;
  onPayment: () => void;
}

export default function PaymentTab({
  paymentMethods,
  paymentMethod,
  setPaymentMethod,
  selectedFees,
  stats,
  promoCode,
  setPromoCode,
  isProcessing,
  isDark,
  cardCls,
  textPrimary,
  textSecondary,
  inputCls,
  paymentGatewayEnabled,
  upiId,
  razorpayKeyId,
  onPayment,
}: PaymentTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Payment Methods */}
      <div className={`${cardCls} p-6 rounded-xl border`}>
        <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => {
            const isExternalPayment = method.id !== 'cash';
            const isConfigured = paymentGatewayEnabled && (method.id === 'upi' ? upiId : razorpayKeyId);
            
            return (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                disabled={isExternalPayment && !isConfigured}
                className={`p-4 rounded-lg border transition-all ${
                  paymentMethod === method.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : cardCls
                } ${isExternalPayment && !isConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    {isExternalPayment && (
                      <div className="mt-1">
                        {isConfigured ? (
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                            {method.id === 'upi' ? '→ Generate UPI QR' : '→ Redirect to Razorpay'}
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
                            ⚠️ Not Configured
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
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
        onClick={onPayment}
        disabled={isProcessing || selectedFees.length === 0 || (paymentMethod !== 'cash' && (!paymentGatewayEnabled || (paymentMethod === 'upi' ? !upiId : !razorpayKeyId)))}
        className={`w-full py-4 rounded-lg font-medium transition-colors ${
          isProcessing || selectedFees.length === 0 || (paymentMethod !== 'cash' && (!paymentGatewayEnabled || (paymentMethod === 'upi' ? !upiId : !razorpayKeyId)))
            ? 'opacity-50 cursor-not-allowed bg-gray-400'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isProcessing ? 'Processing...' : (
          paymentMethod === 'cash' 
            ? `Pay ₹${(stats.selectedFeesTotal + (paymentMethods.find(m => m.id === paymentMethod)?.fee || 0)).toLocaleString()}`
            : paymentMethod === 'upi'
              ? `Generate UPI QR - ₹${(stats.selectedFeesTotal + (paymentMethods.find(m => m.id === paymentMethod)?.fee || 0)).toLocaleString()}`
              : `Redirect to Razorpay - ₹${(stats.selectedFeesTotal + (paymentMethods.find(m => m.id === paymentMethod)?.fee || 0)).toLocaleString()}`
        )}
      </button>
    </motion.div>
  );
}
