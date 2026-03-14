'use client';

import React, { useState, useEffect } from 'react';
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

interface RolesManagementProps {
  theme: string;
  isDark: boolean;
}

export default function RolesManagement({ theme, isDark }: RolesManagementProps) {
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
    setMessage(null);
  };

  const openEdit = (role: CustomRole) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions.split(',').filter(Boolean) as Permission[],
      isDefault: role.isDefault,
    });
    setShowForm(true);
    setMessage(null);
  };

  const save = async () => {
    if (!form.name.trim()) return setMessage({ type: 'error', text: 'Role name is required' });
    if (form.permissions.length === 0) return setMessage({ type: 'error', text: 'Please select at least one permission' });

    setSaving(true);
    try {
      const res = await fetch('/api/roles' + (editingRole ? `/${editingRole.id}` : ''), {
        method: editingRole ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          permissions: form.permissions.join(','),
          isDefault: form.isDefault,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMessage({ type: 'success', text: editingRole ? 'Role updated' : 'Role created' });
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' });
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
      setMessage({ type: 'success', text: 'Role deleted' });
      load();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Delete failed' });
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

  const card = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6';
  const input = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const btn = 'px-4 py-2 rounded-lg font-medium transition-all';
  const btnPrimary = 'bg-blue-600 hover:bg-blue-700 text-white';
  const btnSecondary = 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Roles</h2>
        <button onClick={openCreate} className={`${btn} ${btnPrimary}`}>
          + Create Role
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading roles...</div>
      ) : (
        <div className="grid gap-4">
          {roles.map(role => (
            <div key={role.id} className={card}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                    {role.isDefault && (
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{role.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {role.permissions.split(',').filter(Boolean).map((perm: string) => (
                      <span key={perm} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {PERMISSION_LABELS[perm as Permission] || perm}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {role._count.users} user{role._count.users !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(role)} className={`${btn} ${btnSecondary} text-sm`}>
                    Edit
                  </button>
                  {!role.isDefault && (
                    <button 
                      onClick={() => deleteRole(role.id)} 
                      disabled={deleting === role.id}
                      className={`${btn} bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50`}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${card} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingRole ? 'Edit Role' : 'Create Role'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Name *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={input}
                  placeholder="e.g., Department Head"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={input}
                  rows={3}
                  placeholder="Describe what this role can do..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permissions *
                </label>
                <div className="space-y-3">
                  {Object.entries(PERMISSION_GROUPS).map(([group, groupData]) => (
                    <div key={group}>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 capitalize">{group}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {groupData.permissions.map((perm: Permission) => (
                          <label key={perm} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(perm)}
                              onChange={() => togglePermission(perm)}
                              className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                            />
                            {PERMISSION_LABELS[perm] || perm}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                  className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
                  Make this the default role for new users
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving} className={`${btn} ${btnPrimary} flex-1`}>
                {saving ? 'Saving...' : (editingRole ? 'Update' : 'Create')}
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
