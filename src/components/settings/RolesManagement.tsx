'use client';

import React, { useState, useEffect } from 'react';
import { PERMISSION_GROUPS, DEFAULT_ROLE_PERMISSIONS, PERMISSION_LABELS, type Permission } from '@/lib/permissions';
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
        
        // Auto-seed Teacher role if no custom roles exist
        if (roles.length === 0) {
          seedTeacherRole();
        }
      })
      .finally(() => setLoading(false));
  };

  const seedTeacherRole = async () => {
    try {
      const response = await fetch('/api/roles/seed-defaults', { method: 'POST' });
      if (response.ok) {
        // Reload roles after seeding
        load();
      }
    } catch (error) {
      console.error('Failed to seed Teacher role:', error);
    }
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

  const handleTogglePermission = (id: string, permission: Permission) => {
    setRoleDrafts(prev => {
      const draft = { ...prev[id] };
      const currentPerms = new Set(draft.permissions);
      
      if (currentPerms.has(permission)) {
        currentPerms.delete(permission);
      } else {
        currentPerms.add(permission);
      }
      
      draft.permissions = currentPerms;
      draft.isModified = true;
      return { ...prev, [id]: draft };
    });
  };

  const deleteRole = async (id: string) => {
    const draft = roleDrafts[id];
    
    if (!draft) return;
    
    if (draft.usersCount > 0) {
      showErrorToast('Cannot Delete', `This role is assigned to ${draft.usersCount} user(s).`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete the role "${draft.name || 'New Role'}"?`)) {
      if (draft.isNew) {
        // Just remove from state
        setRoleDrafts(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
        if (response.ok) {
          showSuccessToast('Success', 'Role deleted successfully');
          load(); // reload roles
        } else {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            showErrorToast('Error', `Failed to delete role: ${errorData.error}`);
          } catch {
            showErrorToast('Error', `Failed to delete role: ${errorText}`);
          }
          setLoading(false);
        }
      } catch (e) {
        showErrorToast('Error', 'An error occurred while deleting the role.');
        setLoading(false);
      }
    }
  };

  const bulkSave = async () => {
    setSaving(true);
    let hasErrors = false;
    const errorMessages: string[] = [];
    
    try {
      const promises = [];
      
      for (const [id, draft] of Object.entries(roleDrafts)) {
        if (!draft.isModified) continue;
        
        if (draft.isNew) {
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
              if (!r.ok) { 
                hasErrors = true;
                const errorText = await r.text();
                console.error('Create error:', errorText);
                try {
                  const errorData = JSON.parse(errorText);
                  errorMessages.push(`Failed to create "${draft.name}": ${errorData.error}`);
                } catch {
                  errorMessages.push(`Failed to create "${draft.name}": ${errorText}`);
                }
              }
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
              if (!r.ok) { 
                hasErrors = true;
                const errorText = await r.text();
                console.error('Update error:', errorText);
                try {
                  const errorData = JSON.parse(errorText);
                  errorMessages.push(`Failed to update "${draft.name}": ${errorData.error}`);
                } catch {
                  errorMessages.push(`Failed to update "${draft.name}": ${errorText}`);
                }
              }
            })
          );
        }
      }
      
      await Promise.all(promises);
      if (hasErrors) {
        if (errorMessages.length > 0) {
          showErrorToast('Error', errorMessages.join('; '));
        } else {
          showErrorToast('Warning', 'Some changes could not be saved. Check if role names are unique.');
        }
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
          <h3 className={headingClasses}>Custom Roles Management</h3>
          <p className={subtextClasses}>Manage custom user roles and their permissions</p>
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
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="min-w-[900px]">
            <table className={`w-full text-sm border-collapse ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead>
              <tr>
                <th className={`px-4 py-3 text-left font-semibold border min-w-[300px] bg-clip-padding ${isDark ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-gray-50/80 text-gray-700'} sticky left-0 z-20 shadow-[2px_0_0_0_#e5e7eb] ${isDark ? 'shadow-[2px_0_0_0_#374151]' : ''}`}>
                  Role Name
                </th>
                {/* Individual Permission Columns */}
                {Object.values(PERMISSION_LABELS).map((label) => (
                  <th key={label} className={`px-2 py-2 text-center font-semibold border w-24 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                    <div className="transform -rotate-45 whitespace-nowrap origin-bottom-left ml-6 mt-6 mb-2 text-xs">
                      {label}
                    </div>
                  </th>
                ))}
                <th className={`px-4 py-2 text-center border w-20 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Custom Roles Only */}
              {activeDrafts.map(([id, draft]) => (
                <tr key={id} className={`${draft.isNew ? (isDark ? 'bg-green-900/10' : 'bg-green-50') : ''} ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                  <td className={`p-0 border sticky left-0 z-20 shadow-[2px_0_0_0_#e5e7eb] ${isDark ? 'border-gray-700 bg-gray-900 shadow-[2px_0_0_0_#374151]' : 'border-gray-200 bg-white'}`}>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => handleNameChange(id, e.target.value)}
                      placeholder="Role Name"
                      className={`w-full h-full min-h-[48px] px-4 py-3 bg-transparent outline-none text-ellipsis ${isDark ? 'text-gray-200 placeholder-gray-600 focus:bg-gray-800' : 'text-gray-900 placeholder-gray-400 focus:bg-blue-50'} transition-colors font-medium`}
                      title={draft.name || 'Role Name'}
                    />
                  </td>
                  {/* Individual Permission Checkboxes */}
                  {Object.entries(PERMISSION_LABELS).map(([permissionKey, label]) => {
                    const hasPermission = draft.permissions.has(permissionKey as Permission);
                    return (
                      <td key={permissionKey} className={`px-2 py-2 border text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <input
                          type="checkbox"
                          checked={hasPermission}
                          onChange={() => handleTogglePermission(id, permissionKey as Permission)}
                          className={`w-4 h-4 rounded cursor-pointer ${isDark ? 'accent-blue-500 bg-gray-700 border-gray-600' : 'accent-blue-600 bg-white border-gray-300'}`}
                        />
                      </td>
                    );
                  })}
                  <td className={`px-4 py-2 border text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button
                      onClick={() => deleteRole(id)}
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
        </div>
      )}
    </div>
  );
}
