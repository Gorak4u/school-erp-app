'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { PERMISSION_GROUPS, PERMISSION_LABELS, ALL_PERMISSIONS, type Permission } from '@/lib/permissions';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: string;
  isDefault: boolean;
  _count: { users: number };
}

const EMPTY_FORM = { name: '', description: '', permissions: [] as Permission[], isDefault: false };

export default function RolesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    fetch('/api/roles?cache=true')
      .then(r => r.json())
      .then(d => setRoles(d.roles || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingRole(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (role: CustomRole) => {
    setEditingRole(role);
    let perms: Permission[] = [];
    try { perms = JSON.parse(role.permissions); } catch {}
    setForm({ name: role.name, description: role.description || '', permissions: perms, isDefault: role.isDefault });
    setShowForm(true);
  };

  const togglePermission = (p: Permission) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(p)
        ? prev.permissions.filter(x => x !== p)
        : [...prev.permissions, p],
    }));
  };

  const toggleGroup = (groupPerms: Permission[]) => {
    const allSelected = groupPerms.every(p => form.permissions.includes(p));
    setForm(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !groupPerms.includes(p))
        : [...new Set([...prev.permissions, ...groupPerms])],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showErrorToast('Validation Error', 'Role name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch(editingRole ? `/api/roles/${editingRole.id}` : '/api/roles', {
        method: editingRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast('Success', editingRole ? `"${form.name}" updated!` : `"${form.name}" created!`);
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

  const handleDelete = async (role: CustomRole) => {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    setDeleting(role.id);
    try {
      const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast('Success', `"${role.name}" deleted`);
        load();
      } else {
        showErrorToast('Error', data.error);
      }
    } finally {
      setDeleting(null);
    }
  };

  const cardCls = `rounded-2xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`;
  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm transition-all ${isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'} focus:outline-none`;
  const labelCls = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <AppLayout currentPage="settings" title="Custom Roles" theme={theme}>
      <div className="max-w-7xl mx-auto space-y-8 pb-8">
        {/* Modern Header */}
        <div className={`rounded-2xl border ${isDark ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200'} p-8 shadow-lg`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Role Management</h1>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Create and manage custom roles with specific permissions for your staff
                  </p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={openCreate}
              className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center gap-2 ${
                isDark 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Role
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Total Roles</p>
                <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{roles.length}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Custom roles created</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50' : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-600'}`}>Default Roles</p>
                <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{roles.filter(r => r.isDefault).length}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Set as default</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${isDark ? 'bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/50' : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>Total Users</p>
                <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {roles.reduce((sum, role) => sum + role._count.users, 0)}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Assigned to roles</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      {/* Modern Create / Edit Form */}
        {showForm && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4`} onClick={() => setShowForm(false)}>
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
              {/* Form Header */}
              <div className={`px-8 py-6 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {editingRole ? `Edit "${editingRole.name}"` : 'Create New Role'}
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      {editingRole ? 'Modify role details and permissions' : 'Create a custom role with specific permissions'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className={`p-3 rounded-xl transition-all ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Basic Information */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Basic Information</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Role name and description</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelCls}>Role Name *</label>
                      <input 
                        type="text" 
                        value={form.name} 
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g., Principal, Clerk, Academic Coordinator" 
                        className={inputCls} 
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Description</label>
                      <input 
                        type="text" 
                        value={form.description} 
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Brief description of this role" 
                        className={inputCls} 
                      />
                    </div>
                  </div>
                </div>

                {/* Permissions Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Permissions</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {form.permissions.length} permissions selected
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setForm(p => ({ ...p, permissions: Object.values(ALL_PERMISSIONS) as Permission[] }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isDark 
                            ? 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30' 
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        Select All
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setForm(p => ({ ...p, permissions: [] }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isDark 
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {PERMISSION_GROUPS.map(group => {
                      const allSelected = group.permissions.every(p => form.permissions.includes(p));
                      const someSelected = group.permissions.some(p => form.permissions.includes(p));
                      return (
                        <div key={group.label} className={`rounded-xl border p-6 transition-all ${
                          isDark 
                            ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' 
                            : 'bg-gray-50/50 border-gray-200 hover:bg-gray-100'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                allSelected 
                                  ? 'bg-purple-600 text-white' 
                                  : someSelected 
                                    ? 'bg-purple-500/30 text-purple-400' 
                                    : isDark 
                                      ? 'bg-gray-700 text-gray-400' 
                                      : 'bg-gray-200 text-gray-500'
                              }`}>
                                {allSelected ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : someSelected ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{group.label}</h4>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {group.permissions.length} permissions
                                </p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => toggleGroup(group.permissions)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                allSelected 
                                  ? 'bg-purple-600 text-white' 
                                  : someSelected 
                                    ? 'bg-purple-500/30 text-purple-400 hover:bg-purple-500/40' 
                                    : isDark 
                                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' 
                                      : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                              }`}
                            >
                              {allSelected ? 'All Selected' : someSelected ? 'Some Selected' : 'Select All'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.permissions.map(p => (
                              <label key={p} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700">
                                <input
                                  type="checkbox"
                                  checked={form.permissions.includes(p)}
                                  onChange={() => togglePermission(p)}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {PERMISSION_LABELS[p]}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Default Role Setting */}
                <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                  <label className="flex items-center gap-4 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.isDefault} 
                      onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500" 
                    />
                    <div>
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Set as default role</div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        New users will be assigned this role by default
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Footer */}
              <div className={`px-8 py-6 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                <button 
                  onClick={() => setShowForm(false)}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                    isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                    saving 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
                  } disabled:opacity-50`}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {editingRole ? 'Updating Role...' : 'Creating Role...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editingRole ? 'Update Role' : 'Create Role'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modern Roles List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`h-64 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`} />
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className={`${cardCls} p-16 text-center`}>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
              <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>No custom roles yet</h3>
            <p className={`text-lg mb-8 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Create roles like Principal, Clerk, or Academic Coordinator with specific permissions to manage your school staff efficiently.
            </p>
            <button 
              onClick={openCreate} 
              className={`px-8 py-4 rounded-xl text-base font-medium transition-all transform hover:scale-105 inline-flex items-center gap-3 ${
                isDark 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Role
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => {
              let perms: string[] = [];
              try { perms = JSON.parse(role.permissions); } catch {}
              return (
                <div key={role.id} className={`${cardCls} p-6 transition-all hover:shadow-xl hover:scale-[1.02] group`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          role.isDefault 
                            ? 'bg-purple-600 text-white' 
                            : isDark 
                              ? 'bg-gray-700 text-gray-300' 
                              : 'bg-gray-200 text-gray-600'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{role.name}</h3>
                      </div>
                      {role.isDefault && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-500/30">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Default Role
                        </span>
                      )}
                      {role.description && (
                        <p className={`text-sm mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>{role.description}</p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {role._count.users} user{role._count.users !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Permissions ({perms.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {perms.slice(0, 6).map(p => (
                        <span key={p} className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {PERMISSION_LABELS[p as Permission] || p}
                        </span>
                      ))}
                      {perms.length > 6 && (
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}>
                          +{perms.length - 6} more
                        </span>
                      )}
                      {perms.length === 0 && (
                        <span className={`text-xs italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          No permissions assigned
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={() => openEdit(role)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        isDark 
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(role)} 
                      disabled={deleting === role.id}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                        isDark 
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                          : 'bg-red-50 hover:bg-red-100 text-red-600'
                      }`}
                    >
                      {deleting === role.id ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
    </AppLayout>
  );
}
