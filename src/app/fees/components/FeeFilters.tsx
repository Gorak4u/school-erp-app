'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, X, Download, Settings, ChevronDown, Calendar,
  User, Hash, CreditCard, Users, AlertCircle, CheckCircle,
  RefreshCw, SlidersHorizontal, Zap, Sparkles, Banknote,
  Receipt, TrendingUp, Clock, DollarSign, Building2
} from 'lucide-react';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

export default function FeeFilters({ ctx }: { ctx: any }) {
  const {
    theme, searchTerm, setSearchTerm, selectedClass, setSelectedClass,
    selectedStatus, setSelectedStatus, pageSize, setPageSize,
    currentPage, setCurrentPage, showAdvancedFilters, setShowAdvancedFilters,
    showColumnSettings, setShowColumnSettings, advancedFilters, setAdvancedFilters,
    filteredStudentSummaries, studentFeeSummaries, selectedStudents, setSelectedStudents,
    includeArchivedStudents, setIncludeArchivedStudents,
    setShowBulkOperations, setShowExportModal, showAISuggestions, setShowAISuggestions, handleAISearch,
    feeSuggestions, canManageFees = true,
  } = ctx;

  const { dropdowns } = useSchoolConfig();
  const isDark = theme === 'dark';
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cardClass = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const secondaryTextClass = isDark ? 'text-gray-400' : 'text-gray-600';

  const inputClass = `w-full px-3 py-2 rounded-lg text-sm border transition-colors ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  } outline-none`;

  const selectClass = `px-3 py-2 rounded-lg text-sm border transition-colors ${
    isDark
      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
  } outline-none`;

  // Active filters display
  const getActiveFilters = () => {
    const filters: Array<{ key: string; label: string; value: string; color: string; onRemove: () => void }> = [];

    if (selectedClass && selectedClass !== 'all') {
      filters.push({ key: 'class', label: 'Class', value: selectedClass, color: 'blue', onRemove: () => setSelectedClass('all') });
    }
    if (selectedStatus && selectedStatus !== 'all') {
      const statusLabels: Record<string, string> = { fully_paid: 'Fully Paid', partially_paid: 'Partially Paid', overdue: 'Overdue', pending: 'Pending' };
      filters.push({ key: 'status', label: 'Status', value: statusLabels[selectedStatus] || selectedStatus, color: 'green', onRemove: () => setSelectedStatus('all') });
    }
    if (advancedFilters?.feeType) {
      filters.push({ key: 'feeType', label: 'Fee Type', value: advancedFilters.feeType, color: 'purple', onRemove: () => setAdvancedFilters((p: any) => ({ ...p, feeType: '' })) });
    }
    if (advancedFilters?.overdueRange) {
      filters.push({ key: 'overdue', label: 'Overdue', value: advancedFilters.overdueRange, color: 'orange', onRemove: () => setAdvancedFilters((p: any) => ({ ...p, overdueRange: '' })) });
    }
    if (advancedFilters?.amountRange) {
      filters.push({ key: 'amount', label: 'Amount', value: advancedFilters.amountRange, color: 'cyan', onRemove: () => setAdvancedFilters((p: any) => ({ ...p, amountRange: '' })) });
    }
    if (includeArchivedStudents) {
      filters.push({ key: 'archived', label: 'Archived', value: 'Included', color: 'gray', onRemove: () => setIncludeArchivedStudents(false) });
    }
    return filters;
  };

  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0;

  const clearAllFilters = () => {
    setSelectedClass('all');
    setSelectedStatus('all');
    setAdvancedFilters({ studentName: '', rollNo: '', class: '', paymentStatus: '', feeType: '', amountMin: '', amountMax: '', amountRange: '', dueDateFrom: '', dueDateTo: '', paidDateFrom: '', paidDateTo: '', overdueDaysMin: '', overdueDaysMax: '', overdueRange: '', discountApplied: '', collectedBy: '', session: '', receiptNumber: '', admissionNumber: '' });
    setIncludeArchivedStudents(false);
    setCurrentPage(1);
  };

  const colorClasses: Record<string, string> = {
    blue: isDark ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-300',
    green: isDark ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-green-100 text-green-800 border-green-300',
    purple: isDark ? 'bg-purple-900/50 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-300',
    orange: isDark ? 'bg-orange-900/50 text-orange-300 border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-300',
    cyan: isDark ? 'bg-cyan-900/50 text-cyan-300 border-cyan-700' : 'bg-cyan-100 text-cyan-800 border-cyan-300',
    gray: isDark ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <>
      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-4 rounded-xl border overflow-hidden ${cardClass}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}>
                    <SlidersHorizontal className="w-5 h-5 text-white" />
                  </div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Advanced Filters
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowAdvancedFilters(false)}
                    className="p-2 rounded-xl bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { label: 'Overdue Only', icon: AlertCircle, action: () => setSelectedStatus('overdue'), color: 'red' },
                  { label: 'High Amount', icon: DollarSign, action: () => setAdvancedFilters((p: any) => ({ ...p, amountRange: '20001-50000' })), color: 'orange' },
                  { label: 'Transport Fee', icon: Building2, action: () => setAdvancedFilters((p: any) => ({ ...p, feeType: 'transport' })), color: 'blue' },
                  { label: 'With Discount', icon: CheckCircle, action: () => setAdvancedFilters((p: any) => ({ ...p, discountApplied: 'with' })), color: 'green' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={preset.action}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all inline-flex items-center gap-2 ${
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <preset.icon className="w-4 h-4" />
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Filter Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <User className="w-3.5 h-3.5 inline mr-1" />Student Name
                  </label>
                  <input type="text" value={advancedFilters?.studentName || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, studentName: e.target.value }))} placeholder="Search by name..." className={inputClass} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Hash className="w-3.5 h-3.5 inline mr-1" />Roll No
                  </label>
                  <input type="text" value={advancedFilters?.rollNo || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, rollNo: e.target.value }))} placeholder="Roll number..." className={inputClass} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <CheckCircle className="w-3.5 h-3.5 inline mr-1 text-green-500" />Payment Status
                  </label>
                  <select value={advancedFilters?.paymentStatus || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, paymentStatus: e.target.value }))} className={inputClass}>
                    <option value="">All</option>
                    <option value="fully_paid">Fully Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="pending">Pending</option>
                  </select>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <CreditCard className="w-3.5 h-3.5 inline mr-1 text-purple-500" />Fee Type
                  </label>
                  <select value={advancedFilters?.feeType || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, feeType: e.target.value }))} className={inputClass}>
                    <option value="">All Types</option>
                    <option value="tuition">Tuition</option>
                    <option value="transport">Transport</option>
                    <option value="hostel">Hostel</option>
                    <option value="library">Library</option>
                    <option value="sports">Sports</option>
                  </select>
                </motion.div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Payment Method</label>
                  <select value={advancedFilters?.paymentMethod || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, paymentMethod: e.target.value }))} className={inputClass}>
                    <option value="">All Methods</option>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Amount Min (₹)</label>
                  <input type="number" value={advancedFilters?.amountMin || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, amountMin: e.target.value }))} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Amount Max (₹)</label>
                  <input type="number" value={advancedFilters?.amountMax || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, amountMax: e.target.value }))} placeholder="999999" className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Due Date From</label>
                  <input type="date" value={advancedFilters?.dueDateFrom || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, dueDateFrom: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Due Date To</label>
                  <input type="date" value={advancedFilters?.dueDateTo || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, dueDateTo: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Collected By</label>
                  <input type="text" value={advancedFilters?.collectedBy || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, collectedBy: e.target.value }))} placeholder="Staff name..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Session</label>
                  <select value={advancedFilters?.session || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, session: e.target.value }))} className={inputClass}>
                    <option value="">All Sessions</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2023-24">2023-24</option>
                    <option value="2022-23">2022-23</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Receipt Number</label>
                  <input type="text" value={advancedFilters?.receiptNumber || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, receiptNumber: e.target.value }))} placeholder="Receipt number..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Admission Number</label>
                  <input type="text" value={advancedFilters?.admissionNumber || ''} onChange={e => setAdvancedFilters((p: any) => ({ ...p, admissionNumber: e.target.value }))} placeholder="Admission number..." className={inputClass} />
                </div>
                <div className="flex items-center space-x-2 pt-6 lg:col-span-2">
                  <input
                    type="checkbox"
                    id="includeArchivedStudents"
                    checked={includeArchivedStudents}
                    onChange={e => setIncludeArchivedStudents(e.target.checked)}
                    className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}`}
                  />
                  <label htmlFor="includeArchivedStudents" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Include Exited/Graduated Students
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Quick Filters Bar */}
      <div className={`rounded-xl border p-4 mb-4 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {/* Row 1: AI-Powered Search Input */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🤖</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => { 
              setSearchTerm(e.target.value); 
              setCurrentPage(1);
              // Trigger AI search suggestions for longer queries
              if (e.target.value.length >= 3) {
                handleAISearch(e.target.value);
              }
            }}
            placeholder="AI Search: 'students with pending fees', 'overdue payments', 'class 10 fees'..."
            className={`w-full pl-10 pr-12 py-2.5 rounded-lg text-sm border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } outline-none`}
          />
          <button
            onClick={() => setShowAISuggestions(!showAISuggestions)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="AI Search Suggestions"
          >
            ✨
          </button>
        </div>

        {/* AI Search Suggestions */}
        {showAISuggestions && (
          <div className={`mb-3 p-3 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">🤖 AI Search Suggestions:</span>
              <button
                onClick={() => setShowAISuggestions(false)}
                className={`ml-auto text-xs p-1 rounded ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(feeSuggestions || []).map((suggestion: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchTerm(suggestion);
                    setCurrentPage(1);
                    setShowAISuggestions(false);
                    handleAISearch(suggestion);
                  }}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300'
                      : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row 2: Icon-Integrated Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Class Filter with Icon */}
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <Users className={`w-3.5 h-3.5 ${selectedClass !== 'all' ? 'text-blue-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <select 
              value={selectedClass} 
              onChange={e => { setSelectedClass(e.target.value); setCurrentPage(1); }}
              className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all min-w-[110px] appearance-none cursor-pointer ${
                selectedClass !== 'all' 
                  ? theme === 'dark' 
                    ? 'bg-blue-900/30 border-blue-500/50 text-blue-200' 
                    : 'bg-blue-50 border-blue-300 text-blue-700'
                  : theme === 'dark' 
                    ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <option value="all">All Classes</option>
              {dropdowns.classes.map(cls => {
                const value = cls.mediumName ? `${cls.label}|${cls.mediumName}` : cls.label;
                return (
                  <option key={cls.value} value={value}>{cls.label}{cls.mediumName ? ` (${cls.mediumName})` : ''}</option>
                );
              })}
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          {/* Status Filter with Icon */}
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <CheckCircle className={`w-3.5 h-3.5 ${selectedStatus !== 'all' ? 'text-green-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <select 
              value={selectedStatus} 
              onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all appearance-none cursor-pointer ${
                selectedStatus !== 'all' 
                  ? theme === 'dark' 
                    ? 'bg-green-900/30 border-green-500/50 text-green-200' 
                    : 'bg-green-50 border-green-300 text-green-700'
                  : theme === 'dark' 
                    ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <option value="all">All Status</option>
              <option value="fully_paid">Fully Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
              <option value="pending">Pending</option>
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          {/* Fee Type Filter with Icon */}
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <CreditCard className={`w-3.5 h-3.5 ${advancedFilters?.feeType ? 'text-purple-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <select 
              value={advancedFilters?.feeType || ''} 
              onChange={e => setAdvancedFilters((p: any) => ({ ...p, feeType: e.target.value }))}
              className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all appearance-none cursor-pointer ${
                advancedFilters?.feeType 
                  ? theme === 'dark' 
                    ? 'bg-purple-900/30 border-purple-500/50 text-purple-200' 
                    : 'bg-purple-50 border-purple-300 text-purple-700'
                  : theme === 'dark' 
                    ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <option value="">All Fee Types</option>
              <option value="tuition">Tuition Fee</option>
              <option value="transport">Transport Fee</option>
              <option value="hostel">Hostel Fee</option>
              <option value="library">Library Fee</option>
              <option value="lab">Lab Fee</option>
              <option value="sports">Sports Fee</option>
              <option value="exam">Exam Fee</option>
              <option value="uniform">Uniform Fee</option>
              <option value="stationery">Stationery Fee</option>
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          {/* Overdue Range Filter with Icon */}
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <AlertCircle className={`w-3.5 h-3.5 ${advancedFilters?.overdueRange ? 'text-orange-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <select 
              value={advancedFilters?.overdueRange || ''} 
              onChange={e => setAdvancedFilters((p: any) => ({ ...p, overdueRange: e.target.value }))}
              className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all appearance-none cursor-pointer ${
                advancedFilters?.overdueRange 
                  ? theme === 'dark' 
                    ? 'bg-orange-900/30 border-orange-500/50 text-orange-200' 
                    : 'bg-orange-50 border-orange-300 text-orange-700'
                  : theme === 'dark' 
                    ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <option value="">All Overdue</option>
              <option value="0-30">0-30 Days</option>
              <option value="31-60">31-60 Days</option>
              <option value="61-90">61-90 Days</option>
              <option value="91-120">91-120 Days</option>
              <option value="120+">120+ Days</option>
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          {/* Amount Range Filter with Icon */}
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <DollarSign className={`w-3.5 h-3.5 ${advancedFilters?.amountRange ? 'text-cyan-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <select 
              value={advancedFilters?.amountRange || ''} 
              onChange={e => setAdvancedFilters((p: any) => ({ ...p, amountRange: e.target.value }))}
              className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all appearance-none cursor-pointer ${
                advancedFilters?.amountRange 
                  ? theme === 'dark' 
                    ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-200' 
                    : 'bg-cyan-50 border-cyan-300 text-cyan-700'
                  : theme === 'dark' 
                    ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <option value="">All Amounts</option>
              <option value="0-5000">₹0-5,000</option>
              <option value="5001-10000">₹5,001-10,000</option>
              <option value="10001-20000">₹10,001-20,000</option>
              <option value="20001-50000">₹20,001-50,000</option>
              <option value="50000+">₹50,000+</option>
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          {/* Discount Filter with Icon */}
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <Sparkles className={`w-3.5 h-3.5 ${advancedFilters?.discountApplied ? 'text-pink-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <select 
              value={advancedFilters?.discountApplied || ''} 
              onChange={e => setAdvancedFilters((p: any) => ({ ...p, discountApplied: e.target.value }))}
              className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all appearance-none cursor-pointer ${
                advancedFilters?.discountApplied 
                  ? theme === 'dark' 
                    ? 'bg-pink-900/30 border-pink-500/50 text-pink-200' 
                    : 'bg-pink-50 border-pink-300 text-pink-700'
                  : theme === 'dark' 
                    ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <option value="">Discount Status</option>
              <option value="with">With Discount</option>
              <option value="without">Without Discount</option>
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          {/* Session Filter with Icon */}
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <Calendar className={`w-3.5 h-3.5 ${advancedFilters?.session ? 'text-indigo-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <select 
              value={advancedFilters?.session || ''} 
              onChange={e => setAdvancedFilters((p: any) => ({ ...p, session: e.target.value }))}
              className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer ${
                advancedFilters?.session 
                  ? theme === 'dark' 
                    ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-200' 
                    : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : theme === 'dark' 
                    ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <option value="">All Sessions</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          {/* Page Size with Icon */}
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <SlidersHorizontal className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <select 
              value={pageSize} 
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className={`pl-7 pr-6 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-gray-500/30 transition-all appearance-none cursor-pointer ${
                theme === 'dark' 
                  ? 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600' 
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          {/* Divider */}
          <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />

          {/* Icon Actions */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
              className={`p-1.5 rounded-md transition-all ${
                showAdvancedFilters 
                  ? 'bg-blue-500 text-white' 
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Advanced Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => setShowColumnSettings(true)} 
              className={`p-1.5 rounded-md transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Column Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => setShowExportModal(true)}
              className={`p-1.5 rounded-md transition-colors ${
                theme === 'dark' 
                  ? 'text-green-400 hover:text-green-300 hover:bg-green-900/30' 
                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
              }`}
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Records Actions */}
        {selectedStudents?.length > 0 && (
          <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              {selectedStudents.length} selected
            </span>
            {canManageFees && (
              <button
                onClick={() => setShowBulkOperations(true)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
              >
                ⚙️ Bulk Operations
              </button>
            )}
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
