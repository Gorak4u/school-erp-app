// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { feeRecordsApi } from '@/lib/apiClient';

interface Invoice {
  id: string;
  invoiceNo: string;
  studentName: string;
  class: string;
  feeType: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled' | 'partial';
  generatedDate: string;
  paidAmount: number;
  paymentMethod?: string;
}

interface FeeInvoiceManagerProps {
  theme: 'dark' | 'light';
  onClose?: () => void;
}

export default function FeeInvoiceManager({ theme, onClose }: FeeInvoiceManagerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const { dropdowns } = useSchoolConfig();
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showBulkGenerate, setShowBulkGenerate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  useEffect(() => {
    (async () => {
      try {
        const data = await feeRecordsApi.list({ pageSize: 200 });
        const records = data.records || data.feeRecords || [];
        setInvoices(records.map((r: any) => ({
          id: r.id,
          invoiceNo: r.receiptNumber || `INV-${r.id.slice(-6)}`,
          studentName: r.student?.name || 'Unknown',
          class: r.student?.class ? `${r.student.class}-${r.student.section || ''}` : '—',
          feeType: r.feeStructure?.name || r.remarks || 'Fee',
          amount: r.amount || 0,
          dueDate: r.dueDate || '',
          status: r.status || 'pending',
          generatedDate: r.createdAt?.split('T')[0] || '',
          paidAmount: r.paidAmount || 0,
          paymentMethod: r.paymentMethod || undefined,
        })));
      } catch (e) { console.error('Failed to load invoices', e); }
      finally { setLoading(false); }
    })();
  }, []);

  const getStatusStyle = (status: Invoice['status']) => {
    const map = {
      paid: isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600',
      pending: isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600',
      overdue: isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600',
      partial: isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600',
      cancelled: isDark ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-600',
    };
    return map[status];
  };

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab !== 'all' && inv.status !== activeTab) return false;
    if (searchQuery && !inv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) && !inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
    collected: invoices.reduce((sum, i) => sum + i.paidAmount, 0),
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  };

  const toggleInvoiceSelection = (id: string) => {
    setSelectedInvoices(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(i => i.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Invoice Management</h2>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowBulkGenerate(true)} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Bulk Generate
          </button>
          <button onClick={() => setShowCreateInvoice(true)} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
            Create Invoice
          </button>
          {onClose && (
            <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Close
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Total Invoices</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Total Amount</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>Rs.{(stats.totalAmount / 1000).toFixed(0)}K</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Collected</p>
          <p className="text-2xl font-bold text-green-500">Rs.{(stats.collected / 1000).toFixed(0)}K</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Overdue</p>
          <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search by student name or invoice number..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={`flex-1 min-w-[200px] px-4 py-2 rounded-lg border text-sm ${inputCls}`}
        />
        <div className="flex gap-2">
          {(['all', 'pending', 'overdue', 'paid'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedInvoices.length > 0 && (
        <div className={`p-3 rounded-lg flex items-center justify-between ${isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
          <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{selectedInvoices.length} invoice(s) selected</span>
          <div className="flex gap-2">
            <button className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>Send Reminders</button>
            <button className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>Export Selected</button>
            <button className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>Cancel Selected</button>
          </div>
        </div>
      )}

      {/* Invoice Table */}
      <div className={`rounded-xl border overflow-hidden ${cardCls}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} border-b`}>
                <th className="py-3 px-4 text-left">
                  <input type="checkbox" checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Invoice #</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Student</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Class</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Fee Type</th>
                <th className={`text-right py-3 px-4 text-sm font-medium ${textSecondary}`}>Amount</th>
                <th className={`text-right py-3 px-4 text-sm font-medium ${textSecondary}`}>Paid</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Due Date</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Status</th>
                <th className={`text-left py-3 px-4 text-sm font-medium ${textSecondary}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className={`${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-200 hover:bg-gray-50'} border-b`}>
                  <td className="py-3 px-4">
                    <input type="checkbox" checked={selectedInvoices.includes(inv.id)} onChange={() => toggleInvoiceSelection(inv.id)} className="rounded" />
                  </td>
                  <td className={`py-3 px-4 text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{inv.invoiceNo}</td>
                  <td className={`py-3 px-4 text-sm ${textPrimary}`}>{inv.studentName}</td>
                  <td className={`py-3 px-4 text-sm ${textSecondary}`}>{inv.class}</td>
                  <td className={`py-3 px-4 text-sm ${textSecondary}`}>{inv.feeType}</td>
                  <td className={`py-3 px-4 text-sm text-right font-medium ${textPrimary}`}>Rs.{inv.amount.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-sm text-right ${inv.paidAmount > 0 ? 'text-green-500' : textSecondary}`}>Rs.{inv.paidAmount.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-sm ${textSecondary}`}>{inv.dueDate}</td>
                  <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusStyle(inv.status)}`}>{inv.status}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>View</button>
                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <button className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>Collect</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreateInvoice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateInvoice(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className={`w-full max-w-lg p-6 rounded-xl border ${cardCls}`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Create New Invoice</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Student</label>
                  <input type="text" placeholder="Search student..." className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Fee Type</label>
                    <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                      <option value="">Select fee type</option>
                      <option>Tuition Fee</option>
                      <option>Transport Fee</option>
                      <option>Lab Fee</option>
                      <option>Library Fee</option>
                      <option>Activity Fee</option>
                      <option>Sports Fee</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Amount</label>
                    <input type="number" placeholder="Enter amount" className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Due Date</label>
                    <input type="date" className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Payment Terms</label>
                    <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                      <option>Due on receipt</option>
                      <option>Net 15</option>
                      <option>Net 30</option>
                      <option>Net 60</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Discount</label>
                  <div className="grid grid-cols-2 gap-4">
                    <select className={`px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                      <option>No discount</option>
                      <option>Percentage</option>
                      <option>Fixed amount</option>
                    </select>
                    <input type="number" placeholder="Discount value" className={`px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Notes</label>
                  <textarea rows={2} placeholder="Additional notes..." className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button onClick={() => setShowCreateInvoice(false)} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancel</button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Create Invoice</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Generate Modal */}
      <AnimatePresence>
        {showBulkGenerate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBulkGenerate(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className={`w-full max-w-md p-6 rounded-xl border ${cardCls}`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Bulk Generate Invoices</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Class</label>
                  <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                    <option value="">All Classes</option>
                    {dropdowns.classes.map(cls => (
                      <option key={cls.value} value={cls.label}>{cls.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Fee Type</label>
                  <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                    <option>Tuition Fee</option>
                    <option>Transport Fee</option>
                    <option>All Fees</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Billing Period</label>
                  <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                    <option>April 2026</option>
                    <option>Q1 2026-27</option>
                    <option>Semester 1</option>
                    <option>Annual</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Due Date</label>
                  <input type="date" className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>This will generate invoices for approximately 850 students based on the selected criteria.</p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button onClick={() => setShowBulkGenerate(false)} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancel</button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Generate Invoices</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
