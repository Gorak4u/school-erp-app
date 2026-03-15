'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  schoolName: string;
  schoolId: string | null;
  createdAt: string;
}

const ROLE_CONFIG: Record<string, { color: string; icon: string }> = {
  admin:   { color: 'bg-purple-500/20 text-purple-400 border-purple-500/20', icon: '👑' },
  teacher: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/20',       icon: '👩‍🏫' },
  student: { color: 'bg-green-500/20 text-green-400 border-green-500/20',     icon: '🎓' },
  parent:  { color: 'bg-orange-500/20 text-orange-400 border-orange-500/20',  icon: '👨‍👩‍👧' },
};

function Avatar({ name, email }: { name: string; email: string }) {
  const initials = name.trim() ? name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : email[0].toUpperCase();
  const hue = email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: `hsl(${hue},55%,45%)` }}>
      {initials}
    </div>
  );
}

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [resetModal, setResetModal] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('Reset@123');
  const [showPw, setShowPw] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', pageSize.toString());
    if (search) params.append('search', search);
    if (filterRole) params.append('role', filterRole);
    if (filterStatus) params.append('status', filterStatus);
    if (filterSchool) params.append('school', filterSchool);
    params.append('cache', 'true');
    
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => {
        console.log('API Response:', d); // Debug log
        setUsers(d.users || []);
        if (d.pagination) {
          setTotalPages(d.pagination.totalPages);
          setTotalUsers(d.pagination.total);
        } else {
          // Fallback if API doesn't return pagination info
          const userCount = d.users?.length || 0;
          setTotalPages(Math.max(1, Math.ceil(userCount / pageSize)));
          setTotalUsers(userCount);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, pageSize, search, filterRole, filterStatus, filterSchool]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (id: string, action: string, extra?: any) => {
    if (action === 'delete') {
      // Show confirmation for individual delete
      setSelected(new Set([id]));
      setBulkAction('delete');
      setShowDeleteConfirm(true);
      return;
    }
    
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast('Success', data.message || 'Action completed successfully');
        if (action === 'reset_password') setResetModal(null);
        load();
      } else {
        showErrorToast('Error', data.message || data.error);
      }
    } catch {
      showErrorToast('Error', 'Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const doBulk = async () => {
    if (!bulkAction || selected.size === 0) return;
    
    // Show confirmation for delete action
    if (bulkAction === 'delete') {
      setShowDeleteConfirm(true);
      return;
    }
    
    executeBulkAction();
  };

  const executeBulkAction = async () => {
    setActionLoading('bulk');
    const ids = Array.from(selected);
    
    if (bulkAction === 'delete') {
      // Handle bulk delete
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ids[0], action: 'bulk_delete', ids }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast('Success', data.message || 'Users deleted successfully');
      } else {
        showErrorToast('Error', data.message || data.error);
      }
    } else {
      // Handle other bulk actions
      for (const id of ids) {
        await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: bulkAction }),
        });
      }
      showSuccessToast('Success', `Bulk action applied to ${ids.length} users`);
    }
    
    setActionLoading(null);
    setSelected(new Set());
    setBulkAction('');
    setShowDeleteConfirm(false);
    load();
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Role', 'School', 'Status', 'Joined'].join(','),
      ...users.map((u: UserRow) => [`"${u.firstName} ${u.lastName}"`, u.email, u.role, `"${u.schoolName}"`, u.isActive ? 'Active' : 'Blocked', new Date(u.createdAt).toLocaleDateString()].join(',')),
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    a.download = 'users.csv'; a.click();
  };

  const schools = Array.from(new Set(users.map(u => u.schoolName))).sort();

  // Server-side pagination - no client-side filtering needed
  const allSelected = users.length > 0 && users.every(u => selected.has(u.id));

  // Stats
  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>);
  const activeCount = users.filter(u => u.isActive).length;

  const cardCls = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;
  const inputCls = `px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`;
  const btnCls = (color: string) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${color}`;
  const thCls = `text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Users</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{users.length} total · {activeCount} active</p>
        </div>
        <button onClick={exportCSV} className={btnCls(isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: users.length, icon: '👥', color: 'from-blue-500 to-indigo-500' },
          { label: 'Admins', value: roleCounts.admin || 0, icon: '👑', color: 'from-purple-500 to-pink-500' },
          { label: 'Teachers', value: roleCounts.teacher || 0, icon: '👩‍🏫', color: 'from-blue-500 to-cyan-500' },
          { label: 'Students', value: roleCounts.student || 0, icon: '🎓', color: 'from-green-500 to-emerald-500' },
          { label: 'Parents', value: roleCounts.parent || 0, icon: '👨‍👩‍👧', color: 'from-orange-500 to-red-500' },
        ].map(s => (
          <div key={s.label} className={`${cardCls} p-4`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</span>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-gradient-to-br ${s.color}`}>{s.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <input className={`${inputCls} flex-1 min-w-48`} placeholder="Search by name, email, school..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className={inputCls} value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </select>
        <select className={inputCls} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <select className={inputCls} value={filterSchool} onChange={e => { setFilterSchool(e.target.value); setPage(1); }}>
          <option value="">All Schools</option>
          {schools.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterRole || filterStatus || filterSchool) && (
          <button onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); setFilterSchool(''); setPage(1); }}
            className={`text-xs px-3 py-2 rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
          <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{selected.size} selected</span>
          <select className={`${inputCls} text-xs`} value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
            <option value="">Bulk action...</option>
            <option value="block">Block All</option>
            <option value="unblock">Unblock All</option>
            <option value="delete" style={{color: '#ef4444'}}>🗑️ Delete All (Permanent)</option>
          </select>
          <button onClick={doBulk} disabled={!bulkAction || actionLoading === 'bulk'}
            className={btnCls('bg-blue-600 text-white hover:bg-blue-700')}>
            {actionLoading === 'bulk' ? 'Processing...' : 'Apply'}
          </button>
          <button onClick={() => setSelected(new Set())} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Clear</button>
        </div>
      )}

      {/* Results count and page size */}
      <div className="flex items-center justify-between">
        {(search || filterRole || filterStatus || filterSchool) && (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Showing {users.length} of {totalUsers} users</p>
        )}
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setPage(1); // Reset to first page when changing page size
            }}
            className={`px-2 py-1 rounded text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className={`${cardCls} overflow-hidden`}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-14 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse ${i > 0 ? 'mt-px' : ''}`} />
          ))}
        </div>
      ) : (
        <div className={`${cardCls} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-gray-800/60' : 'bg-gray-50'}>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected}
                    onChange={() => allSelected ? setSelected(new Set()) : setSelected(new Set(users.map((u: UserRow) => u.id)))}
                    className="rounded" />
                </th>
                <th className={thCls}>User</th>
                <th className={thCls}>School</th>
                <th className={thCls}>Role</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Joined</th>
                <th className={`text-right px-4 py-3 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
              {users.map((user: UserRow) => {
                const rc = ROLE_CONFIG[user.role] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/20', icon: '👤' };
                return (
                  <tr key={user.id} className={`${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50/80'} transition-colors ${selected.has(user.id) ? (isDark ? 'bg-blue-500/5' : 'bg-blue-50/50') : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(user.id)}
                        onChange={e => {
                          const next = new Set(selected);
                          e.target.checked ? next.add(user.id) : next.delete(user.id);
                          setSelected(next);
                        }} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={`${user.firstName} ${user.lastName}`} email={user.email} />
                        <div className="min-w-0">
                          <div className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.firstName} {user.lastName}</div>
                          <div className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {user.schoolName || <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${rc.color}`}>
                        {rc.icon} {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {user.isActive ? '● Active' : '○ Blocked'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        {user.isActive ? (
                          <button onClick={() => doAction(user.id, 'block')} disabled={actionLoading === user.id}
                            className={btnCls(isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100')}>
                            Block
                          </button>
                        ) : (
                          <button onClick={() => doAction(user.id, 'unblock')} disabled={actionLoading === user.id}
                            className={btnCls(isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100')}>
                            Unblock
                          </button>
                        )}
                        <button onClick={() => { setResetModal(user); setNewPassword('Reset@123'); setShowPw(false); }}
                          className={btnCls(isDark ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100')}>
                          🔑 Reset
                        </button>
                        <button onClick={() => doAction(user.id, 'delete')} disabled={actionLoading === user.id}
                          className={btnCls('bg-red-600 text-white hover:bg-red-700')}>
                          🗑️ Delete
                        </button>
                        <select className={`${inputCls} text-xs py-1`} defaultValue=""
                          onChange={e => { if (e.target.value) doAction(user.id, 'change_role', { role: e.target.value }); e.target.value = ''; }}>
                          <option value="" disabled>Role…</option>
                          <option value="admin">Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="student">Student</option>
                          <option value="parent">Parent</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="text-3xl mb-2">👥</div>
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {(totalPages > 1 || totalUsers > 0) && (
        <div className="flex items-center justify-between">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Page {page} of {totalPages} · {totalUsers} users
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-blue-600 text-white' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`rounded-2xl border p-6 w-full max-w-md shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-lg">🔑</div>
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Reset Password</h3>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{resetModal.email}</p>
              </div>
            </div>
            <div className="relative mb-4">
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                className={`${inputCls} w-full pr-16`}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className={`absolute right-3 top-7 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setResetModal(null)}
                className={`px-4 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                Cancel
              </button>
              <button onClick={() => doAction(resetModal.id, 'reset_password', { password: newPassword })}
                disabled={!newPassword || actionLoading === resetModal.id}
                className="px-4 py-2 rounded-lg text-sm bg-yellow-600 hover:bg-yellow-500 text-white font-medium disabled:opacity-50">
                {actionLoading === resetModal.id ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ⚠️ Delete Users Permanently?
            </h3>
            <div className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <p className="mb-2">You are about to delete <strong>{selected.size}</strong> user(s) permanently:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>All user accounts and login access</li>
                <li>User data and associated records</li>
                <li>Any personal information and settings</li>
              </ul>
              <p className="mt-3 text-red-500 font-medium">This action cannot be undone!</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAction}
                disabled={actionLoading === 'bulk'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'bulk' ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
