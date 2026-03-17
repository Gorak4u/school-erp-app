'use client';

import React, { useState, useCallback, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { teachersApi } from '@/lib/apiClient';
import { createTeacherSearchHandlers } from './handlers/searchHandlers';
import SearchPerformanceMonitor from '../shared/search/components/SearchPerformanceMonitor';
import { TeacherSearchEngine } from './search/TeacherSearchEngine';
import ClassTeacherFormAssignments from './components/ClassTeacherFormAssignments';

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const EMPTY_FORM = { 
  name: '', 
  firstName: '', 
  lastName: '', 
  email: '', 
  phone: '', 
  department: '', 
  subject: '', 
  qualification: '', 
  experience: '', 
  employeeId: '', 
  status: 'active', 
  joiningDate: '', 
  password: '', 
  isClassTeacher: false, 
  classTeacherAssignments: [] as any[],
  // New fields
  role: 'teacher',
  photo: '',
  salary: '',
  designation: '',
  bankName: '',
  bankAccountNo: '',
  bankIfsc: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  aadharNumber: '',
  emergencyName: '',
  emergencyPhone: '',
  remarks: ''
};

export default function StaffPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [boards, setBoards] = useState<any[]>([]);
  const [mediums, setMediums] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);
  const [dbSections, setDbSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  const fetcher = useCallback((p: any) => teachersApi.list(p), []);
  const {
    data: teachers, total, page, pageSize, totalPages, loading, error,
    filters, setFilter, resetFilters, setPage, setPageSize, toggleSort, sortBy, sortOrder, refresh,
  } = usePaginatedQuery(fetcher, 'teachers', {}, { pageSize: 50 });

  // Load school data for class teacher assignments
  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        // Load school configuration
        const schoolConfigRes = await fetch('/api/school-config');
        if (schoolConfigRes.ok) {
          const schoolConfigData = await schoolConfigRes.json();
          setSchoolData(schoolConfigData);
          setBoards(schoolConfigData.dropdowns?.boards || []);
          setMediums(schoolConfigData.dropdowns?.mediums || []);
          setDbClasses(schoolConfigData.dropdowns?.classes || []);
          setDbSections(schoolConfigData.dropdowns?.sections || []);
        }

        // Load academic years
        const academicYearsRes = await fetch('/api/school-structure/academic-years');
        if (academicYearsRes.ok) {
          const academicYearsData = await academicYearsRes.json();
          setAcademicYears(academicYearsData.academicYears || []);
        }
      } catch (error) {
        console.error('Failed to load school data:', error);
      }
    };

    loadSchoolData();
  }, []);

  // Search handlers
  const searchHandlers = createTeacherSearchHandlers({ teachers, refresh });
  const { teacherSearch, setTeacherSearch, performTeacherSearch, toggleTeacherSearch, clearSearchHistory } = searchHandlers;

  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
    isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;
  const thCls = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none hover:opacity-80 ${sub}`;
  const tdCls = `px-4 py-3 text-sm ${txt}`;

  const SortIcon = ({ field }: { field: string }) =>
    sortBy === field ? <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span> : <span className="ml-1 opacity-30">↕</span>;

  const activeCount = teachers.filter((t: any) => t.status === 'active').length;

  // Export functions
  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Employee ID', 'Department', 'Subject', 'Experience', 'Status', 'Joining Date'],
      ...teachers.map((t: any) => [
        t.name || '',
        t.email || '',
        t.employeeId || '',
        t.department || '',
        t.subject || '',
        t.experience || '',
        t.status || '',
        t.joiningDate || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(teachers, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Bulk actions
  const toggleTeacherSelection = (teacherId: number) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const toggleAllTeachers = () => {
    if (selectedTeachers.length === teachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(teachers.map((t: any) => t.id));
    }
  };

  const bulkDelete = async () => {
    if (selectedTeachers.length === 0) return;
    
    if (confirm(`Are you sure you want to deactivate ${selectedTeachers.length} teachers?`)) {
      try {
        await Promise.all(selectedTeachers.map(id => teachersApi.delete(id.toString())));
        setSelectedTeachers([]);
        refresh();
      } catch (error) {
        console.error('Bulk delete error:', error);
      }
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedTeachers.length === 0) return;
    
    try {
      await Promise.all(selectedTeachers.map(id => teachersApi.update(id.toString(), { status })));
      setSelectedTeachers([]);
      refresh();
    } catch (error) {
      console.error('Bulk update error:', error);
    }
  };

  return (
    <AppLayout currentPage="teachers" title="Staff Management">
      <div className="space-y-8 pb-8">
        {/* Modern Header */}
        <div className={`rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-8 shadow-lg`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${txt}`}>Staff Management</h1>
                  <p className={`text-sm ${sub} mt-1`}>
                    {loading ? 'Loading staff data...' : `Manage ${total.toLocaleString()} staff members across your school`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  isDark 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Staff Member
                </span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                    selectedTeachers.length > 0
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg'
                      : isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    {selectedTeachers.length > 0 ? `${selectedTeachers.length} Selected` : 'Bulk Actions'}
                  </span>
                </button>
                {showBulkActions && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl z-10 overflow-hidden ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium ${txt}`}>Bulk Operations</p>
                    </div>
                    <button
                      onClick={() => { bulkUpdateStatus('active'); setShowBulkActions(false); }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <div>
                        <div className="font-medium">Mark as Active</div>
                        <div className={`text-xs ${sub}`}>Activate selected staff</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { bulkUpdateStatus('inactive'); setShowBulkActions(false); }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <div>
                        <div className="font-medium">Mark as Inactive</div>
                        <div className={`text-xs ${sub}`}>Deactivate selected staff</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { bulkDelete(); setShowBulkActions(false); }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-red-600`}
                    >
                      <span className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </span>
                      <div>
                        <div className="font-medium">Deactivate Selected</div>
                        <div className={`text-xs ${sub}`}>Remove selected staff</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button
                  className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </span>
                </button>
                {showExportMenu && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl z-10 overflow-hidden ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <button
                      onClick={exportToCSV}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m5-4h4" />
                      </svg>
                      Export as CSV
                    </button>
                    <button
                      onClick={exportToJSON}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Total Staff</p>
                <p className={`text-3xl font-bold mt-2 ${txt}`}>{total.toLocaleString()}</p>
                <p className={`text-xs ${sub} mt-1`}>All staff members</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50' : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-600'}`}>Active Staff</p>
                <p className={`text-3xl font-bold mt-2 ${txt}`}>{activeCount.toLocaleString()}</p>
                <p className={`text-xs ${sub} mt-1`}>Currently active</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>On This Page</p>
                <p className={`text-3xl font-bold mt-2 ${txt}`}>{teachers.length}</p>
                <p className={`text-xs ${sub} mt-1`}>Currently displayed</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/50' : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>Total Pages</p>
                <p className={`text-3xl font-bold mt-2 ${txt}`}>{totalPages}</p>
                <p className={`text-xs ${sub} mt-1`}>Page {page} of {totalPages}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Filters Section */}
        <div className={`rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-6 shadow-lg`}>
          {/* Search Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${txt}`}>Search & Filters</h3>
              <p className={`text-sm ${sub}`}>Find staff members quickly</p>
            </div>
          </div>

          {/* AI Search Input */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <input
                className={`${inputCls} pl-12 pr-4 py-3 rounded-xl border-2 ${
                  teacherSearch.enabled 
                    ? isDark 
                      ? 'bg-purple-900/30 border-purple-600 text-purple-100 placeholder-purple-300' 
                      : 'bg-purple-50 border-purple-300 text-purple-900 placeholder-purple-500'
                    : isDark 
                      ? 'bg-gray-800 border-gray-600' 
                      : 'bg-white border-gray-300'
                }`}
                placeholder={teacherSearch.enabled ? "AI Search: try 'mathematics department teachers' or 'senior teachers with PhD'..." : "Search by name, email, ID, subject, department..."}
                value={teacherSearch.enabled ? teacherSearch.query : (filters.search as string) || ''}
                onChange={e => {
                  if (teacherSearch.enabled) {
                    setTeacherSearch(prev => ({ ...prev, query: e.target.value }));
                    performTeacherSearch(e.target.value);
                  } else {
                    setFilter('search', e.target.value);
                  }
                }}
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                {teacherSearch.isSearching ? (
                  <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full" />
                ) : (
                  <svg className={`w-5 h-5 ${teacherSearch.enabled ? 'text-purple-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              {teacherSearch.enabled && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-600 text-white font-medium">AI</span>
                </div>
              )}
            </div>
            <button
              onClick={toggleTeacherSearch}
              className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all transform hover:scale-105 ${
                teacherSearch.enabled
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg'
                  : isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                {teacherSearch.enabled ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Search
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Basic Search
                  </>
                )}
              </span>
            </button>
          </div>

          {/* AI Search Suggestions */}
          {teacherSearch.enabled && teacherSearch.searchAnalytics?.recentSearches?.length > 0 && (
            <div className={`mb-6 p-4 rounded-xl border ${
              isDark 
                ? 'bg-gradient-to-r from-purple-900/30 to-purple-800/20 border-purple-700/50' 
                : 'bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-purple-600">Recent Searches</span>
                </div>
                <button
                  onClick={clearSearchHistory}
                  className={`text-xs px-3 py-1 rounded-xl transition-colors ${
                    isDark 
                      ? 'text-purple-400 hover:text-white hover:bg-purple-700/50' 
                      : 'text-purple-600 hover:text-purple-900 hover:bg-purple-200'
                  }`}
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(teacherSearch.searchAnalytics?.recentSearches || []).slice(0, 6).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      performTeacherSearch(search);
                    }}
                    className={`px-3 py-2 text-xs rounded-xl font-medium transition-all hover:scale-105 ${
                      isDark
                        ? 'bg-purple-800/50 text-purple-200 hover:bg-purple-700/50 border border-purple-600/30'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                    }`}
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={`block text-xs font-medium mb-2 ${sub}`}>Search</label>
              <input
                className={`${inputCls} rounded-xl`}
                placeholder="Name, email, ID..."
                value={teacherSearch.enabled ? '' : (filters.search as string) || ''}
                onChange={e => !teacherSearch.enabled && setFilter('search', e.target.value)}
                disabled={teacherSearch.enabled}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-2 ${sub}`}>Status</label>
              <select
                className={`${inputCls} rounded-xl`}
                value={(filters.status as string) || ''}
                onChange={e => setFilter('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-2 ${sub}`}>Role</label>
              <select
                className={`${inputCls} rounded-xl`}
                value={(filters.role as string) || ''}
                onChange={e => setFilter('role', e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-2 ${sub}`}>Department</label>
              <input
                className={`${inputCls} rounded-xl`}
                placeholder="Department..."
                value={(filters.department as string) || ''}
                onChange={e => setFilter('department', e.target.value)}
              />
            </div>
          </div>
          
          {/* Clear Filters */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500">
              {Object.values(filters).filter(v => v).length > 0 && (
                <span>{Object.values(filters).filter(v => v).length} filters applied</span>
              )}
            </div>
            <button
              onClick={resetFilters}
              className={`text-sm px-4 py-2 rounded-xl transition-colors ${
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Modern Table */}
        <div className={`rounded-2xl border overflow-hidden shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          
          {/* Table Header */}
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className={`text-lg font-semibold ${txt}`}>Staff Directory</h3>
                {selectedTeachers.length > 0 && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDark ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedTeachers.length} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <select
                  className={`${inputCls} text-sm rounded-xl`}
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} per page</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
                <tr>
                  {[
                    { label: '', field: 'checkbox', width: 'w-12' },
                    { label: 'Staff Member', field: 'name', width: 'min-w-[200px]' },
                    { label: 'Employee ID', field: 'employeeId', width: 'min-w-[120px]' },
                    { label: 'Department', field: 'department', width: 'min-w-[140px]' },
                    { label: 'Subject', field: 'subject', width: 'min-w-[120px]' },
                    { label: 'Class Teacher', field: 'classTeacher', width: 'min-w-[100px]' },
                    { label: 'Experience', field: 'experience', width: 'min-w-[80px]' },
                    { label: 'Status', field: 'status', width: 'min-w-[100px]' },
                    { label: 'Joined', field: 'joiningDate', width: 'min-w-[100px]' },
                    { label: 'Actions', field: 'actions', width: 'w-24' },
                  ].map(col => (
                    <th key={col.field} className={`${thCls} ${col.width || ''} px-4 py-3`} onClick={() => col.field !== 'checkbox' && col.field !== 'actions' && toggleSort(col.field)}>
                      {col.field === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={selectedTeachers.length === teachers.length && teachers.length > 0}
                          onChange={toggleAllTeachers}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      ) : (
                        <>
                          {col.label}<SortIcon field={col.field} />
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {loading && teachers.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${60 + (j * 7) % 30}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <p className={`text-lg font-medium ${txt}`}>No teachers found</p>
                      <p className={`text-sm mt-1 ${sub}`}>Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher: any) => (
                    <tr key={teacher.id} className={`transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                      <td className={tdCls}>
                        <input
                          type="checkbox"
                          checked={selectedTeachers.includes(teacher.id)}
                          onChange={() => toggleTeacherSelection(teacher.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            {teacher.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${txt}`}>{teacher.name}</p>
                            <p className={`text-xs ${sub}`}>{teacher.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`${tdCls} font-mono text-xs`}>{teacher.employeeId}</td>
                      <td className={tdCls}>{teacher.department || '—'}</td>
                      <td className={tdCls}>{teacher.subject || '—'}</td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={teacher.isClassTeacher || false}
                            disabled
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className={`text-xs ${sub}`}>
                            {teacher.isClassTeacher ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </td>
                      <td className={tdCls}>{teacher.experience != null ? `${teacher.experience}y` : '—'}</td>
                      <td className={tdCls}>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          teacher.status === 'active'
                            ? 'bg-green-500/15 text-green-400'
                            : teacher.status === 'on_leave'
                            ? 'bg-yellow-500/15 text-yellow-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {teacher.status}
                        </span>
                      </td>
                      <td className={`${tdCls} text-xs`}>{teacher.joiningDate || '—'}</td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-2">
<button
                            onClick={() => {
                              setEditingTeacher(teacher);
                              setForm({
                                name: teacher.name || '',
                                firstName: teacher.name?.split(' ')[0] || '',
                                lastName: teacher.name?.split(' ').slice(1).join(' ') || '',
                                email: teacher.email || '',
                                phone: teacher.phone || '',
                                department: teacher.department || '',
                                subject: teacher.subject || '',
                                qualification: teacher.qualification || '',
                                experience: teacher.experience?.toString() || '',
                                employeeId: teacher.employeeId || '',
                                status: teacher.status || 'active',
                                joiningDate: teacher.joiningDate || '',
                                password: '',
                                isClassTeacher: teacher.isClassTeacher || false,
                                classTeacherAssignments: teacher.classTeacherAssignments || [],
                                // New fields
                                role: teacher.user?.role || 'teacher',
                                photo: teacher.photo || '',
                                salary: teacher.salary?.toString() || '',
                                designation: teacher.designation || '',
                                bankName: teacher.bankName || '',
                                bankAccountNo: teacher.bankAccountNo || '',
                                bankIfsc: teacher.bankIfsc || '',
                                gender: teacher.gender || '',
                                dateOfBirth: teacher.dateOfBirth || '',
                                address: teacher.address || '',
                                aadharNumber: teacher.aadharNumber || '',
                                emergencyName: teacher.emergencyName || '',
                                emergencyPhone: teacher.emergencyPhone || '',
                                remarks: teacher.remarks || ''
                              });
                              setShowEditModal(true);
                            }}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              isDark 
                                ? 'border-blue-600 text-blue-400 hover:bg-blue-600/20' 
                                : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(teacher)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              isDark 
                                ? 'border-red-600 text-red-400 hover:bg-red-600/20' 
                                : 'border-red-500 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
            <p className={`text-sm ${sub}`}>
              {loading ? 'Loading…' : `Showing ${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)} disabled={page === 1} className={`px-2 py-1 rounded-lg text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >«</button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-3 py-1 rounded-lg text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >‹ Prev</button>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
              >
                {page} / {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={`px-3 py-1 rounded-lg text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >Next ›</button>
              <button
                onClick={() => setPage(totalPages)} disabled={page >= totalPages} className={`px-2 py-1 rounded-lg text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >»</button>
            </div>
          </div>
        </div>
      {/* Edit Staff Modal - Modern Design */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowEditModal(false)}>
          <div className={`w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`px-8 py-6 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-2xl font-bold ${txt}`}>Edit Staff Member</h3>
                  <p className={`text-sm ${sub} mt-1`}>Update the details for {form.firstName} {form.lastName}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {formError && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formError}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Photo & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Photo Upload */}
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${txt}`}>Staff Photo</label>
                    <div className="flex flex-col items-center">
                      <div className={`w-32 h-32 rounded-full border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'} flex items-center justify-center overflow-hidden`}>
                        {form.photo ? (
                          <img src={form.photo} alt="Staff preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <svg className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No photo</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // For now, just create a preview URL
                              // In production, you'd upload to server
                              const previewUrl = URL.createObjectURL(file);
                              setForm(prev => ({ ...prev, photo: previewUrl }));
                            }
                          }}
                          className="hidden"
                          id="photo-upload-edit"
                        />
                        <label
                          htmlFor="photo-upload-edit"
                          className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                            isDark 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          Upload Photo
                        </label>
                        <div className="text-center">
                          <input
                            type="url"
                            placeholder="Or enter photo URL"
                            value={form.photo}
                            onChange={e => setForm(prev => ({ ...prev, photo: e.target.value }))}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Basic Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>First Name *</label>
                        <input
                          type="text"
                          className={inputCls}
                          value={form.firstName}
                          onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value, name: `${e.target.value} ${form.lastName}`.trim() }))}
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>Last Name *</label>
                        <input
                          type="text"
                          className={inputCls}
                          value={form.lastName}
                          onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value, name: `${form.firstName} ${e.target.value}`.trim() }))}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Role *</label>
                      <select className={inputCls} value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}>
                        <option value="">Select Role...</option>
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="parent">Parent</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Designation</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.designation}
                        onChange={e => setForm(prev => ({ ...prev, designation: e.target.value }))}
                        placeholder="e.g., Mathematics Teacher"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Department</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.department}
                        onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="e.g., Science Department"
                      />
                    </div>
                  </div>
                </div>

                {/* Middle Column - Contact & Professional */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Contact Information</h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Email (for login account)</label>
                      <input
                        type="email"
                        className={inputCls}
                        value={form.email}
                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="staff@school.com"
                      />
                      <p className={`text-xs ${sub} mt-1`}>Optional - Leave blank to create staff record without login access</p>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Phone</label>
                      <input
                        type="tel"
                        className={inputCls}
                        value={form.phone}
                        onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Address</label>
                      <textarea
                        className={inputCls}
                        value={form.address}
                        onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter full address"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Professional Information</h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Qualification</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.qualification}
                        onChange={e => setForm(prev => ({ ...prev, qualification: e.target.value }))}
                        placeholder="e.g., M.Sc. Mathematics"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Subject</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.subject}
                        onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>Experience (years)</label>
                        <input
                          type="number"
                          className={inputCls}
                          value={form.experience}
                          onChange={e => setForm(prev => ({ ...prev, experience: e.target.value }))}
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>Salary</label>
                        <input
                          type="number"
                          className={inputCls}
                          value={form.salary}
                          onChange={e => setForm(prev => ({ ...prev, salary: e.target.value }))}
                          placeholder="50000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>Joining Date</label>
                        <input
                          type="date"
                          className={inputCls}
                          value={form.joiningDate}
                          onChange={e => setForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>Date of Birth</label>
                        <input
                          type="date"
                          className={inputCls}
                          value={form.dateOfBirth}
                          onChange={e => setForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Gender</label>
                      <select className={inputCls} value={form.gender} onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column - Financial & Additional */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Bank Details */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Bank Details</h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Bank Name</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.bankName}
                        onChange={e => setForm(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="e.g., State Bank of India"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Bank Account Number</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.bankAccountNo}
                        onChange={e => setForm(prev => ({ ...prev, bankAccountNo: e.target.value }))}
                        placeholder="Enter account number"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Bank IFSC Code</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.bankIfsc}
                        onChange={e => setForm(prev => ({ ...prev, bankIfsc: e.target.value }))}
                        placeholder="e.g., SBIN0001234"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Emergency Contact</h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Contact Name</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.emergencyName}
                        onChange={e => setForm(prev => ({ ...prev, emergencyName: e.target.value }))}
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Contact Phone</label>
                      <input
                        type="tel"
                        className={inputCls}
                        value={form.emergencyPhone}
                        onChange={e => setForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                        placeholder="Emergency contact phone"
                      />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Additional Information</h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Aadhar Number</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.aadharNumber}
                        onChange={e => setForm(prev => ({ ...prev, aadharNumber: e.target.value }))}
                        placeholder="Enter Aadhar number"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Remarks</label>
                      <textarea
                        className={inputCls}
                        value={form.remarks}
                        onChange={e => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                        placeholder="Enter any additional remarks"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Status</label>
                      <select className={inputCls} value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div className={`mt-8 p-4 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                <h4 className={`text-sm font-semibold ${txt} mb-4`}>Account Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${sub}`}>Password (if email provided)</label>
                    <input
                      type="password"
                      className={inputCls}
                      value={form.password}
                      onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isClassTeacherEdit"
                      checked={form.isClassTeacher}
                      onChange={e => setForm(prev => ({ ...prev, isClassTeacher: e.target.checked, classTeacherAssignments: e.target.checked ? prev.classTeacherAssignments : [] }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isClassTeacherEdit" className={`ml-2 text-sm font-medium ${txt}`}>
                      Is this staff member a Class Teacher?
                    </label>
                  </div>
                </div>

                {form.isClassTeacher && (
                  <div className="mt-4">
                    <ClassTeacherFormAssignments
                      assignments={form.classTeacherAssignments}
                      boards={boards}
                      mediums={mediums}
                      classes={dbClasses}
                      sections={dbSections}
                      academicYears={academicYears}
                      theme={theme}
                      onChange={(assignments) => setForm(prev => ({ ...prev, classTeacherAssignments: assignments }))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`px-8 py-6 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
              <button 
                onClick={() => { setShowEditModal(false); setForm({ ...EMPTY_FORM }); setFormError(''); }} 
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={async () => {
                  if (!form.firstName || !form.lastName || !form.email) { setFormError('First Name, Last Name, and Email are required'); return; }
                  setSaving(true); setFormError('');
                  try {
                    await teachersApi.update(editingTeacher.id, { 
                      ...form, 
                      experience: form.experience ? Number(form.experience) : null,
                      salary: form.salary ? Number(form.salary) : null,
                    });
                    setShowEditModal(false); setForm({ ...EMPTY_FORM }); refresh();
                  } catch (err: any) { 
                    setFormError(err.message || 'Failed to update staff');
                  }
                  finally { setSaving(false); }
                }}
                className="px-6 py-3 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Updating Staff Member...
                  </span>
                ) : 'Update Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className={`w-full max-w-md mx-4 rounded-xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold ${txt}`}>Confirm Deletion</h3>
            </div>
            <div className="px-6 py-4">
              <p className={`text-sm ${sub}`}>
                Are you sure you want to deactivate <span className="font-medium text-white">{deleteConfirm.name}</span>? This action can be undone by reactivating the teacher.
              </p>
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => setDeleteConfirm(null)} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>Cancel</button>
              <button
                onClick={async () => {
                  try {
                    await teachersApi.delete(deleteConfirm.id);
                    setDeleteConfirm(null);
                    refresh();
                  } catch (err: any) {
                    console.error('Delete error:', err);
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Search Performance Monitor */}
      <SearchPerformanceMonitor 
        theme={theme} 
        engine={TeacherSearchEngine.getInstance()} 
      />

      {/* Add Staff Modal - Modern Design */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className={`w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`px-8 py-6 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-2xl font-bold ${txt}`}>Add New Staff Member</h3>
                  <p className={`text-sm ${sub} mt-1`}>Fill in the details to add a new staff member to your school</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {formError && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formError}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Photo & Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Photo Upload */}
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${txt}`}>Staff Photo</label>
                    <div className="flex flex-col items-center">
                      <div className={`w-32 h-32 rounded-full border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'} flex items-center justify-center overflow-hidden`}>
                        {form.photo ? (
                          <img src={form.photo} alt="Staff preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <svg className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No photo</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // For now, just create a preview URL
                              // In production, you'd upload to server
                              const previewUrl = URL.createObjectURL(file);
                              setForm(prev => ({ ...prev, photo: previewUrl }));
                            }
                          }}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                            isDark 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          Upload Photo
                        </label>
                        <div className="text-center">
                          <input
                            type="url"
                            placeholder="Or enter photo URL"
                            value={form.photo}
                            onChange={e => setForm(prev => ({ ...prev, photo: e.target.value }))}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Basic Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>First Name *</label>
                        <input
                          type="text"
                          className={inputCls}
                          value={form.firstName}
                          onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value, name: `${e.target.value} ${form.lastName}`.trim() }))}
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>Last Name *</label>
                        <input
                          type="text"
                          className={inputCls}
                          value={form.lastName}
                          onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value, name: `${form.firstName} ${e.target.value}`.trim() }))}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Role *</label>
                      <select className={inputCls} value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}>
                        <option value="">Select Role...</option>
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="parent">Parent</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Designation</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.designation}
                        onChange={e => setForm(prev => ({ ...prev, designation: e.target.value }))}
                        placeholder="e.g., Mathematics Teacher"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Department</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.department}
                        onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="e.g., Science Department"
                      />
                    </div>
                  </div>
                </div>

                {/* Middle Column - Contact & Professional */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Contact Information</h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Email (for login account)</label>
                      <input
                        type="email"
                        className={inputCls}
                        value={form.email}
                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="staff@school.com"
                      />
                      <p className={`text-xs ${sub} mt-1`}>Optional - Leave blank to create staff record without login access</p>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Phone</label>
                      <input
                        type="tel"
                        className={inputCls}
                        value={form.phone}
                        onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Address</label>
                      <textarea
                        className={inputCls}
                        value={form.address}
                        onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter full address"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Professional Information</h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Qualification</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.qualification}
                        onChange={e => setForm(prev => ({ ...prev, qualification: e.target.value }))}
                        placeholder="e.g., M.Sc. Mathematics"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Subject</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.subject}
                        onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>Experience (years)</label>
                        <input
                          type="number"
                          className={inputCls}
                          value={form.experience}
                          onChange={e => setForm(prev => ({ ...prev, experience: e.target.value }))}
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>Salary</label>
                        <input
                          type="number"
                          className={inputCls}
                          value={form.salary}
                          onChange={e => setForm(prev => ({ ...prev, salary: e.target.value }))}
                          placeholder="50000"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>Joining Date</label>
                        <input
                          type="date"
                          className={inputCls}
                          value={form.joiningDate}
                          onChange={e => setForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${sub}`}>Date of Birth</label>
                        <input
                          type="date"
                          className={inputCls}
                          value={form.dateOfBirth}
                          onChange={e => setForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Gender</label>
                      <select className={inputCls} value={form.gender} onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Column - Financial & Additional */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Bank Details */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Bank Details</h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Bank Name</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.bankName}
                        onChange={e => setForm(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="e.g., State Bank of India"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Bank Account Number</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.bankAccountNo}
                        onChange={e => setForm(prev => ({ ...prev, bankAccountNo: e.target.value }))}
                        placeholder="Enter account number"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Bank IFSC Code</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.bankIfsc}
                        onChange={e => setForm(prev => ({ ...prev, bankIfsc: e.target.value }))}
                        placeholder="e.g., SBIN0001234"
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Emergency Contact</h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Contact Name</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.emergencyName}
                        onChange={e => setForm(prev => ({ ...prev, emergencyName: e.target.value }))}
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Contact Phone</label>
                      <input
                        type="tel"
                        className={inputCls}
                        value={form.emergencyPhone}
                        onChange={e => setForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                        placeholder="Emergency contact phone"
                      />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h4 className={`text-sm font-semibold ${txt}`}>Additional Information</h4>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Aadhar Number</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={form.aadharNumber}
                        onChange={e => setForm(prev => ({ ...prev, aadharNumber: e.target.value }))}
                        placeholder="Enter Aadhar number"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Remarks</label>
                      <textarea
                        className={inputCls}
                        value={form.remarks}
                        onChange={e => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                        placeholder="Enter any additional remarks"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${sub}`}>Status</label>
                      <select className={inputCls} value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Settings */}
              <div className={`mt-8 p-4 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                <h4 className={`text-sm font-semibold ${txt} mb-4`}>Account Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${sub}`}>Password (if email provided)</label>
                    <input
                      type="password"
                      className={inputCls}
                      value={form.password}
                      onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Leave blank for auto-generated password"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isClassTeacher"
                      checked={form.isClassTeacher}
                      onChange={e => setForm(prev => ({ ...prev, isClassTeacher: e.target.checked, classTeacherAssignments: e.target.checked ? prev.classTeacherAssignments : [] }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isClassTeacher" className={`ml-2 text-sm font-medium ${txt}`}>
                      Is this staff member a Class Teacher?
                    </label>
                  </div>
                </div>

                {form.isClassTeacher && (
                  <div className="mt-4">
                    <ClassTeacherFormAssignments
                      assignments={form.classTeacherAssignments}
                      boards={boards}
                      mediums={mediums}
                      classes={dbClasses}
                      sections={dbSections}
                      academicYears={academicYears}
                      theme={theme}
                      onChange={(assignments) => setForm(prev => ({ ...prev, classTeacherAssignments: assignments }))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`px-8 py-6 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
              <button 
                onClick={() => { setShowAddModal(false); setForm({ ...EMPTY_FORM }); setFormError(''); }} 
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={async () => {
                  if (!form.firstName || !form.lastName) { setFormError('First Name and Last Name are required'); return; }
                  setSaving(true); setFormError('');
                  try {
                    const response = await teachersApi.create({ 
                      ...form, 
                      experience: form.experience ? Number(form.experience) : null,
                      salary: form.salary ? Number(form.salary) : null,
                    });
                    setShowAddModal(false); setForm({ ...EMPTY_FORM }); refresh();
                    
                    // Show appropriate message based on whether user account was created
                    if (response.createUserAccount && response.temporaryPassword) {
                      if ((window as any).toast) {
                        (window as any).toast({
                          type: 'success',
                          title: 'Staff Created Successfully',
                          message: `Login account created! Welcome email sent to ${response.user.email}. Admin notification sent.`,
                          duration: 8000,
                        });
                      } else {
                        alert(`Staff created! Login account created for ${response.user.email}\nWelcome email and admin notification sent.`);
                      }
                    } else {
                      if ((window as any).toast) {
                        (window as any).toast({
                          type: 'info',
                          title: 'Staff Record Created',
                          message: 'Staff record created without login account (no email provided). Admin notification sent.',
                          duration: 6000,
                        });
                      } else {
                        alert('Staff record created! No login account created as no email was provided.\nAdmin notification sent with next steps.');
                      }
                    }
                  } catch (err: any) { 
                    // Check for subscription limit errors
                    if (err.message.includes('limit reached') || err.message.includes('quota') || err.message.includes('upgrade')) {
                      setFormError(err.message || 'Staff limit reached. Please upgrade your plan to add more staff.');
                      // Show upgrade prompt toast
                      if ((window as any).toast) {
                        (window as any).toast({
                          type: 'warning',
                          title: 'Staff Limit Reached',
                          message: err.message || 'Staff limit reached. Please upgrade your plan to add more staff.',
                          duration: 6000,
                          actions: [
                            {
                              label: 'View Subscription',
                              action: () => {
                                window.location.href = '/subscription';
                              }
                            },
                            {
                              label: 'Upgrade Plan',
                              action: () => {
                                window.location.href = '/billing';
                              }
                            }
                          ]
                        });
                      }
                    } else {
                      setFormError(err.message || 'Failed to create staff');
                    }
                  }
                  finally { setSaving(false); }
                }}
                className="px-6 py-3 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Saving Staff Member...
                  </span>
                ) : 'Save Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
