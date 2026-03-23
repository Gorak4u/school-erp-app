'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { usePermissions } from '@/hooks/usePermissions';
import { attendanceApi, studentsApi } from '@/lib/apiClient';
import { showErrorToast, showSuccessToast } from '@/lib/toastUtils';
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';

const TODAY = new Date().toISOString().split('T')[0];
const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function AttendanceManagementWorkspace() {
  const { theme } = useTheme();
  const { dropdowns, activeAcademicYear } = useSchoolConfig();
  const { hasPermission } = usePermissions();
  const isDark = theme === 'dark';
  const canManageAttendance = hasPermission('manage_attendance');
  const canManageStaffAttendance = hasPermission('manage_staff_attendance') || canManageAttendance;
  const canViewStaff = hasPermission('view_staff_attendance') || canManageAttendance;
  const [activeTab, setActiveTab] = useState<'students' | 'staff' | 'student-history' | 'staff-history' | 'student-calendar' | 'staff-calendar'>('students');
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showStaffMarkModal, setShowStaffMarkModal] = useState(false);
  const [markClass, setMarkClass] = useState('');
  const [markMedium, setMarkMedium] = useState('');
  const [markDate, setMarkDate] = useState(TODAY);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [markMap, setMarkMap] = useState<Record<string, string>>({});
  const [markSaving, setMarkSaving] = useState(false);
  const [markError, setMarkError] = useState('');
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [staffOverview, setStaffOverview] = useState<any>(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffMarkDate, setStaffMarkDate] = useState(TODAY);
  const [staffMarkMap, setStaffMarkMap] = useState<Record<string, string>>({});
  const [staffMarkSaving, setStaffMarkSaving] = useState(false);
  const [staffMarkError, setStaffMarkError] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [historyDateRange, setHistoryDateRange] = useState({ start: '', end: '' });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [personSearch, setPersonSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [bulkActions, setBulkActions] = useState({
    markAllPresent: false,
    markAllAbsent: false,
    markAllLate: false,
  });
  const [studentSearch, setStudentSearch] = useState(''); // For searching within loaded students

  // Handle URL parameters for direct navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const studentId = urlParams.get('studentId');
    const staffId = urlParams.get('staffId');

    if (tab) {
      setActiveTab(tab as any);
      
      // Pre-select student/staff and search for them
      if (tab === 'student-calendar' && studentId) {
        // Search for the student by ID
        const searchAndSelectStudent = async () => {
          try {
            const response = await fetch(`/api/students?id=${studentId}`, {
              credentials: 'include',
            });
            const data = await response.json();
            
            if (response.ok && data.student) {
              setSelectedPerson(data.student);
              setPersonSearch(`${data.student.name} (Roll: ${data.student.rollNo || 'N/A'})`);
            }
          } catch (e) {
            console.error('Failed to load student:', e);
          }
        };
        searchAndSelectStudent();
      } else if (tab === 'staff-calendar' && staffId) {
        // Search for the staff member by ID
        const searchAndSelectStaff = async () => {
          try {
            const response = await fetch(`/api/teachers?id=${staffId}`, {
              credentials: 'include',
            });
            const data = await response.json();
            
            if (response.ok && data.teacher) {
              setSelectedPerson(data.teacher);
              setPersonSearch(`${data.teacher.name} (${data.teacher.employeeId || 'N/A'})`);
            }
          } catch (e) {
            console.error('Failed to load staff:', e);
          }
        };
        searchAndSelectStaff();
      }
    }
  }, []);

  const fetcher = useCallback((params: any) => {
  const apiParams = { ...params };
  // Convert class ID to class name for API
  if (apiParams.class && typeof apiParams.class === 'string') {
    const selectedClass = dropdowns.classes.find(cls => cls.value === apiParams.class);
    if (selectedClass) {
      apiParams.class = selectedClass.label;
    }
  }
  return attendanceApi.list(apiParams);
}, [dropdowns.classes]);
  const { data: records, total, page, pageSize, totalPages, loading, error, filters, setFilter, resetFilters, setPage, setPageSize } = usePaginatedQuery(fetcher, 'records', { date: TODAY }, { pageSize: 25 });

  // Override resetFilters to also reset medium
  const handleResetFilters = () => {
    resetFilters();
    setMarkMedium('');
  };

  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  useEffect(() => {
    if (!markClass && dropdowns.classes.length > 0) setMarkClass(dropdowns.classes[0].value);
  }, [dropdowns.classes, markClass]);

  useEffect(() => {
    // Reset class selection when medium changes
    if (markMedium && dropdowns.classes.length > 0) {
      const firstClassInMedium = dropdowns.classes.find(cls => cls.mediumId === markMedium);
      setMarkClass(firstClassInMedium?.value || '');
    }
  }, [markMedium, dropdowns.classes]);

  useEffect(() => {
    if (!canViewStaff) return;
    const load = async () => {
      try {
        setStaffLoading(true);
        const response = await fetch(`/api/attendance/staff-overview?date=${encodeURIComponent((filters.date as string) || TODAY)}`, { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load staff overview');
        setStaffOverview(data);
      } catch (e: any) {
        showErrorToast('Staff attendance', e.message || 'Failed to load staff overview');
      } finally {
        setStaffLoading(false);
      }
    };
    load();
  }, [canViewStaff, filters.date]);

  const stats = useMemo(() => {
    const present = records.filter((r: any) => r.status === 'present').length;
    const absent = records.filter((r: any) => r.status === 'absent').length;
    const late = records.filter((r: any) => r.status === 'late').length;
    const rate = present + absent + late > 0 ? Math.round((present / (present + absent + late)) * 100) : 0;
    return { present, absent, late, rate };
  }, [records]);

  // Bulk action functions
  const markAllAs = (status: string) => {
    const newMap: Record<string, string> = {};
    classStudents.forEach((student: any) => {
      newMap[student.id] = status;
    });
    setMarkMap(newMap);
  };

  const clearAllSelections = () => {
    const newMap: Record<string, string> = {};
    classStudents.forEach((student: any) => {
      newMap[student.id] = 'present'; // Reset to default
    });
    setMarkMap(newMap);
  };

  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    if (classStudents.length === 0) return { present: 0, absent: 0, late: 0, rate: 0 };
    
    const present = Object.values(markMap).filter(status => status === 'present').length;
    const absent = Object.values(markMap).filter(status => status === 'absent').length;
    const late = Object.values(markMap).filter(status => status === 'late').length;
    const marked = present + absent + late;
    const rate = marked > 0 ? Math.round((present / marked) * 100) : 0;
    
    return { present, absent, late, marked, rate };
  }, [classStudents, markMap]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!studentSearch) return classStudents;
    
    const searchLower = studentSearch.toLowerCase();
    return classStudents.filter((student: any) => 
      student.name.toLowerCase().includes(searchLower) ||
      (student.rollNo && student.rollNo.toLowerCase().includes(searchLower))
    );
  }, [classStudents, studentSearch]);

  const loadRoster = async () => {
    if (!markClass) return;
    try {
      setLoadingRoster(true);
      setMarkError('');
      
      // Convert class ID to class name for the API
      const selectedClass = dropdowns.classes.find(cls => cls.value === markClass);
      const className = selectedClass?.label || markClass;
      
      // Fetch students directly for the selected class, bypassing main filters
      const response = await fetch(`/api/students?class=${encodeURIComponent(className)}&pageSize=200&status=active`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to load students');
      
      const students = data.students || [];
      setClassStudents(students);
      const nextMap: Record<string, string> = {};
      students.forEach((student: any) => { nextMap[student.id] = 'present'; });
      setMarkMap(nextMap);
    } catch (e: any) {
      setMarkError(e.message || 'Failed to load students');
    } finally {
      setLoadingRoster(false);
    }
  };

  const saveAttendance = async () => {
    try {
      setMarkSaving(true);
      setMarkError('');
      const selectedClass = dropdowns.classes.find(cls => cls.value === markClass);
      const className = selectedClass?.label || markClass;
      const records = classStudents.map((student: any) => ({ 
        studentId: student.id, 
        class: className, 
        date: markDate, 
        status: markMap[student.id] || 'present', 
        subject: 'General' 
      }));
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409 && data.conflicts) {
          // Show holiday conflicts
          setMarkError(`${data.error}: ${data.conflicts.join(', ')}`);
        } else {
          throw new Error(data.error || 'Failed to save attendance');
        }
        return;
      }
      
      showSuccessToast('Attendance saved', `${classStudents.length} records saved successfully.`);
      setShowMarkModal(false);
      setClassStudents([]);
      setMarkMap({});
      resetFilters();
    } catch (e: any) {
      setMarkError(e.message || 'Failed to save attendance');
    } finally {
      setMarkSaving(false);
    }
  };

  // Load teachers for staff attendance
  const loadTeachers = async () => {
    try {
      const response = await fetch('/api/teachers', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load teachers');
      setTeachers(data.teachers || []);
    } catch (e: any) {
      console.error('Failed to load teachers:', e);
    }
  };

  // Save staff attendance
  const saveStaffAttendance = async () => {
    try {
      setStaffMarkSaving(true);
      setStaffMarkError('');
      
      const records = teachers
        .filter(teacher => staffMarkMap[teacher.id])
        .map(teacher => ({
          teacherId: teacher.id,
          date: staffMarkDate,
          status: staffMarkMap[teacher.id],
          remarks: '',
        }));

      if (records.length === 0) {
        setStaffMarkError('Please mark at least one staff member');
        return;
      }

      const response = await fetch('/api/staff-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409 && data.conflicts) {
          // Show leave conflicts
          setStaffMarkError(`${data.error}: ${data.conflicts.join(', ')}`);
        } else {
          throw new Error(data.error || 'Failed to save staff attendance');
        }
        return;
      }

      showSuccessToast('Staff attendance saved', `${records.length} records saved successfully.`);
      setShowStaffMarkModal(false);
      setStaffMarkMap({});
      setStaffMarkDate(TODAY);
    } catch (e: any) {
      setStaffMarkError(e.message || 'Failed to save staff attendance');
    } finally {
      setStaffMarkSaving(false);
    }
  };

  // Load teachers on component mount
  useEffect(() => {
    if (canManageStaffAttendance) {
      loadTeachers();
    }
  }, [canManageStaffAttendance]);

  // Load attendance history
  const loadHistory = async (type: 'student' | 'staff') => {
    if (!historyDateRange.start || !historyDateRange.end) return;
    
    try {
      setHistoryLoading(true);
      const endpoint = type === 'student' ? '/api/attendance' : '/api/staff-attendance';
      const params = new URLSearchParams({
        startDate: historyDateRange.start,
        endDate: historyDateRange.end,
        pageSize: '100',
      });
      
      const response = await fetch(`${endpoint}?${params}`, { credentials: 'include' });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to load history');
      setHistoryData(data);
    } catch (e: any) {
      console.error('Failed to load history:', e);
      // Show error toast if needed
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history when date range changes
  useEffect(() => {
    if (activeTab === 'student-history' || activeTab === 'staff-history') {
      const type = activeTab === 'student-history' ? 'student' : 'staff';
      loadHistory(type);
    }
  }, [historyDateRange, activeTab]);

  // Search for students/staff
  const searchPeople = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      
      if (activeTab === 'student-calendar') {
        // Search students by name or roll number
        const response = await fetch(`/api/students?search=${encodeURIComponent(query)}&pageSize=20`, {
          credentials: 'include',
        });
        const data = await response.json();
        
        if (response.ok) {
          setSearchResults(data.students || []);
        }
      } else {
        // Search staff by name or employee ID
        const response = await fetch(`/api/teachers?search=${encodeURIComponent(query)}&pageSize=20`, {
          credentials: 'include',
        });
        const data = await response.json();
        
        if (response.ok) {
          setSearchResults(data.teachers || []);
        }
      }
    } catch (e) {
      console.error('Search error:', e);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPeople(personSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [personSearch, activeTab]);

  return (
    <AppLayout currentPage="attendance" title="Attendance Management">
      <div className="space-y-6 pb-8">
        <div className={`${card} p-6 md:p-8`}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-blue-500/20 bg-blue-500/10 text-blue-300' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Attendance Management • {activeAcademicYear?.name || 'School operations hub'}
              </div>
              <h1 className={`mt-4 text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Student and staff attendance in one premium workspace</h1>
              <p className={`mt-3 text-sm md:text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Track live student attendance, mark classes quickly, and monitor leave-aware staff capacity without a blocking page loader.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full xl:w-auto">
              <button className={btnPrimary} onClick={() => setShowMarkModal(true)} disabled={!canManageAttendance}>Quick mark</button>
              {canManageStaffAttendance && (
                <button className={btnPrimary} onClick={() => setShowStaffMarkModal(true)}>Quick mark staff</button>
              )}
              <button className={btnSecondary} onClick={() => setActiveTab(activeTab === 'students' ? 'staff' : 'students')} disabled={!canViewStaff && activeTab === 'students'}>{activeTab === 'students' ? 'Staff ops' : 'Student grid'}</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Student records', value: total.toLocaleString(), tone: 'text-blue-400', hint: 'Tenant-scoped attendance list' },
            { label: 'Present', value: stats.present, tone: 'text-emerald-400', hint: 'Current filtered result set' },
            { label: 'Absent', value: stats.absent, tone: 'text-rose-400', hint: 'Needs family outreach' },
            { label: 'Attendance rate', value: `${stats.rate}%`, tone: 'text-violet-400', hint: 'Visible records performance' },
          ].map((item) => (
            <div key={item.label} className={`${card} p-5`}>
              <div className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</div>
              <div className={`mt-3 text-3xl font-bold ${item.tone}`}>{item.value}</div>
              <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.hint}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('students')} className={activeTab === 'students' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105 px-4 py-2.5 rounded-xl text-sm font-medium' : btnSecondary}>Student Attendance</button>
          {canViewStaff && <button onClick={() => setActiveTab('staff')} className={activeTab === 'staff' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105 px-4 py-2.5 rounded-xl text-sm font-medium' : btnSecondary}>Staff Attendance</button>}
          <button onClick={() => setActiveTab('student-history')} className={activeTab === 'student-history' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105 px-4 py-2.5 rounded-xl text-sm font-medium' : btnSecondary}>Student History</button>
          {canViewStaff && <button onClick={() => setActiveTab('staff-history')} className={activeTab === 'staff-history' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105 px-4 py-2.5 rounded-xl text-sm font-medium' : btnSecondary}>Staff History</button>}
          <button onClick={() => setActiveTab('student-calendar')} className={activeTab === 'student-calendar' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105 px-4 py-2.5 rounded-xl text-sm font-medium' : btnSecondary}>Student Calendar</button>
          {canViewStaff && <button onClick={() => setActiveTab('staff-calendar')} className={activeTab === 'staff-calendar' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105 px-4 py-2.5 rounded-xl text-sm font-medium' : btnSecondary}>Staff Calendar</button>}
        </div>

        {activeTab === 'students' && (
          <>
            <div className={`${card} p-5`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
                <div>
                  <label className={label}>Date</label>
                  <input type="date" className={input} value={(filters.date as string) || TODAY} onChange={(e) => setFilter('date', e.target.value)} />
                </div>
                {dropdowns.mediums.length > 1 && (
                  <div>
                    <label className={label}>Medium</label>
                    <select className={input} value={(filters.medium as string) || ''} onChange={(e) => setFilter('medium', e.target.value)}>
                      <option value="">All mediums</option>
                      {dropdowns.mediums.map((medium) => <option key={medium.value} value={medium.value}>{medium.label}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className={label}>Class</label>
                  <select className={input} value={(filters.class as string) || ''} onChange={(e) => setFilter('class', e.target.value)}>
                    <option value="">All classes</option>
                    {dropdowns.classes
                      .filter((cls) => !filters.medium || cls.mediumId === filters.medium)
                      .map((cls) => (
                        <option key={`${cls.value}-${cls.mediumId}`} value={cls.value}>
                          {cls.label}{dropdowns.mediums.length > 1 ? ` (${cls.mediumName})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Status</label>
                  <select className={input} value={(filters.status as string) || ''} onChange={(e) => setFilter('status', e.target.value)}><option value="">All statuses</option><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="half-day">Half day</option></select>
                </div>
                <div>
                  <label className={label}>Rows</label>
                  <select className={input} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>{PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size} / page</option>)}</select>
                </div>
                <div className="flex items-end"><button className={`${btnSecondary} w-full`} onClick={handleResetFilters}>Reset filters</button></div>
              </div>
            </div>
            <div className={`${card} overflow-hidden`}>
              {error && <div className="px-4 py-3 text-sm text-rose-400 bg-rose-500/10 border-b border-rose-500/10">{error}</div>}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className={isDark ? 'bg-gray-900/60' : 'bg-gray-100/80'}><tr>{['Student', 'Class', 'Date', 'Status', 'Subject', 'Remarks'].map((label) => <th key={label} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</th>)}</tr></thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700/80' : 'divide-gray-200'}`}>
                    {loading && records.length === 0 ? Array.from({ length: 6 }).map((_, i) => <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-4"><div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} /></td>)}</tr>) : records.length === 0 ? <tr><td colSpan={6} className="px-4 py-16 text-center"><div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>No attendance records found</div></td></tr> : records.map((record: any) => <tr key={record.id} className={isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'}><td className="px-4 py-4"><div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{record.student?.name || '—'}</div><div className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Roll {record.student?.rollNo || '—'}</div></td><td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{record.class || record.student?.class || '—'}</td><td className={`px-4 py-4 text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{record.date}</td><td className="px-4 py-4 text-sm"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === 'present' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : record.status === 'absent' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>{record.status}</span></td><td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{record.subject || 'General'}</td><td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{record.remarks || '—'}</td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{loading ? 'Loading…' : `Showing ${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()}`}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className={`${btnSecondary} !px-3 !py-1.5 disabled:opacity-50`}>Prev</button>
                  <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>{page} / {totalPages || 1}</span>
                  <button onClick={() => setPage(Math.min(totalPages || 1, page + 1))} disabled={page >= totalPages} className={`${btnSecondary} !px-3 !py-1.5 disabled:opacity-50`}>Next</button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'staff' && canViewStaff && (
          <div className={`${card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className={isDark ? 'bg-gray-900/60' : 'bg-gray-100/80'}><tr>{['Staff member', 'Department', 'Status', 'Sessions', 'Today leave', 'Upcoming leave'].map((label) => <th key={label} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</th>)}</tr></thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700/80' : 'divide-gray-200'}`}>
                  {staffLoading ? Array.from({ length: 5 }).map((_, i) => <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-4"><div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} /></td>)}</tr>) : !staffOverview?.staff?.length ? <tr><td colSpan={6} className="px-4 py-16 text-center"><div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>No staff overview available</div></td></tr> : staffOverview.staff.map((staff: any) => <tr key={staff.id}><td className="px-4 py-4"><div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{staff.name}</div><div className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{staff.employeeId || 'No employee ID'} • {staff.designation || 'Staff'}</div></td><td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{staff.department || 'General'}</td><td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${staff.status === 'on_leave' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : staff.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
                        {staff.status === 'on_leave' ? 'On leave' : staff.status === 'active' ? 'Active' : 'Awaiting activity'}
                      </span>
                      {staff.manualAttendance && (
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                          Manual
                        </span>
                      )}
                    </div>
                  </td><td className={`px-4 py-4 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{staff.sessionsHandled}</td><td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{staff.todaysLeave ? `${staff.todaysLeave.leaveType.name} • ${staff.todaysLeave.totalDays} day(s)` : '—'}</td><td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{staff.upcomingLeaves?.length ? staff.upcomingLeaves.map((leave: any) => `${leave.leaveType.code} (${leave.startDate})`).join(', ') : 'None planned'}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === 'student-history' || activeTab === 'staff-history') && (
          <div className={`${card} p-6`}>
            <div className="mb-6">
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {activeTab === 'student-history' ? 'Student' : 'Staff'} Attendance History
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={label}>Start Date</label>
                  <input 
                    type="date" 
                    className={input} 
                    value={historyDateRange.start} 
                    onChange={(e) => setHistoryDateRange(prev => ({ ...prev, start: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className={label}>End Date</label>
                  <input 
                    type="date" 
                    className={input} 
                    value={historyDateRange.end} 
                    onChange={(e) => setHistoryDateRange(prev => ({ ...prev, end: e.target.value }))} 
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    className={btnPrimary} 
                    onClick={() => loadHistory(activeTab === 'student-history' ? 'student' : 'staff')}
                    disabled={historyLoading || !historyDateRange.start || !historyDateRange.end}
                  >
                    {historyLoading ? 'Loading...' : 'Load History'}
                  </button>
                </div>
              </div>
            </div>

            {historyLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50/70'}`}>
                    <div className="h-4 rounded animate-pulse bg-gray-300 w-3/4 mb-2"></div>
                    <div className="h-3 rounded animate-pulse bg-gray-300 w-1/2"></div>
                  </div>
                ))}
              </div>
            )}

            {!historyLoading && historyData && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className={isDark ? 'bg-gray-900/60' : 'bg-gray-100/80'}>
                    <tr>
                      {activeTab === 'student-history' 
                        ? ['Student', 'Class', 'Date', 'Status', 'Subject', 'Remarks'].map((label) => (
                            <th key={label} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {label}
                            </th>
                          ))
                        : ['Staff Member', 'Department', 'Date', 'Status', 'Check In', 'Check Out'].map((label) => (
                            <th key={label} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {label}
                            </th>
                          ))
                      }
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700/80' : 'divide-gray-200'}`}>
                    {historyData.records?.length === 0 ? (
                      <tr>
                        <td colSpan={activeTab === 'student-history' ? 6 : 6} className="px-4 py-16 text-center">
                          <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            No attendance records found for the selected date range
                          </div>
                        </td>
                      </tr>
                    ) : (
                      historyData.records.map((record: any) => (
                        <tr key={record.id} className={isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'}>
                          {activeTab === 'student-history' ? (
                            <>
                              <td className="px-4 py-4">
                                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {record.student?.name || '—'}
                                </div>
                                <div className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Roll {record.student?.rollNo || '—'}
                                </div>
                              </td>
                              <td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {record.class || '—'}
                              </td>
                              <td className={`px-4 py-4 text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {record.date}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  record.status === 'present' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 
                                  record.status === 'absent' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 
                                  'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {record.status}
                                </span>
                              </td>
                              <td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {record.subject || 'General'}
                              </td>
                              <td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {record.remarks || '—'}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-4">
                                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {record.teacher?.name || '—'}
                                </div>
                                <div className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {record.teacher?.employeeId || 'No employee ID'} • {record.teacher?.designation || 'Staff'}
                                </div>
                              </td>
                              <td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {record.teacher?.department || 'General'}
                              </td>
                              <td className={`px-4 py-4 text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {new Date(record.attendanceDate).toISOString().split('T')[0]}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    record.status === 'present' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 
                                    record.status === 'absent' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 
                                    record.status === 'late' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                                    record.status === 'on_leave' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                                    'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                                  }`}>
                                    {record.status === 'on_leave' ? 'On Leave' : record.status}
                                  </span>
                                  {record.source === 'leave' && (
                                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                      Leave
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {record.checkInAt ? new Date(record.checkInAt).toLocaleTimeString() : '—'}
                              </td>
                              <td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {record.checkOutAt ? new Date(record.checkOutAt).toLocaleTimeString() : '—'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showMarkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowMarkModal(false)}>
            <div className={`w-full max-w-3xl mx-4 rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}><div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick mark attendance</div></div>
              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {markError && <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{markError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {dropdowns.mediums.length > 1 && (
                    <div>
                      <label className={label}>Medium</label>
                      <select className={input} value={markMedium} onChange={(e) => setMarkMedium(e.target.value)}>
                        <option value="">All mediums</option>
                        {dropdowns.mediums.map((medium) => <option key={medium.value} value={medium.value}>{medium.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div><label className={label}>Class</label><select className={input} value={markClass} onChange={(e) => setMarkClass(e.target.value)}><option value="">Select class</option>{dropdowns.classes.filter((cls) => !markMedium || cls.mediumId === markMedium).map((cls) => <option key={`${cls.value}-${cls.mediumId}`} value={cls.value}>{cls.label}{dropdowns.mediums.length > 1 ? ` (${cls.mediumName})` : ''}</option>)}</select></div>
                  <div><label className={label}>Date</label><input type="date" className={input} value={markDate} onChange={(e) => setMarkDate(e.target.value)} /></div>
                  <div className="flex items-end"><button className={`${btnPrimary} w-full`} onClick={loadRoster} disabled={loadingRoster}>{loadingRoster ? 'Loading roster…' : 'Load roster'}</button></div>
                </div>
                {classStudents.length > 0 && (
                  <>
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        className={input}
                        placeholder="Search students by name or roll number..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                      />
                      {studentSearch && (
                        <button
                          onClick={() => setStudentSearch('')}
                          className={`absolute right-3 top-3 text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Bulk Actions */}
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50 border border-gray-600/50' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bulk Actions</h4>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {filteredStudents.length} of {classStudents.length} students
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => markAllAs('present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'}`}
                        >
                          ✓ All Present
                        </button>
                        <button
                          onClick={() => markAllAs('absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-600/30' : 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200'}`}
                        >
                          ✗ All Absent
                        </button>
                        <button
                          onClick={() => markAllAs('late')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-600/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'}`}
                        >
                          ⏰ All Late
                        </button>
                        <button
                          onClick={clearAllSelections}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 border border-gray-600/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
                        >
                          ↺ Reset
                        </button>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                      <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Attendance Statistics</h4>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {attendanceStats.present}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Present</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                            {attendanceStats.absent}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Absent</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            {attendanceStats.late}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Late</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {attendanceStats.rate}%
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Rate</div>
                        </div>
                      </div>
                    </div>

                    {/* Student List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {filteredStudents.map((student: any) => (
                        <div key={student.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${isDark ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50/70'}`}>
                          <div>
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{student.name}</div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Roll {student.rollNo || '—'}</div>
                          </div>
                          <div className="flex gap-2">
                            {['present', 'absent', 'late'].map((status) => (
                              <button
                                key={status}
                                onClick={() => setMarkMap((current) => ({ ...current, [student.id]: status }))}
                                className={markMap[student.id] === status ? 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white' : `${btnSecondary} !px-3 !py-1.5 !text-xs`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}><div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{classStudents.length} students loaded</div><div className="flex gap-3"><button className={btnSecondary} onClick={() => setShowMarkModal(false)}>Cancel</button><button className={btnPrimary} onClick={saveAttendance} disabled={markSaving || classStudents.length === 0}>{markSaving ? 'Saving…' : 'Save attendance'}</button></div></div>
            </div>
          </div>
        )}

        {showStaffMarkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowStaffMarkModal(false)}>
            <div className={`w-full max-w-4xl mx-4 rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}><div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick mark staff attendance</div></div>
              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {staffMarkError && <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{staffMarkError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={label}>Date</label>
                    <input type="date" className={input} value={staffMarkDate} onChange={(e) => setStaffMarkDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  {teachers.map((teacher: any) => (
                    <div key={teacher.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${isDark ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-gray-50/70'}`}>
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{teacher.name}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{teacher.employeeId || 'No employee ID'} • {teacher.designation || 'Staff'}</div>
                      </div>
                      <div className="flex gap-2">
                        {['present', 'absent', 'late', 'half_day'].map((status) => (
                          <button 
                            key={status} 
                            onClick={() => setStaffMarkMap((current) => ({ ...current, [teacher.id]: status }))} 
                            className={staffMarkMap[teacher.id] === status ? 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white' : `${btnSecondary} !px-3 !py-1.5 !text-xs`}
                          >
                            {status.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{teachers.length} staff members loaded</div>
                <div className="flex gap-3">
                  <button className={btnSecondary} onClick={() => setShowStaffMarkModal(false)}>Cancel</button>
                  <button className={btnPrimary} onClick={saveStaffAttendance} disabled={staffMarkSaving}>
                    {staffMarkSaving ? 'Saving…' : 'Save staff attendance'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Views */}
        {(activeTab === 'student-calendar' || activeTab === 'staff-calendar') && (
          <div className={`${card} p-6`}>
            <div className="mb-6">
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {activeTab === 'student-calendar' ? 'Student' : 'Staff'} Attendance Calendar
              </h2>
              
              {/* Person Selection */}
              <div className="mb-4">
                <label className={label}>Search {activeTab === 'student-calendar' ? 'Student' : 'Staff Member'}</label>
                <div className="relative">
                  <input
                    type="text"
                    className={input}
                    placeholder={`Type ${activeTab === 'student-calendar' ? 'student name or roll number' : 'staff name or employee ID'}...`}
                    value={personSearch}
                    onChange={(e) => {
                      setPersonSearch(e.target.value);
                      if (!e.target.value) {
                        setSelectedPerson(null);
                        setSearchResults([]);
                      }
                    }}
                  />
                  
                  {searchLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-auto ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                    {searchResults.map((person) => (
                      <button
                        key={person.id}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-b-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                        onClick={() => {
                          setSelectedPerson(person);
                          setPersonSearch(activeTab === 'student-calendar' 
                            ? `${person.name} (Roll: ${person.rollNo || 'N/A'})`
                            : `${person.name} (${person.employeeId || 'N/A'})`
                          );
                          setSearchResults([]);
                        }}
                      >
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {person.name}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {activeTab === 'student-calendar' 
                            ? `Roll: ${person.rollNo || 'N/A'} • ${person.class || 'N/A'}`
                            : `${person.employeeId || 'N/A'} • ${person.designation || 'Staff'}`
                          }
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Person Display */}
                {selectedPerson && (
                  <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                          {selectedPerson.name}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                          {activeTab === 'student-calendar' 
                            ? `Roll: ${selectedPerson.rollNo || 'N/A'} • ${selectedPerson.class || 'N/A'}`
                            : `${selectedPerson.employeeId || 'N/A'} • ${selectedPerson.designation || 'Staff'}`
                          }
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPerson(null);
                          setPersonSearch('');
                          setSearchResults([]);
                        }}
                        className={`text-sm ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Component */}
            <AttendanceCalendar 
              type={activeTab === 'student-calendar' ? 'student' : 'staff'}
              personId={selectedPerson?.id || ''}
              isDark={isDark}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
