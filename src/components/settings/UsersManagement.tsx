'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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

interface UsersManagementProps {
  theme: string;
  isDark: boolean;
}

export default function UsersManagement({ theme, isDark }: UsersManagementProps) {
  const { data: session } = useSession();
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
      fetch('/api/users').then(r => r.json()),
      fetch('/api/roles').then(r => r.json()),
    ]).then(([uData, rData]) => {
      setUsers(uData.users || []);
      setCustomRoles(rData.roles || []);
    }).catch(err => {
      showErrorToast('Error', 'Failed to load data');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({
      email: '', firstName: '', lastName: '',
      role: 'teacher', customRoleId: '', password: '', isActive: true,
    });
    setShowForm(true);
    
    // Refresh roles to get any newly created ones
    fetch('/api/roles').then(r => r.json()).then(rData => {
      setCustomRoles(rData.roles || []);
    }).catch(err => {
      console.error('Failed to refresh roles:', err);
    });
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
    
    // Refresh roles to get any newly created ones
    fetch('/api/roles').then(r => r.json()).then(rData => {
      setCustomRoles(rData.roles || []);
    }).catch(err => {
      console.error('Failed to refresh roles:', err);
    });
  };

  const save = async () => {
    if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      showErrorToast('Validation Error', 'All fields are required');
      return;
    }
    if (!editingUser && !form.password.trim()) {
      showErrorToast('Validation Error', 'Password is required for new users');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        customRoleId: form.customRoleId || null,
        isActive: form.isActive,
      };
      if (!editingUser || form.password.trim()) {
        payload.password = form.password.trim();
      }
      // Add schoolId from session for super admins
      if (session?.user?.schoolId) {
        payload.schoolId = session.user.schoolId;
      }

      const res = await fetch('/api/users' + (editingUser ? `/${editingUser.id}` : ''), {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      showSuccessToast('Success', editingUser ? 'User updated' : 'User created');
      setShowForm(false);
      load();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: SchoolUser) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      showSuccessToast('Success', `User ${!user.isActive ? 'activated' : 'deactivated'}`);
      load();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Update failed');
    }
  };

  const deleteUser = async (user: SchoolUser) => {
    if (!confirm(`Delete user ${user.firstName} ${user.lastName}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      showSuccessToast('Success', 'User deleted');
      load();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Delete failed');
    }
  };

  const card = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6';
  const input = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const btn = 'px-4 py-2 rounded-lg font-medium transition-all';
  const btnPrimary = 'bg-blue-600 hover:bg-blue-700 text-white';
  const btnSecondary = 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white';

  const getRoleBadge = (user: SchoolUser) => {
    if (user.customRole) {
      return (
        <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 border-purple-500/30 rounded-full">
          {user.customRole.name}
        </span>
      );
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${ROLE_COLORS[user.role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
        {user.role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users & Access</h2>
        <button onClick={openCreate} className={`${btn} ${btnPrimary}`}>
          + Add User
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Created</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{getRoleBadge(user)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full border ${
                      user.isActive 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(user)} className={`${btn} ${btnSecondary} text-sm`}>
                        Edit
                      </button>
                      <button 
                        onClick={() => toggleStatus(user)}
                        className={`${btn} ${user.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white text-sm`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => deleteUser(user)}
                        className={`${btn} bg-red-600 hover:bg-red-700 text-white text-sm`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${card} max-w-md w-full`}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingUser ? 'Edit User' : 'Add User'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={input}
                  placeholder="user@example.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className={input}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className={input}
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value, customRoleId: '' }))}
                  className={input}
                >
                  {BUILT_IN_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              {form.role === 'teacher' && customRoles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Custom Role (optional)
                  </label>
                  <select
                    value={form.customRoleId}
                    onChange={e => setForm(f => ({ ...f, customRoleId: e.target.value }))}
                    className={input}
                  >
                    <option value="">No custom role</option>
                    {customRoles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={input}
                  placeholder={editingUser ? '••••••••' : 'Enter password'}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Active user
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving} className={`${btn} ${btnPrimary} flex-1`}>
                {saving ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
              </button>
              <button onClick={() => setShowForm(false)} className={`${btn} ${btnSecondary}`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
