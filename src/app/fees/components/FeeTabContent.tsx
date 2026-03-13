// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import FeeRecordsTabs from './FeeRecordsTabs';

export default function FeeTabContent({ ctx }: { ctx: any }) {
  const { activeTab, advancedFilters, allIds, amountMax, amountMin, averageResults, cls, collectedBy, currentPage, setCurrentPage, delay, discountApplied, dueDateFrom, dueDateTo, duration, feeType, filteredStudentSummaries, filters, height, hover, isMobile, mobileView, opacity, overdueDaysMax, overdueDaysMin, pageSize, paidDateFrom, paidDateTo, paymentMethod, paymentStatus, query, recentSearches, rollNo, row, searchAnalytics, searchTerm, selectedClass, selectedStatus, selectedStudents, setAdvancedFilters, setMobileView, setPageSize, setSearchAnalytics, setSearchTerm, setSelectedClass, setSelectedStatus, setSelectedStudents, setShowAdvancedFilters, setShowBulkCollectionModal, setShowBulkDiscountModal, setShowColumnSettings, setShowReceiptModal, showAdvancedFilters, studentFeeSummaries, studentName, theme, totalSearches, setActiveTab } = ctx;

  return (
    <>
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'all-students' && (
            <motion.div
              key="all-students"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Summary Cards — handled by FeeDashboard above */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 hidden">
                <div className={`p-4 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {studentFeeSummaries.length}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Students
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold text-green-500`}>
                      {studentFeeSummaries.filter(s => s.paymentStatus === 'fully_paid').length}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Fully Paid
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold text-yellow-500`}>
                      {studentFeeSummaries.filter(s => s.paymentStatus === 'partially_paid').length}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Partially Paid
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold text-red-500`}>
                      {studentFeeSummaries.filter(s => s.paymentStatus === 'overdue').length}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Overdue
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filters removed — handled by FeeFilters above */}
              <motion.div className="hidden">
                {/* AI-Powered Search Bar */}
                <div className="mb-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <div className="absolute left-4 top-3.5 flex items-center gap-2">
                          {searchAnalytics.totalSearches > 0 ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          ) : (
                            <svg className={`w-5 h-5 ${
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          )}
                          <span className={`text-xs font-medium ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`}>AI</span>
                        </div>
                        <input
                          type="text"
                          placeholder="AI Search: Try 'students with overdue fees', 'class 10A pending payments', 'high fee performers'..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (e.target.value.length > 2) {
                              // Update search analytics
                              setSearchAnalytics(prev => ({
                                ...prev,
                                totalSearches: prev.totalSearches + 1,
                                averageResults: prev.totalSearches > 0 ? 
                                  (prev.averageResults + filteredStudentSummaries.length) / 2 : 
                                  filteredStudentSummaries.length,
                                recentSearches: [e.target.value, ...prev.recentSearches.slice(0, 4)]
                              }));
                            }
                          }}
                          className={`w-full pl-20 pr-12 py-3 rounded-xl border ${
                            theme === 'dark'
                              ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className={`absolute right-4 top-3.5 p-1 rounded-lg transition-colors ${
                              theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                            }`}
                          >
                            <svg className={`w-4 h-4 ${
                              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                        }`}
                      >
                        🔍 Advanced Filters
                      </button>

                      <button
                        onClick={() => setShowColumnSettings(!showColumnSettings)}
                        className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        ⚙️ Columns
                      </button>

                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(parseInt(e.target.value))}
                        className={`px-4 py-3 rounded-xl border font-medium ${
                          theme === 'dark'
                            ? 'bg-gray-900 border-gray-800 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                      </select>

                      {isMobile && (
                        <select
                          value={mobileView}
                          onChange={(e) => setMobileView(e.target.value as 'list' | 'grid' | 'card')}
                          className={`px-4 py-3 rounded-xl border font-medium ${
                            theme === 'dark'
                              ? 'bg-gray-900 border-gray-800 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="list">List View</option>
                          <option value="grid">Grid View</option>
                          <option value="card">Card View</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="all">All Classes</option>
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(cls => (
                        <option key={cls} value={cls}>Class {cls}</option>
                      ))}
                    </select>

                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="all">All Status</option>
                      <option value="fully_paid">Fully Paid</option>
                      <option value="partially_paid">Partially Paid</option>
                      <option value="no_payment">No Payment</option>
                      <option value="overdue">Overdue</option>
                    </select>

                    <select
                      value={advancedFilters.feeType}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, feeType: e.target.value }))}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">All Fee Types</option>
                      <option value="tuition">Tuition</option>
                      <option value="transport">Transport</option>
                      <option value="lab">Lab</option>
                      <option value="exam">Exam</option>
                      <option value="hostel">Hostel</option>
                    </select>

                    <select
                      value={advancedFilters.paymentMethod}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        theme === 'dark'
                          ? 'bg-gray-900 border-gray-800 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">All Payment Methods</option>
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="cheque">Cheque</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>

                    <button
                      onClick={() => {
                        setSelectedClass('all');
                        setSelectedStatus('all');
                        setAdvancedFilters({
                          studentName: '',
                          rollNo: '',
                          class: '',
                          paymentStatus: '',
                          feeType: '',
                          paymentMethod: '',
                          amountMin: '',
                          amountMax: '',
                          dueDateFrom: '',
                          dueDateTo: '',
                          paidDateFrom: '',
                          paidDateTo: '',
                          overdueDaysMin: '',
                          overdueDaysMax: '',
                          discountApplied: '',
                          collectedBy: ''
                        });
                        setSearchTerm('');
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        theme === 'dark'
                          ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                          : 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                      }`}
                    >
                      🔄 Clear Filters
                    </button>
                  </div>
                </div>

                {/* Advanced Filters Section */}
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-6 p-4 rounded-lg border ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <h4 className={`text-sm font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      🔍 Advanced Filters
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Student Name
                        </label>
                        <input
                          type="text"
                          value={advancedFilters.studentName}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, studentName: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Search by name..."
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Roll Number
                        </label>
                        <input
                          type="text"
                          value={advancedFilters.rollNo}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, rollNo: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Enter roll number..."
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Amount Range
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={advancedFilters.amountMin}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                            className={`flex-1 px-3 py-2 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="Min"
                          />
                          <input
                            type="number"
                            value={advancedFilters.amountMax}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                            className={`flex-1 px-3 py-2 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="Max"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Overdue Days
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={advancedFilters.overdueDaysMin}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, overdueDaysMin: e.target.value }))}
                            className={`flex-1 px-3 py-2 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="Min days"
                          />
                          <input
                            type="number"
                            value={advancedFilters.overdueDaysMax}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, overdueDaysMax: e.target.value }))}
                            className={`flex-1 px-3 py-2 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            placeholder="Max days"
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Due Date Range
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={advancedFilters.dueDateFrom}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dueDateFrom: e.target.value }))}
                            className={`flex-1 px-3 py-2 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <input
                            type="date"
                            value={advancedFilters.dueDateTo}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dueDateTo: e.target.value }))}
                            className={`flex-1 px-3 py-2 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Paid Date Range
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={advancedFilters.paidDateFrom}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, paidDateFrom: e.target.value }))}
                            className={`flex-1 px-3 py-2 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          <input
                            type="date"
                            value={advancedFilters.paidDateTo}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, paidDateTo: e.target.value }))}
                            className={`flex-1 px-3 py-2 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Discount Applied
                        </label>
                        <select
                          value={advancedFilters.discountApplied}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, discountApplied: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">All</option>
                          <option value="yes">With Discount</option>
                          <option value="no">No Discount</option>
                        </select>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Collected By
                        </label>
                        <select
                          value={advancedFilters.collectedBy}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, collectedBy: e.target.value }))}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            theme === 'dark'
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">All Staff</option>
                          <option value="Admin">Admin</option>
                          <option value="Teacher">Teacher</option>
                          <option value="Accountant">Accountant</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          // Apply advanced filters logic here
                          console.log('Applying advanced filters:', advancedFilters);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        Apply Filters
                      </button>
                      <button
                        onClick={() => {
                          setAdvancedFilters({
                            studentName: '',
                            rollNo: '',
                            class: '',
                            paymentStatus: '',
                            feeType: '',
                            paymentMethod: '',
                            amountMin: '',
                            amountMax: '',
                            dueDateFrom: '',
                            dueDateTo: '',
                            paidDateFrom: '',
                            paidDateTo: '',
                            overdueDaysMin: '',
                            overdueDaysMax: '',
                            discountApplied: '',
                            collectedBy: ''
                          });
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        Clear Advanced
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* AI Search History & Suggestions */}
                {searchAnalytics.recentSearches.length > 0 && (
                  <div className="mt-4">
                    <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Recent AI Searches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {searchAnalytics.recentSearches.map((query, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchTerm(query)}
                          className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                            theme === 'dark'
                              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                              : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Results Summary and Bulk Actions — handled by FeeFilters */}
              <div className={`p-4 rounded-lg border mb-4 hidden ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Showing <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {filteredStudentSummaries.length}
                      </span> of <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {studentFeeSummaries.length}
                      </span> students
                    </div>
                    {selectedStudents.length > 0 && (
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                        theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
                      } border`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          {selectedStudents.length}
                        </div>
                        <span className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                        }`}>
                          student{selectedStudents.length !== 1 ? 's' : ''} selected
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const allIds = filteredStudentSummaries.map(s => s.studentId);
                        setSelectedStudents(allIds.length === selectedStudents.length ? [] : allIds);
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedStudents.length === filteredStudentSummaries.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={() => {
                        const csvContent = [
                          ['Student Name', 'Roll No', 'Class', 'Total Fees', 'Paid', 'Pending', 'Overdue', 'Status', 'Last Payment'],
                          ...filteredStudentSummaries.map(student => [
                            student.studentName,
                            student.rollNo,
                            student.studentClass,
                            student.totalFees,
                            student.totalPaid,
                            student.totalPending,
                            student.totalOverdue,
                            student.paymentStatus,
                            student.lastPaymentDate || 'N/A'
                          ])
                        ].map(row => row.join(',')).join('\n');

                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `all_students_fees_${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      📥 Export All
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Selection Actions — handled by FeeFilters */}
              <div className="hidden">
              {selectedStudents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {selectedStudents.length}
                      </div>
                      <p className={`font-medium ${
                        theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowBulkCollectionModal(true)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        💰 Collect Fees ({selectedStudents.length})
                      </button>
                      
                      <button
                        onClick={() => setShowBulkDiscountModal(true)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                        }`}
                      >
                        🎁 Apply Discount ({selectedStudents.length})
                      </button>
                      
                      <button
                        onClick={() => {
                          // Generate sample receipt for selected students
                          const samplePayment = {
                            receipt: `RCPT-2024-BULK-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                            date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
                            method: 'Bulk Payment',
                            amount: selectedStudents.length * 5000
                          };
                          if (ctx.setShowDetailedReceipt) {
                            ctx.setSelectedPaymentForReceipt(samplePayment);
                            ctx.setShowDetailedReceipt(true);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        🧾 Generate Receipt ({selectedStudents.length})
                      </button>
                      
                      <button
                        onClick={() => {
                          // Send reminders logic
                          console.log('Sending reminders to:', selectedStudents);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        📧 Send Reminder ({selectedStudents.length})
                      </button>
                      
                      <button
                        onClick={() => {
                          // Export selected logic
                          const selectedData = filteredStudentSummaries.filter(s => selectedStudents.includes(s.studentId));
                          const csvContent = [
                            ['Student Name', 'Roll No', 'Class', 'Total Fees', 'Paid', 'Pending', 'Overdue', 'Status'],
                            ...selectedData.map(student => [
                              student.studentName,
                              student.rollNo,
                              student.studentClass,
                              student.totalFees,
                              student.totalPaid,
                              student.totalPending,
                              student.totalOverdue,
                              student.paymentStatus
                            ])
                          ].map(row => row.join(',')).join('\n');

                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `selected_students_fees_${new Date().toISOString().split('T')[0]}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        📥 Export Selected ({selectedStudents.length})
                      </button>
                      
                      <button
                        onClick={() => setSelectedStudents([])}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              </div>

              {/* Students Fee Table */}
              <div className={`rounded-xl border overflow-hidden ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedStudents.length === filteredStudentSummaries.length && filteredStudentSummaries.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents(filteredStudentSummaries.map(s => s.studentId));
                              } else {
                                setSelectedStudents([]);
                              }
                            }}
                            className={`rounded border-gray-300 ${
                              theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                            }`}
                          />
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Student</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Total Fees</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Paid</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Pending</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Overdue</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Status</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Last Payment</th>
                        <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {filteredStudentSummaries.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((student) => (
                        <tr key={student.studentId} className={`hover:${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                        } transition-colors ${selectedStudents.includes(student.studentId) ? (
                          theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
                        ) : ''}`}>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.studentId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents([...selectedStudents, student.studentId]);
                                } else {
                                  setSelectedStudents(selectedStudents.filter(id => id !== student.studentId));
                                }
                              }}
                              className={`rounded border-gray-300 ${
                                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                              }`}
                            />
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            <div>
                              <div className="font-medium">{student.studentName}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {student.rollNo} • {student.studentClass}
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            <div>
                              <div className="font-medium">₹{student.totalFees.toLocaleString()}</div>
                              {student.discountApplied > 0 && (
                                <div className={`text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                  -₹{student.discountApplied} discount
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            <span className="text-green-500 font-medium">
                              ₹{student.totalPaid.toLocaleString()}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            <span className="text-yellow-500 font-medium">
                              ₹{student.totalPending.toLocaleString()}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            <span className="text-red-500 font-medium">
                              ₹{student.totalOverdue.toLocaleString()}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap`}>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              student.paymentStatus === 'fully_paid'
                                ? 'bg-green-100 text-green-800'
                                : student.paymentStatus === 'partially_paid'
                                ? 'bg-yellow-100 text-yellow-800'
                                : student.paymentStatus === 'no_payment'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.paymentStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {student.lastPaymentDate ? (
                              <div>
                                <div className="text-sm">{student.lastPaymentDate}</div>
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {Math.floor(Math.random() * 30) + 1} days ago
                                </div>
                              </div>
                            ) : (
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                No payment
                              </span>
                            )}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-center`}>
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => window.location.href = `/fee-collection?studentId=${student.studentId}`}
                                className={`text-blue-600 hover:text-blue-800 text-lg ${
                                  theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : ''
                                }`}
                                title="Collect Fee"
                              >
                                💰
                              </button>
                              <button
                                onClick={() => setShowReceiptModal(true)}
                                className={`text-green-600 hover:text-green-800 text-lg ${
                                  theme === 'dark' ? 'text-green-400 hover:text-green-300' : ''
                                }`}
                                title="View Receipt"
                              >
                                🧾
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStudents([student.studentId]);
                                  setActiveTab('student-profile');
                                }}
                                className={`text-purple-600 hover:text-purple-800 text-lg ${
                                  theme === 'dark' ? 'text-purple-400 hover:text-purple-300' : ''
                                }`}
                                title="Student Profile"
                              >
                                👤
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStudents([student.studentId]);
                                  setActiveTab('workflows');
                                }}
                                className={`text-orange-600 hover:text-orange-800 text-lg ${
                                  theme === 'dark' ? 'text-orange-400 hover:text-orange-300' : ''
                                }`}
                                title="Student Workflows"
                              >
                                ⚙️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className={`flex items-center justify-between px-6 py-4 border-t ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredStudentSummaries.length)} of {filteredStudentSummaries.length} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? theme === 'dark' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, Math.ceil(filteredStudentSummaries.length / pageSize)) }, (_, i) => {
                      const totalPages = Math.ceil(filteredStudentSummaries.length / pageSize);
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
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                              : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredStudentSummaries.length / pageSize), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredStudentSummaries.length / pageSize)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === Math.ceil(filteredStudentSummaries.length / pageSize)
                        ? theme === 'dark' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <FeeRecordsTabs ctx={ctx} />
        </AnimatePresence>
    </>
  );
}
