// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

interface StudentFiltersProps {
  advancedFilters: any;
  advancedSearch: any;
  applySavedFilter: (f: any) => void;
  attendanceFilter: string;
  clearAdvancedFilters: () => void;
  deleteSavedFilter: (id: string) => void;
  exportAllFilteredStudents: () => void;
  exportSelectedStudents: () => void;
  filteredStudents: Student[];
  isMobile: boolean;
  mobileView: string;
  pageSize: number;
  performAdvancedSearch: (q: string) => void;
  savedFilters: any[];
  searchTerm: string;
  selectedClass: string;
  selectedGender: string;
  selectedLanguage: string;
  selectedStatus: string;
  selectedStudents: number[];
  setAdvancedFilters: (v: any) => void;
  setAdvancedSearch: (v: any) => void;
  setAttendanceFilter: (v: string) => void;
  setCurrentPage: (v: number) => void;
  setMobileView: (v: string) => void;
  setPageSize: (v: number) => void;
  setSearchTerm: (v: string) => void;
  setSelectedClass: (v: string) => void;
  setSelectedGender: (v: string) => void;
  setSelectedLanguage: (v: string) => void;
  setSelectedStatus: (v: string) => void;
  setSelectedStudents: (v: number[]) => void;
  setShowAdvancedFilters: (v: boolean) => void;
  setShowBulkOperationModal: (v: boolean) => void;
  setShowColumnSettings: (v: boolean) => void;
  setShowSaveFilterModal: (v: boolean) => void;
  showAdvancedFilters: boolean;
  showColumnSettings: boolean;
  students: Student[];
  theme: 'dark' | 'light';
  onPromoteBulk?: () => void;
  onPromoteClass?: (cls: string, section: string) => void;
  canPromoteStudents?: boolean;
  canManageStudentBulk?: boolean;
}

