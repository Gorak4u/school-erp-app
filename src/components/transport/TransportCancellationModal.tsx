'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface TransportCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentTransport: any;
  onSuccess: (result: any) => void;
  theme: 'light' | 'dark';
}

interface FeeAnalysis {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'full';
  refundableAmount: number;
  feeAnalysisByYear?: any[]; // Year-wise breakdown
  hasArrears?: boolean; // Whether there are old academic year arrears
}

interface RefundSummary {
  feeAnalysis: FeeAnalysis;
  eligibility: {
    canRefund: boolean;
    maxRefundable: number;
    suggestedRefund: number;
    requiresApproval: boolean;
  };
}

export default function TransportCancellationModal({ 
  isOpen, 
  onClose, 
  studentTransport, 
  onSuccess,
  theme 
}: TransportCancellationModalProps) {
  const [loading, setLoading] = useState(false);
  const [refundSummary, setRefundSummary] = useState<RefundSummary | null>(null);
  const [createRefund, setCreateRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState<'waive' | 'keep' | 'auto-waive'>('auto-waive');

  const isDark = theme === 'dark';
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'}`;

  useEffect(() => {
    if (isOpen && studentTransport) {
      loadRefundAnalysis();
    }
  }, [isOpen, studentTransport]);

  const loadRefundAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transport/refunds/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentTransportId: studentTransport.id })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRefundSummary(data.data);
        setRefundAmount(data.data.eligibility.suggestedRefund);
        
        // Set default pending action based on payment status
        if (data.data.feeAnalysis.pendingAmount > 0) {
          setPendingAction('auto-waive'); // Default to waive when refund is selected
        }
      }
    } catch (error) {
      console.error('Error loading refund analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransport = async () => {
    try {
      setLoading(true);
      setError('');

      const requestBody: any = {
        studentTransportId: studentTransport.id
      };

      if (createRefund) {
        requestBody.createRefund = true;
        requestBody.refundAmount = refundAmount;
        requestBody.adminFee = adminFee;
        requestBody.reason = reason || 'Transport cancellation';
        requestBody.pendingAction = 'waive'; // Auto-waive pending when refund is created
      } else {
        // No refund selected - ask what to do with pending
        requestBody.createRefund = false;
        requestBody.pendingAction = pendingAction; // 'waive' or 'keep'
      }

      const response = await fetch(`/api/transport/students/${studentTransport.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to cancel transport');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4 ${card}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Cancel Transport Assignment
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Info */}
          <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Student Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Name:</span>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {studentTransport?.student?.name}
                </p>
              </div>
              <div>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Class:</span>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {studentTransport?.student?.class} - {studentTransport?.student?.section}
                </p>
              </div>
              <div>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Route:</span>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {studentTransport?.route?.routeName}
                </p>
              </div>
              <div>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Monthly Fee:</span>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ₹{studentTransport?.monthlyFee}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Analysis */}
          {refundSummary && (
            <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Fee Analysis
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    ₹{refundSummary.feeAnalysis.totalAmount}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Amount</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ₹{refundSummary.feeAnalysis.paidAmount}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Paid Amount</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    ₹{refundSummary.feeAnalysis.pendingAmount}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending Amount</p>
                </div>
              </div>
              
              {/* Payment Status */}
              <div className={`mt-4 p-3 rounded-lg ${
                refundSummary.feeAnalysis.paymentStatus === 'unpaid' ? 'bg-yellow-100/20 text-yellow-600' :
                refundSummary.feeAnalysis.paymentStatus === 'partial' ? 'bg-blue-100/20 text-blue-600' :
                'bg-green-100/20 text-green-600'
              }`}>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Payment Status: {refundSummary.feeAnalysis.paymentStatus.charAt(0).toUpperCase() + refundSummary.feeAnalysis.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Refund Options */}
          {refundSummary?.eligibility.canRefund && (
            <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Refund Options
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createRefund}
                    onChange={(e) => setCreateRefund(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Create Refund
                  </span>
                </label>
              </div>

              {createRefund && (
                <div className="space-y-4">
                  <div>
                    <label className={label}>Refund Amount</label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      max={refundSummary.eligibility.maxRefundable}
                      className={input}
                      placeholder="Enter refund amount"
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Maximum refundable: ₹{refundSummary.eligibility.maxRefundable}
                    </p>
                  </div>

                  <div>
                    <label className={label}>Admin Fee (Optional)</label>
                    <input
                      type="number"
                      value={adminFee}
                      onChange={(e) => setAdminFee(Number(e.target.value))}
                      className={input}
                      placeholder="Enter admin fee (default: ₹0)"
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Net refund: ₹{refundAmount - adminFee}
                    </p>
                  </div>

                  <div>
                    <label className={label}>Reason</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={input}
                      rows={3}
                      placeholder="Enter refund reason"
                    />
                  </div>

                  {refundSummary.eligibility.requiresApproval && (
                    <div className={`p-3 rounded-lg bg-blue-100/20 text-blue-600`}>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">
                          This refund requires manager approval
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pending Amount Options */}
              {refundSummary?.feeAnalysis.pendingAmount > 0 && (
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Pending Amount (₹{refundSummary.feeAnalysis.pendingAmount})
                  </h3>
                  
                  {createRefund ? (
                    <div className={`p-3 rounded-lg bg-green-100/20 text-green-600`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">
                          Pending amount will be automatically waived off with refund
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        What would you like to do with the pending amount?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="pendingAction"
                            value="waive"
                            checked={pendingAction === 'waive'}
                            onChange={(e) => setPendingAction(e.target.value as 'waive' | 'keep')}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Waive Off
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Cancel the pending amount - student saves ₹{refundSummary.feeAnalysis.pendingAmount}
                            </div>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="pendingAction"
                            value="keep"
                            checked={pendingAction === 'keep'}
                            onChange={(e) => setPendingAction(e.target.value as 'waive' | 'keep')}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Keep for Recovery
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Maintain pending balance for future collection
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg bg-red-100/20 text-red-600`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Calculations & Disclaimer */}
          {refundSummary && (
            <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Calculations & Disclaimer
              </h3>
              
              {/* Academic Year Breakdown */}
              {refundSummary?.feeAnalysis?.feeAnalysisByYear && refundSummary.feeAnalysis.feeAnalysisByYear.length > 1 && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Academic Year Breakdown
                  </h4>
                  <div className="space-y-1 text-xs">
                    {refundSummary.feeAnalysis.feeAnalysisByYear.map((year: any) => (
                      <div key={year.academicYear} className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          {year.academicYear} {year.academicYear !== new Date().getFullYear().toString() && '(Arrears)'}
                        </span>
                        <div className="flex gap-2">
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            Total: ₹{year.totalAmount}
                          </span>
                          <span className={isDark ? 'text-green-400' : 'text-green-600'}>
                            Paid: ₹{year.paidAmount}
                          </span>
                          <span className={isDark ? 'text-orange-400' : 'text-orange-600'}>
                            Pending: ₹{year.pendingAmount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {refundSummary.feeAnalysis.hasArrears && (
                    <div className={`mt-2 p-2 rounded bg-orange-100/20 text-orange-600 text-xs`}>
                      ⚠️ Includes old academic year arrears - waiver may require approval
                    </div>
                  )}
                </div>
              )}

              {/* Financial Summary */}
              <div className="space-y-3 mb-4">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Financial Summary
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Transport Fee:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        ₹{refundSummary.feeAnalysis.totalAmount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Amount Paid:</span>
                      <span className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        ₹{refundSummary.feeAnalysis.paidAmount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Pending Amount:</span>
                      <span className={`font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                        ₹{refundSummary.feeAnalysis.pendingAmount}
                      </span>
                    </div>
                    
                    {/* Refund Calculation */}
                    {createRefund && (
                      <>
                        <div className={`flex justify-between pt-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Refund Amount:</span>
                          <span className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            ₹{refundAmount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Admin Fee:</span>
                          <span className={`font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            ₹{adminFee}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Net Refund:</span>
                          <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            ₹{refundAmount - adminFee}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {/* Pending Action Impact */}
                    {refundSummary.feeAnalysis.pendingAmount > 0 && (
                      <div className={`flex justify-between pt-2 border-t ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Pending Amount:</span>
                        <span className={`font-medium ${
                          createRefund || pendingAction === 'waive' 
                            ? isDark ? 'text-green-400' : 'text-green-600'
                            : isDark ? 'text-orange-400' : 'text-orange-600'
                        }`}>
                          {createRefund || pendingAction === 'waive' 
                            ? `Waived (Student saves ₹${refundSummary.feeAnalysis.pendingAmount})`
                            : 'Kept for recovery'
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Impact */}
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Student Impact
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Financial Impact:</span>
                      <span className={`font-bold ${
                        (createRefund ? (refundAmount - adminFee) : 0) + 
                        (createRefund || pendingAction === 'waive' ? refundSummary.feeAnalysis.pendingAmount : 0) > 0
                          ? isDark ? 'text-green-400' : 'text-green-600'
                          : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        ₹{
                          (createRefund ? (refundAmount - adminFee) : 0) + 
                          (createRefund || pendingAction === 'waive' ? refundSummary.feeAnalysis.pendingAmount : 0)
                        } {createRefund || pendingAction === 'waive' ? 'Saved' : 'Owed'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Transport Access:</span>
                      <span className={`font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        Removed Immediately
                      </span>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className={`p-3 rounded-lg ${
                  createRefund || pendingAction === 'waive'
                    ? 'bg-green-100/20 text-green-600'
                    : 'bg-orange-100/20 text-orange-600'
                }`}>
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <div className="font-medium mb-1">
                        {createRefund || pendingAction === 'waive' ? 'Student Benefit Disclaimer' : 'Recovery Disclaimer'}
                      </div>
                      <div className="space-y-1">
                        {createRefund || pendingAction === 'waive' ? (
                          <>
                            <p>• Student will receive {createRefund ? `₹${refundAmount - adminFee} refund` : 'no refund'}</p>
                            <p>• Pending amount of ₹{refundSummary.feeAnalysis.pendingAmount} will be waived off</p>
                            <p>• Total student benefit: ₹{
                              (createRefund ? (refundAmount - adminFee) : 0) + 
                              refundSummary.feeAnalysis.pendingAmount
                            }</p>
                            <p>• This action cannot be undone once confirmed</p>
                            {createRefund && refundSummary.eligibility.requiresApproval && (
                              <p>• Refund requires manager approval before processing</p>
                            )}
                            {pendingAction === 'waive' && (
                              <>
                                {(refundSummary.feeAnalysis.pendingAmount >= 1000 || refundSummary.feeAnalysis.hasArrears) && (
                                  <p>• Waiver requires manager approval due to {(refundSummary.feeAnalysis.hasArrears ? 'old academic year arrears' : 'significant amount')}</p>
                                )}
                                {refundSummary.feeAnalysis.pendingAmount < 1000 && !refundSummary.feeAnalysis.hasArrears && (
                                  <p>• Waiver will be auto-approved (small amount, no arrears)</p>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <p>• No refund will be issued to the student</p>
                            <p>• Pending amount of ₹{refundSummary.feeAnalysis.pendingAmount} will be kept for recovery</p>
                            <p>• Student will still owe the pending amount</p>
                            <p>• Fee records will be marked as cancelled but preserved</p>
                            <p>• School can pursue collection of pending amount</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Confirmation */}
                <div className={`p-3 rounded-lg bg-blue-100/20 text-blue-600`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <div className="font-medium mb-1">Action Confirmation</div>
                      <div className="space-y-1">
                        <p>• Transport assignment will be permanently cancelled</p>
                        <p>• Student will lose access to transport services immediately</p>
                        <p>• All related records will be updated accordingly</p>
                        <p>• Notifications will be sent to parents/guardians</p>
                        <p>• This action will be logged for audit purposes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={btnSecondary}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleCancelTransport}
            className={btnDanger}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Cancel Transport'}
          </button>
        </div>
      </div>
    </div>
  );
}
