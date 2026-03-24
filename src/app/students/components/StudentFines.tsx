'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Ban, Eye, Calendar, DollarSign, FileText } from 'lucide-react';

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

export default function StudentFines({ student, theme, onClose }: StudentFinesProps) {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const card = `rounded-lg border p-4 ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`;
  const btnPrimary = `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
  const btnSecondary = `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  useEffect(() => {
    fetchStudentFines();
  }, [student?.id, student?.studentId]);

  const fetchStudentFines = async () => {
    const studentId = student?.id || student?.studentId;
    if (!studentId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/fees/students/${studentId}/fines`);
      const data = await response.json();

      if (response.ok) {
        setFines(data.fines || []);
      } else {
        setError(data.error || 'Failed to fetch fines');
      }
    } catch (error) {
      console.error('Failed to fetch student fines:', error);
      setError('Failed to fetch fines');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'partial': return 'text-blue-600 bg-blue-100';
      case 'paid': return 'text-green-600 bg-green-100';
      case 'waived': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={card}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Fines</p>
              <p className="text-lg font-bold">₹{totalStats.total.toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-lg font-bold text-green-600">₹{totalStats.paid.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-yellow-600">₹{totalStats.pending.toLocaleString()}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Waived</p>
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
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No fines found for this student</p>
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
                      <span className="text-xs text-gray-500">{fine.type}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{fine.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
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
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 mb-1">Recent Payments:</p>
                        <div className="space-y-1">
                          {fine.payments.slice(0, 2).map((payment) => (
                            <div key={payment.id} className="flex items-center gap-2 text-xs">
                              <span>₹{payment.amount} via {payment.paymentMethod}</span>
                              <span className="text-gray-500">
                                ({new Date(payment.createdAt).toLocaleDateString()})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold">₹{fine.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-sm text-green-600">₹{fine.paidAmount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Paid</div>
                    {fine.pendingAmount > 0 && (
                      <>
                        <div className="text-sm text-yellow-600">₹{fine.pendingAmount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Pending</div>
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
  );
}
