'use client';

import React, { useState, useEffect } from 'react';
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

interface RolesManagementProps {
  theme: string;
  isDark: boolean;
}

export default function RolesManagement({ theme, isDark }: RolesManagementProps) {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    fetch('/api/roles')
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
    // Handle both JSON and comma-separated formats
    let parsedPermissions: Permission[] = [];
    
    try {
      // Try parsing as JSON first (this is the correct format from database)
      parsedPermissions = JSON.parse(role.permissions);
    } catch (e) {
      // Fallback to comma-separated parsing
      parsedPermissions = role.permissions
        .split(',')
        .map(p => p.trim())
        .filter(Boolean) as Permission[];
    }
    
        
    setForm({
      name: role.name,
      description: role.description,
      permissions: parsedPermissions,
      isDefault: role.isDefault,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      showErrorToast('Validation Error', 'Role name is required');
      return;
    }
    if (form.permissions.length === 0) {
      showErrorToast('Validation Error', 'Please select at least one permission');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/roles' + (editingRole ? `/${editingRole.id}` : ''), {
        method: editingRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          permissions: JSON.stringify(form.permissions),
          isDefault: form.isDefault,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      showSuccessToast('Success', editingRole ? 'Role updated' : 'Role created');
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm('Delete this role? Users with this role will lose access.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      showSuccessToast('Success', 'Role deleted');
      load();
    } catch (err: any) {
      showErrorToast('Error', err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const togglePermission = (perm: Permission) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className={`rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-8 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Custom Roles & Permissions</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage user roles and their access permissions</p>
            </div>
          </div>
          <button 
            onClick={openCreate}
            className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
              isDark 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg' 
                : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Role
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`text-center py-12 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
          <svg className={`mx-auto h-12 w-12 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className={`mt-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading roles...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {roles.map(role => (
            <div 
              key={role.id} 
              className={`rounded-2xl border p-6 shadow-lg transition-all ${
                isDark 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-gray-600' 
                  : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role.isDefault 
                        ? isDark ? 'bg-purple-600/20' : 'bg-purple-100'
                        : isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <svg className={`w-6 h-6 ${
                        role.isDefault ? 'text-purple-500' : isDark ? 'text-gray-400' : 'text-gray-500'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{role.name}</h3>
                      {role.isDefault && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          isDark ? 'bg-purple-600/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          ⭐ Default Role
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                    {role.description || 'No description provided'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(() => {
                      let permissions: string[] = [];
                      try {
                        // Try parsing as JSON first
                        permissions = JSON.parse(role.permissions);
                      } catch (e) {
                        // Fallback to comma-separated
                        permissions = role.permissions.split(',').filter(Boolean);
                      }
                      return permissions.map((perm: string) => (
                        <span 
                          key={perm} 
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {PERMISSION_LABELS[perm] || perm.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      ));
                    })()}
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {role._count.users} user{role._count.users !== 1 ? 's' : ''} assigned
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEdit(role)} 
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Edit
                  </button>
                  {!role.isDefault && (
                    <button 
                      onClick={() => deleteRole(role.id)} 
                      disabled={deleting === role.id}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                        isDark 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {deleting === role.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div 
            className={`w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {editingRole ? 'Edit Role' : 'Create New Role'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {editingRole ? 'Update role permissions and settings' : 'Define role permissions and access rights'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 max-h-[calc(85vh-140px)] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="e.g., Department Head, Subject Teacher"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-none ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    rows={3}
                    placeholder="Describe what this role can do and who it's for..."
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Permissions <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {Object.entries(PERMISSION_GROUPS).map(([group, groupData]) => (
                      <div key={group} className={`p-3 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                        <h4 className={`text-sm font-bold mb-2 capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {group.replace('_', ' ')} Permissions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {groupData.permissions.map((perm: Permission) => (
                            <label key={perm} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                              isDark 
                                ? 'border-gray-600 hover:bg-gray-700/50 hover:border-gray-500' 
                                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}>
                              <input
                                type="checkbox"
                                checked={form.permissions.includes(perm)}
                                onChange={() => togglePermission(perm)}
                                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500/30 focus:ring-offset-0"
                              />
                              <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                {PERMISSION_LABELS[perm] || perm.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <label className={`flex items-center gap-3 cursor-pointer`}>
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={form.isDefault}
                      onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                    />
                    <div>
                      <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Make this the default role for new users
                      </span>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                        New users will be automatically assigned this role
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex gap-3">
                <button 
                  onClick={save} 
                  disabled={saving}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark 
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg'
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {editingRole ? 'Update Role' : 'Create Role'}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setShowForm(false)} 
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${
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
