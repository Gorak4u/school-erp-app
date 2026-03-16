// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

interface Invoice {
  id: string;
  receiptNumber: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  createdAt: string;
  academicYear: string;
  student: {
    name: string;
    class: string;
    section: string;
    rollNo: string;
  };
  feeStructure: {
    name: string;
    category: string;
  };
  status: 'paid' | 'pending' | 'partial' | 'overdue';
  totalPayments: number;
  paymentCount: number;
}

interface InvoiceSummary {
  totalRecords: number;
  totalAmount: number;
  totalCollected: number;
  paidCount: number;
  overdueCount: number;
  partialCount: number;
  pendingCount: number;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function FeeInvoiceManagerOptimized({ theme, activeTab }: { theme: string; activeTab: string }) {
  const { dropdowns } = useSchoolConfig();
  
  // State management
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showBulkGenerate, setShowBulkGenerate] = useState(false);

  // Theme classes
  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  // Load invoices data
  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build API parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      // Add filters
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (selectedAcademicYear !== 'all') {
        params.append('academicYear', selectedAcademicYear);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/fees/records?${params}`);
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        const recs = (result.data?.records || result.records || []).map((r: any) => ({
          ...r,
          pendingAmount: Math.max(0, (r.amount || 0) - (r.paidAmount || 0) - (r.discount || 0)),
          student: r.student || { name: r.studentName || '-', class: r.class || '-', section: r.section || '', rollNo: r.rollNo || '' },
          feeStructure: r.feeStructure || { name: r.feeStructureName || '-', category: r.feeCategory || '-' },
          receiptNumber: r.receiptNumber || `FEE-${r.id?.slice(0, 8).toUpperCase()}`,
        }));
        setInvoices(recs);
        setSummary(result.data?.summary || null);
        setPagination(result.data?.pagination || null);
      }
    } catch (e) {
      console.error('Failed to load invoices', e);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadInvoices();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedStatus, selectedAcademicYear, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedAcademicYear, pageSize]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    const colors = {
      paid: isDark ? 'bg-green-900/30 text-green-400 border-green-700' : 'bg-green-100 text-green-800 border-green-200',
      pending: isDark ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-200',
      partial: isDark ? 'bg-blue-900/30 text-blue-400 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-200',
      overdue: isDark ? 'bg-red-900/30 text-red-400 border-red-700' : 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  // Pagination controls
  const PaginationControls = () => {
    if (!pagination) return null;

    const { page, total, totalPages, hasNext, hasPrev } = pagination;
    const startRecord = (page - 1) * pageSize + 1;
    const endRecord = Math.min(page * pageSize, total);

    return (
      <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`text-sm ${textSecondary}`}>
          Showing {startRecord} to {endRecord} of {total} invoices
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(page - 1)}
            disabled={!hasPrev}
            className={`px-3 py-1 rounded text-sm ${
              !hasPrev
                ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Previous
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(page + 1)}
            disabled={!hasNext}
            className={`px-3 py-1 rounded text-sm ${
              !hasNext
                ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Next
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <label className={`text-sm ${textSecondary}`}>Show:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value))}
            className={`px-2 py-1 rounded text-sm ${inputCls}`}
          >
            <option key="page-size-10" value={10}>10</option>
            <option key="page-size-25" value={25}>25</option>
            <option key="page-size-50" value={50}>50</option>
            <option key="page-size-100" value={100}>100</option>
          </select>
        </div>
      </div>
    );
  };

  // Selection handlers
  const toggleInvoiceSelection = (id: string) => {
    setSelectedInvoices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map(i => i.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className={`p-4 rounded-lg border ${cardCls}`}>
            <p className={`text-sm ${textSecondary}`}>Total Invoices</p>
            <p className={`text-2xl font-bold ${textPrimary}`}>{summary.totalRecords.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg border ${cardCls}`}>
            <p className={`text-sm ${textSecondary}`}>Total Amount</p>
            <p className={`text-2xl font-bold ${textPrimary}`}>₹{summary.totalAmount.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg border ${cardCls}`}>
            <p className={`text-sm ${textSecondary}`}>Collected</p>
            <p className={`text-2xl font-bold text-green-500`}>₹{summary.totalCollected.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg border ${cardCls}`}>
            <p className={`text-sm ${textSecondary}`}>Paid</p>
            <p className={`text-2xl font-bold text-green-500`}>{summary.paidCount.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg border ${cardCls}`}>
            <p className={`text-sm ${textSecondary}`}>Pending</p>
            <p className={`text-2xl font-bold text-yellow-500`}>{summary.pendingCount.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg border ${cardCls}`}>
            <p className={`text-sm ${textSecondary}`}>Overdue</p>
            <p className={`text-2xl font-bold text-red-500`}>{summary.overdueCount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`p-4 rounded-lg border ${cardCls}`}>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg border ${inputCls}`}
          />
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${inputCls}`}
          >
            <option key="status-all" value="all">All Status</option>
            <option key="status-paid" value="paid">Paid</option>
            <option key="status-pending" value="pending">Pending</option>
            <option key="status-partial" value="partial">Partial</option>
            <option key="status-overdue" value="overdue">Overdue</option>
          </select>
          
          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${inputCls}`}
          >
            <option key="year-all" value="all">All Years</option>
            {dropdowns?.academicYears?.map((year: any, index: number) => (
              <option key={year.id || `year-${index}`} value={year.id}>{year.name}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowCreateInvoice(true)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Create Invoice
          </button>
          
          <button
            onClick={() => setShowBulkGenerate(true)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            Bulk Generate
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className={`p-3 rounded-lg flex items-center justify-between ${
          isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'
        }`}>
          <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {selectedInvoices.length} invoice(s) selected
          </span>
          <div className="flex gap-2">
            <button className={`px-3 py-1 rounded text-sm ${
              isDark ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}>
              Send Reminders
            </button>
            <button className={`px-3 py-1 rounded text-sm ${
              isDark ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}>
              Export Selected
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={`p-8 text-center ${cardCls}`}>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className={`mt-2 ${textSecondary}`}>Loading invoices...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={`p-4 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          <button
            onClick={loadInvoices}
            className={`mt-2 px-3 py-1 rounded text-sm ${
              isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Retry
          </button>
        </div>
      )}

      {/* Invoices Table */}
      {!loading && !error && invoices.length > 0 && (
        <div className={`rounded-xl border overflow-hidden ${cardCls}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className={`p-4 text-left text-sm font-medium ${textSecondary}`}>Invoice #</th>
                  <th className={`p-4 text-left text-sm font-medium ${textSecondary}`}>Student</th>
                  <th className={`p-4 text-left text-sm font-medium ${textSecondary}`}>Class</th>
                  <th className={`p-4 text-left text-sm font-medium ${textSecondary}`}>Fee Type</th>
                  <th className={`p-4 text-right text-sm font-medium ${textSecondary}`}>Amount</th>
                  <th className={`p-4 text-right text-sm font-medium ${textSecondary}`}>Paid</th>
                  <th className={`p-4 text-right text-sm font-medium ${textSecondary}`}>Pending</th>
                  <th className={`p-4 text-center text-sm font-medium ${textSecondary}`}>Status</th>
                  <th className={`p-4 text-left text-sm font-medium ${textSecondary}`}>Due Date</th>
                  <th className={`p-4 text-center text-sm font-medium ${textSecondary}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                        className="rounded"
                      />
                    </td>
                    <td className={`p-4 text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {invoice.receiptNumber}
                    </td>
                    <td className={`p-4 text-sm ${textPrimary}`}>
                      <div>
                        <div className="font-medium">{invoice.student.name}</div>
                        <div className={`text-xs ${textSecondary}`}>Roll: {invoice.student.rollNo}</div>
                      </div>
                    </td>
                    <td className={`p-4 text-sm ${textPrimary}`}>
                      {invoice.student.class} {invoice.student.section}
                    </td>
                    <td className={`p-4 text-sm ${textPrimary}`}>{invoice.feeStructure.name}</td>
                    <td className={`p-4 text-sm text-right font-medium ${textPrimary}`}>
                      ₹{invoice.amount.toLocaleString()}
                    </td>
                    <td className={`p-4 text-sm text-right font-medium text-green-500`}>
                      ₹{invoice.paidAmount.toLocaleString()}
                    </td>
                    <td className={`p-4 text-sm text-right font-medium ${textPrimary}`}>
                      ₹{invoice.pendingAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className={`p-4 text-sm ${textPrimary}`}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td className="p-4 text-center">
                      <button className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <PaginationControls />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && invoices.length === 0 && (
        <div className={`p-8 text-center ${cardCls}`}>
          <p className={`${textSecondary}`}>No invoices found</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedStatus('all');
              setSelectedAcademicYear('all');
            }}
            className={`mt-2 px-3 py-1 rounded text-sm ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
