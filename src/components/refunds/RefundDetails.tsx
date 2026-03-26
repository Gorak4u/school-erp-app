'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';
import { refundPerformanceMonitor } from '@/lib/refundLogger';

// Icons
import {
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  CreditCard,
  BanknoteIcon,
  User,
  Calendar,
  FileText,
  MessageSquare,
  History,
  Building,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  ArrowRight,
  Check,
  Ban,
  RefreshCw
} from 'lucide-react';

interface RefundDetailsProps {
  isOpen: boolean;
  refund: any;
  onClose: () => void;
  onUpdate: (refund: any) => void;
}

// AI-Optimized Refund Details Component following settings modal pattern
export default function RefundDetails({ isOpen, refund, onClose, onUpdate }: RefundDetailsProps) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  // Enhanced state management
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [processMethod, setProcessMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  // CSS class generators following settings modal pattern
  const modalClasses = useMemo(() =>
    `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`,
    []
  );

  const modalContentClasses = useMemo(() =>
    `w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`,
    [isDark]
  );

  const cardClasses = useMemo(() =>
    `rounded-2xl border p-6 shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`,
    [isDark]
  );

  const inputClasses = useMemo(() =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${
      isDark 
        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
        : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-400'
    }`,
    [isDark]
  );

  const labelClasses = useMemo(() =>
    `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`,
    [isDark]
  );

  const btnPrimaryClasses = useMemo(() =>
    `flex-1 px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${
      isDark 
        ? 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white' 
        : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white'
    }`,
    [isDark]
  );

  const btnSecondaryClasses = useMemo(() =>
    `flex-1 px-6 py-3 rounded-xl text-sm font-medium border transition-all transform hover:scale-105 ${
      isDark 
        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
    }`,
    [isDark]
  );

  const btnDangerClasses = useMemo(() =>
    `flex-1 px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
      isDark 
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white' 
        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
    }`,
    [isDark]
  );

  // Enhanced status configuration
  const getStatusConfig = useMemo(() => ({
    pending: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/20', border: 'border-orange-500/30', label: 'Pending' },
    approved: { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/30', label: 'Approved' },
    processed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/30', label: 'Processed' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/30', label: 'Rejected' },
    cancelled: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-500/20', border: 'border-gray-500/30', label: 'Cancelled' }
  }), []);

  // Enhanced refund type mapping
  const getRefundTypeLabel = useCallback((type: string) => {
    const labels: Record<string, string> = {
      academic_fee: 'Academic Fee',
      transport_fee: 'Transport Fee',
      fine: 'Fine',
      overpayment: 'Overpayment'
    };
    return labels[type] || type;
  }, []);

  // Enhanced refund method mapping
  const getRefundMethodLabel = useCallback((method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      credit_future: 'Credit to Future Fees',
      cash: 'Cash'
    };
    return labels[method] || method;
  }, []);

  // Enhanced amount formatting
  const formatAmount = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  // Enhanced date formatting
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Enhanced refund actions
  const handleApprove = useCallback(async () => {
    setActionLoading(true);
    const operationId = `approve_refund_${Date.now()}`;
    refundPerformanceMonitor.startOperation(operationId);

    try {
      const response = await fetch(`/api/refunds/${refund.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approved' })
      });

      if (response.ok) {
        showSuccessToast('Success', 'Refund approved successfully');
        onUpdate({ ...refund, status: 'approved' });
      } else {
        throw new Error('Failed to approve refund');
      }
    } catch (error) {
      console.error('Error approving refund:', error);
      showErrorToast('Error', 'Failed to approve refund');
    } finally {
      refundPerformanceMonitor.endOperation(operationId, 'RefundDetails.handleApprove');
      setActionLoading(false);
    }
  }, [refund, onUpdate]);

  const handleReject = useCallback(async () => {
    if (!rejectionReason.trim()) {
      showErrorToast('Error', 'Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    const operationId = `reject_refund_${Date.now()}`;
    refundPerformanceMonitor.startOperation(operationId);

    try {
      const response = await fetch(`/api/refunds/${refund.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'rejected',
          comments: rejectionReason 
        })
      });

      if (response.ok) {
        showSuccessToast('Success', 'Refund rejected successfully');
        onUpdate({ ...refund, status: 'rejected' });
        setShowRejectionForm(false);
        setRejectionReason('');
      } else {
        throw new Error('Failed to reject refund');
      }
    } catch (error) {
      console.error('Error rejecting refund:', error);
      showErrorToast('Error', 'Failed to reject refund');
    } finally {
      refundPerformanceMonitor.endOperation(operationId, 'RefundDetails.handleReject');
      setActionLoading(false);
    }
  }, [refund, rejectionReason, onUpdate]);

  const handleProcess = useCallback(async () => {
    if (!processMethod || !transactionId.trim()) {
      showErrorToast('Error', 'Please provide processing details');
      return;
    }

    setActionLoading(true);
    const operationId = `process_refund_${Date.now()}`;
    refundPerformanceMonitor.startOperation(operationId);

    try {
      const response = await fetch(`/api/refunds/${refund.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'processed',
          method: processMethod,
          transactionId,
          notes
        })
      });

      if (response.ok) {
        showSuccessToast('Success', 'Refund processed successfully');
        onUpdate({ ...refund, status: 'processed' });
        setShowProcessForm(false);
        setProcessMethod('');
        setTransactionId('');
        setNotes('');
      } else {
        throw new Error('Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      showErrorToast('Error', 'Failed to process refund');
    } finally {
      refundPerformanceMonitor.endOperation(operationId, 'RefundDetails.handleProcess');
      setActionLoading(false);
    }
  }, [refund, processMethod, transactionId, notes, onUpdate]);

  const handleCancel = useCallback(async () => {
    setActionLoading(true);
    const operationId = `cancel_refund_${Date.now()}`;
    refundPerformanceMonitor.startOperation(operationId);

    try {
      const response = await fetch(`/api/refunds/${refund.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccessToast('Success', 'Refund cancelled successfully');
        onUpdate({ ...refund, status: 'cancelled' });
      } else {
        throw new Error('Failed to cancel refund');
      }
    } catch (error) {
      console.error('Error cancelling refund:', error);
      showErrorToast('Error', 'Failed to cancel refund');
    } finally {
      refundPerformanceMonitor.endOperation(operationId, 'RefundDetails.handleCancel');
      setActionLoading(false);
    }
  }, [refund, onUpdate]);

  const statusConfig = getStatusConfig[refund.status as keyof typeof getStatusConfig] || getStatusConfig.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={modalClasses}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className={modalContentClasses}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${statusConfig.bg} ${statusConfig.border}`}>
                  <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Refund Details
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    ID: {refund.id}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Information */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cardClasses}
                >
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <User className="w-5 h-5 text-teal-600" />
                    Student Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Name:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {refund.student?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Admission No:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {refund.student?.admissionNo || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Class:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {refund.student?.class}{refund.student?.section && `-${refund.student?.section}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Parent Email:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {refund.student?.parentEmail || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Parent Phone:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {refund.student?.parentPhone || 'N/A'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Refund Information */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cardClasses}
                >
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <DollarSign className="w-5 h-5 text-teal-600" />
                    Refund Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Type:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getRefundTypeLabel(refund.type)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Gross Amount:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatAmount(refund.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Admin Fee:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatAmount(refund.adminFee || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Net Amount:</span>
                      <span className={`font-bold text-teal-600`}>
                        {formatAmount(refund.netAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Method:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getRefundMethodLabel(refund.refundMethod)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cardClasses}
                >
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <History className="w-5 h-5 text-teal-600" />
                    Timeline
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${statusConfig.bg} ${statusConfig.border}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Request Created</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {refund.reason}
                            </p>
                          </div>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatDate(refund.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {refund.approvedAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Approved</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Approved by {refund.approvedBy || 'System'}
                              </p>
                            </div>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatDate(refund.approvedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {refund.processedAt && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-2 bg-green-500" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Processed</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Transaction ID: {refund.transactionId || 'N/A'}
                              </p>
                            </div>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatDate(refund.processedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Bank Details (if applicable) */}
                {refund.refundMethod === 'bank_transfer' && refund.bankDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cardClasses}
                  >
                    <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Building className="w-5 h-5 text-teal-600" />
                      Bank Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Account Number:</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {refund.bankDetails.accountNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Bank Name:</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {refund.bankDetails.bankName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>IFSC Code:</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {refund.bankDetails.ifscCode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Account Holder:</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {refund.bankDetails.accountHolder}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Approval/Rejection Forms */}
              <AnimatePresence mode="wait">
                {showRejectionForm && (
                  <motion.div
                    key="rejection-form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cardClasses}
                  >
                    <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Rejection Reason
                    </h3>
                    <textarea
                      placeholder="Please provide a reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className={inputClasses}
                    />
                    <div className="flex gap-3 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowRejectionForm(false)}
                        className={btnSecondaryClasses}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReject}
                        disabled={actionLoading}
                        className={btnDangerClasses}
                      >
                        <AnimatePresence mode="wait">
                          {actionLoading ? (
                            <motion.span
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center justify-center gap-2"
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                              Rejecting...
                            </motion.span>
                          ) : (
                            <motion.span
                              key="action"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center justify-center gap-2"
                            >
                              <Ban className="w-4 h-4" />
                              Reject Refund
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {showProcessForm && (
                  <motion.div
                    key="process-form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cardClasses}
                  >
                    <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Processing Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClasses}>Processing Method</label>
                        <select
                          value={processMethod}
                          onChange={(e) => setProcessMethod(e.target.value)}
                          className={inputClasses}
                        >
                          <option value="">Select method</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash">Cash</option>
                          <option value="credit_future">Credit to Future Fees</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Transaction ID</label>
                        <input
                          type="text"
                          placeholder="Enter transaction ID"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Notes (Optional)</label>
                        <textarea
                          placeholder="Add any processing notes..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          className={inputClasses}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowProcessForm(false)}
                        className={btnSecondaryClasses}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleProcess}
                        disabled={actionLoading}
                        className={btnPrimaryClasses}
                      >
                        <AnimatePresence mode="wait">
                          {actionLoading ? (
                            <motion.span
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center justify-center gap-2"
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                              Processing...
                            </motion.span>
                          ) : (
                            <motion.span
                              key="action"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center justify-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Process Refund
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <AnimatePresence mode="wait">
                {!showRejectionForm && !showProcessForm && (
                  <motion.div
                    key="action-buttons"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex gap-3"
                  >
                    {refund.status === 'pending' && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleApprove}
                          disabled={actionLoading}
                          className={btnPrimaryClasses}
                        >
                          <AnimatePresence mode="wait">
                            {actionLoading ? (
                              <motion.span
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center gap-2"
                              >
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                Approving...
                              </motion.span>
                            ) : (
                              <motion.span
                                key="action"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowRejectionForm(true)}
                          className={btnDangerClasses}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Reject
                        </motion.button>
                      </>
                    )}

                    {refund.status === 'approved' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowProcessForm(true)}
                        className={btnPrimaryClasses}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Process Refund
                      </motion.button>
                    )}

                    {(refund.status === 'pending' || refund.status === 'approved') && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancel}
                        disabled={actionLoading}
                        className={btnSecondaryClasses}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
