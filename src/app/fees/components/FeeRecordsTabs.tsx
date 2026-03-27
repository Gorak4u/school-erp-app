// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, Download, Eye, ChevronLeft, ChevronRight, TrendingUp, DollarSign, Clock, CheckCircle, CreditCard } from 'lucide-react';

export default function FeeRecordsTabs({ ctx }: { ctx: any }) {
  const { activeTab, theme, feeStructures, discounts } = ctx;

  // ── Fee Records: fully self-contained state ──────────────────────────────
  const [records, setRecords]     = useState<any[]>([]);
  const [summary, setSummary]     = useState<any>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [yearFilter, setYear]     = useState('');
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const isDark = theme === 'dark';
  const cardBg   = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const headerBg = isDark ? 'bg-gray-700'  : 'bg-gray-50';
  const rowHover = isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const txt      = isDark ? 'text-white'   : 'text-gray-900';
  const txtSec   = isDark ? 'text-gray-400': 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  const statusColors: Record<string, string> = {
    paid:    'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };

  const fetchRecords = useCallback(async () => {
    if (activeTab !== 'fee-records') return;
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
      if (search)       params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (yearFilter)   params.set('academicYear', yearFilter);
      const res  = await fetch(`/api/fees/records?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch records');
      const recs = data.data?.records || data.records || [];
      setRecords(recs);
      setSummary(data.data?.summary || data.summary || null);
      setTotalRecords(data.data?.pagination?.total || data.pagination?.total || recs.length);
      setTotalPages(data.data?.pagination?.totalPages || data.pagination?.totalPages || Math.ceil(recs.length / pageSize));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize, search, statusFilter, yearFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => { setPage(1); }, [search, statusFilter, yearFilter]);

  const pending = (r: any) => Math.max(0, (r.amount || 0) - (r.paidAmount || 0) - (r.discount || 0));

  // Helper to determine if discount is actually a waived amount
  const getDiscountLabel = (r: any) => {
    if (r.feeStructure?.category === 'transport' && r.status === 'cancelled' && r.discount > 0) {
      return 'Waived Off';
    }
    return 'Discount';
  };

  const getDiscountValue = (r: any) => {
    return r.discount || 0;
  };

  const exportCSV = () => {
    const rows = [
      ['Student', 'Class', 'Roll No', 'Fee Type', 'Category', 'Amount', 'Paid', 'Discount/Waiver', 'Pending', 'Due Date', 'Status', 'Academic Year'],
      ...records.map(r => [
        r.student?.name || '-', r.student?.class || '-', r.student?.rollNo || '-',
        r.feeStructure?.name || '-', r.feeStructure?.category || '-',
        r.amount, r.paidAmount || 0, `${getDiscountValue(r)} (${getDiscountLabel(r)})`, pending(r),
        r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-',
        r.status, r.academicYear || '-'
      ])
    ].map(row => row.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = `fee-records-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <>
          {activeTab === 'fee-records' && (
            <motion.div key="fee-records" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">

              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Records', value: (summary.totalRecords || 0).toLocaleString(), icon: <TrendingUp className="w-5 h-5" />, color: 'text-blue-500' },
                    { label: 'Total Amount',  value: `₹${(summary.totalAmount || 0).toLocaleString()}`,   icon: <DollarSign className="w-5 h-5" />, color: 'text-purple-500' },
                    { label: 'Collected',     value: `₹${(summary.totalCollected || 0).toLocaleString()}`, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-500' },
                    { label: 'Outstanding',   value: `₹${(summary.totalOutstanding || summary.totalPending || 0).toLocaleString()}`, icon: <Clock className="w-5 h-5" />, color: 'text-red-500' },
                  ].map(card => (
                    <div key={card.label} className={`p-4 rounded-xl border ${cardBg}`}>
                      <div className={`flex items-center gap-2 mb-1 ${card.color}`}>{card.icon}<span className={`text-xs font-medium ${txtSec}`}>{card.label}</span></div>
                      <div className={`text-xl font-bold ${txt}`}>{card.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Filters Bar */}
              <div className={`p-4 rounded-xl border flex flex-wrap gap-3 items-center ${cardBg}`}>
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search by student name..." value={search} onChange={e => setSearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                </div>
                <select value={statusFilter} onChange={e => setStatus(e.target.value)} className={`px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
                <input type="text" placeholder="Academic Year (e.g. 2024-25)" value={yearFilter} onChange={e => setYear(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm w-44 ${inputCls}`} />
                <select value={pageSize} onChange={e => { setPageSize(+e.target.value); setPage(1); }} className={`px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                </select>
                <button onClick={fetchRecords} className={`p-2 rounded-lg border ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}><RefreshCw className={`w-4 h-4 ${txtSec}`} /></button>
                <button onClick={exportCSV}   className={`p-2 rounded-lg border ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}><Download className={`w-4 h-4 ${txtSec}`} /></button>
                {(search || statusFilter !== 'all' || yearFilter) && (
                  <button onClick={() => { setSearch(''); setStatus('all'); setYear(''); }} className="px-3 py-2 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200">Clear Filters</button>
                )}
              </div>

              {/* Error */}
              {error && <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm">{error}</div>}

              {/* Table */}
              <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={`text-xs uppercase ${headerBg} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <tr>
                        {['Student', 'Class / Roll', 'Fee Structure', 'Category', 'Amount', 'Paid', 'Discount/Waiver', 'Pending', 'Due Date', 'Acad. Year', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {loading ? (
                        <tr><td colSpan={12} className={`px-4 py-12 text-center ${txtSec}`}>
                          <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span>Loading fee records...</span></div>
                        </td></tr>
                      ) : records.length === 0 ? (
                        <tr><td colSpan={12} className={`px-4 py-12 text-center ${txtSec}`}>
                          <div className="text-4xl mb-2">📋</div>
                          <p className={`font-medium ${txt}`}>No fee records found</p>
                          <p className="text-xs mt-1">Try adjusting your filters</p>
                        </td></tr>
                      ) : records.map(r => (
                        <tr key={r.id} className={`${rowHover} transition-colors`}>
                          <td className={`px-4 py-3 font-medium ${txt}`}>{r.student?.name || '-'}</td>
                          <td className={`px-4 py-3 ${txtSec}`}>
                            <div>{r.student?.class || '-'}{r.student?.section ? ` - ${r.student.section}` : ''}</div>
                            <div className="text-xs">{r.student?.rollNo ? `Roll: ${r.student.rollNo}` : ''}</div>
                          </td>
                          <td className={`px-4 py-3 ${txt}`}>{r.feeStructure?.name || '-'}</td>
                          <td className={`px-4 py-3 ${txtSec} capitalize`}>{r.feeStructure?.category || '-'}</td>
                          <td className={`px-4 py-3 font-medium ${txt}`}>₹{(r.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-green-500 font-medium">₹{(r.paidAmount || 0).toLocaleString()}</td>
                          <td className={`px-4 py-3 ${getDiscountLabel(r) === 'Waived Off' ? 'text-orange-500' : 'text-blue-500'}`}>
                            <div className="flex items-center gap-1">
                              <span>₹{getDiscountValue(r).toLocaleString()}</span>
                              {getDiscountLabel(r) === 'Waived Off' && (
                                <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">
                                  Waived
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`px-4 py-3 font-medium ${pending(r) > 0 ? 'text-red-500' : 'text-green-500'}`}>₹{pending(r).toLocaleString()}</td>
                          <td className={`px-4 py-3 ${txtSec} whitespace-nowrap`}>{r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '-'}</td>
                          <td className={`px-4 py-3 ${txtSec}`}>{r.academicYear || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[r.status] || 'bg-gray-100 text-gray-700'}`}>
                              {r.status || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSelectedRecord(r)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                              {(r.paidAmount || 0) > 0 && (
                                <button 
                                  onClick={() => window.open(`/refunds?studentId=${r.studentId}&feeRecordId=${r.id}`, '_blank')} 
                                  className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30" 
                                  title="Request Refund"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <span className={`text-sm ${txtSec}`}>
                    {totalRecords > 0 ? `Showing ${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, totalRecords)} of ${totalRecords} records` : 'No records'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className={`p-1.5 rounded ${page === 1 ? 'opacity-40 cursor-not-allowed' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                      return <button key={n} onClick={() => setPage(n)} className={`px-3 py-1 rounded text-sm ${n === page ? 'bg-blue-600 text-white' : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>{n}</button>;
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                      className={`p-1.5 rounded ${page >= totalPages ? 'opacity-40 cursor-not-allowed' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Record Detail Modal */}
              {selectedRecord && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className={`w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                      <h3 className={`text-lg font-bold ${txt}`}>📋 Fee Record Details</h3>
                      <button onClick={() => setSelectedRecord(null)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>✕</button>
                    </div>
                    <div className="p-5 space-y-3">
                      {[
                        ['Student',      selectedRecord.student?.name || '-'],
                        ['Class',        `${selectedRecord.student?.class || '-'}${selectedRecord.student?.section ? ` - ${selectedRecord.student.section}` : ''}`],
                        ['Roll No',      selectedRecord.student?.rollNo || '-'],
                        ['Fee Type',     selectedRecord.feeStructure?.name || '-'],
                        ['Category',     selectedRecord.feeStructure?.category || '-'],
                        ['Academic Year',selectedRecord.academicYear || '-'],
                        ['Total Amount', `₹${(selectedRecord.amount || 0).toLocaleString()}`],
                        ['Paid Amount',  `₹${(selectedRecord.paidAmount || 0).toLocaleString()}`],
                        [getDiscountLabel(selectedRecord), `₹${getDiscountValue(selectedRecord).toLocaleString()}`],
                        ['Pending',      `₹${pending(selectedRecord).toLocaleString()}`],
                        ['Due Date',     selectedRecord.dueDate ? new Date(selectedRecord.dueDate).toLocaleDateString('en-IN') : '-'],
                        ['Status',       selectedRecord.status || '-'],
                        ['Payments',     `${selectedRecord.paymentCount || 0} payment(s)`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className={`text-sm ${txtSec}`}>{label}</span>
                          <span className={`text-sm font-medium ${txt}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                      <button onClick={() => setSelectedRecord(null)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Close</button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'structures' && (
            <motion.div
              key="structures"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {feeStructures.map((structure) => (
                  <div
                    key={structure.id}
                    className={`p-6 rounded-xl border ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {structure.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        structure.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {structure.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {/* AY / Medium / Class / Board tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {structure.academicYear && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          theme === 'dark' ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'
                        }`}>
                          📅 {structure.academicYear.name || structure.academicYear.year}
                        </span>
                      )}
                      {structure.medium && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          theme === 'dark' ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700'
                        }`}>
                          🗣️ {structure.medium.name}
                        </span>
                      )}
                      {structure.class && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          theme === 'dark' ? 'bg-green-900/40 text-green-300' : 'bg-green-50 text-green-700'
                        }`}>
                          🏫 {structure.class.name}
                        </span>
                      )}
                      {structure.board && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          theme === 'dark' ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-50 text-orange-700'
                        }`}>
                          📋 {structure.board.name}
                        </span>
                      )}
                      {structure.applicableCategories && structure.applicableCategories !== 'all' && (
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {structure.applicableCategories}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Amount</span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ₹{structure.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Category</span>
                        <span className={`font-medium capitalize ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {structure.category || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Frequency</span>
                        <span className={`font-medium capitalize ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {structure.frequency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Due Date</span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {structure.dueDate}{structure.frequency === 'monthly' ? 'st of each month' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Late Fee</span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          ₹{structure.lateFee || 0}
                        </span>
                      </div>
                    </div>
                    {structure.description && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {structure.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          
          {activeTab === 'discounts' && (
            <motion.div
              key="discounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {discounts.map((discount) => (
                  <div
                    key={discount.id}
                    className={`p-6 rounded-xl border ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {discount.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        discount.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Type
                        </span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {discount.type === 'percentage' ? `${discount.value}%` : `₹${discount.value}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Valid From
                        </span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {discount.validFrom}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Valid To
                        </span>
                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {discount.validTo}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {discount.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

              </>
  );
}
