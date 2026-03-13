'use client';

import React, { useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { teachersApi } from '@/lib/apiClient';

const PAGE_SIZE_OPTIONS = [25, 50, 100];
const EMPTY_FORM = { name: '', email: '', phone: '', department: '', subject: '', qualification: '', experience: '', employeeId: '', status: 'active', joiningDate: '' };

export default function TeachersPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetcher = useCallback((p: any) => teachersApi.list(p), []);
  const {
    data: teachers, total, page, pageSize, totalPages, loading, error,
    filters, setFilter, resetFilters, setPage, setPageSize, toggleSort, sortBy, sortOrder, refresh,
  } = usePaginatedQuery(fetcher, 'teachers', {}, { pageSize: 50 });

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

  return (
    <AppLayout currentPage="teachers" title="Teachers Management">
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div>
            <h2 className={`text-2xl font-bold ${txt}`}>Teachers Management</h2>
            <p className={`mt-1 text-sm ${sub}`}>
              {loading ? 'Loading…' : `${total.toLocaleString()} teachers total`}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            + Add Teacher
          </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              className={inputCls}
              placeholder="Search name, email, ID, subject…"
              value={(filters.search as string) || ''}
              onChange={e => setFilter('search', e.target.value)}
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
                    { label: 'Teacher', field: 'name' },
                    { label: 'Employee ID', field: 'employeeId' },
                    { label: 'Department', field: 'department' },
                    { label: 'Subject', field: 'subject' },
                    { label: 'Experience', field: 'experience' },
                    { label: 'Status', field: 'status' },
                    { label: 'Joined', field: 'joiningDate' },
                  ].map(col => (
                    <th key={col.field} className={thCls} onClick={() => toggleSort(col.field)}>
                      {col.label}<SortIcon field={col.field} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {loading && teachers.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${60 + (j * 7) % 30}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <p className={`text-lg font-medium ${txt}`}>No teachers found</p>
                      <p className={`text-sm mt-1 ${sub}`}>Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher: any) => (
                    <tr key={teacher.id} className={`transition-colors ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
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

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className={`w-full max-w-lg mx-4 rounded-xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold ${txt}`}>Add New Teacher</h3>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {formError && <div className="p-2 rounded bg-red-500/10 text-red-400 text-sm">{formError}</div>}
              {[
                { key: 'name', label: 'Full Name *', type: 'text' },
                { key: 'email', label: 'Email *', type: 'email' },
                { key: 'phone', label: 'Phone', type: 'text' },
                { key: 'employeeId', label: 'Employee ID *', type: 'text' },
                { key: 'department', label: 'Department', type: 'text' },
                { key: 'subject', label: 'Subject', type: 'text' },
                { key: 'qualification', label: 'Qualification', type: 'text' },
                { key: 'experience', label: 'Experience (years)', type: 'number' },
                { key: 'joiningDate', label: 'Joining Date', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`block text-xs font-medium mb-1 ${sub}`}>{f.label}</label>
                  <input
                    type={f.type}
                    className={inputCls}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
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
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => { setShowAddModal(false); setForm({ ...EMPTY_FORM }); setFormError(''); }} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>Cancel</button>
              <button
                disabled={saving}
                onClick={async () => {
                  if (!form.name || !form.email || !form.employeeId) { setFormError('Name, Email and Employee ID are required'); return; }
                  setSaving(true); setFormError('');
                  try {
                    await teachersApi.create({ ...form, experience: form.experience ? Number(form.experience) : null });
                    setShowAddModal(false); setForm({ ...EMPTY_FORM }); refresh();
                  } catch (err: any) { setFormError(err.message || 'Failed to create teacher'); }
                  finally { setSaving(false); }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
