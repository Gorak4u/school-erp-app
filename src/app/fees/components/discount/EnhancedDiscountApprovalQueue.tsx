'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Calendar, User, Clock } from 'lucide-react';

interface EnhancedDiscountApprovalQueueProps {
  theme: 'dark' | 'light';
  userRole: string;
  viewMode: 'my_requests' | 'all';
}

export default function EnhancedDiscountApprovalQueue({ theme, userRole, viewMode }: EnhancedDiscountApprovalQueueProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<any>(null);
  const [feeStructures, setFeeStructures] = useState<Array<{id: string; name: string; class?: {name: string}}>>([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const bgCard = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const bgSecondary = isDark ? 'bg-gray-700' : 'bg-gray-50';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300';

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('pageSize', pageSize.toString());
    
    // Apply status filter for both my_requests and all views
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }
    
    if (searchQuery) params.set('search', searchQuery);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    
    return params.toString();
  }, [currentPage, pageSize, statusFilter, searchQuery, dateFrom, dateTo, viewMode]);

  useEffect(() => {
    fetchRequests();
  }, [queryParams]);

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      const res = await fetch('/api/fees/structures');
      if (res.ok) {
        const data = await res.json();
        setFeeStructures(data.feeStructures || []);
      }
    } catch (err) {
      console.error('Failed to fetch fee structures:', err);
    }
  };

  // Helper function to get fee structure names
  const getFeeStructureNames = (feeStructureIds: string[]) => {
    if (!feeStructureIds || feeStructureIds.length === 0) return [];
    
    return feeStructureIds.map(id => {
      const structure = feeStructures.find(fs => fs.id === id);
      return structure ? {
        id: structure.id,
        name: structure.name,
        class: structure.class?.name || 'All Classes'
      } : { id, name: 'Unknown Structure', class: 'N/A' };
    });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const url = `/api/fees/discount-requests${queryParams ? '?' + queryParams : ''}`;
      
      const res = await fetch(url);
      
      if (res.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      const data = await res.json();
      
      if (data.success) {
        console.log('DEBUG API Response:', { 
          totalRecords: data.pagination?.total, 
          totalPages: data.pagination?.totalPages,
          currentPage,
          pageSize,
          dataLength: data.data?.length 
        });
        setRequests(data.data);
        setTotalRecords(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 0);
      } else {
        throw new Error(data.error || 'Failed to load requests');
      }
    } catch (err: any) {
      console.error('Fetch requests error:', err);
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'apply', reason?: string) => {
    try {
      setIsProcessing(true);
      
      if (action === 'apply') {
        // Use batch apply API for better performance
        const res = await fetch(`/api/fees/discount-requests/${requestId}/apply-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to start discount application');
        }
        
        // Start tracking the batch job
        setBatchJobId(data.jobId);
        setBatchProgress({ status: 'pending', progress: 0, message: 'Starting...' });
        
        // Poll for progress
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/fees/discount-requests/${requestId}/apply-batch?jobId=${data.jobId}`);
            const statusData = await statusRes.json();
            
            if (statusData.success) {
              setBatchProgress(statusData.job);
              
              if (statusData.job.status === 'completed') {
                clearInterval(pollInterval);
                setBatchJobId(null);
                setBatchProgress(null);
                
                if ((window as any).toast) {
                  (window as any).toast({
                    type: 'success',
                    title: 'Success',
                    message: statusData.job.message,
                    duration: 5000
                  });
                }
                
                setSelectedRequest(null);
                fetchRequests(); // Refresh list
              } else if (statusData.job.status === 'failed') {
                clearInterval(pollInterval);
                setBatchJobId(null);
                setBatchProgress(null);
                
                if ((window as any).toast) {
                  (window as any).toast({
                    type: 'error',
                    title: 'Error',
                    message: statusData.job.error || 'Discount application failed',
                    duration: 5000
                  });
                }
              }
            }
          } catch (error) {
            console.error('Failed to check job status:', error);
          }
        }, 2000); // Poll every 2 seconds
        
        return;
      }
      
      // Handle approve/reject actions (existing logic)
      let url = `/api/fees/discount-requests/${requestId}`;
      let options: RequestInit = {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: reason, rejectionReason: reason })
      };

      const res = await fetch(url, options);
      const data = await res.json();

      if (!data.success && !res.ok) {
        throw new Error(data.error || `Failed to ${action} request`);
      }

      // Show success toast
      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Success',
          message: data.message || `Request ${action}d successfully`,
          duration: 3000
        });
      }

      setSelectedRequest(null);
      setApprovalNote('');
      fetchRequests(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className={`mt-2 ${textSecondary}`}>Loading discount requests...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, description, or requested by..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${inputCls}`}
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
            isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={`p-4 rounded-lg border ${bgCard}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              />
            </div>

            {/* Date To */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                }`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className={`p-4 rounded-lg border ${bgCard}`}>
        <div className="flex justify-between items-center">
          <span className={`text-sm ${textSecondary}`}>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} requests
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${textSecondary}`}>Page size:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className={`px-2 py-1 rounded border text-sm ${inputCls}`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className={`text-xs uppercase ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
            <tr>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Requested By</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <td className="px-4 py-3">
                  <div>
                    <p className={`font-medium ${textPrimary}`}>{request.name}</p>
                    <p className={`text-xs ${textSecondary}`}>{request.description}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{request.requestedByName || 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${textPrimary}`}>
                    {request.discountType === 'percentage' ? `${request.discountValue}%` : `₹${request.discountValue}`}
                  </span>
                  {request.maxCapAmount && (
                    <span className={`text-xs ${textSecondary} block`}>Max: ₹{request.maxCapAmount}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${textSecondary}`}>
                    {request.scope} • {request.targetType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs ${textSecondary}`}>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalRecords > 0 && (
        <div className="flex justify-between items-center p-4">
          <div className={`text-sm ${textSecondary}`}>
            Page {currentPage} of {totalPages} (Total: {totalRecords} records)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded border transition-colors ${
                currentPage === 1 
                  ? 'opacity-50 cursor-not-allowed' 
                  : isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded border transition-colors ${
                      pageNum === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded border transition-colors ${
                currentPage === totalPages 
                  ? 'opacity-50 cursor-not-allowed' 
                  : isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col ${bgCard}`}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-bold ${textPrimary}`}>Discount Request Details</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`font-semibold ${textPrimary} mb-4`}>Request Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Name:</span>
                      <p className={`font-medium ${textPrimary}`}>{selectedRequest.name}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Description:</span>
                      <p className={`${textPrimary}`}>{selectedRequest.description}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Created:</span>
                      <p className={`${textPrimary}`}>{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Requested By:</span>
                      <p className={`font-medium ${textPrimary}`}>{selectedRequest.requestedByName}</p>
                      <p className={`text-xs ${textSecondary}`}>{selectedRequest.requestedByEmail}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className={`font-semibold ${textPrimary} mb-4`}>Discount Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Type:</span>
                      <p className={`${textPrimary}`}>{selectedRequest.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}</p>
                    </div>
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Value:</span>
                      <p className={`font-medium ${textPrimary}`}>
                        {selectedRequest.discountType === 'percentage' ? `${selectedRequest.discountValue}%` : `₹${selectedRequest.discountValue}`}
                      </p>
                    </div>
                    {selectedRequest.maxCapAmount && (
                      <div>
                        <span className={`text-sm ${textSecondary}`}>Max Cap:</span>
                        <p className={`${textPrimary}`}>₹{selectedRequest.maxCapAmount}</p>
                      </div>
                    )}
                    <div>
                      <span className={`text-sm ${textSecondary}`}>Scope:</span>
                      <p className={`${textPrimary}`}>{selectedRequest.scope} • {selectedRequest.targetType}</p>
                    </div>
                    {selectedRequest.targetType === 'fee_structure' && (
                      <div>
                        <span className={`text-sm ${textSecondary}`}>Fee Structures:</span>
                        <div className={`mt-2 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                          {(() => {
                            let feeStructureIds = [];
                            try {
                              feeStructureIds = JSON.parse(selectedRequest.feeStructureIds || '[]');
                            } catch (e) {
                              feeStructureIds = [];
                            }
                            
                            const structures = getFeeStructureNames(feeStructureIds);
                            
                            return structures.length > 0 ? (
                              <div className="space-y-2">
                                {structures.map(structure => (
                                  <div key={structure.id} className="flex items-center justify-between">
                                    <div>
                                      <span className={`font-medium ${textPrimary}`}>{structure.name}</span>
                                      <span className={`ml-2 text-xs ${textSecondary}`}>For Student Only</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className={textSecondary}>No specific fee structures selected</p>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    {selectedRequest.targetType === 'total' && (
                      <div>
                        <span className={`text-sm ${textSecondary}`}>Fee Structures:</span>
                        <p className={`font-medium ${textPrimary}`}>All Fee Structures</p>
                        <p className={`text-xs ${textSecondary} mt-1`}>(Total Fees option - applies to all fee structures)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedRequest.reason && (
                <div className="mt-6">
                  <h3 className={`font-semibold ${textPrimary} mb-2`}>Reason</h3>
                  <p className={`${textPrimary}`}>{selectedRequest.reason}</p>
                </div>
              )}
              
              {selectedRequest.status === 'pending' && (userRole === 'admin' || userRole === 'super_admin') && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className={`font-semibold ${textPrimary} mb-4`}>Approval Action</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Approval Note (Optional)</label>
                      <textarea
                        value={approvalNote}
                        onChange={(e) => setApprovalNote(e.target.value)}
                        placeholder="Add a note for this approval..."
                        rows={3}
                        className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        disabled={isProcessing}
                        onClick={() => handleAction(selectedRequest.id, 'reject', approvalNote)}
                        className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
                      >
                        Reject Request
                      </button>
                      <button
                        disabled={isProcessing}
                        onClick={() => handleAction(selectedRequest.id, 'approve', approvalNote)}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2"
                      >
                        {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Approve Discount
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedRequest.status === 'approved' && (userRole === 'admin' || userRole === 'super_admin') && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                    <p className="text-blue-800 dark:text-blue-300 text-sm">
                      This request has been approved. Click apply to execute the batch update on all target fee records. This action cannot be undone automatically.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(selectedRequest.id, 'apply')}
                      className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium flex items-center gap-2"
                    >
                      {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      Apply to Fee Records
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Progress Modal */}
      {batchJobId && batchProgress && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${bgCard}`}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                <div 
                  className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent absolute top-0 left-0 animate-spin"
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(2 * Math.PI * batchProgress.progress / 100 - Math.PI / 2)}% ${50 + 50 * Math.sin(2 * Math.PI * batchProgress.progress / 100 - Math.PI / 2)}%, 50% 50%)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${textPrimary}`}>{batchProgress.progress}%</span>
                </div>
              </div>
              
              <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>
                Applying Discount
              </h3>
              
              <p className={`text-sm ${textSecondary} mb-4`}>
                {batchProgress.message}
              </p>
              
              {batchProgress.total > 0 && (
                <div className={`text-xs ${textSecondary} mb-4`}>
                  Processing {batchProgress.progress}% of {batchProgress.total} records
                </div>
              )}
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${batchProgress.progress}%` }}
                ></div>
              </div>
              
              <div className={`text-xs ${textSecondary}`}>
                {batchProgress.status === 'running' && 'Please do not close this window...'}
                {batchProgress.status === 'pending' && 'Starting...'}
                {batchProgress.status === 'completed' && 'Completed!'}
                {batchProgress.status === 'failed' && 'Failed!'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
