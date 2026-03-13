'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { attendanceApi, studentsApi } from '@/lib/apiClient';

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const TODAY = new Date().toISOString().split('T')[0];

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-500/15 text-green-400',
  absent: 'bg-red-500/15 text-red-400',
  late: 'bg-yellow-500/15 text-yellow-400',
  holiday: 'bg-blue-500/15 text-blue-400',
  'half-day': 'bg-orange-500/15 text-orange-400',
};

export default function AttendancePage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markClass, setMarkClass] = useState('10');
  const [markDate, setMarkDate] = useState(TODAY);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [markMap, setMarkMap] = useState<Record<string, string>>({});
  const [markSaving, setMarkSaving] = useState(false);
  const [markError, setMarkError] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  const fetcher = useCallback((p: any) => attendanceApi.list(p), []);
  const {
    data: records, total, page, pageSize, totalPages, loading, error,
    filters, setFilter, resetFilters, setPage, setPageSize, toggleSort, sortBy, sortOrder,
  } = usePaginatedQuery(fetcher, 'records', { date: TODAY }, { pageSize: 50 });

  // Compute stats from current page data
  const stats = useMemo(() => {
    const present = records.filter((r: any) => r.status === 'present').length;
    const absent = records.filter((r: any) => r.status === 'absent').length;
    const late = records.filter((r: any) => r.status === 'late').length;
    const rate = present + absent + late > 0
      ? Math.round((present / (present + absent + late)) * 100)
      : 0;
    return { present, absent, late, rate };
  }, [records]);

  const card = `p-5 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'
  }`;
  const thCls = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none hover:opacity-80 ${sub}`;
  const tdCls = `px-4 py-3 text-sm ${txt}`;

  const SortIcon = ({ field }: { field: string }) =>
    sortBy === field
      ? <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
      : <span className="ml-1 opacity-30">↕</span>;

  return (
    <AppLayout currentPage="attendance" title="Attendance Management">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div>
            <h2 className={`text-2xl font-bold ${txt}`}>Attendance Management</h2>
            <p className={`mt-1 text-sm ${sub}`}>
              {loading ? 'Loading…' : `${total.toLocaleString()} records`}
            </p>
          </div>
          <button onClick={() => setShowMarkModal(true)} className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            📝 Mark Attendance
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: stats.present, icon: '✅', cls: 'bg-green-500/15 text-green-400' },
            { label: 'Absent', value: stats.absent, icon: '❌', cls: 'bg-red-500/15 text-red-400' },
            { label: 'Late', value: stats.late, icon: '⏰', cls: 'bg-yellow-500/15 text-yellow-400' },
            { label: 'Rate (page)', value: `${stats.rate}%`, icon: '📊', cls: 'bg-blue-500/15 text-blue-400' },
          ].map(s => (
            <div key={s.label} className={card}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-xs font-medium ${sub}`}>{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${txt}`}>{s.value}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="date"
              className={inputCls}
              value={(filters.date as string) || ''}
              onChange={e => setFilter('date', e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="Class (e.g. 10A)…"
              value={(filters.class as string) || ''}
              onChange={e => setFilter('class', e.target.value)}
            />
            <select
              className={inputCls}
              value={(filters.status as string) || ''}
              onChange={e => setFilter('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="holiday">Holiday</option>
              <option value="half-day">Half Day</option>
            </select>
            <select
              className={inputCls}
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <button
              onClick={resetFilters}
              className={`px-3 py-2 rounded-lg text-sm border ${
                isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Reset
            </button>
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
                    { label: 'Student', field: 'studentId' },
                    { label: 'Class', field: 'class' },
                    { label: 'Date', field: 'date' },
                    { label: 'Status', field: 'status' },
                    { label: 'Subject', field: 'subject' },
                    { label: 'Remarks', field: 'remarks' },
                  ].map(col => (
                    <th key={col.field} className={thCls} onClick={() => toggleSort(col.field)}>
                      {col.label}<SortIcon field={col.field} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {loading && records.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${55 + (j * 9) % 35}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <p className={`text-lg font-medium ${txt}`}>No attendance records found</p>
                      <p className={`text-sm mt-1 ${sub}`}>Try changing the date or filters</p>
                    </td>
                  </tr>
                ) : (
                  records.map((rec: any) => (
                    <tr key={rec.id} className={`transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                      <td className={tdCls}>
                        <div>
                          <p className={`font-medium text-sm ${txt}`}>{rec.student?.name || '—'}</p>
                          <p className={`text-xs ${sub}`}>Roll: {rec.student?.rollNo || '—'}</p>
                        </div>
                      </td>
                      <td className={tdCls}>{rec.class || rec.student?.class || '—'}</td>
                      <td className={`${tdCls} text-xs font-mono`}>{rec.date}</td>
                      <td className={tdCls}>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[rec.status] || 'bg-gray-500/15 text-gray-400'}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className={tdCls}>{rec.subject || '—'}</td>
                      <td className={`${tdCls} text-xs ${sub}`}>{rec.remarks || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`flex flex-wrap gap-3 items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-sm ${sub}`}>
              {loading ? 'Loading…' : `Showing ${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()}`}
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

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowMarkModal(false)}>
          <div className={`w-full max-w-2xl mx-4 rounded-xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold ${txt}`}>Mark Attendance</h3>
            </div>
            <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
              {markError && <div className="p-2 rounded bg-red-500/10 text-red-400 text-sm">{markError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${sub}`}>Class *</label>
                  <input className={inputCls} value={markClass} onChange={e => setMarkClass(e.target.value)} placeholder="e.g. 10" />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${sub}`}>Date *</label>
                  <input type="date" className={inputCls} value={markDate} onChange={e => setMarkDate(e.target.value)} />
                </div>
              </div>
              <button
                disabled={loadingStudents}
                onClick={async () => {
                  setLoadingStudents(true); setMarkError('');
                  try {
                    const data = await studentsApi.list({ class: markClass, pageSize: 200, status: 'active' });
                    const students = data.students || [];
                    setClassStudents(students);
                    const map: Record<string, string> = {};
                    students.forEach((s: any) => { map[s.id] = 'present'; });
                    setMarkMap(map);
                  } catch (err: any) { setMarkError(err.message); }
                  finally { setLoadingStudents(false); }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 w-full"
              >
                {loadingStudents ? 'Loading students…' : `Load Students for Class ${markClass}`}
              </button>
              {classStudents.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-2 mb-2">
                    <button onClick={() => setMarkMap(prev => { const m = { ...prev }; Object.keys(m).forEach(k => m[k] = 'present'); return m; })} className="px-2 py-1 text-xs rounded bg-green-600 text-white">All Present</button>
                    <button onClick={() => setMarkMap(prev => { const m = { ...prev }; Object.keys(m).forEach(k => m[k] = 'absent'); return m; })} className="px-2 py-1 text-xs rounded bg-red-600 text-white">All Absent</button>
                  </div>
                  {classStudents.map((s: any) => (
                    <div key={s.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <span className={`text-sm ${txt}`}>{s.name} <span className={`text-xs ${sub}`}>(Roll: {s.rollNo})</span></span>
                      <select className={`px-2 py-1 rounded text-xs border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        value={markMap[s.id] || 'present'}
                        onChange={e => setMarkMap(prev => ({ ...prev, [s.id]: e.target.value }))}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="half-day">Half Day</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={`px-6 py-4 border-t flex justify-between items-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <span className={`text-xs ${sub}`}>{classStudents.length} students</span>
              <div className="flex gap-3">
                <button onClick={() => { setShowMarkModal(false); setClassStudents([]); setMarkMap({}); setMarkError(''); }} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>Cancel</button>
                <button
                  disabled={markSaving || classStudents.length === 0}
                  onClick={async () => {
                    setMarkSaving(true); setMarkError('');
                    try {
                      const records = classStudents.map((s: any) => ({
                        studentId: s.id, class: markClass, date: markDate,
                        status: markMap[s.id] || 'present', subject: 'General',
                      }));
                      await attendanceApi.save(records);
                      setShowMarkModal(false); setClassStudents([]); setMarkMap({});
                      resetFilters();
                    } catch (err: any) { setMarkError(err.message || 'Failed to save'); }
                    finally { setMarkSaving(false); }
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {markSaving ? 'Saving…' : 'Save Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