export default function StudentFilters({
  advancedFilters, advancedSearch, applySavedFilter, attendanceFilter,
  clearAdvancedFilters, deleteSavedFilter, exportAllFilteredStudents,
  exportSelectedStudents, filteredStudents, isMobile, mobileView, pageSize,
  performAdvancedSearch, savedFilters, searchTerm, selectedClass, selectedGender,
  selectedLanguage, selectedStatus, selectedStudents, setAdvancedFilters, setAdvancedSearch, setAttendanceFilter, setCurrentPage, setMobileView,
  canPromoteStudents = true,
  canManageStudentBulk = true,
  setPageSize, setSearchTerm, setSelectedClass, setSelectedGender,
  setSelectedLanguage, setSelectedStatus, setSelectedStudents,
  setShowAdvancedFilters, setShowBulkOperationModal, setShowColumnSettings,
  setShowSaveFilterModal, showAdvancedFilters, showColumnSettings, students, theme,
  onPromoteBulk, onPromoteClass
}: StudentFiltersProps) {
  const { dropdowns } = useSchoolConfig();
  const dbClasses = dropdowns.classes;
  const dbMediums = dropdowns.mediums;

  const selectClass = `w-full px-3 py-2 rounded-lg text-sm border transition-colors ${
    theme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
  } outline-none`;

  const inputClass = `w-full px-3 py-2 rounded-lg text-sm border transition-colors ${
    theme === 'dark'
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  } outline-none`;

  return (
    <>
      {/* Advanced Filters Section */}
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
                  <button onClick={clearAdvancedFilters} className="px-3 py-1 text-sm rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                    Clear All
                  </button>
                  <button onClick={() => setShowSaveFilterModal(true)} className="px-3 py-1 text-sm rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors">
                    Save Filter
                  </button>
                  <button onClick={() => setShowAdvancedFilters(false)} className="px-3 py-1 text-sm rounded-lg bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 transition-colors">
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Filter Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Student Name</label>
                  <input type="text" value={advancedFilters.name} onChange={e => setAdvancedFilters(prev => ({ ...prev, name: e.target.value }))} placeholder="Search by name..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Admission No</label>
                  <input type="text" value={advancedFilters.admissionNo} onChange={e => setAdvancedFilters(prev => ({ ...prev, admissionNo: e.target.value }))} placeholder="Admission number..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Parent Name</label>
                  <input type="text" value={advancedFilters.parentName} onChange={e => setAdvancedFilters(prev => ({ ...prev, parentName: e.target.value }))} placeholder="Parent name..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Phone</label>
                  <input type="text" value={advancedFilters.phone} onChange={e => setAdvancedFilters(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone number..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Email</label>
                  <input type="text" value={advancedFilters.email} onChange={e => setAdvancedFilters(prev => ({ ...prev, email: e.target.value }))} placeholder="Email..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Blood Group</label>
                  <select value={advancedFilters.bloodGroup} onChange={e => setAdvancedFilters(prev => ({ ...prev, bloodGroup: e.target.value }))} className={selectClass}>
                    <option value="all">All</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Fee Status</label>
                  <select value={advancedFilters.feeStatus} onChange={e => setAdvancedFilters(prev => ({ ...prev, feeStatus: e.target.value }))} className={selectClass}>
                    <option value="all">All</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Category</label>
                  <select value={advancedFilters.category} onChange={e => setAdvancedFilters(prev => ({ ...prev, category: e.target.value }))} className={selectClass}>
                    <option value="all">All</option>
                    <option value="general">General</option>
                    <option value="obc">OBC</option>
                    <option value="sc">SC</option>
                    <option value="st">ST</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Attendance Min %</label>
                  <input type="number" value={advancedFilters.attendanceMin} onChange={e => setAdvancedFilters(prev => ({ ...prev, attendanceMin: e.target.value }))} placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Attendance Max %</label>
                  <input type="number" value={advancedFilters.attendanceMax} onChange={e => setAdvancedFilters(prev => ({ ...prev, attendanceMax: e.target.value }))} placeholder="100" className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>City</label>
                  <input type="text" value={advancedFilters.city} onChange={e => setAdvancedFilters(prev => ({ ...prev, city: e.target.value }))} placeholder="City..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>State</label>
                  <input type="text" value={advancedFilters.state} onChange={e => setAdvancedFilters(prev => ({ ...prev, state: e.target.value }))} placeholder="State..." className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Date of Birth</label>
                  <input type="date" value={advancedFilters.dateOfBirth} onChange={e => setAdvancedFilters(prev => ({ ...prev, dateOfBirth: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Admission From</label>
                  <input type="date" value={advancedFilters.admissionDateFrom} onChange={e => setAdvancedFilters(prev => ({ ...prev, admissionDateFrom: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Admission To</label>
                  <input type="date" value={advancedFilters.admissionDateTo} onChange={e => setAdvancedFilters(prev => ({ ...prev, admissionDateTo: e.target.value }))} className={inputClass} />
                </div>
              </div>

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Saved Filters</h4>
                  <div className="flex flex-wrap gap-2">
                    {savedFilters.map(filter => (
                      <div key={filter.id} className="flex items-center gap-1">
                        <button
                          onClick={() => applySavedFilter(filter)}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            theme === 'dark' ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          {filter.name}
                        </button>
                        <button onClick={() => deleteSavedFilter(filter.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Quick Filters Bar */}
      <div className={`rounded-xl border p-4 mb-4 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {/* Search Input */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={advancedSearch.enabled ? advancedSearch.query : searchTerm}
              onChange={e => {
                if (advancedSearch.enabled) {
                  setAdvancedSearch(prev => ({ ...prev, query: e.target.value }));
                  performAdvancedSearch(e.target.value);
                } else {
                  setSearchTerm(e.target.value);
                }
                setCurrentPage(1);
              }}
              placeholder={advancedSearch.enabled ? "AI Search: try 'students with low attendance in class 10'..." : "Search students by name, email, phone, admission no..."}
              className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
              } outline-none`}
            />
          </div>

          {/* Search Mode Toggle */}
          <button
            onClick={() => setAdvancedSearch(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              advancedSearch.enabled
                ? 'bg-purple-600 text-white'
                : theme === 'dark' ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {advancedSearch.enabled ? '🤖 AI Search ON' : '🔤 Basic Search'}
          </button>
        </div>

        {/* AI Search Suggestions */}
        {advancedSearch.enabled && advancedSearch.searchAnalytics?.recentSearches?.length > 0 && (
          <div className={`mt-3 p-3 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-purple-900/20 border-purple-700/50' 
              : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">🤖 Recent Searches:</span>
              <button
                onClick={() => {
                  // Clear search history
                  setAdvancedSearch(prev => ({
                    ...prev,
                    searchAnalytics: {
                      totalSearches: prev.searchAnalytics?.totalSearches || 0,
                      averageResults: prev.searchAnalytics?.averageResults || 0,
                      recentSearches: []
                    }
                  }));
                }}
                className={`text-xs p-1 rounded ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(advancedSearch.searchAnalytics?.recentSearches || []).slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    performAdvancedSearch(search);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    theme === 'dark'
                      ? 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setCurrentPage(1); }} className={selectClass} style={{ width: 'auto' }}>
            <option value="all">All Classes</option>
            {dbClasses.map(cls => (
              <option key={cls.value} value={cls.label}>{cls.label}</option>
            ))}
          </select>

          <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }} className={selectClass} style={{ width: 'auto' }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="transferred">Transferred</option>
            <option value="suspended">Suspended</option>
            <option value="exit">Exited</option>
            <option value="locked">Locked</option>
          </select>

          <select value={selectedGender} onChange={e => { setSelectedGender(e.target.value); setCurrentPage(1); }} className={selectClass} style={{ width: 'auto' }}>
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <select value={selectedLanguage} onChange={e => { setSelectedLanguage(e.target.value); setCurrentPage(1); }} className={selectClass} style={{ width: 'auto' }}>
            <option value="all">All Mediums</option>
            {dbMediums.map(m => (
              <option key={m.value} value={m.label}>{m.label}</option>
            ))}
          </select>

          <select value={attendanceFilter} onChange={e => { setAttendanceFilter(e.target.value); setCurrentPage(1); }} className={selectClass} style={{ width: 'auto' }}>
            <option value="all">All Attendance</option>
            <option value="high">High (≥90%)</option>
            <option value="average">Average (75-89%)</option>
            <option value="low">Low (&lt;75%)</option>
          </select>

          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className={selectClass} style={{ width: 'auto' }}>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${showAdvancedFilters ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`} title="Advanced Search">
              🔍 Advanced
            </button>
            <button onClick={() => setShowColumnSettings(true)} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`} title="Column Settings">
              ⚙️
            </button>
            {canPromoteStudents && onPromoteClass && selectedClass && selectedClass !== 'all' && (
              <button onClick={() => onPromoteClass(selectedClass, '')} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}>
                🎓 Promote {selectedClass}
              </button>
            )}
            <button onClick={exportAllFilteredStudents} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
              📥 Export ({filteredStudents.length})
            </button>
          </div>
        </div>

        {/* Selected Students Actions */}
        {selectedStudents.length > 0 && (
          <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              {selectedStudents.length} selected
            </span>
            <button onClick={exportSelectedStudents} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
              📥 Export Selected
            </button>
            {canPromoteStudents && onPromoteBulk && (
              <button onClick={onPromoteBulk} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}>
                🎓 Promote Selected
              </button>
            )}
            {canManageStudentBulk && (
              <button onClick={() => setShowBulkOperationModal(true)} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
                ⚙️ Bulk Operations
              </button>
            )}
            <button onClick={() => setSelectedStudents([])} className={`px-3 py-1 rounded text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}>
              Clear Selection
            </button>
          </div>
        )}
      </div>
    </>
  );
}
