'use client';

import React, { useCallback, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { examsApi } from '@/lib/apiClient';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/15 text-blue-400',
  ongoing: 'bg-yellow-500/15 text-yellow-400',
  completed: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

const TYPE_COLORS: Record<string, string> = {
  unit_test: 'bg-purple-500/15 text-purple-400',
  mid_term: 'bg-orange-500/15 text-orange-400',
  final: 'bg-red-500/15 text-red-400',
  practical: 'bg-teal-500/15 text-teal-400',
};

const EMPTY_EXAM = { name: '', subject: '', class: '', date: '', startTime: '', endTime: '', totalMarks: '100', passingMarks: '33', type: 'unit_test', status: 'scheduled', academicYear: '2024-25', description: '' };

export default function ExamsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAddModal, setShowAddModal] = useState(false);
  const [examForm, setExamForm] = useState({ ...EMPTY_EXAM });
  const [examSaving, setExamSaving] = useState(false);
  const [examError, setExamError] = useState('');

  const fetcher = useCallback((p: any) => examsApi.list(p), []);
  const {
    data: exams, total, page, pageSize, totalPages, loading, error,
    filters, setFilter, resetFilters, setPage, setPageSize, toggleSort, sortBy, sortOrder,
  } = usePaginatedQuery(fetcher, 'exams', {}, { pageSize: 50 });

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

  const scheduled = (exams as any[]).filter(e => e.status === 'scheduled').length;
  const completed = (exams as any[]).filter(e => e.status === 'completed').length;

  return (
    <AppLayout currentPage="exams" title="Exams Management">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div>
            <h2 className={`text-2xl font-bold ${txt}`}>Exams Management</h2>
            <p className={`mt-1 text-sm ${sub}`}>
              {loading ? 'Loading…' : `${total.toLocaleString()} exams total`}
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors">
            + Schedule Exam
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: total, icon: '📝' },
            { label: 'Scheduled', value: scheduled, icon: '📅' },
            { label: 'Completed', value: completed, icon: '✅' },
            { label: 'Pages', value: totalPages, icon: '📑' },
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              className={inputCls}
              placeholder="Search name, subject…"
              value={(filters.search as string) || ''}
              onChange={e => setFilter('search', e.target.value)}
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
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className={inputCls}
              value={(filters.type as string) || ''}
              onChange={e => setFilter('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="unit_test">Unit Test</option>
              <option value="mid_term">Mid Term</option>
              <option value="final">Final</option>
              <option value="practical">Practical</option>
            </select>
            <div className="flex gap-2">
              <select
                className={inputCls}
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
              <button
                onClick={resetFilters}
                className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
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
                    { label: 'Exam Name', field: 'name' },
                    { label: 'Type', field: 'type' },
                    { label: 'Class', field: 'class' },
                    { label: 'Subject', field: 'subject' },
                    { label: 'Date', field: 'date' },
                    { label: 'Marks', field: 'totalMarks' },
                    { label: 'Status', field: 'status' },
                    { label: 'Results', field: '_count' },
                  ].map(col => (
                    <th key={col.field} className={thCls} onClick={() => toggleSort(col.field)}>
                      {col.label}<SortIcon field={col.field} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {loading && exams.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${55 + (j * 9) % 35}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : exams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <p className={`text-lg font-medium ${txt}`}>No exams found</p>
                      <p className={`text-sm mt-1 ${sub}`}>Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  (exams as any[]).map(exam => (
                    <tr key={exam.id} className={`transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                      <td className={tdCls}>
                        <p className={`font-medium text-sm ${txt}`}>{exam.name}</p>
                        {exam.venue && <p className={`text-xs ${sub}`}>{exam.venue}</p>}
                      </td>
                      <td className={tdCls}>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[exam.type] || 'bg-gray-500/15 text-gray-400'}`}>
                          {exam.type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={tdCls}>{exam.class}{exam.section ? `-${exam.section}` : ''}</td>
                      <td className={tdCls}>{exam.subject}</td>
                      <td className={`${tdCls} text-xs font-mono`}>{exam.date}</td>
                      <td className={tdCls}>
                        <span>{exam.totalMarks}</span>
                        <span className={`text-xs ml-1 ${sub}`}>(pass: {exam.passingMarks})</span>
                      </td>
                      <td className={tdCls}>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[exam.status] || 'bg-gray-500/15 text-gray-400'}`}>
                          {exam.status}
                        </span>
                      </td>
                      <td className={tdCls}>
                        <span className={`text-xs font-medium ${sub}`}>{exam._count?.results ?? 0} students</span>
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

      {/* Schedule Exam Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className={`w-full max-w-lg mx-4 rounded-xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold ${txt}`}>Schedule New Exam</h3>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {examError && <div className="p-2 rounded bg-red-500/10 text-red-400 text-sm">{examError}</div>}
              {[
                { key: 'name', label: 'Exam Name *', type: 'text' },
                { key: 'subject', label: 'Subject *', type: 'text' },
                { key: 'class', label: 'Class *', type: 'text' },
                { key: 'date', label: 'Date *', type: 'date' },
                { key: 'startTime', label: 'Start Time', type: 'time' },
                { key: 'endTime', label: 'End Time', type: 'time' },
                { key: 'totalMarks', label: 'Total Marks', type: 'number' },
                { key: 'passingMarks', label: 'Passing Marks', type: 'number' },
                { key: 'description', label: 'Description', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`block text-xs font-medium mb-1 ${sub}`}>{f.label}</label>
                  <input type={f.type} className={inputCls} value={(examForm as any)[f.key]} onChange={e => setExamForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${sub}`}>Type</label>
                  <select className={inputCls} value={examForm.type} onChange={e => setExamForm(prev => ({ ...prev, type: e.target.value }))}>
                    <option value="unit_test">Unit Test</option>
                    <option value="mid_term">Mid Term</option>
                    <option value="final">Final</option>
                    <option value="practical">Practical</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${sub}`}>Academic Year</label>
                  <input className={inputCls} value={examForm.academicYear} onChange={e => setExamForm(prev => ({ ...prev, academicYear: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => { setShowAddModal(false); setExamForm({ ...EMPTY_EXAM }); setExamError(''); }} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>Cancel</button>
              <button
                disabled={examSaving}
                onClick={async () => {
                  if (!examForm.name || !examForm.subject || !examForm.class || !examForm.date) { setExamError('Name, Subject, Class and Date are required'); return; }
                  setExamSaving(true); setExamError('');
                  try {
                    await examsApi.create({ ...examForm, totalMarks: Number(examForm.totalMarks), passingMarks: Number(examForm.passingMarks) });
                    setShowAddModal(false); setExamForm({ ...EMPTY_EXAM }); resetFilters();
                  } catch (err: any) { setExamError(err.message || 'Failed to schedule exam'); }
                  finally { setExamSaving(false); }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {examSaving ? 'Saving…' : 'Schedule Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
