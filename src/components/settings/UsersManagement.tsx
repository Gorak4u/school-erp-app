'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { BASE_ROLE_OPTIONS } from '@/lib/permissions';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';

interface CustomRole { id: string; name: string; description?: string; }
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

// Custom role colors for better visual distinction
const CUSTOM_ROLE_COLORS = [
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-green-500/20 text-green-400 border-green-500/30',
  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
];

const getRoleColor = (index: number) => CUSTOM_ROLE_COLORS[index % CUSTOM_ROLE_COLORS.length];

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
    // Refresh roles first to get latest list
    fetch('/api/roles').then(r => r.json()).then(rData => {
      const roles = rData.roles || [];
      setCustomRoles(roles);
      setForm({
        email: '', firstName: '', lastName: '',
        role: 'teacher', customRoleId: '', password: '', isActive: true,
      });
      setShowForm(true);
    }).catch(err => {
      console.error('Failed to refresh roles:', err);
      // Fallback to original behavior
      setForm({
        email: '', firstName: '', lastName: '',
        role: 'teacher', customRoleId: '', password: '', isActive: true,
      });
      setShowForm(true);
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

  
  const getRoleBadge = (user: SchoolUser) => {
    if (user.customRole) {
      const roleIndex = customRoles.findIndex(r => r.id === user.customRole?.id);
      return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleColor(roleIndex)}`}>
          {user.customRole.name}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-gray-500/20 text-gray-400 border-gray-500/30">
        {user.role}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Users & Access</h3>
              <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{users.length} users</p>
            </div>
          </div>
          <button 
            onClick={openCreate}
            className={`px-2 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            + Add User
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-6 rounded-lg border border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
          <svg className={`mx-auto h-8 w-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {users.map(user => (
            <div 
              key={user.id} 
              className={`rounded-xl border p-3 shadow-sm transition-all ${
                isDark 
                  ? 'bg-gray-900 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                    user.isActive 
                      ? isDark ? 'bg-green-600/20' : 'bg-green-100'
                      : isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      user.isActive ? 'text-green-500' : isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.firstName} {user.lastName}
                    </h4>
                    <p className={`text-[10px] truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {getRoleBadge(user)}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                      user.isActive 
                        ? isDark ? 'bg-green-600/20 text-green-300' : 'bg-green-100 text-green-700'
                        : isDark ? 'bg-gray-600/20 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button 
                    onClick={() => openEdit(user)} 
                    className={`p-1.5 rounded-lg text-xs ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => toggleStatus(user)}
                    className={`p-1.5 rounded-lg text-xs ${
                      user.isActive 
                        ? isDark ? 'hover:bg-orange-600/20 text-orange-400' : 'hover:bg-orange-50 text-orange-500'
                        : isDark ? 'hover:bg-green-600/20 text-green-400' : 'hover:bg-green-50 text-green-500'
                    }`}
                  >
                    {user.isActive ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                  <button 
                    onClick={() => deleteUser(user)}
                    className={`p-1.5 rounded-lg text-xs ${isDark ? 'hover:bg-red-600/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div 
            className={`w-full max-w-xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`px-3 py-2.5 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {editingUser ? 'Edit User' : 'New User'}
                    </h3>
                    <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {editingUser ? 'Update user details' : 'Add new user'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-3 py-3 max-h-[calc(85vh-120px)] overflow-y-auto">
              <div className="space-y-3">
                <div>
                  <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="user@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {BASE_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Custom Role
                  </label>
                  {customRoles.length > 0 ? (
                    <div className={`p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="space-y-2">
                        <label className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                          !form.customRoleId
                            ? isDark
                              ? 'border-blue-500 bg-blue-600/20'
                              : 'border-blue-500 bg-blue-50'
                            : isDark
                              ? 'border-gray-600 hover:bg-gray-700/50'
                              : 'border-gray-300 hover:bg-gray-50'
                        }`}>
                          <input
                            type="radio"
                            name="customRole"
                            checked={!form.customRoleId}
                            onChange={() => setForm(f => ({ ...f, customRoleId: '' }))}
                            className="w-3 h-3 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Base Role Only
                            </div>
                            <div className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              No custom permissions
                            </div>
                          </div>
                        </label>
                        {customRoles.map((role, index) => (
                          <label key={role.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                            form.customRoleId === role.id
                              ? isDark 
                                ? 'border-blue-500 bg-blue-600/20' 
                                : 'border-blue-500 bg-blue-50'
                              : isDark 
                                ? 'border-gray-600 hover:bg-gray-700/50' 
                                : 'border-gray-300 hover:bg-gray-50'
                          }`}>
                            <input
                              type="radio"
                              name="customRole"
                              checked={form.customRoleId === role.id}
                              onChange={() => setForm(f => ({ ...f, customRoleId: role.id }))}
                              className="w-3 h-3 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {role.name}
                              </div>
                              <div className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {role.description || 'Custom permissions'}
                              </div>
                            </div>
                            <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full border ${getRoleColor(index)}`}>
                              Custom
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-lg border border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
                      <div className="text-center">
                        <svg className={`mx-auto h-8 w-8 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className={`mt-1 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No Custom Roles
                        </p>
                        <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>
                          Create custom roles first
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className={`block text-[11px] font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password {editingUser && <span className="text-[9px] text-gray-500">(leave blank to keep)</span>}
                    {!editingUser && <span className="text-red-500"> *</span>}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder={editingUser ? '••••••••' : 'Enter password'}
                  />
                </div>
                
                <div className={`p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <label className={`flex items-center gap-2 cursor-pointer`}>
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={form.isActive}
                      onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                      className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Active Account
                      </span>
                      <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        User can login
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className={`px-3 py-2.5 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex gap-2">
                <button 
                  onClick={save} 
                  disabled={saving}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-1">
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editingUser ? 'Update' : 'Create'}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setShowForm(false)} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
