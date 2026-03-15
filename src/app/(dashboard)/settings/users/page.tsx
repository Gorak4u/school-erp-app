'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';

interface CustomRole { id: string; name: string; }
interface SchoolUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  customRoleId: string | null;
  isActive: boolean;
  createdAt: string;
  customRole: CustomRole | null;
}

const BUILT_IN_ROLES = ['admin', 'teacher', 'parent'];
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  teacher: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  parent: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function UsersPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SchoolUser | null>(null);
  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '',
    role: 'teacher', customRoleId: '', password: '', isActive: true,
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/users?page=1&limit=100&cache=true').then(r => r.json()),
      fetch('/api/roles?cache=true').then(r => r.json()),
    ]).then(([uData, rData]) => {
      setUsers(uData.users || []);
      setCustomRoles(rData.roles || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ email: '', firstName: '', lastName: '', role: 'teacher', customRoleId: '', password: '', isActive: true });
    setShowForm(true);
  };

  const openEdit = (user: SchoolUser) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      customRoleId: user.customRoleId || '',
      password: '',
      isActive: user.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        customRoleId: form.customRoleId || null,
        isActive: form.isActive,
      };
      if (form.password) payload.password = form.password;

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      if (!editingUser) payload.password = form.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast('Success', editingUser ? 'User updated!' : 'User created!');
        setShowForm(false);
        load();
      } else {
        showErrorToast('Error', data.error);
      }
    } catch {
      showErrorToast('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: SchoolUser) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast('Success', `User ${!user.isActive ? 'activated' : 'deactivated'}`);
        load();
      } else {
        showErrorToast('Error', data.error);
      }
    } catch {
      showErrorToast('Error', 'Network error');
    }
  };

  const cardCls = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const selectCls = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500`;

  return (
    <AppLayout currentPage="settings" title="Users & Access" theme={theme}>
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Users & Access</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage all staff accounts. Assign built-in roles or custom roles with specific permissions.
          </p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700">
          + Add User
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className={`${cardCls} p-6 ring-2 ring-purple-500 relative`}>
          {/* Close button in top-right corner */}
          <button
            onClick={() => setShowForm(false)}
            className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
              isDark 
                ? 'bg-gray-800 text-gray-300 hover:bg-red-900 hover:text-red-300 border border-gray-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 border border-gray-300'
            }`}
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {editingUser ? `Edit ${editingUser.firstName} ${editingUser.lastName}` : 'Add New User'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>First Name *</label>
              <input type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                placeholder="First name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Last Name *</label>
              <input type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                placeholder="Last name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@school.com" className={inputCls} disabled={!!editingUser} />
            </div>
            <div>
              <label className={labelCls}>{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder={editingUser ? 'Leave blank to keep current' : 'Min 8 characters'} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Built-in Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={selectCls}>
                {BUILT_IN_ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Used as fallback when no custom role is assigned</p>
            </div>
            <div>
              <label className={labelCls}>Custom Role (Optional)</label>
              <select value={form.customRoleId} onChange={e => setForm(p => ({ ...p, customRoleId: e.target.value }))} className={selectCls}>
                <option value="">None (use built-in role)</option>
                {customRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Custom role permissions override the built-in role
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                className="w-4 h-4 rounded accent-purple-600" />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Account is active (can login)</span>
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)}
                className={`px-4 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-lg text-sm bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Saving...' : editingUser ? '✓ Update User' : '✓ Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className={`${cardCls} p-8`}>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className={`h-12 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`} />)}
          </div>
        </div>
      ) : (
        <div className={`${cardCls} overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-gray-800/60' : 'bg-gray-50'}>
                <th className={`text-left text-xs font-medium px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>User</th>
                <th className={`text-left text-xs font-medium px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Role</th>
                <th className={`text-left text-xs font-medium px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                <th className={`text-left text-xs font-medium px-4 py-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {users.map(user => (
                <tr key={user.id} className={`transition-colors ${isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[user.role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {user.role}
                      </span>
                      {user.customRole && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {user.customRole.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(user)}
                      className={`text-xs px-2 py-0.5 rounded-full border ${user.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(user)}
                      className={`px-3 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                      ✏ Edit
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className={`px-4 py-8 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </AppLayout>
  );
}
