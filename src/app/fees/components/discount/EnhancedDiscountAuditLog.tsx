'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Calendar, User, Clock, FileText } from 'lucide-react';

interface EnhancedDiscountAuditLogProps {
  theme: 'dark' | 'light';
}

export default function EnhancedDiscountAuditLog({ theme }: EnhancedDiscountAuditLogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<Array<{id: string; name: string; class?: string}>>([]);
  const [classes, setClasses] = useState<Array<{id: string; name: string}>>([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
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
    
    if (actionFilter !== 'all') params.set('action', actionFilter);
    if (searchQuery) params.set('search', searchQuery);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    
    return params.toString();
  }, [currentPage, pageSize, actionFilter, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [queryParams]);

  useEffect(() => {
    const fetchStudentsAndClasses = async () => {
      try {
        const [studRes, configRes] = await Promise.all([
          fetch('/api/fees/students?page=1&limit=500'),
          fetch('/api/school-config'),
        ]);
        if (studRes.ok) {
          const d = await studRes.json();
          setStudents((d.students || d.data?.students || d.data || []).map((s: any) => ({ id: s.studentId || s.id, name: s.studentName || s.name, class: s.studentClass || s.class })));
        }
        if (configRes.ok) {
          const d = await configRes.json();
          setClasses((d.classes || d.dropdowns?.classes || []).map((c: any) => ({ id: c.id || c.value, name: c.name || c.label })));
        }
      } catch (err) {
        console.error('Failed to fetch students/classes:', err);
      }
    };
    fetchStudentsAndClasses();
  }, []);

  const resolveTarget = (log: any): string => {
    const req = log.discountRequest;
    if (!req) return '-';
    if (req.scope === 'student') {
      let ids: string[] = []; try { ids = JSON.parse(req.studentIds || '[]'); } catch {}
      if (!ids.length) return '-';
      const names = ids.slice(0, 2).map((id: string) => {
        const student = students.find(s => s.id === id);
        if (!student) return id;
        return student.class ? `${student.name} (${student.class})` : student.name;
      });
      return names.join(', ') + (ids.length > 2 ? ` +${ids.length - 2} more` : '');
    }
    if (req.scope === 'class') {
      let ids: string[] = []; try { ids = JSON.parse(req.classIds || '[]'); } catch {}
      if (!ids.length) return '-';
      const names = ids.slice(0, 2).map((id: string) => classes.find(c => c.id === id)?.name || id);
      return names.join(', ') + (ids.length > 2 ? ` +${ids.length - 2} more` : '');
    }
    if (req.scope === 'bulk') {
      let sIds: string[] = []; try { sIds = JSON.parse(req.studentIds || '[]'); } catch {}
      let cIds: string[] = []; try { cIds = JSON.parse(req.classIds || '[]'); } catch {}
      const parts = [];
      if (sIds.length) parts.push(`${sIds.length} students`);
      if (cIds.length) parts.push(classes.slice(0,2).map((c) => cIds.includes(c.id) ? c.name : null).filter(Boolean).join(', '));
      return parts.join(' / ') || '-';
    }
    return '-';
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = `/api/fees/discount-requests/audit-logs${queryParams ? '?' + queryParams : ''}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
        setTotalRecords(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 0);
      } else {
        throw new Error(data.error || 'Failed to load audit logs');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      case 'applied': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatLogDetails = (log: any) => {
    if (!log.details) return '-';
    
    try {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      
      switch (log.action) {
        case 'created':
          return (
            <div className="space-y-1">
              <div>Reason: {details.reason || 'No reason provided'}</div>
              {log.discountRequest?.scope && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  log.discountRequest.scope === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  log.discountRequest.scope === 'class' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  log.discountRequest.scope === 'bulk' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {log.discountRequest.scope === 'student' ? '👤 Single' : 
                   log.discountRequest.scope === 'class' ? '🏫 Class' :
                   log.discountRequest.scope === 'bulk' ? '👥 Bulk' : 
                   log.discountRequest.scope}
                </div>
              )}
            </div>
          );
        
        case 'approved':
          return (
            <div className="space-y-1">
              <div>{details.note ? `Approved with note: ${details.note}` : 'Approved'}</div>
              {log.discountRequest?.scope && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  log.discountRequest.scope === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  log.discountRequest.scope === 'class' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  log.discountRequest.scope === 'bulk' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {log.discountRequest.scope === 'student' ? '👤 Single' : 
                   log.discountRequest.scope === 'class' ? '🏫 Class' :
                   log.discountRequest.scope === 'bulk' ? '👥 Bulk' : 
                   log.discountRequest.scope}
                </div>
              )}
            </div>
          );
        
        case 'rejected':
          return (
            <div className="space-y-1">
              <div>{details.note || details.rejectionReason
                ? `Rejected: ${details.note || details.rejectionReason}`
                : 'Rejected'}</div>
              {log.discountRequest?.scope && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  log.discountRequest.scope === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  log.discountRequest.scope === 'class' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  log.discountRequest.scope === 'bulk' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {log.discountRequest.scope === 'student' ? '👤 Single' : 
                   log.discountRequest.scope === 'class' ? '🏫 Class' :
                   log.discountRequest.scope === 'bulk' ? '👥 Bulk' : 
                   log.discountRequest.scope}
                </div>
              )}
            </div>
          );
        
        case 'cancelled':
          return (
            <div className="space-y-1">
              <div>{details.note
                ? `Cancelled: ${details.note}`
                : 'Cancelled'}</div>
              {log.discountRequest?.scope && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  log.discountRequest.scope === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  log.discountRequest.scope === 'class' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  log.discountRequest.scope === 'bulk' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {log.discountRequest.scope === 'student' ? '👤 Single' : 
                   log.discountRequest.scope === 'class' ? '🏫 Class' :
                   log.discountRequest.scope === 'bulk' ? '👥 Bulk' : 
                   log.discountRequest.scope}
                </div>
              )}
            </div>
          );
        
        case 'applied':
          return (
            <div className="space-y-1">
              <div>Applied to {details.appliedCount || 0} fee records</div>
              {log.discountRequest?.scope && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  log.discountRequest.scope === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  log.discountRequest.scope === 'class' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  log.discountRequest.scope === 'bulk' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {log.discountRequest.scope === 'student' ? '👤 Single' : 
                   log.discountRequest.scope === 'class' ? '🏫 Class' :
                   log.discountRequest.scope === 'bulk' ? '👥 Bulk' : 
                   log.discountRequest.scope}
                </div>
              )}
            </div>
          );
        
        default:
          return (
            <div className="space-y-1">
              <div>{details.note || details.reason || JSON.stringify(details)}</div>
              {log.discountRequest?.scope && (
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  log.discountRequest.scope === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  log.discountRequest.scope === 'class' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  log.discountRequest.scope === 'bulk' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {log.discountRequest.scope === 'student' ? '👤 Single' : 
                   log.discountRequest.scope === 'class' ? '🏫 Class' :
                   log.discountRequest.scope === 'bulk' ? '👥 Bulk' : 
                   log.discountRequest.scope}
                </div>
              )}
            </div>
          );
      }
    } catch (error) {
      return (
        <div className="space-y-1">
          <div>{log.details}</div>
          {log.discountRequest?.scope && (
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
              log.discountRequest.scope === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              log.discountRequest.scope === 'class' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              log.discountRequest.scope === 'bulk' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {log.discountRequest.scope === 'student' ? '👤 Single Student' : 
               log.discountRequest.scope === 'class' ? '🏫 Class' :
               log.discountRequest.scope === 'bulk' ? '👥 Bulk Students' : 
               log.discountRequest.scope}
            </div>
          )}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className={`mt-2 ${textSecondary}`}>Loading audit logs...</p>
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
              placeholder="Search by action, actor, or details..."
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
            {/* Action Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Action</label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
              >
                <option value="all">All Actions</option>
                <option value="created">Created</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="applied">Applied</option>
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
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} audit logs
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
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Student / Class</th>
              <th className="px-4 py-3">Academic Year</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs ${textSecondary}`}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    {log.discountRequest?.scope && (
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${
                        log.discountRequest.scope === 'student' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        log.discountRequest.scope === 'class' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {log.discountRequest.scope === 'student' ? '👤' : log.discountRequest.scope === 'class' ? '🏫' : '👥'}
                      </div>
                    )}
                    <p className={`text-sm font-medium ${textPrimary}`}>{resolveTarget(log)}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {log.discountRequest?.academicYear || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className={`${textPrimary}`}>{log.actorName}</p>
                      <p className={`text-xs ${textSecondary}`}>{log.actorRole}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className={`${textPrimary}`}>{log.discountRequest?.name || 'Unknown'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`text-xs ${textSecondary} max-w-xs`}>
                    {formatLogDetails(log)}
                  </div>
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
            Page {currentPage} of {totalPages} (Total: {totalRecords} logs)
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
    </div>
  );
}
