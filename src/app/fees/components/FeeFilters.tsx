// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CLASSES = ['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function FeeFilters({ ctx }: { ctx: any }) {
  const {
    theme, searchTerm, setSearchTerm, selectedClass, setSelectedClass,
    selectedStatus, setSelectedStatus, pageSize, setPageSize,
    currentPage, setCurrentPage, showAdvancedFilters, setShowAdvancedFilters,
    showColumnSettings, setShowColumnSettings, advancedFilters, setAdvancedFilters,
    filteredStudentSummaries, studentFeeSummaries, selectedStudents, setSelectedStudents,
    setShowBulkOperations, setShowExportModal,
  } = ctx;

  const inputClass = `w-full px-3 py-2 rounded-lg text-sm border transition-colors ${
    theme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  } outline-none`;

  const selectClass = `px-3 py-2 rounded-lg text-sm border transition-colors ${
    theme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
  } outline-none`;

  return (
    <>
      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-4 rounded-xl border overflow-hidden ${
              theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  🔍 Advanced Filters
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdvancedFilters({
                      studentName: '', rollNo: '', class: '', paymentStatus: '',
                      feeType: '', paymentMethod: '', amountMin: '', amountMax: '',
                      dueDateFrom: '', dueDateTo: '', paidDateFrom: '', paidDateTo: '',
                      overdueDaysMin: '', overdueDaysMax: '', discountApplied: '', collectedBy: ''
                    })}
                    className="px-3 py-1 text-sm rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowAdvancedFilters(false)}
                    className="px-3 py-1 text-sm rounded-lg bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Student Name</label>
                  <input type="text" value={advancedFilters?.studentName || ''} onChange={e => setAdvancedFilters(p => ({ ...p, studentName: e.target.value }))} placeholder="Search by name..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Roll No</label>
                  <input type="text" value={advancedFilters?.rollNo || ''} onChange={e => setAdvancedFilters(p => ({ ...p, rollNo: e.target.value }))} placeholder="Roll number..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Payment Status</label>
                  <select value={advancedFilters?.paymentStatus || ''} onChange={e => setAdvancedFilters(p => ({ ...p, paymentStatus: e.target.value }))} className={inputClass}>
                    <option value="">All</option>
                    <option value="fully_paid">Fully Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Fee Type</label>
                  <select value={advancedFilters?.feeType || ''} onChange={e => setAdvancedFilters(p => ({ ...p, feeType: e.target.value }))} className={inputClass}>
                    <option value="">All Types</option>
                    <option value="tuition">Tuition</option>
                    <option value="transport">Transport</option>
                    <option value="hostel">Hostel</option>
                    <option value="library">Library</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Payment Method</label>
                  <select value={advancedFilters?.paymentMethod || ''} onChange={e => setAdvancedFilters(p => ({ ...p, paymentMethod: e.target.value }))} className={inputClass}>
                    <option value="">All Methods</option>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Amount Min (₹)</label>
                  <input type="number" value={advancedFilters?.amountMin || ''} onChange={e => setAdvancedFilters(p => ({ ...p, amountMin: e.target.value }))} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Amount Max (₹)</label>
                  <input type="number" value={advancedFilters?.amountMax || ''} onChange={e => setAdvancedFilters(p => ({ ...p, amountMax: e.target.value }))} placeholder="999999" className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Due Date From</label>
                  <input type="date" value={advancedFilters?.dueDateFrom || ''} onChange={e => setAdvancedFilters(p => ({ ...p, dueDateFrom: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Due Date To</label>
                  <input type="date" value={advancedFilters?.dueDateTo || ''} onChange={e => setAdvancedFilters(p => ({ ...p, dueDateTo: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Collected By</label>
                  <input type="text" value={advancedFilters?.collectedBy || ''} onChange={e => setAdvancedFilters(p => ({ ...p, collectedBy: e.target.value }))} placeholder="Staff name..." className={inputClass} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Quick Filters Bar */}
      <div className={`rounded-xl border p-4 mb-4 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {/* Row 1: Search Input */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by student name, roll no, class..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg text-sm border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } outline-none`}
          />
        </div>

        {/* Row 2: Dropdowns + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setCurrentPage(1); }} className={selectClass} style={{ width: 'auto' }}>
            {CLASSES.map(cls => (
              <option key={cls} value={cls}>{cls === 'all' ? 'All Classes' : `Class ${cls}`}</option>
            ))}
          </select>

          <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }} className={selectClass} style={{ width: 'auto' }}>
            <option value="all">All Status</option>
            <option value="fully_paid">Fully Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
          </select>

          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className={selectClass} style={{ width: 'auto' }}>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showAdvancedFilters ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              title="Advanced Filters"
            >
              🔍 Advanced
            </button>
            <button
              onClick={() => setShowColumnSettings(true)}
              className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Column Settings"
            >
              ⚙️
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
            >
              📥 Export ({filteredStudentSummaries?.length || 0})
            </button>
          </div>
        </div>

        {/* Selected Records Actions */}
        {selectedStudents?.length > 0 && (
          <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              {selectedStudents.length} selected
            </span>
            <button
              onClick={() => setShowBulkOperations(true)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
            >
              ⚙️ Bulk Operations
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
            >
              📥 Export Selected
            </button>
            <button
              onClick={() => setSelectedStudents([])}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>
    </>
  );
}
