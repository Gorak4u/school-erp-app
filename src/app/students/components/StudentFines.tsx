'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Ban, Eye, Calendar, DollarSign, FileText } from 'lucide-react';
import { showToast } from '@/lib/toastUtils';

interface Fine {
  id: string;
  fineNumber: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  paidAmount: number;
  waivedAmount: number;
  pendingAmount: number;
  status: 'pending' | 'partial' | 'paid' | 'waived';
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    receiptNumber: string;
    createdAt: string;
  }>;
  waiverRequests: Array<{
    id: string;
    status: string;
    requestedBy: string;
    createdAt: string;
  }>;
}

interface StudentFinesProps {
  student: any;
  theme: 'dark' | 'light';
  onClose: () => void;
}

export default function StudentFines({ student, theme }: StudentFinesProps) {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any>(null);
  const [waiverForm, setWaiverForm] = useState({
    reason: '',
    remarks: '',
    documents: [] as File[]
  });
  const [submittingWaiver, setSubmittingWaiver] = useState(false);

  const isDark = theme === 'dark';
  const card = `rounded-lg border p-4 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`;
  const btnPrimary = `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
  const btnSecondary = `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  useEffect(() => {
    fetchStudentFines();
  }, [student?.id, student?.studentId]);

  const fetchStudentFines = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fees/students/${student.id || student.studentId}/fines`);
      if (!response.ok) throw new Error('Failed to fetch fines');
      const data = await response.json();
      console.log('Fetched fines data:', data);
      setFines(data.fines || []);
    } catch (err: any) {
      console.error('Fetch fines error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWaiver = (fine: any) => {
    setSelectedFine(fine);
    setShowWaiverModal(true);
  };

  const handleWaiverRequestSubmit = async () => {
    if (!selectedFine || !waiverForm.reason.trim()) {
      showToast('warning', 'Missing Reason', 'Please provide a reason for the waiver request');
      return;
    }

    setSubmittingWaiver(true);
    try {
      const response = await fetch('/api/fines/waiver-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fineId: selectedFine.id,
          reason: waiverForm.reason,
          remarks: waiverForm.remarks,
          documents: waiverForm.documents.map(f => f.name),
          waiveAmount: selectedFine.pendingAmount
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit waiver request');
      }

      const result = await response.json();
      showToast('success', 'Request Submitted', 'Waiver request submitted successfully!');
      setShowWaiverModal(false);
      setWaiverForm({ reason: '', remarks: '', documents: [] });
      
      // Refresh fines data
      await fetchStudentFines();
    } catch (err: any) {
      showToast('error', 'Submission Failed', `Error submitting waiver request: ${err.message}`);
    } finally {
      setSubmittingWaiver(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return isDark ? 'text-yellow-400 bg-yellow-900/30' : 'text-yellow-600 bg-yellow-100';
      case 'partial': return isDark ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-100';
      case 'paid': return isDark ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-100';
      case 'waived': return isDark ? 'text-purple-400 bg-purple-900/30' : 'text-purple-600 bg-purple-100';
      default: return isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'partial': return <AlertCircle className="w-4 h-4" />;
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'waived': return <Ban className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const totalStats = fines.reduce(
    (acc, fine) => ({
      total: acc.total + fine.amount,
      paid: acc.paid + fine.paidAmount,
      waived: acc.waived + fine.waivedAmount,
      pending: acc.pending + fine.pendingAmount,
    }),
    { total: 0, paid: 0, waived: 0, pending: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <button onClick={fetchStudentFines} className={btnPrimary + ' mt-4'}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={card}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Fines</p>
              <p className="text-lg font-bold">₹{totalStats.total.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Paid</p>
              <p className="text-lg font-bold text-green-600">₹{totalStats.paid.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending</p>
              <p className="text-lg font-bold text-yellow-600">₹{totalStats.pending.toLocaleString()}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Waived</p>
              <p className="text-lg font-bold text-purple-600">₹{totalStats.waived.toLocaleString()}</p>
            </div>
            <Ban className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Fines List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Fine History</h3>
        {fines.length === 0 ? (
          <div className={card}>
            <div className="text-center py-8">
              <FileText className={`w-12 h-12 ${isDark ? 'text-gray-500' : 'text-gray-400'} mx-auto mb-4`} />
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No fines found for this student</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {fines.map((fine) => (
              <motion.div
                key={fine.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={card}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(fine.status)}`}>
                        {getStatusIcon(fine.status)}
                        {fine.status.charAt(0).toUpperCase() + fine.status.slice(1)}
                      </span>
                      <span className="text-sm font-medium">{fine.fineNumber}</span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{fine.type}</span>
                    </div>
                    
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{fine.description}</p>
                    
                    <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Issued: {new Date(fine.issuedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due: {new Date(fine.dueDate).toLocaleDateString()}
                      </div>
                      {fine.paidAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Paid: {new Date(fine.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {fine.payments.length > 0 && (
                      <div className={`mt-2 pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Recent Payments:</p>
                        <div className="space-y-1">
                          {fine.payments.slice(0, 2).map((payment: any) => (
                            <div key={payment.id} className="flex items-center gap-2 text-xs">
                              <span>₹{payment.amount} via {payment.paymentMethod}</span>
                              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                                ({new Date(payment.createdAt).toLocaleDateString()})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No actions here - waiver requests are handled in main Fines page */}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold">₹{fine.amount.toLocaleString()}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total</div>
                    <div className="text-sm text-green-600">₹{fine.paidAmount.toLocaleString()}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Paid</div>
                    {fine.pendingAmount > 0 && (
                      <>
                        <div className="text-sm text-yellow-600">₹{fine.pendingAmount.toLocaleString()}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending</div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
    
    {/* Waiver Request Modal */}
    <AnimatePresence>
      {showWaiverModal && selectedFine && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowWaiverModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={card}>
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Request Waiver
                  </h2>
                  <button
                    onClick={() => setShowWaiverModal(false)}
                    className={`p-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fine</div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedFine.fineNumber} - {selectedFine.description}
                  </div>
                </div>
                <div className="mb-4">
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Student</div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {student.name}
                  </div>
                </div>
                <div className="mb-4">
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pending Amount</div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ₹{selectedFine.pendingAmount.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reason for Waiver *</label>
                    <textarea 
                      className={`mt-1 block w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      rows={3}
                      placeholder="Explain why this fine should be waived..."
                      value={waiverForm.reason}
                      onChange={(e) => setWaiverForm(prev => ({ ...prev, reason: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Additional Remarks (Optional)</label>
                    <textarea 
                      className={`mt-1 block w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      rows={2}
                      placeholder="Any additional information..."
                      value={waiverForm.remarks}
                      onChange={(e) => setWaiverForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Supporting Documents (Optional)</label>
                    <input 
                      type="file" 
                      className={`mt-1 block w-full px-3 py-2 border rounded-lg text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setWaiverForm(prev => ({ 
                        ...prev, 
                        documents: Array.from(e.target.files || []) 
                      }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowWaiverModal(false)}
                    className={btnSecondary}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWaiverRequestSubmit}
                    disabled={submittingWaiver}
                    className={btnPrimary}
                  >
                    {submittingWaiver ? 'Submitting...' : 'Submit Request'}
                  </button>
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
