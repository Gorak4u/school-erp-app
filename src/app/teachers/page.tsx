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
import TeacherProfileModal from './components/TeacherProfileModal';

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
  const [profileTeacherId, setProfileTeacherId] = useState<string | null>(null);
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

  const card = `p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
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
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div>
            <h2 className={`text-2xl font-bold ${txt}`}>Staff Management</h2>
            <p className={`mt-1 text-sm ${sub}`}>
              {loading ? 'Loading…' : `${total.toLocaleString()} staff members total`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              + Add Staff
            </button>
            <div className="relative">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTeachers.length > 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {selectedTeachers.length > 0 ? `${selectedTeachers.length} Selected` : 'Bulk Actions'}
              </button>
              {showBulkActions && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg border shadow-lg z-10 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <button
                    onClick={() => { bulkUpdateStatus('active'); setShowBulkActions(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Mark as Active
                  </button>
                  <button
                    onClick={() => { bulkUpdateStatus('inactive'); setShowBulkActions(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Mark as Inactive
                  </button>
                  <button
                    onClick={() => { bulkDelete(); setShowBulkActions(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 ${
                      isDark ? 'text-red-400' : 'text-red-600'
                    }`}
                  >
                    Deactivate Selected
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export
              </button>
              {showExportMenu && (
                <div className={`absolute right-0 mt-2 w-40 rounded-lg border shadow-lg z-10 ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <button
                    onClick={exportToCSV}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={exportToJSON}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Export as JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: total, icon: '👨‍🏫', color: 'blue' },
            { label: 'Active', value: activeCount, icon: '✅', color: 'green' },
            { label: 'On Page', value: teachers.length, icon: '📋', color: 'purple' },
            { label: 'Pages', value: totalPages, icon: '📑', color: 'orange' },
          ].map(s => (
            <div key={s.label} className={card}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-xs font-medium ${sub}`}>{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${txt}`}>{s.value.toLocaleString()}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* AI Search Input */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <input
                className={`${inputCls} pl-10`}
                placeholder={teacherSearch.enabled ? "AI Search: try 'mathematics department teachers' or 'senior teachers with PhD'..." : "Search name, email, ID, subject…"}
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
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {teacherSearch.isSearching ? (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                ) : (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            </div>
            <button
              onClick={toggleTeacherSearch}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                teacherSearch.enabled
                  ? 'bg-purple-600 text-white'
                  : isDark ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {teacherSearch.enabled ? '🤖 AI Search ON' : '🔤 Basic Search'}
            </button>
          </div>

          {/* AI Search Suggestions */}
          {teacherSearch.enabled && teacherSearch.searchAnalytics?.recentSearches?.length > 0 && (
            <div className={`mb-4 p-3 rounded-lg border ${
              isDark 
                ? 'bg-purple-900/20 border-purple-700/50' 
                : 'bg-purple-50 border-purple-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">🤖 Recent Searches:</span>
                <button
                  onClick={clearSearchHistory}
                  className={`text-xs p-1 rounded ${
                    isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(teacherSearch.searchAnalytics?.recentSearches || []).slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      performTeacherSearch(search);
                    }}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      isDark
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              className={inputCls}
              placeholder="Search name, email, ID, subject…"
              value={teacherSearch.enabled ? '' : (filters.search as string) || ''}
              onChange={e => !teacherSearch.enabled && setFilter('search', e.target.value)}
              disabled={teacherSearch.enabled}
            />
            <select
              className={inputCls}
              value={(filters.status as string) || ''}
              onChange={e => setFilter('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
            <input
              className={inputCls}
              placeholder="Department…"
              value={(filters.department as string) || ''}
              onChange={e => setFilter('department', e.target.value)}
            />
            <div className="flex gap-2">
              <select
                className={inputCls}
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
              <button onClick={resetFilters} className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">{error}</div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
                <tr>
                  {[
                    { label: '', field: 'checkbox' },
                    { label: 'Teacher', field: 'name' },
                    { label: 'Employee ID', field: 'employeeId' },
                    { label: 'Department', field: 'department' },
                    { label: 'Subject', field: 'subject' },
                    { label: 'Class Teacher', field: 'classTeacher' },
                    { label: 'Experience', field: 'experience' },
                    { label: 'Status', field: 'status' },
                    { label: 'Joined', field: 'joiningDate' },
                    { label: 'Actions', field: 'actions' },
                  ].map(col => (
                    <th key={col.field} className={thCls} onClick={() => col.field !== 'checkbox' && toggleSort(col.field)}>
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
                            onClick={() => setProfileTeacherId(teacher.id)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              isDark
                                ? 'border-purple-600 text-purple-400 hover:bg-purple-600/20'
                                : 'border-purple-500 text-purple-600 hover:bg-purple-50'
                            }`}
                          >
                            Profile
                          </button>
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
          <div className={`flex flex-wrap gap-3 items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${sub}`}>
              {loading ? 'Loading…' : `Showing ${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()}`}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className={`px-2 py-1 rounded text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>«</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-3 py-1 rounded text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>‹ Prev</button>
              <span className={`px-3 py-1 rounded text-sm font-medium ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                {page} / {totalPages || 1}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={`px-3 py-1 rounded text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>Next ›</button>
              <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className={`px-2 py-1 rounded text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>»</button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Teacher Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className={`w-full max-w-lg mx-4 rounded-xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold ${txt}`}>Edit Staff</h3>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {formError && <div className="p-2 rounded bg-red-500/10 text-red-400 text-sm">{formError}</div>}
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
              {/* Role Selection */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${sub}`}>Role *</label>
                <select className={inputCls} value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="student">Student</option>
                </select>
              </div>

              {[
                { key: 'email', label: 'Email (for login account)', type: 'email', helper: 'Optional - Leave blank to create staff record without login access' },
                { key: 'phone', label: 'Phone', type: 'text' },
                { key: 'designation', label: 'Designation', type: 'text' },
                { key: 'department', label: 'Department', type: 'text' },
                { key: 'subject', label: 'Subject', type: 'text' },
                { key: 'qualification', label: 'Qualification', type: 'text' },
                { key: 'experience', label: 'Experience (years)', type: 'number' },
                { key: 'salary', label: 'Salary', type: 'number' },
                { key: 'joiningDate', label: 'Joining Date', type: 'date' },
                { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
                { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                { key: 'address', label: 'Address', type: 'textarea' },
                { key: 'photo', label: 'Photo URL', type: 'text', helper: 'Optional - URL to staff photo' },
                { key: 'bankName', label: 'Bank Name', type: 'text' },
                { key: 'bankAccountNo', label: 'Bank Account Number', type: 'text' },
                { key: 'bankIfsc', label: 'Bank IFSC Code', type: 'text' },
                { key: 'aadharNumber', label: 'Aadhar Number', type: 'text' },
                { key: 'emergencyName', label: 'Emergency Contact Name', type: 'text' },
                { key: 'emergencyPhone', label: 'Emergency Contact Phone', type: 'text' },
                { key: 'remarks', label: 'Remarks', type: 'textarea' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`block text-xs font-medium mb-1 ${sub}`}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select className={inputCls} value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}>
                      <option value="">Select...</option>
                      {(f as any).options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      className={inputCls}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.key === 'address' ? 'Enter full address' : f.key === 'remarks' ? 'Enter any remarks' : ''}
                      rows={3}
                    />
                  ) : (
                    <input
                      type={f.type}
                      className={inputCls}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.key === 'email' ? 'Leave blank to create record without login' : f.key === 'photo' ? 'Enter photo URL' : f.key === 'bankAccountNo' ? 'Enter account number' : f.key === 'bankIfsc' ? 'Enter IFSC code' : f.key === 'aadharNumber' ? 'Enter Aadhar number' : f.key === 'emergencyName' ? 'Enter emergency contact name' : f.key === 'emergencyPhone' ? 'Enter emergency contact phone' : ''}
                    />
                  )}
                  {(f as any).helper && (
                    <p className={`text-xs ${sub} mt-1`}>{(f as any).helper}</p>
                  )}
                </div>
              ))}
              <div>
                <label className={`block text-xs font-medium mb-1 ${sub}`}>Status</label>
                <select className={inputCls} value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isClassTeacherEdit"
                  checked={form.isClassTeacher}
                  onChange={e => setForm(prev => ({ ...prev, isClassTeacher: e.target.checked, classTeacherAssignments: e.target.checked ? prev.classTeacherAssignments : [] }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isClassTeacherEdit" className={`text-sm font-medium ${txt}`}>
                  Is this staff member a Class Teacher?
                </label>
              </div>

              {form.isClassTeacher && (
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
              )}
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => { setShowEditModal(false); setForm({ ...EMPTY_FORM }); setFormError(''); }} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>Cancel</button>
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
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {saving ? 'Updating…' : 'Update Staff'}
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

      {/* Teacher Profile Modal */}
      {profileTeacherId && (
        <TeacherProfileModal
          teacherId={profileTeacherId}
          onClose={() => setProfileTeacherId(null)}
        />
      )}

      {/* Search Performance Monitor */}
      <SearchPerformanceMonitor 
        theme={theme} 
        engine={TeacherSearchEngine.getInstance()} 
      />

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className={`w-full max-w-lg mx-4 rounded-xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold ${txt}`}>Add New Staff</h3>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {formError && <div className="p-2 rounded bg-red-500/10 text-red-400 text-sm">{formError}</div>}
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
              {/* Role Selection */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${sub}`}>Role *</label>
                <select className={inputCls} value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="student">Student</option>
                </select>
              </div>

              {[
                { key: 'email', label: 'Email (for login account)', type: 'email', helper: 'Optional - Leave blank to create staff record without login access' },
                { key: 'phone', label: 'Phone', type: 'text' },
                { key: 'designation', label: 'Designation', type: 'text' },
                { key: 'department', label: 'Department', type: 'text' },
                { key: 'subject', label: 'Subject', type: 'text' },
                { key: 'qualification', label: 'Qualification', type: 'text' },
                { key: 'experience', label: 'Experience (years)', type: 'number' },
                { key: 'salary', label: 'Salary', type: 'number' },
                { key: 'joiningDate', label: 'Joining Date', type: 'date' },
                { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
                { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                { key: 'address', label: 'Address', type: 'textarea' },
                { key: 'photo', label: 'Photo URL', type: 'text', helper: 'Optional - URL to staff photo' },
                { key: 'bankName', label: 'Bank Name', type: 'text' },
                { key: 'bankAccountNo', label: 'Bank Account Number', type: 'text' },
                { key: 'bankIfsc', label: 'Bank IFSC Code', type: 'text' },
                { key: 'aadharNumber', label: 'Aadhar Number', type: 'text' },
                { key: 'emergencyName', label: 'Emergency Contact Name', type: 'text' },
                { key: 'emergencyPhone', label: 'Emergency Contact Phone', type: 'text' },
                { key: 'remarks', label: 'Remarks', type: 'textarea' },
                { key: 'password', label: 'Password (if email provided)', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`block text-xs font-medium mb-1 ${sub}`}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select className={inputCls} value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}>
                      <option value="">Select...</option>
                      {(f as any).options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      className={inputCls}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.key === 'address' ? 'Enter full address' : f.key === 'remarks' ? 'Enter any remarks' : ''}
                      rows={3}
                    />
                  ) : (
                    <input
                      type={f.type}
                      className={inputCls}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.key === 'email' ? 'Leave blank to create record without login' : f.key === 'photo' ? 'Enter photo URL' : f.key === 'bankAccountNo' ? 'Enter account number' : f.key === 'bankIfsc' ? 'Enter IFSC code' : f.key === 'aadharNumber' ? 'Enter Aadhar number' : f.key === 'emergencyName' ? 'Enter emergency contact name' : f.key === 'emergencyPhone' ? 'Enter emergency contact phone' : ''}
                    />
                  )}
                  {(f as any).helper && (
                    <p className={`text-xs ${sub} mt-1`}>{(f as any).helper}</p>
                  )}
                </div>
              ))}
              <div>
                <label className={`block text-xs font-medium mb-1 ${sub}`}>Status</label>
                <select className={inputCls} value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isClassTeacher"
                  checked={form.isClassTeacher}
                  onChange={e => setForm(prev => ({ ...prev, isClassTeacher: e.target.checked, classTeacherAssignments: e.target.checked ? prev.classTeacherAssignments : [] }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isClassTeacher" className={`text-sm font-medium ${txt}`}>
                  Is this staff member a Class Teacher?
                </label>
              </div>

              {form.isClassTeacher && (
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
              )}
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => { setShowAddModal(false); setForm({ ...EMPTY_FORM }); setFormError(''); }} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>Cancel</button>
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
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
