'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Ban,
  FileText,
  User,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { showToast } from '@/lib/toastUtils';

interface WaiverRequest {
  id: string;
  fineId: string;
  requestedBy: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  reason: string;
  remarks: string;
  waiveAmount: number;
  documents: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  createdAt: Date;
  fine: {
    id: string;
    fineNumber: string;
    type: string;
    category: string;
    description: string;
    amount: number;
    paidAmount: number;
    waivedAmount: number;
    pendingAmount: number;
    status: string;
    issuedAt: string;
    dueDate: string;
    student: {
      id: string;
      name: string;
      admissionNo: string;
      class: string;
      section: string;
    };
  };
}

export default function WaiverRequestsPage() {
  const { theme } = useTheme();
  const [waiverRequests, setWaiverRequests] = useState<WaiverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WaiverRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const isDark = theme === 'dark';
  const card = `rounded-lg border p-4 ${isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`;
  const btnPrimary = `px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
  const btnSecondary = `px-4 py-2 rounded-lg text-sm font-medium border transition-all ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnSuccess = `px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`;
  const btnDanger = `px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`;

  useEffect(() => {
    fetchWaiverRequests();
  }, [search, selectedStatus, pagination.page]);

  const fetchWaiverRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(search && { search })
      });

      const response = await fetch(`/api/fines/waiver-requests?${params}`);
      const data = await response.json();

      if (data.success) {
        setWaiverRequests(data.waiverRequests);
        setPagination(data.pagination);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this waiver request?')) {
      return;
    }

    setProcessing(requestId);
    try {
      const response = await fetch(`/api/fines/waiver-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          remarks: 'Approved by admin'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve request');
      }

      await fetchWaiverRequests();
      showToast('success', 'Approved', 'Waiver request approved successfully!');
    } catch (err: any) {
      showToast('error', 'Approval Failed', `Error approving request: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const remarks = prompt('Reason for rejection (optional):');
    
    setProcessing(requestId);
    try {
      const response = await fetch(`/api/fines/waiver-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          remarks: remarks || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject request');
      }

      await fetchWaiverRequests();
      showToast('success', 'Rejected', 'Waiver request rejected successfully!');
    } catch (err: any) {
      showToast('error', 'Rejection Failed', `Error rejecting request: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <AppLayout currentPage="fines" title="Waiver Requests">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className={card}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Waiver Requests
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage fine waiver requests from students and parents
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={card}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by student name, admission number, or fine number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`pl-10 pr-4 py-2 w-full rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={btnSecondary}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className={card}>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading waiver requests...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <button onClick={fetchWaiverRequests} className={btnPrimary + ' mt-4'}>
                Retry
              </button>
            </div>
          ) : waiverRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No waiver requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Student
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fine Details
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reason
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Requested
                    </th>
                    <th className="p-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {waiverRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {request.fine.student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.fine.student.admissionNo} • {request.fine.student.class} - {request.fine.student.section}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {request.fine.fineNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.fine.type} • {request.fine.category}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">
                            {request.fine.description}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {request.reason}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ₹{request.waiveAmount ? request.waiveAmount.toLocaleString() : '0'}
                        </div>
                        <div className="text-xs text-gray-500">
                          of ₹{request.fine.amount ? request.fine.amount.toLocaleString() : '0'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status || 'pending')}`}>
                          {getStatusIcon(request.status || 'pending')}
                          {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.requestedBy || 'Unknown'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(request.id)}
                                disabled={processing === request.id}
                                className={`p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors ${
                                  processing === request.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleReject(request.id)}
                                disabled={processing === request.id}
                                className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${
                                  processing === request.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className={card}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total.toLocaleString()} requests
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={pagination.pageSize}
                  onChange={(e) => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), page: 1 }))}
                  className={`px-3 py-1 text-sm border rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                    disabled={!pagination.hasPrev}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      pagination.hasPrev
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    First
                  </button>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPrev}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      pagination.hasPrev
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <span className="px-3 py-1 text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNext}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      pagination.hasNext
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                    disabled={!pagination.hasNext}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      pagination.hasNext
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={card}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Waiver Request Details
                    </h2>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Student Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student Information</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Name:</span>
                          <p className="font-medium">{selectedRequest.fine.student.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Admission No:</span>
                          <p className="font-medium">{selectedRequest.fine.student.admissionNo}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Class:</span>
                          <p className="font-medium">{selectedRequest.fine.student.class} - {selectedRequest.fine.student.section}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Requester:</span>
                          <p className="font-medium">{selectedRequest.requestedBy}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fine Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fine Details</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Fine Number:</span>
                          <p className="font-medium">{selectedRequest.fine.fineNumber}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Type:</span>
                          <p className="font-medium">{selectedRequest.fine.type}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Category:</span>
                          <p className="font-medium">{selectedRequest.fine.category}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Description:</span>
                          <p className="font-medium">{selectedRequest.fine.description}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Total Amount:</span>
                          <p className="font-medium">₹{selectedRequest.fine.amount ? selectedRequest.fine.amount.toLocaleString() : '0'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Waiver Amount:</span>
                          <p className="font-medium text-blue-600">₹{selectedRequest.waiveAmount ? selectedRequest.waiveAmount.toLocaleString() : '0'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Request Information</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">Reason:</span>
                          <p className="font-medium">{selectedRequest.reason}</p>
                        </div>
                        {selectedRequest.remarks && (
                          <div>
                            <span className="text-sm text-gray-500">Remarks:</span>
                            <p className="font-medium">{selectedRequest.remarks}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-500">Status:</span>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status || 'pending')}`}>
                              {getStatusIcon(selectedRequest.status || 'pending')}
                              {(selectedRequest.status || 'pending').charAt(0).toUpperCase() + (selectedRequest.status || 'pending').slice(1)}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Requested:</span>
                            <p className="font-medium">{selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'N/A'}</p>
                          </div>
                        </div>
                        
                        {selectedRequest.reviewedAt && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-500">Reviewed By:</span>
                              <p className="font-medium">{selectedRequest.reviewedByName}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Reviewed At:</span>
                              <p className="font-medium">{selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString() : 'N/A'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedRequest.status === 'pending' && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setShowDetailsModal(false)}
                        className={btnSecondary}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleReject(selectedRequest.id);
                        }}
                        disabled={processing === selectedRequest.id}
                        className={btnDanger}
                      >
                        {processing === selectedRequest.id ? 'Processing...' : 'Reject'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleApprove(selectedRequest.id);
                        }}
                        disabled={processing === selectedRequest.id}
                        className={btnSuccess}
                      >
                        {processing === selectedRequest.id ? 'Processing...' : 'Approve'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
