'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { PERMISSION_GROUPS, PERMISSION_LABELS, ALL_PERMISSIONS, type Permission } from '@/lib/permissions';

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
    setMessage(null);
  };

  const openEdit = (role: CustomRole) => {
    setEditingRole(role);
    let perms: Permission[] = [];
    try { perms = JSON.parse(role.permissions); } catch {}
    setForm({ name: role.name, description: role.description || '', permissions: perms, isDefault: role.isDefault });
    setShowForm(true);
    setMessage(null);
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
    if (!form.name.trim()) { setMessage({ type: 'error', text: 'Role name is required' }); return; }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(editingRole ? `/api/roles/${editingRole.id}` : '/api/roles', {
        method: editingRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: editingRole ? `"${form.name}" updated!` : `"${form.name}" created!` });
        setShowForm(false);
        load();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
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
        setMessage({ type: 'success', text: `"${role.name}" deleted` });
        load();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } finally {
      setDeleting(null);
    }
  };

  const cardCls = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;

  return (
    <AppLayout currentPage="settings" title="Custom Roles" theme={theme}>
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Custom Roles</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Create roles like Principal, Clerk, Coordinator with specific permissions. Assign them to staff users.
          </p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700">
          + Create Role
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {message.text}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className={`${cardCls} p-6 ring-2 ring-purple-500`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {editingRole ? `Edit "${editingRole.name}"` : 'Create New Role'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Role Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Principal, Clerk, Academic Coordinator" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this role" className={inputCls} />
            </div>
          </div>

          {/* Permissions */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Permissions ({form.permissions.length} selected)
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm(p => ({ ...p, permissions: Object.values(ALL_PERMISSIONS) as Permission[] }))}
                  className="text-xs text-purple-400 hover:text-purple-300">Select All</button>
                <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>|</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, permissions: [] }))}
                  className="text-xs text-gray-400 hover:text-gray-300">Clear All</button>
              </div>
            </div>
            <div className="space-y-4">
              {PERMISSION_GROUPS.map(group => {
                const allSelected = group.permissions.every(p => form.permissions.includes(p));
                const someSelected = group.permissions.some(p => form.permissions.includes(p));
                return (
                  <div key={group.label} className={`rounded-lg p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {group.label}
                      </span>
                      <button type="button" onClick={() => toggleGroup(group.permissions)}
                        className={`text-xs px-2 py-0.5 rounded ${allSelected ? 'bg-purple-600 text-white' : someSelected ? 'bg-purple-500/30 text-purple-400' : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                        {allSelected ? '✓ All' : someSelected ? '~ Some' : 'None'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.permissions.map(p => (
                        <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                          <span onClick={() => togglePermission(p)}
                            className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${form.permissions.includes(p) ? 'bg-purple-600 border-purple-600 text-white' : isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            {form.permissions.includes(p) ? '✓' : ''}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{PERMISSION_LABELS[p]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))}
                className="w-4 h-4 rounded accent-purple-600" />
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Set as default role for new users</span>
            </label>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)}
                className={`px-4 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-lg text-sm bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Saving...' : editingRole ? '✓ Update Role' : '✓ Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roles List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className={`h-32 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`} />)}
        </div>
      ) : roles.length === 0 ? (
        <div className={`${cardCls} p-12 text-center`}>
          <div className="text-4xl mb-3">🎭</div>
          <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>No custom roles yet</h3>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Create roles like Principal, Clerk, or Academic Coordinator with specific permissions.
          </p>
          <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700">
            Create First Role
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(role => {
            let perms: string[] = [];
            try { perms = JSON.parse(role.permissions); } catch {}
            return (
              <div key={role.id} className={`${cardCls} p-5`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{role.name}</span>
                      {role.isDefault && (
                        <span className="text-xs bg-purple-600/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    {role.description && (
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{role.description}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    {role._count.users} user{role._count.users !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {perms.slice(0, 6).map(p => (
                    <span key={p} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      {PERMISSION_LABELS[p as Permission] || p}
                    </span>
                  ))}
                  {perms.length > 6 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                      +{perms.length - 6} more
                    </span>
                  )}
                  {perms.length === 0 && (
                    <span className="text-xs text-gray-500 italic">No permissions assigned</span>
                  )}
                </div>
                <div className="flex gap-2 justify-end pt-3 border-t border-gray-800/30">
                  <button onClick={() => openEdit(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    ✏ Edit
                  </button>
                  <button onClick={() => handleDelete(role)} disabled={deleting === role.id}
                    className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50">
                    {deleting === role.id ? 'Deleting...' : '✕ Delete'}
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
