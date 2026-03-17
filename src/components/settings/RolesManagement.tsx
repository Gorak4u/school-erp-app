'use client';

import React, { useState, useEffect } from 'react';
import { PERMISSION_GROUPS, DEFAULT_ROLE_PERMISSIONS, type Permission } from '@/lib/permissions';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: string;
  isDefault: boolean;
  _count: { users: number };
}

interface RolesManagementProps {
  theme: string;
  isDark: boolean;
}

const BUILT_IN_ROLES = [
  { id: 'admin', name: 'Admin', permissions: new Set(DEFAULT_ROLE_PERMISSIONS.admin) },
  { id: 'teacher', name: 'Teacher', permissions: new Set(DEFAULT_ROLE_PERMISSIONS.teacher) },
  { id: 'parent', name: 'Parent', permissions: new Set(DEFAULT_ROLE_PERMISSIONS.parent) },
  { id: 'student', name: 'Student', permissions: new Set(DEFAULT_ROLE_PERMISSIONS.student) },
];

export default function RolesManagement({ theme, isDark }: RolesManagementProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // roleDrafts: { [id]: { name, permissions: Set, isNew, isModified, isDeleted, isDefault, usersCount } }
  const [roleDrafts, setRoleDrafts] = useState<Record<string, any>>({});

  const load = () => {
    setLoading(true);
    fetch('/api/roles')
      .then(r => r.json())
      .then(d => {
        const roles = d.roles || [];
        const drafts: Record<string, any> = {};
        
        roles.forEach((r: CustomRole) => {
          let perms: Permission[] = [];
          try {
            perms = JSON.parse(r.permissions);
          } catch {
            perms = r.permissions.split(',').filter(Boolean) as Permission[];
          }
          drafts[r.id] = {
            name: r.name,
            permissions: new Set(perms),
            isNew: false,
            isModified: false,
            isDeleted: false,
            isDefault: r.isDefault,
            usersCount: r._count?.users || 0
          };
        });
        
        setRoleDrafts(drafts);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addRoleRow = () => {
    const id = 'new_' + Date.now();
    setRoleDrafts(prev => ({
      ...prev,
      [id]: {
        name: '',
        permissions: new Set(['view_dashboard']), // basic default
        isNew: true,
        isModified: true,
        isDeleted: false,
        isDefault: false,
        usersCount: 0
      }
    }));
  };

  const handleNameChange = (id: string, name: string) => {
    setRoleDrafts(prev => ({
      ...prev,
      [id]: { ...prev[id], name, isModified: true }
    }));
  };

  const handleToggleGroup = (id: string, groupPerms: Permission[]) => {
    setRoleDrafts(prev => {
      const draft = { ...prev[id] };
      const currentPerms = new Set(draft.permissions);
      
      const allPresent = groupPerms.every(p => currentPerms.has(p));
      
      if (allPresent) {
        groupPerms.forEach(p => currentPerms.delete(p));
      } else {
        groupPerms.forEach(p => currentPerms.add(p));
      }
      
      draft.permissions = currentPerms;
      draft.isModified = true;
      return { ...prev, [id]: draft };
    });
  };

  const markDeleted = (id: string) => {
    const draft = roleDrafts[id];
    if (draft.usersCount > 0) {
      showErrorToast('Cannot Delete', `This role is assigned to ${draft.usersCount} user(s).`);
      return;
    }
    if (confirm(`Are you sure you want to delete the role "${draft.name || 'New Role'}"?`)) {
      setRoleDrafts(prev => ({
        ...prev,
        [id]: { ...prev[id], isDeleted: true, isModified: true }
      }));
    }
  };

  const bulkSave = async () => {
    setSaving(true);
    let hasErrors = false;
    
    try {
      const promises = [];
      
      for (const [id, draft] of Object.entries(roleDrafts)) {
        if (!draft.isModified) continue;
        
        if (draft.isDeleted) {
          if (!draft.isNew) {
            promises.push(
              fetch(`/api/roles/${id}`, { method: 'DELETE' }).then(async r => {
                if (!r.ok) { hasErrors = true; console.error(await r.text()); }
              })
            );
          }
        } else if (draft.isNew) {
          if (!draft.name.trim()) continue; // skip empty
          promises.push(
            fetch('/api/roles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: draft.name.trim(),
                permissions: JSON.stringify(Array.from(draft.permissions)),
                isDefault: draft.isDefault
              })
            }).then(async r => {
              if (!r.ok) { hasErrors = true; console.error(await r.text()); }
            })
          );
        } else {
          // update
          if (!draft.name.trim()) {
            hasErrors = true;
            showErrorToast('Validation', 'Role names cannot be empty');
            continue;
          }
          promises.push(
            fetch(`/api/roles/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: draft.name.trim(),
                permissions: JSON.stringify(Array.from(draft.permissions)),
                isDefault: draft.isDefault
              })
            }).then(async r => {
              if (!r.ok) { hasErrors = true; console.error(await r.text()); }
            })
          );
        }
      }
      
      await Promise.all(promises);
      if (hasErrors) {
        showErrorToast('Warning', 'Some changes could not be saved. Check if role names are unique.');
      } else {
        showSuccessToast('Success', 'Roles and permissions updated successfully');
      }
      load();
    } catch (e) {
      showErrorToast('Error', 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = Object.values(roleDrafts).some(d => d.isModified);

  const activeDrafts = Object.entries(roleDrafts).filter(([_, d]) => !d.isDeleted);

  const cardClasses = `rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} shadow-lg`;
  const headingClasses = `text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`;
  const subtextClasses = `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 ${isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'}`;

  return (
    <div className={cardClasses + " p-6"}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className={headingClasses}>Roles & Permissions Matrix</h3>
          <p className={subtextClasses}>Manage user roles in an Excel-style grid</p>
        </div>
        <div className="flex gap-3">
          <button 
            className={btnSecondary} 
            onClick={addRoleRow}
          >
            <span className="font-bold text-blue-500 mr-1">+</span> Add Role
          </button>
          <button 
            className={btnPrimary} 
            disabled={saving || !hasUnsavedChanges} 
            onClick={bulkSave}
          >
            {saving ? 'Saving...' : '💾 Bulk Save'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading roles...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`w-full text-sm border-collapse ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead>
              <tr>
                <th className={`px-4 py-3 text-left font-semibold border min-w-[180px] bg-clip-padding ${isDark ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-gray-50/80 text-gray-700'} sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb] ${isDark ? 'shadow-[1px_0_0_0_#374151]' : ''}`}>
                  Role Name
                </th>
                {PERMISSION_GROUPS.map((group) => (
                  <th key={group.label} className={`px-2 py-2 text-center font-semibold border w-24 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                    <div className="transform -rotate-45 whitespace-nowrap origin-bottom-left ml-6 mt-6 mb-2 text-xs">
                      {group.label}
                    </div>
                  </th>
                ))}
                <th className={`px-4 py-2 text-center border w-20 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Built-in Roles */}
              {BUILT_IN_ROLES.map((role) => (
                <tr key={role.id} className={`${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                  <td className={`px-4 py-3 border font-medium sticky left-0 z-10 bg-inherit shadow-[1px_0_0_0_#e5e7eb] ${isDark ? 'border-gray-700 shadow-[1px_0_0_0_#374151]' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <span>{role.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                        System
                      </span>
                    </div>
                  </td>
                  {PERMISSION_GROUPS.map((group) => {
                    const hasAll = group.permissions.every(p => role.permissions.has(p));
                    return (
                      <td key={group.label} className={`px-2 py-2 border text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <input
                          type="checkbox"
                          checked={hasAll}
                          disabled
                          className={`w-4 h-4 rounded ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} opacity-60 cursor-not-allowed`}
                        />
                      </td>
                    );
                  })}
                  <td className={`px-4 py-2 border text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span className="text-gray-400 text-xs">-</span>
                  </td>
                </tr>
              ))}

              {/* Editable Drafts & Custom Roles */}
              {activeDrafts.map(([id, draft]) => (
                <tr key={id} className={`${draft.isNew ? (isDark ? 'bg-green-900/10' : 'bg-green-50') : ''} ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                  <td className={`p-0 border sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb] ${isDark ? 'border-gray-700 bg-gray-900 shadow-[1px_0_0_0_#374151]' : 'border-gray-200 bg-white'}`}>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => handleNameChange(id, e.target.value)}
                      placeholder="Role Name"
                      className={`w-full h-full min-h-[48px] px-4 py-3 bg-transparent outline-none ${isDark ? 'text-gray-200 placeholder-gray-600 focus:bg-gray-800' : 'text-gray-900 placeholder-gray-400 focus:bg-blue-50'} transition-colors font-medium`}
                    />
                  </td>
                  {PERMISSION_GROUPS.map((group) => {
                    const hasAll = group.permissions.every(p => draft.permissions.has(p));
                    // Add slight visual difference for partial selections if needed, but checkbox natively supports boolean
                    return (
                      <td key={group.label} className={`px-2 py-2 border text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <input
                          type="checkbox"
                          checked={hasAll}
                          onChange={() => handleToggleGroup(id, group.permissions)}
                          className={`w-4 h-4 rounded cursor-pointer ${isDark ? 'accent-blue-500 bg-gray-700 border-gray-600' : 'accent-blue-600 bg-white border-gray-300'}`}
                        />
                      </td>
                    );
                  })}
                  <td className={`px-4 py-2 border text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button
                      onClick={() => markDeleted(id)}
                      title="Delete Role"
                      className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
