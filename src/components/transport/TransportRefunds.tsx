'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, RefreshCw, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TransportRefundsProps {
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  btnPrimary: string;
  btnSecondary: string;
  btnDanger: string;
  theme: 'light' | 'dark';
}

interface RefundRequest {
  id: string;
  schoolId: string;
  studentId: string;
  type: string; // 'academic_fee', 'transport_fee', 'fine', 'overpayment', 'transport_fee_waiver'
  sourceId?: string;
  sourceType?: string;
  amount: number;
  adminFee: number;
  netAmount: number;
  reason: string;
  status: string;
  priority: string;
  refundMethod: string;
  approvedBy?: string;
  approvedAt?: string;
  processedBy?: string;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    class: string;
    section: string;
  };
  approvals?: Array<{
    approver: {
      firstName: string;
      lastName: string;
      email: string;
    };
    action: string;
    comments: string;
    createdAt: string;
  }>;
}

export default function TransportRefunds({ 
  isDark, 
  card, 
  text, 
  subtext, 
  btnPrimary, 
  btnSecondary, 
  btnDanger,
  theme 
}: TransportRefundsProps) {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState('');

  // Handle approve refund
  const handleApproveRefund = async (refundId: string) => {
    try {
      const response = await fetch(`/api/transport/approvals/${refundId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          comments: 'Approved via transport refunds management'
        })
      });

      if (response.ok) {
        fetchRefunds(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to approve refund');
      }
    } catch (error) {
      setError('Failed to approve refund');
      console.error('Approve refund error:', error);
    }
  };

  // Handle reject refund
  const handleRejectRefund = async (refundId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/transport/approvals/${refundId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          comments: reason
        })
      });

      if (response.ok) {
        fetchRefunds(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reject refund');
      }
    } catch (error) {
      setError('Failed to reject refund');
      console.error('Reject refund error:', error);
    }
  };

  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  const fetchRefunds = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(requestTypeFilter !== 'all' && { requestType: requestTypeFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/transport/refunds?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transport refunds');
      }
      
      const data = await response.json();
      setRefunds(data.refunds || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [page, pageSize, statusFilter, requestTypeFilter, searchTerm]);

  const getStatusBadge = (status: string, type?: string) => {
    const statusConfig: Record<string, any> = {
      pending: { color: 'bg-yellow-100 text-yellow-600', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-600', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-600', icon: XCircle, label: 'Rejected' },
      processed: { color: 'bg-blue-100 text-blue-600', icon: CheckCircle, label: 'Processed' },
      pending_waiver_approval: { color: 'bg-orange-100 text-orange-600', icon: Clock, label: 'Waiver Pending' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {type === 'transport_fee_waiver' ? `Waiver ${config.label}` : config.label}
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${card} p-6 rounded-xl border`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-semibold ${text}`}>Transport Refunds & Waivers</h2>
            <p className={`text-sm ${subtext} mt-1`}>
              Manage transport fee refunds and waiver requests
            </p>
          </div>
          <button
            onClick={fetchRefunds}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : isDark 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${card} p-4 rounded-xl border`}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${subtext}`} />
              <input
                type="text"
                placeholder="Search by student name, admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${input} pl-10`}
              />
            </div>
          </div>

          {/* Request Type Filter */}
          <div>
            <select
              value={requestTypeFilter}
              onChange={(e) => setRequestTypeFilter(e.target.value)}
              className={input}
            >
              <option value="all">All Types</option>
              <option value="refund">Refunds Only</option>
              <option value="waiver">Waivers Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={input}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processed">Processed</option>
              <option value="pending_waiver_approval">Waiver Pending</option>
            </select>
          </div>

          {/* Page Size */}
          <div>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className={input}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg bg-red-100/20 text-red-600 border border-red-200/20`}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className={subtext}>Loading refunds...</p>
        </div>
      )}

      {!loading && refunds.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <span className="text-2xl">💸</span>
            </div>
            <p className={`font-medium ${text} mb-2`}>No transport refunds found</p>
            <p className={`text-sm ${subtext}`}>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Transport refunds will appear here when created'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Student
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Type
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Amount
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Net Amount
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Date
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${subtext} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {refunds.map((refund, index) => (
                  <motion.tr
                    key={refund.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className={`hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} transition-colors`}
                  >
                    <td className="px-4 py-4">
                      <div>
                        <div className={`font-medium ${text}`}>
                          {refund.student?.name || 'Unknown Student'}
                        </div>
                        <div className={`text-sm ${subtext}`}>
                          {refund.student?.admissionNo} • {refund.student?.class}-{refund.student?.section}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        refund.type === 'transport_fee_waiver' 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {refund.type === 'transport_fee_waiver' ? 'Waiver' : 'Refund'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`font-medium ${text}`}>
                        ₹{refund.amount}
                      </div>
                      {refund.adminFee > 0 && (
                        <div className={`text-xs ${subtext}`}>
                          Admin fee: ₹{refund.adminFee}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className={`font-medium ${text}`}>
                        ₹{refund.netAmount}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(refund.status, refund.type)}
                    </td>
                    <td className="px-4 py-4">
                      <div className={`text-sm ${subtext}`}>
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRefund(refund);
                            setShowDetailsModal(true);
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                            isDark 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        
                        {/* Show approve/reject buttons for pending requests */}
                        {(refund.status === 'pending' || refund.status === 'pending_waiver_approval') && (
                          <>
                            <button
                              onClick={() => handleApproveRefund(refund.id)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                isDark 
                                  ? 'bg-green-600 text-white hover:bg-green-700' 
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleRejectRefund(refund.id)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                isDark 
                                  ? 'bg-red-600 text-white hover:bg-red-700' 
                                  : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`${card} p-4 rounded-xl border`}>
          <div className="flex items-center justify-between">
            <div className={`text-sm ${subtext}`}>
              Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to {Math.min(page * pageSize, totalCount)} of {totalCount} refunds
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        pageNum === page
                          ? 'bg-blue-500 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  page === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRefund && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 ${card} rounded-xl border`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${text}`}>Refund Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRefund(null);
                }}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Student Info */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-2 ${text}`}>Student Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={subtext}>Name:</span>
                    <p className={`font-medium ${text}`}>{selectedRefund.student?.name}</p>
                  </div>
                  <div>
                    <span className={subtext}>Admission No:</span>
                    <p className={`font-medium ${text}`}>{selectedRefund.student?.admissionNo}</p>
                  </div>
                  <div>
                    <span className={subtext}>Class:</span>
                    <p className={`font-medium ${text}`}>{selectedRefund.student?.class}-{selectedRefund.student?.section}</p>
                  </div>
                </div>
              </div>

              {/* Refund Info */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-2 ${text}`}>Refund Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={subtext}>Amount:</span>
                    <p className={`font-medium ${text}`}>₹{selectedRefund.amount}</p>
                  </div>
                  <div>
                    <span className={subtext}>Admin Fee:</span>
                    <p className={`font-medium ${text}`}>₹{selectedRefund.adminFee}</p>
                  </div>
                  <div>
                    <span className={subtext}>Net Amount:</span>
                    <p className={`font-medium ${text}`}>₹{selectedRefund.netAmount}</p>
                  </div>
                  <div>
                    <span className={subtext}>Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedRefund.status)}</div>
                  </div>
                  <div>
                    <span className={subtext}>Created:</span>
                    <p className={`font-medium ${text}`}>{new Date(selectedRefund.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className={subtext}>Reason:</span>
                    <p className={`font-medium ${text}`}>{selectedRefund.reason}</p>
                  </div>
                </div>
              </div>

              {/* Approval History */}
              {selectedRefund.approvals && selectedRefund.approvals.length > 0 && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h4 className={`font-medium mb-2 ${text}`}>Approval History</h4>
                  <div className="space-y-2">
                    {selectedRefund.approvals.map((approval, index) => (
                      <div key={index} className={`text-sm p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${text}`}>
                            {approval.approver.firstName} {approval.approver.lastName}
                          </span>
                          <span className={subtext}>
                            {new Date(approval.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className={subtext}>
                          {approval.action} • {approval.comments}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
