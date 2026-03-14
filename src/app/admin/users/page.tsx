'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

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

export default function AdminUsersPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [resetModal, setResetModal] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('Reset@123');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const doAction = async (userId: string, action: string, extra?: any) => {
    setActionLoading(userId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action, ...extra }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (action === 'reset_password') setResetModal(null);
      load();
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = `${u.firstName} ${u.lastName} ${u.email} ${u.schoolName}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const inputCls = `px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`;
  const btnCls = (color: string) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${color}`;

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-500/20 text-purple-400',
      teacher: 'bg-blue-500/20 text-blue-400',
      student: 'bg-green-500/20 text-green-400',
      parent: 'bg-orange-500/20 text-orange-400',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[role] || 'bg-gray-500/20 text-gray-400'}`}>{role}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Users</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{users.length} total users across all schools</p>
        </div>
        <div className="flex gap-2">
          <input className={`${inputCls} w-56`} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className={inputCls} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>User</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>School</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Role</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                <th className={`text-left px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Joined</th>
                <th className={`text-right px-4 py-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
              {filtered.map(user => (
                <tr key={user.id} className={isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.firstName} {user.lastName}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{user.email}</div>
                  </td>
                  <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{user.schoolName}</td>
                  <td className="px-4 py-3">{roleBadge(user.role)}</td>
                  <td className="px-4 py-3">
                    {user.isActive
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Active</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Blocked</span>}
                  </td>
                  <td className={`px-4 py-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      {user.isActive ? (
                        <button onClick={() => doAction(user.id, 'block')} disabled={actionLoading === user.id}
                          className={btnCls(isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600')}>
                          Block
                        </button>
                      ) : (
                        <button onClick={() => doAction(user.id, 'unblock')} disabled={actionLoading === user.id}
                          className={btnCls(isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-50 text-green-600')}>
                          Unblock
                        </button>
                      )}
                      <button onClick={() => { setResetModal(user); setNewPassword('Reset@123'); }}
                        className={btnCls(isDark ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-yellow-50 text-yellow-600')}>
                        Reset Pwd
                      </button>
                      <select className={`${inputCls} text-xs py-1`} defaultValue=""
                        onChange={e => { if (e.target.value) doAction(user.id, 'change_role', { role: e.target.value }); e.target.value = ''; }}>
                        <option value="" disabled>Role...</option>
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No users found</div>
          )}
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-xl border p-6 w-96 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Reset Password</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Reset password for <strong>{resetModal.firstName} {resetModal.lastName}</strong> ({resetModal.email})
            </p>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
            <input className={`${inputCls} w-full mb-4`} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setResetModal(null)}
                className={btnCls(isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600')}>
                Cancel
              </button>
              <button onClick={() => doAction(resetModal.id, 'reset_password', { password: newPassword })}
                disabled={actionLoading === resetModal.id}
                className={btnCls('bg-yellow-600 text-white hover:bg-yellow-500')}>
                {actionLoading === resetModal.id ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
