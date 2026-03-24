'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { usePermissions } from '@/hooks/usePermissions';
import { showErrorToast, showSuccessToast } from '@/lib/toastUtils';

const TODAY = new Date().toISOString().split('T')[0];

type Assignment = {
  id: string;
  title: string;
  subject: string;
  classId?: string | null;
  class?: {
    id: string;
    name: string;
    code: string;
    medium?: {
      id: string;
      name: string;
      code: string;
    } | null;
    section?: {
      name: string;
    } | null;
  } | null;
  dueDate: string;
  type: string;
  status: string;
  description?: string | null;
  totalMarks?: number | null;
  teacher?: {
    id: string;
    name: string;
    department?: string | null;
  } | null;
  stats?: {
    totalRecipients: number;
    submitted: number;
    graded: number;
    pending: number;
    completionRate: number;
  };
  isOverdue?: boolean;
  isDueSoon?: boolean;
};

export default function AssignmentsWorkspace() {
  const { theme } = useTheme();
  const { dropdowns, activeAcademicYear } = useSchoolConfig();
  const { isAdmin, hasPermission } = usePermissions();
  const isDark = theme === 'dark';
  const canCreate = hasPermission('create_assignments') || isAdmin;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({ 
    status: '', 
    classId: '', 
    teacherId: '', 
    search: '', 
    mediumId: '',
    dueDateFrom: '',      // NEW
    dueDateTo: '',        // NEW
    createdFrom: '',      // NEW
    createdTo: ''         // NEW
  });
  const [form, setForm] = useState({ title: '', subject: '', classId: '', mediumId: '', dueDate: TODAY, description: '', type: 'homework', teacherId: '' });
  
  // Cursor-based pagination state
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  const loadAssignments = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setCursor(null);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const query = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      
      // Add cursor for pagination
      if (cursor && !reset) {
        query.set('cursor', cursor);
      }
      
      query.set('pageSize', '12');
      const response = await fetch(`/api/assignments?${query.toString()}`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch assignments');
      
      if (reset) {
        setAssignments(data.assignments || []);
      } else {
        setAssignments(prev => [...prev, ...(data.assignments || [])]);
      }
      
      setSummary(data.summary || null);
      setHasMore(data.pagination?.hasMore || false);
      if (data.pagination?.nextCursor) {
        setCursor(data.pagination.nextCursor);
      }
    } catch (e: any) {
      console.error('Failed to load assignments:', e);
      showErrorToast('Error loading assignments', e.message);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [filters.status, filters.classId, filters.teacherId, filters.search, filters.mediumId, filters.dueDateFrom, filters.dueDateTo, filters.createdFrom, filters.createdTo]);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await fetch('/api/teachers?pageSize=200&status=active', { credentials: 'include' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch teachers');
        setTeachers(data.teachers || []);
      } catch (e: any) {
        showErrorToast('Teachers', e.message || 'Failed to fetch teachers');
      }
    };
    loadTeachers();
  }, []);

  const assignmentCards = useMemo(() => ([
    { label: 'Total assignments', value: summary?.totalAssignments ?? 0, tone: 'text-blue-400', hint: 'School-wide assignment inventory' },
    { label: 'Active', value: summary?.activeAssignments ?? 0, tone: 'text-emerald-400', hint: 'Open and in circulation' },
    { label: 'Overdue', value: summary?.overdueAssignments ?? 0, tone: 'text-rose-400', hint: 'Needs intervention' },
    { label: 'Pending review', value: summary?.pendingReviewCount ?? 0, tone: 'text-amber-400', hint: 'Submissions awaiting grading' },
  ]), [summary]);

  const submitAssignment = async () => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          academicYearId: activeAcademicYear?.id,
          teacherId: isAdmin ? form.teacherId || undefined : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create assignment');
      showSuccessToast('Assignment created', `${form.title} created successfully.`);
      setShowCreateModal(false);
      setForm({ title: '', subject: '', classId: '', mediumId: '', dueDate: TODAY, description: '', type: 'homework', teacherId: '' });
      loadAssignments();
    } catch (e: any) {
      showErrorToast('Assignment creation', e.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout currentPage="assignments" title="Assignments Management">
      <div className="space-y-6 pb-8">
        <div className={`${card} p-6 md:p-8`}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-blue-500/20 bg-blue-500/10 text-blue-300' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Assignments Management • {activeAcademicYear?.name || 'Academic delivery hub'}
              </div>
              <h1 className={`mt-4 text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Assignments Management</h1>
              <p className={`mt-3 text-sm md:text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Create, track, and review assignments with real-time submission monitoring.</p>
            </div>
            {canCreate && <button className={btnPrimary} onClick={() => setShowCreateModal(true)}>Create assignment</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {assignmentCards.map((item) => (
            <div key={item.label} className={`${card} p-5`}>
              <div className={`text-xs uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</div>
              <div className={`mt-3 text-3xl font-bold ${item.tone}`}>{loading ? '—' : item.value}</div>
              <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.hint}</div>
            </div>
          ))}
        </div>

        <div className={`${card} p-5`}>
          <div className="mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
            <button 
              onClick={() => setFilters({ status: '', classId: '', teacherId: '', search: '', mediumId: '', dueDateFrom: '', dueDateTo: '', createdFrom: '', createdTo: '' })}
              className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            >
              Clear all filters
            </button>
          </div>
          
          {/* Basic Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <div>
              <label className={label}>Search</label>
              <input className={input} value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} placeholder="Title, subject, description" />
            </div>
            <div>
              <label className={label}>Status</label>
              <select className={input} value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}><option value="">All statuses</option><option value="active">Active</option><option value="graded">Graded</option><option value="draft">Draft</option></select>
            </div>
            {dropdowns.mediums.length > 1 && (
              <div>
                <label className={label}>Medium</label>
                <select className={input} value={filters.mediumId} onChange={(e) => setFilters((current) => ({ ...current, mediumId: e.target.value, classId: '' }))}>
                  <option value="">All mediums</option>
                  {dropdowns.mediums.map((medium) => <option key={medium.value} value={medium.value}>{medium.label}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={label}>Class</label>
              <select className={input} value={filters.classId} onChange={(e) => setFilters((current) => ({ ...current, classId: e.target.value }))}>
                <option value="">All classes</option>
                {dropdowns.classes
                  .filter(cls => !filters.mediumId || cls.mediumId === filters.mediumId)
                  .map((cls) => <option key={cls.value} value={cls.value}>{cls.label}{dropdowns.mediums.length > 1 ? ` (${cls.mediumName})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Teacher</label>
              <select className={input} value={filters.teacherId} onChange={(e) => setFilters((current) => ({ ...current, teacherId: e.target.value }))}><option value="">All teachers</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select>
            </div>
          </div>
          
          {/* Date Range Filters */}
          <div className="border-t pt-4">
            <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Date Range Filters</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={label}>Due Date From</label>
                <input 
                  type="date" 
                  className={input} 
                  value={filters.dueDateFrom} 
                  onChange={(e) => setFilters((current) => ({ ...current, dueDateFrom: e.target.value }))} 
                />
              </div>
              <div>
                <label className={label}>Due Date To</label>
                <input 
                  type="date" 
                  className={input} 
                  value={filters.dueDateTo} 
                  onChange={(e) => setFilters((current) => ({ ...current, dueDateTo: e.target.value }))} 
                />
              </div>
              <div>
                <label className={label}>Created From</label>
                <input 
                  type="date" 
                  className={input} 
                  value={filters.createdFrom} 
                  onChange={(e) => setFilters((current) => ({ ...current, createdFrom: e.target.value }))} 
                />
              </div>
              <div>
                <label className={label}>Created To</label>
                <input 
                  type="date" 
                  className={input} 
                  value={filters.createdTo} 
                  onChange={(e) => setFilters((current) => ({ ...current, createdTo: e.target.value }))} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className={`${card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className={isDark ? 'bg-gray-900/60' : 'bg-gray-100/80'}>
                <tr>
                  {['Assignment', 'Class', 'Teacher', 'Due date', 'Status', 'Progress'].map((heading) => <th key={heading} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{heading}</th>)}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700/80' : 'divide-gray-200'}`}>
                {loading ? Array.from({ length: 6 }).map((_, i) => <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-4"><div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} /></td>)}</tr>) : assignments.length === 0 ? <tr><td colSpan={6} className="px-4 py-16 text-center"><div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>No assignments found</div><div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Adjust your filters or create a new assignment.</div></td></tr> : assignments.map((assignment) => <tr key={assignment.id} className={isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'}><td className="px-4 py-4"><div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{assignment.title}</div><div className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{assignment.subject} • {assignment.type}</div></td><td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {assignment.class ? `${assignment.class.name} ${assignment.class.medium ? `- ${assignment.class.medium.name}` : ''}` : assignment.classId || '—'}
                </td><td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{assignment.teacher?.name || '—'}</td><td className={`px-4 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{assignment.dueDate}</td><td className="px-4 py-4 text-sm"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${assignment.isOverdue ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : assignment.isDueSoon ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>{assignment.isOverdue ? 'Overdue' : assignment.status}</span></td><td className="px-4 py-4"><div className="space-y-2"><div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{assignment.stats?.completionRate ?? 0}% complete</div><div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${assignment.stats?.completionRate ?? 0}%` }} /></div><div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{assignment.stats?.submitted ?? 0} submitted • {assignment.stats?.pending ?? 0} pending • {assignment.stats?.graded ?? 0} graded</div></div></td></tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Load More Button */}
        {!loading && hasMore && assignments.length > 0 && (
          <div className="text-center py-4">
            <button
              onClick={() => loadAssignments(false)}
              disabled={isLoadingMore}
              className={`${btnPrimary} ${isLoadingMore ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
            <div className={`w-full max-w-2xl mx-4 rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}><div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create assignment</div></div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={label}>Title</label><input className={input} value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} /></div>
                  <div><label className={label}>Subject</label><input className={input} value={form.subject} onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))} /></div>
                  {dropdowns.mediums.length > 1 && (
                    <div>
                      <label className={label}>Medium</label>
                      <select className={input} value={form.mediumId} onChange={(e) => setForm((current) => ({ ...current, mediumId: e.target.value, classId: '' }))}>
                        <option value="">Select medium</option>
                        {dropdowns.mediums.map((medium) => <option key={medium.value} value={medium.value}>{medium.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div><label className={label}>Class</label><select className={input} value={form.classId} onChange={(e) => setForm((current) => ({ ...current, classId: e.target.value }))}><option value="">Select class</option>{dropdowns.classes.filter(cls => !form.mediumId || cls.mediumId === form.mediumId).map((item) => <option key={item.value} value={item.value}>{item.label}{dropdowns.mediums.length > 1 ? ` (${item.mediumName})` : ''}</option>)}</select></div>
                  <div><label className={label}>Due date</label><input type="date" className={input} value={form.dueDate} onChange={(e) => setForm((current) => ({ ...current, dueDate: e.target.value }))} /></div>
                  <div><label className={label}>Type</label><select className={input} value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))}><option value="homework">Homework</option><option value="classwork">Classwork</option><option value="project">Project</option><option value="worksheet">Worksheet</option></select></div>
                  {isAdmin && <div><label className={label}>Teacher</label><select className={input} value={form.teacherId} onChange={(e) => setForm((current) => ({ ...current, teacherId: e.target.value }))}><option value="">Assign teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></div>}
                </div>
                <div><label className={label}>Description</label><textarea className={`${input} min-h-[120px]`} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} /></div>
              </div>
              <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}><button className={btnSecondary} onClick={() => setShowCreateModal(false)}>Cancel</button><button className={btnPrimary} onClick={submitAssignment} disabled={submitting}>{submitting ? 'Creating…' : 'Create assignment'}</button></div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
