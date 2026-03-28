'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { showToast } from '@/lib/toastUtils';
import { Search, Filter, ChevronLeft, ChevronRight, Calendar, User, Clock } from 'lucide-react';

interface EnhancedDiscountApprovalQueueProps {
  theme: 'dark' | 'light';
  canApproveDiscounts: boolean;
  viewMode: 'my_requests' | 'all';
}

export default function EnhancedDiscountApprovalQueue({ theme, canApproveDiscounts, viewMode }: EnhancedDiscountApprovalQueueProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<any>(null);
  const [feeStructures, setFeeStructures] = useState<Array<{id: string; name: string; class?: {name: string}}>>([]);
  const [students, setStudents] = useState<Array<{id: string; name: string; class?: string; section?: string}>>([]);
  const [classes, setClasses] = useState<Array<{id: string; name: string}>>([]);
  const [transportRoutes, setTransportRoutes] = useState<Array<{id: string; routeName: string; name: string; routeNumber: string}>>([]);
  
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
    if (viewMode === 'my_requests') params.set('mine', 'true');
    
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
    fetchStudentsAndClasses();
    fetchTransportRoutes();
  }, []);

  const fetchStudentsAndClasses = async () => {
    try {
      const [studRes, configRes] = await Promise.all([
        fetch('/api/students?page=1&limit=500'), 
        fetch('/api/school-config'),
      ]);
      if (studRes.ok) {
        const d = await studRes.json();
        setStudents((d.students || []).map((s: any) => ({ 
          id: s.id, 
          name: s.name, 
          class: s.class?.name || s.class, 
          section: s.section?.name || s.section 
        })));
      }
      if (configRes.ok) {
        const d = await configRes.json();
        setClasses((d.classes || d.dropdowns?.classes || []).map((c: any) => ({ id: c.id || c.value, name: c.name || c.label })));
      }
    } catch (err) {
      console.error('Failed to fetch students/classes:', err);
    }
  };

  const fetchTransportRoutes = async () => {
    try {
      const res = await fetch('/api/transport/routes');
      if (res.ok) {
        const d = await res.json();
        setTransportRoutes((d.routes || []).map((r: any) => ({ 
          id: r.id, 
          routeName: r.routeName || r.name, 
          name: r.name || r.routeName,
          routeNumber: r.routeNumber 
        })));
      }
    } catch (err) {
      console.error('Failed to fetch transport routes:', err);
    }
  };

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

  const resolveStudentNames = (studentIds: string[]): string => {
    if (!studentIds?.length) return '-';
    const names = studentIds.slice(0, 3).map(id => {
      const student = students.find(s => s.id === id);
      if (!student) return id;
      return student.class ? `${student.name} (${student.class})` : student.name;
    });
    const suffix = studentIds.length > 3 ? ` +${studentIds.length - 3} more` : '';
    return names.join(', ') + suffix;
  };

  const resolveClassNames = (classIds: string[]): string => {
    if (!classIds?.length) return '-';
    const names = classIds.slice(0, 3).map(id => classes.find(c => c.id === id)?.name || id);
    const suffix = classIds.length > 3 ? ` +${classIds.length - 3} more` : '';
    return names.join(', ') + suffix;
  };

  const getTargetDisplay = (request: any): { students: string; classes: string; transport: string } => {
    let studentIds: string[] = [];
    let classIds: string[] = [];
    let transportRouteIds: string[] = [];
    try { studentIds = JSON.parse(request.studentIds || '[]'); } catch { studentIds = []; }
    try { classIds = JSON.parse(request.classIds || '[]'); } catch { classIds = []; }
    try { transportRouteIds = JSON.parse(request.transportRouteIds || '[]'); } catch { transportRouteIds = []; }
    
    const studentNames = studentIds.slice(0, 3).map(id => {
      const student = students.find(s => s.id === id);
      return student ? student.name : `Student (${id.slice(0, 8)}...)`;
    });
    const classNames = classIds.slice(0, 3).map(id => {
      const cls = classes.find(c => c.id === id);
      return cls ? cls.name : `Class (${id.slice(0, 8)}...)`;
    });
    const transportNames = transportRouteIds.slice(0, 3).map(id => {
      const route = transportRoutes.find(r => r.id === id);
      return route ? (route.routeName || route.name || `Route ${route.routeNumber}`) : `Route (${id.slice(0, 8)}...)`;
    });
    
    const suffix = (arr: any[], count: number) => arr.length > count ? ` +${arr.length - count} more` : '';
    
    return {
      students: studentNames.join(', ') + suffix(studentIds, 3),
      classes: classNames.join(', ') + suffix(classIds, 3),
      transport: transportNames.join(', ') + suffix(transportRouteIds, 3)
    };
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
        
      if (data.success && data.data && Array.isArray(data.data)) {
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
      showToast('error', 'Error', err.message);
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
              <th className="px-4 py-3">Student / Class</th>
              <th className="px-4 py-3">Academic Year</th>
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
                  {(() => {
                    const target = getTargetDisplay(request);
                    return (
                      <div>
                        {request.scope === 'student' && <p className={`text-sm font-medium ${textPrimary}`}>{target.students}</p>}
                        {request.scope === 'class' && <p className={`text-sm font-medium ${textPrimary}`}>{target.classes}</p>}
                        {request.scope === 'transport' && <p className={`text-sm font-medium ${textPrimary}`}>{target.transport}</p>}
                        {request.scope === 'bulk' && (
                          <div>
                            <p className={`text-xs ${textSecondary}`}>S: {target.students}</p>
                            <p className={`text-xs ${textSecondary}`}>C: {target.classes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {request.academicYear || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{request.requestedByName || 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${textPrimary}`}>
                    {(() => {
                      if (request.discountType === 'percentage') {
                        // Calculate based on scope - bulk vs individual
                        let feeStructureIds: string[] = [];
                        try {
                          feeStructureIds = JSON.parse(request.feeStructureIds || '[]');
                        } catch (e) {
                          feeStructureIds = [];
                        }
                        
                        // Get fee structures to calculate amounts
                        const structures = feeStructureIds.map(id => {
                          const structure = feeStructures.find(fs => fs.id === id);
                          return structure ? structure : null;
                        }).filter(Boolean);
                        
                        // Calculate total fee amounts for bulk discounts
                        const totalFeeAmount = structures.reduce((sum, structure: any) => {
                          return sum + (Number(structure?.amount) || 0);
                        }, 0);
                        
                        // For bulk discounts (class/bus level), use total fee amount
                        // For individual student discounts, we can't calculate exact amount without pending data
                        if (request.scope === 'class' || request.scope === 'transport') {
                          // Bulk discount - calculate on total fee amount
                          const discountAmount = (totalFeeAmount * Number(request.discountValue)) / 100;
                          const cappedAmount = request.maxCapAmount ? Math.min(discountAmount, Number(request.maxCapAmount)) : discountAmount;
                          return `${request.discountValue}% = ₹${cappedAmount.toLocaleString('en-IN')}`;
                        } else {
                          // Individual student discount - show context
                          return `${request.discountValue}% of ${structures.length} fee${structures.length !== 1 ? 's' : ''}`;
                        }
                      } else if (request.discountType === 'full_waiver') {
                        return 'Full Waiver';
                      } else if (request.discountType === 'fixed') {
                        // Calculate total impact for fixed amount
                        let feeStructureIds: string[] = [];
                        try {
                          feeStructureIds = JSON.parse(request.feeStructureIds || '[]');
                        } catch (e) {
                          feeStructureIds = [];
                        }
                        
                        if (feeStructureIds.length === 0) {
                          return 'No fee structures selected';
                        }
                        const totalImpact = Number(request.discountValue) * feeStructureIds.length;
                        return `₹${request.discountValue} × ${feeStructureIds.length} fee${feeStructureIds.length !== 1 ? 's' : ''} = ₹${totalImpact.toLocaleString('en-IN')}`;
                      }
                      return request.discountValue;
                    })()}
                  </span>
                  {request.discountType === 'percentage' && (request.scope === 'class' || request.scope === 'transport') && (
                    <span className={`text-xs ${textSecondary} block`}>
                      Bulk discount on total fee amounts
                    </span>
                  )}
                  {request.discountType === 'percentage' && request.scope === 'student' && (
                    <span className={`text-xs ${textSecondary} block`}>
                      Amount calculated per student based on pending balance
                    </span>
                  )}
                  {request.discountType === 'percentage' && request.maxCapAmount && (
                    <span className={`text-xs ${textSecondary} block`}>
                      Max cap: ₹{request.maxCapAmount}
                    </span>
                  )}
                  {request.discountType === 'fixed' && (() => {
                    let feeStructureIds: string[] = [];
                    try {
                      feeStructureIds = JSON.parse(request.feeStructureIds || '[]');
                    } catch (e) {
                      feeStructureIds = [];
                    }
                    return feeStructureIds.length > 0 && (
                      <span className={`text-xs ${textSecondary} block`}>
                        ₹{request.discountValue} × {feeStructureIds.length} fee{feeStructureIds.length !== 1 ? 's' : ''}
                      </span>
                    );
                  })()}
                  {request.maxCapAmount && request.discountType !== 'percentage' && (
                    <span className={`text-xs ${textSecondary} block`}>Max: ₹{request.maxCapAmount}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    request.scope === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    request.scope === 'class' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    request.scope === 'transport' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    request.scope === 'bulk' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {request.scope === 'student' ? '👤 Single' : 
                     request.scope === 'class' ? '🏫 Class' :
                     request.scope === 'transport' ? '🚌 Transport' :
                     request.scope === 'bulk' ? '👥 Bulk' : 
                     request.scope}
                  </div>
                  <div className={`text-xs ${textSecondary} mt-1 whitespace-nowrap`}>
                    {request.targetType.replace('_', ' ')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${getStatusColor(request.status)}`}>
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
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all transform hover:scale-105 shadow-sm hover:shadow-md ${
                      isDark 
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-emerald-500 shadow-emerald-500/25' 
                        : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-emerald-400 shadow-emerald-400/25'
                    }`}
                  >
                    👁️ View
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

      {/* Detail Modal - Redesigned */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200'} border`}>
            
            {/* Header with Status Badge - Compact Design */}
            <div className={`relative p-4 pb-3 ${isDark ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30' : 'bg-gradient-to-r from-blue-50 to-purple-50'} border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className={`text-lg font-black ${textPrimary}`}>🎁 Discount Request Details</h2>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${
                      selectedRequest.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' :
                      selectedRequest.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' :
                      selectedRequest.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                    }`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <p className={`${textSecondary} text-sm`}>{selectedRequest.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs ${textSecondary}">
                    <span>📅 {new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                    <span>👤 {selectedRequest.requestedByName}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedRequest(null)}
                  className={`p-2 rounded-lg transition-all transform hover:scale-110 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  ✕
                </button>
              </div>
              
              {/* Action Buttons - Right Side */}
              {selectedRequest.status === 'pending' && canApproveDiscounts && (
                <div className="flex justify-end mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(selectedRequest.id, 'approve', approvalNote)}
                      className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-all transform hover:scale-105 shadow hover:shadow-lg flex items-center justify-center gap-1.5 min-w-[120px] ${
                        isProcessing 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          ✅ Approve
                        </>
                      )}
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(selectedRequest.id, 'reject', approvalNote)}
                      className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-all transform hover:scale-105 shadow hover:shadow-lg flex items-center justify-center gap-1.5 min-w-[120px] ${
                        isProcessing 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
                      }`}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              )}
              
              {/* Apply Button - Right Side */}
              {selectedRequest.status === 'approved' && canApproveDiscounts && (
                <div className="flex justify-end mt-3">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleAction(selectedRequest.id, 'apply')}
                    className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-all transform hover:scale-105 shadow hover:shadow-lg flex items-center justify-center gap-1.5 min-w-[140px] ${
                      isProcessing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        🚀 Apply
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* Main Content - Compact Design */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Quick Info Cards - Compact Design */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'} border`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-800/50' : 'bg-blue-200/50'}`}>
                      <span className="text-sm">💰</span>
                    </div>
                    <h4 className={`font-semibold text-sm ${textPrimary}`}>Discount Impact</h4>
                  </div>
                  <p className={`text-lg font-bold ${textPrimary}`}>
                    {(() => {
                      if (selectedRequest.discountType === 'percentage') {
                        // Calculate based on scope - bulk vs individual
                        let feeStructureIds: string[] = [];
                        try {
                          feeStructureIds = JSON.parse(selectedRequest.feeStructureIds || '[]');
                        } catch (e) {
                          feeStructureIds = [];
                        }
                        
                        // Get fee structures to calculate amounts
                        const structures = feeStructureIds.map(id => {
                          const structure = feeStructures.find(fs => fs.id === id);
                          return structure ? structure : null;
                        }).filter(Boolean);
                        
                        // Calculate total fee amounts for bulk discounts
                        const totalFeeAmount = structures.reduce((sum, structure: any) => {
                          return sum + (Number(structure?.amount) || 0);
                        }, 0);
                        
                        // For bulk discounts (class/bus level), use total fee amount
                        // For individual student discounts, we can't calculate exact amount without pending data
                        if (selectedRequest.scope === 'class' || selectedRequest.scope === 'transport') {
                          // Bulk discount - calculate on total fee amount
                          const discountAmount = (totalFeeAmount * Number(selectedRequest.discountValue)) / 100;
                          const cappedAmount = selectedRequest.maxCapAmount ? Math.min(discountAmount, Number(selectedRequest.maxCapAmount)) : discountAmount;
                          return `${selectedRequest.discountValue}% = ₹${cappedAmount.toLocaleString('en-IN')}`;
                        } else {
                          // Individual student discount - show context
                          return `${selectedRequest.discountValue}% of ${structures.length} fee${structures.length !== 1 ? 's' : ''}`;
                        }
                      } else if (selectedRequest.discountType === 'full_waiver') {
                        return 'Full Waiver';
                      } else if (selectedRequest.discountType === 'fixed') {
                        // Calculate total impact for fixed amount
                        let feeStructureIds: string[] = [];
                        try {
                          feeStructureIds = JSON.parse(selectedRequest.feeStructureIds || '[]');
                        } catch (e) {
                          feeStructureIds = [];
                        }
                        
                        let studentIds: string[] = [];
                        try {
                          studentIds = JSON.parse(selectedRequest.studentIds || '[]');
                        } catch (e) {
                          studentIds = [];
                        }
                        
                        if (feeStructureIds.length === 0) {
                          return 'No fee structures selected';
                        }
                        const totalImpact = Number(selectedRequest.discountValue) * feeStructureIds.length;
                        return `₹${selectedRequest.discountValue} × ${feeStructureIds.length} fee${feeStructureIds.length !== 1 ? 's' : ''} = ₹${totalImpact.toLocaleString('en-IN')}`;
                      }
                      return selectedRequest.discountValue;
                    })()}
                  </p>
                  {selectedRequest.discountType === 'percentage' && (selectedRequest.scope === 'class' || selectedRequest.scope === 'transport') && (
                    <p className={`text-xs ${textSecondary} mt-1`}>
                      Bulk discount on total fee amounts
                    </p>
                  )}
                  {selectedRequest.discountType === 'percentage' && selectedRequest.scope === 'student' && (
                    <p className={`text-xs ${textSecondary} mt-1`}>
                      Amount calculated per student based on pending balance
                    </p>
                  )}
                  {selectedRequest.discountType === 'percentage' && selectedRequest.maxCapAmount && (
                    <p className={`text-xs ${textSecondary} mt-1`}>
                      Max cap: ₹{selectedRequest.maxCapAmount}
                    </p>
                  )}
                  {selectedRequest.maxCapAmount && (
                    <p className={`text-xs ${textSecondary} mt-1`}>Max: ₹{selectedRequest.maxCapAmount}</p>
                  )}
                  {selectedRequest.discountType === 'fixed' && (() => {
                    let studentIds: string[] = [];
                    try {
                      studentIds = JSON.parse(selectedRequest.studentIds || '[]');
                    } catch (e) {
                      studentIds = [];
                    }
                    return studentIds.length > 0 && (
                      <p className={`text-xs ${textSecondary} mt-1`}>
                        For {studentIds.length} student{studentIds.length !== 1 ? 's' : ''}
                      </p>
                    );
                  })()}
                </div>
                
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'} border`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${isDark ? 'bg-purple-800/50' : 'bg-purple-200/50'}`}>
                      <span className="text-sm">🎯</span>
                    </div>
                    <h4 className={`font-semibold text-sm ${textPrimary}`}>Scope</h4>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                    selectedRequest.scope === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    selectedRequest.scope === 'class' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    selectedRequest.scope === 'transport' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                    selectedRequest.scope === 'bulk' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {selectedRequest.scope === 'student' ? '👤 Single' : 
                     selectedRequest.scope === 'class' ? '🏫 Class' :
                     selectedRequest.scope === 'transport' ? '🚌 Transport' :
                     selectedRequest.scope === 'bulk' ? '👥 Bulk' : 
                     selectedRequest.scope}
                  </div>
                  <p className={`text-xs ${textSecondary} mt-1`}>{selectedRequest.targetType.replace('_', ' ')}</p>
                </div>
                
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-700/50' : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50'} border`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${isDark ? 'bg-green-800/50' : 'bg-green-200/50'}`}>
                      <span className="text-sm">📚</span>
                    </div>
                    <h4 className={`font-semibold text-sm ${textPrimary}`}>Academic Year</h4>
                  </div>
                  <p className={`text-lg font-bold ${textPrimary}`}>{selectedRequest.academicYear || '-'}</p>
                </div>
              </div>
              
              {/* Detailed Information - Compact Design */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Information */}
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary} mb-4 flex items-center gap-2`}>
                    📋 Request Information
                  </h3>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'} border space-y-3`}>
                    <div>
                      <label className={`text-xs font-semibold ${textSecondary} block mb-1`}>Description</label>
                      <p className={`text-sm ${textPrimary}`}>{selectedRequest.description}</p>
                    </div>
                    
                    {selectedRequest.scope === 'student' && (() => {
                      let sIds: string[] = []; try { sIds = JSON.parse(selectedRequest.studentIds || '[]'); } catch {}
                      return sIds.length > 0 ? (
                        <div>
                          <label className={`text-xs font-semibold ${textSecondary} block mb-2`}>Target Students ({sIds.length})</label>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {sIds.map(id => {
                              const s = students.find(st => st.id === id);
                              return (
                                <span key={id} className={`px-2 py-1 text-xs rounded-full font-medium ${isDark ? 'bg-blue-900/30 text-blue-200 border-blue-700/50' : 'bg-blue-100 text-blue-800 border-blue-200/50'} border`}>
                                  👤 {s ? `${s.name}${s.class ? ` (${s.class})` : ''}` : id}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    
                    {(selectedRequest.scope === 'class' || selectedRequest.scope === 'bulk') && (() => {
                      let cIds: string[] = []; try { cIds = JSON.parse(selectedRequest.classIds || '[]'); } catch {}
                      return cIds.length > 0 ? (
                        <div>
                          <label className={`text-xs font-semibold ${textSecondary} block mb-2`}>Target Classes ({cIds.length})</label>
                          <div className="flex flex-wrap gap-1">
                            {cIds.map(id => {
                              const c = classes.find(cl => cl.id === id);
                              return (
                                <span key={id} className={`px-2 py-1 text-xs rounded-full font-medium ${isDark ? 'bg-green-900/30 text-green-200 border-green-700/50' : 'bg-green-100 text-green-800 border-green-200/50'} border`}>
                                  🏫 {c?.name || id}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    
                    {selectedRequest.scope === 'transport' && (() => {
                      let routeIds: string[] = []; try { routeIds = JSON.parse(selectedRequest.transportRouteIds || '[]'); } catch {}
                      return routeIds.length > 0 ? (
                        <div>
                          <label className={`text-xs font-semibold ${textSecondary} block mb-2`}>Target Transport Routes ({routeIds.length})</label>
                          <div className="flex flex-wrap gap-1">
                            {routeIds.map(id => {
                              const route = transportRoutes.find(r => r.id === id);
                              return (
                                <span key={id} className={`px-2 py-1 text-xs rounded-full font-medium ${isDark ? 'bg-orange-900/30 text-orange-200 border-orange-700/50' : 'bg-orange-100 text-orange-800 border-orange-200/50'} border`}>
                                  🚌 {route ? (route.routeName || route.name || `Route ${route.routeNumber}`) : id}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    
                    {selectedRequest.scope === 'bulk' && (() => {
                      let sIds: string[] = []; try { sIds = JSON.parse(selectedRequest.studentIds || '[]'); } catch {}
                      return sIds.length > 0 ? (
                        <div>
                          <label className={`text-xs font-semibold ${textSecondary} block mb-2`}>Additional Students ({sIds.length})</label>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {sIds.map(id => {
                              const s = students.find(st => st.id === id);
                              return (
                                <span key={id} className={`px-2 py-1 text-xs rounded-full font-medium ${isDark ? 'bg-purple-900/30 text-purple-200 border-purple-700/50' : 'bg-purple-100 text-purple-800 border-purple-200/50'} border`}>
                                  👤 {s?.name || id}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
                
                {/* Discount Details */}
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary} mb-4 flex items-center gap-2`}>
                    💸 Discount Configuration
                  </h3>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'} border space-y-3`}>
                    <div>
                      <label className={`text-xs font-semibold ${textSecondary} block mb-1`}>Discount Type</label>
                      <p className={`text-sm font-medium ${textPrimary}`}>
                        {selectedRequest.discountType === 'percentage' ? '📊 Percentage Based' : '💰 Fixed Amount'}
                      </p>
                    </div>
                    
                    <div>
                      <label className={`text-xs font-semibold ${textSecondary} block mb-1`}>Target Type</label>
                      <p className={`text-sm font-medium ${textPrimary}`}>
                        {selectedRequest.targetType === 'total' ? '📈 Total Fees' : '🎯 Specific Fee Structures'}
                      </p>
                    </div>
                    
                    {selectedRequest.targetType === 'fee_structure' && (
                      <div>
                        <label className={`text-xs font-semibold ${textSecondary} block mb-2`}>Selected Fee Structures</label>
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900/30' : 'bg-white'} border ${isDark ? 'border-gray-600/50' : 'border-gray-300/50'}`}>
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
                                  <div key={structure.id} className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-600/50' : 'border-gray-200/50'}`}>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className={`text-sm font-medium ${textPrimary}`}>{structure.name}</span>
                                        <p className={`text-xs ${textSecondary} mt-1`}>
                                          {structure.class ? `🏫 ${structure.class}` : '📚 All Classes'}
                                        </p>
                                      </div>
                                      <div className={`px-2 py-0.5 text-xs rounded-full font-medium ${isDark ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                        Active
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className={`text-sm ${textSecondary}`}>No specific fee structures selected</p>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {selectedRequest.targetType === 'total' && (
                      <div>
                        <label className={`text-xs font-semibold ${textSecondary} block mb-1`}>Fee Coverage</label>
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/20' : 'bg-gradient-to-r from-green-50 to-emerald-50'} border ${isDark ? 'border-green-700/50' : 'border-green-200/50'}`}>
                          <p className={`text-sm font-medium ${textPrimary}`}>📊 All Fee Structures</p>
                          <p className={`text-xs ${textSecondary} mt-1`}>Applies to total fees for selected students/classes</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Reason Section - Compact Design */}
              {selectedRequest.reason && (
                <div className="mt-6">
                  <h3 className={`text-lg font-bold ${textPrimary} mb-3 flex items-center gap-2`}>
                    📝 Reason for Request
                  </h3>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200/50'} border`}>
                    <p className={`text-sm ${textPrimary} leading-relaxed`}>{selectedRequest.reason}</p>
                  </div>
                </div>
              )}
              
              {/* Approval Note Input - Compact Design */}
              {selectedRequest.status === 'pending' && canApproveDiscounts && (
                <div className="mt-6">
                  <h3 className={`text-lg font-bold ${textPrimary} mb-3 flex items-center gap-2`}>
                    💬 Approval Note (Optional)
                  </h3>
                  <textarea
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Add a note for this approval or rejection..."
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400' : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
                  />
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
