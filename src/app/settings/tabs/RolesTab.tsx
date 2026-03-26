'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showErrorToast, showSuccessToast } from '@/lib/toastUtils';
import { PERMISSION_GROUPS, DEFAULT_ROLE_PERMISSIONS, PERMISSION_LABELS, type Permission, BASE_ROLE_OPTIONS, PREDEFINED_ROLE_TEMPLATES } from '@/lib/permissions';

interface RolesTabProps {
  isDark: boolean;
}

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: string;
  isDefault: boolean;
  _count: { users: number };
}

const BUILT_IN_ROLES = [
  { id: 'admin', name: 'Admin', permissions: new Set(DEFAULT_ROLE_PERMISSIONS.admin) },
  { id: 'teacher', name: 'Teacher', permissions: new Set(DEFAULT_ROLE_PERMISSIONS.teacher) },
  { id: 'parent', name: 'Parent', permissions: new Set(DEFAULT_ROLE_PERMISSIONS.parent) },
  { id: 'student', name: 'Student', permissions: new Set(DEFAULT_ROLE_PERMISSIONS.student) },
];

export const RolesTab: React.FC<RolesTabProps> = ({ isDark }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  
  // roleDrafts: { [id]: { name, permissions: Set, isNew, isModified, isDeleted, isDefault, usersCount } }
  const [roleDrafts, setRoleDrafts] = useState<Record<string, any>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<typeof PREDEFINED_ROLE_TEMPLATES[0] | null>(null);

  // Centralized theme object
  const theme = useMemo(() => ({
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      muted: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    card: isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-200',
    input: isDark 
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
    gradients: {
      primary: 'from-cyan-500 to-blue-600',
      secondary: 'from-purple-500 to-pink-600',
      success: 'from-green-500 to-emerald-600',
      warning: 'from-orange-500 to-red-600',
    }
  }), [isDark]);

  const load = useCallback(() => {
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
  }, []);

  const seedTeacherRole = async () => {
    try {
      const response = await fetch('/api/roles/seed-defaults', { method: 'POST' });
      if (response.ok) {
        load();
      }
    } catch (error) {
      console.error('Failed to seed Teacher role:', error);
    }
  };

  useEffect(() => { load(); }, [load]);

  const updateTeacherRole = async () => {
    try {
      const response = await fetch('/api/roles/seed-defaults', { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        const teacherResult = result.results?.find((r: any) => r.name === 'Teacher');
        if (teacherResult) {
          showSuccessToast('Success', `Teacher role updated (${teacherResult.status})`);
        } else {
          showSuccessToast('Success', 'Roles re-seeded with latest permissions');
        }
        load();
      } else {
        const errorData = await response.json();
        showErrorToast('Error', errorData.error || 'Failed to update teacher role');
      }
    } catch (error) {
      console.error('Failed to update teacher role:', error);
      showErrorToast('Error', 'An error occurred while updating teacher role');
    }
  };

  const addRoleFromTemplate = useCallback((template: typeof PREDEFINED_ROLE_TEMPLATES[0]) => {
    const id = 'new_' + Date.now();
    setRoleDrafts(prev => ({
      ...prev,
      [id]: {
        name: template.name,
        permissions: new Set(template.permissions),
        isNew: true,
        isModified: true,
        isDeleted: false,
        isDefault: template.isDefault || false,
        usersCount: 0
      }
    }));
    setShowTemplateModal(false);
    setSelectedTemplate(null);
  }, []);

  const addCustomRole = useCallback(() => {
    const id = 'new_' + Date.now();
    setRoleDrafts(prev => ({
      ...prev,
      [id]: {
        name: '',
        permissions: new Set(['view_dashboard']),
        isNew: true,
        isModified: true,
        isDeleted: false,
        isDefault: false,
        usersCount: 0
      }
    }));
  }, []);

  const handleNameChange = useCallback((id: string, name: string) => {
    setRoleDrafts(prev => ({
      ...prev,
      [id]: { ...prev[id], name, isModified: true }
    }));
  }, []);

  const handleTogglePermission = useCallback((id: string, permission: Permission) => {
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
  }, []);

  const handleToggleGroup = useCallback((id: string, groupPermissions: Permission[]) => {
    setRoleDrafts(prev => {
      const draft = { ...prev[id] };
      const currentPerms = new Set(draft.permissions);
      
      // Check if all group permissions are already granted
      const allGranted = groupPermissions.every(perm => currentPerms.has(perm));
      
      if (allGranted) {
        // Remove all group permissions
        groupPermissions.forEach(perm => currentPerms.delete(perm));
      } else {
        // Add all group permissions
        groupPermissions.forEach(perm => currentPerms.add(perm));
      }
      
      draft.permissions = currentPerms;
      draft.isModified = true;
      return { ...prev, [id]: draft };
    });
  }, []);

  const deleteRole = useCallback(async (id: string) => {
    const draft = roleDrafts[id];
    
    if (!draft) return;
    
    if (draft.usersCount > 0) {
      showErrorToast('Cannot Delete', `This role is assigned to ${draft.usersCount} user(s).`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete the role "${draft.name || 'New Role'}"?`)) {
      if (draft.isNew) {
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
          load();
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
  }, [roleDrafts, load]);

  const bulkSave = useCallback(async () => {
    setSaving(true);
    let hasErrors = false;
    const errorMessages: string[] = [];
    
    try {
      const promises = [];
      
      for (const [id, draft] of Object.entries(roleDrafts)) {
        if (!draft.isModified) continue;
        
        if (draft.isNew) {
          if (!draft.name.trim()) continue;
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
  }, [roleDrafts, load]);

  const hasUnsavedChanges = Object.values(roleDrafts).some(d => d.isModified);
  const activeDrafts = Object.entries(roleDrafts).filter(([_, d]) => !d.isDeleted);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    }
  };

  const getPermissionStats = useCallback((permissions: Set<Permission>) => {
    const total = Object.keys(PERMISSION_LABELS).length;
    const granted = permissions.size;
    const percentage = (granted / total) * 100;
    return { total, granted, percentage };
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Beautiful Header Section */}
      <motion.div
        variants={itemVariants}
        className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} shadow-lg`}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradients.primary} opacity-10`}></div>
        
        {/* Content */}
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Animated Icon Container */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${theme.gradients.primary} shadow-lg`}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </motion.div>
              
              <div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r ${theme.gradients.primary} bg-clip-text text-transparent`}>
                  Advanced Role Management
                </h1>
                <p className={`text-sm ${theme.text.secondary} mt-1`}>
                  Manage custom roles and permissions • {activeDrafts.length} active roles
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className={`flex items-center gap-1 p-1 rounded-xl ${theme.card} border ${theme.border}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'cards'
                      ? `bg-gradient-to-r ${theme.gradients.primary} text-white`
                      : `${theme.text.secondary} ${theme.hover}`
                  }`}
                >
                  Cards
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'table'
                      ? `bg-gradient-to-r ${theme.gradients.primary} text-white`
                      : `${theme.text.secondary} ${theme.hover}`
                  }`}
                >
                  Table
                </motion.button>
              </div>
              
              {/* Action Buttons */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTemplateModal(true)}
                className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.secondary} text-white shadow-lg hover:shadow-xl transition-all`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  From Template
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addCustomRole}
                className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Custom Role
                </span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={updateTeacherRole}
                className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.success} text-white shadow-lg hover:shadow-xl transition-all`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Update Roles
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading ? (
        <motion.div
          variants={itemVariants}
          className={`text-center py-12 rounded-2xl border border-dashed ${theme.border} ${theme.card}`}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={`mx-auto h-12 w-12 ${isDark ? 'text-cyan-400' : 'text-cyan-500'}`}
          >
            <svg fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.div>
          <p className={`mt-4 text-sm font-medium ${theme.text.secondary}`}>Loading roles...</p>
        </motion.div>
      ) : activeDrafts.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className={`text-center py-12 rounded-2xl border border-dashed ${theme.border} ${theme.card}`}
        >
          <div className={`mx-auto h-12 w-12 ${isDark ? 'text-cyan-400' : 'text-cyan-500'}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className={`mt-4 text-lg font-medium ${theme.text.primary}`}>No custom roles found</h3>
          <p className={`mt-2 text-sm ${theme.text.secondary}`}>Get started by creating your first custom role</p>
          <div className="flex gap-3 justify-center mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTemplateModal(true)}
              className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.secondary} text-white shadow-lg hover:shadow-xl transition-all`}
            >
              Use Template
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addCustomRole}
              className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all`}
            >
              Create Custom
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <motion.div
              variants={itemVariants}
              className="grid gap-6"
            >
              {activeDrafts.map(([id, draft], index) => {
                const stats = getPermissionStats(draft.permissions);
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`group relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    {/* Gradient Accent */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradients.primary} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                    
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => handleNameChange(id, e.target.value)}
                            placeholder="Role Name"
                            className={`text-xl font-bold bg-transparent outline-none ${theme.text.primary} placeholder-gray-400 ${theme.hover} rounded-lg px-2 py-1 transition-colors`}
                          />
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              draft.isNew 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {draft.isNew ? 'New' : 'Saved'}
                            </span>
                            {draft.usersCount > 0 && (
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30`}>
                                {draft.usersCount} user{draft.usersCount !== 1 ? 's' : ''}
                              </span>
                            )}
                            {draft.isDefault && (
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30`}>
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingRole(editingRole === id ? null : id)}
                            className={`p-2 rounded-xl ${theme.hover} ${theme.text.secondary} transition-colors`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteRole(id)}
                            className={`p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.button>
                        </div>
                      </div>
                      
                      {/* Permission Stats */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${theme.text.primary}`}>Permissions Coverage</span>
                          <span className={`text-sm font-bold ${theme.text.primary}`}>{stats.granted}/{stats.total}</span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${theme.card} overflow-hidden`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`h-full bg-gradient-to-r ${theme.gradients.primary}`}
                          ></motion.div>
                        </div>
                        <p className={`text-xs ${theme.text.secondary} mt-1`}>{stats.percentage.toFixed(1)}% of all permissions</p>
                      </div>
                      
                      {/* Permission Groups */}
                      {editingRole === id && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            {PERMISSION_GROUPS.map((group, groupIndex) => {
                              const groupPerms = group.permissions.filter(perm => draft.permissions.has(perm));
                              const isComplete = groupPerms.length === group.permissions.length;
                              
                              return (
                                <motion.div
                                  key={group.label}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: groupIndex * 0.05 }}
                                  className={`p-3 rounded-xl border ${theme.border} ${theme.card}`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <button
                                      onClick={() => handleToggleGroup(id, group.permissions)}
                                      className={`flex items-center gap-2 text-sm font-medium ${theme.text.primary} ${theme.hover} rounded-lg px-2 py-1 transition-colors`}
                                    >
                                      <div className={`w-4 h-4 rounded border-2 ${
                                        isComplete 
                                          ? 'bg-cyan-500 border-cyan-500' 
                                          : `${theme.border} ${theme.text.secondary}`
                                      }`}>
                                        {isComplete && (
                                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </div>
                                      {group.label}
                                    </button>
                                    <span className={`text-xs ${theme.text.secondary}`}>
                                      {groupPerms.length}/{group.permissions.length}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    {group.permissions.map((permission) => (
                                      <label
                                        key={permission}
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                          draft.permissions.has(permission)
                                            ? 'bg-cyan-500/20 border border-cyan-500/30'
                                            : `${theme.hover} border ${theme.border}`
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={draft.permissions.has(permission)}
                                          onChange={() => handleTogglePermission(id, permission)}
                                          className="w-3 h-3 rounded text-cyan-600 focus:ring-cyan-500"
                                        />
                                        <span className={`text-xs ${theme.text.primary}`}>
                                          {PERMISSION_LABELS[permission]}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <motion.div
              variants={itemVariants}
              className={`overflow-x-auto rounded-2xl border ${theme.border} ${theme.bg} shadow-lg`}
            >
              <div className="min-w-[1400px]">
                <table className={`w-full text-sm`}>
                  <thead>
                    <tr className={`${theme.card}`}>
                      <th className={`px-4 py-3 text-left font-semibold ${theme.text.primary} border ${theme.border} sticky left-0 z-20 min-w-[200px]`}>
                        Role
                      </th>
                      {PERMISSION_GROUPS.map((group) => (
                        <th key={group.label} className={`px-3 py-3 text-center font-semibold ${theme.text.primary} border ${theme.border} min-w-[120px]`}>
                          {group.label}
                        </th>
                      ))}
                      <th className={`px-3 py-3 text-center font-semibold ${theme.text.primary} border ${theme.border} min-w-[80px]`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDrafts.map(([id, draft]) => (
                      <tr key={id} className={`${draft.isNew ? (isDark ? 'bg-green-900/10' : 'bg-green-50') : ''} ${theme.hover}`}>
                        <td className={`px-4 py-3 border ${theme.border} sticky left-0 z-20 ${theme.bg}`}>
                          <div>
                            <input
                              type="text"
                              value={draft.name}
                              onChange={(e) => handleNameChange(id, e.target.value)}
                              placeholder="Role Name"
                              className={`font-medium bg-transparent outline-none ${theme.text.primary} placeholder-gray-400 ${theme.hover} rounded px-2 py-1 transition-colors`}
                            />
                            <div className="flex items-center gap-2 mt-1">
                              {draft.isNew && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/20 text-green-400">
                                  New
                                </span>
                              )}
                              {draft.usersCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-500/20 text-purple-400">
                                  {draft.usersCount} users
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        {PERMISSION_GROUPS.map((group) => {
                          const groupPerms = group.permissions.filter(perm => draft.permissions.has(perm));
                          const percentage = (groupPerms.length / group.permissions.length) * 100;
                          
                          return (
                            <td key={group.label} className={`px-3 py-3 border ${theme.border} text-center`}>
                              <button
                                onClick={() => handleToggleGroup(id, group.permissions)}
                                className={`w-full`}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <div className={`w-8 h-2 rounded-full ${theme.card} overflow-hidden`}>
                                    <div
                                      className={`h-full bg-gradient-to-r ${theme.gradients.primary}`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-xs font-medium ${theme.text.primary}`}>
                                    {groupPerms.length}/{group.permissions.length}
                                  </span>
                                </div>
                              </button>
                            </td>
                          );
                        })}
                        <td className={`px-3 py-3 border ${theme.border} text-center`}>
                          <div className="flex items-center justify-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setEditingRole(editingRole === id ? null : id)}
                              className={`p-1.5 rounded ${theme.hover} ${theme.text.secondary} transition-colors`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteRole(id)}
                              className={`p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Save Changes Button */}
      {hasUnsavedChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={bulkSave}
            disabled={saving}
            className={`px-6 py-3 rounded-2xl text-sm font-medium bg-gradient-to-r ${theme.gradients.success} text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="flex items-center gap-2">
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4"
                  >
                    <svg fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </motion.div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save All Changes
                </>
              )}
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* Template Selection Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${theme.bg} border ${theme.border}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b ${theme.border} bg-gradient-to-r ${theme.gradients.secondary} bg-opacity-10`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${theme.gradients.secondary} shadow-lg`}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </motion.div>
                    <div>
                      <h3 className={`text-lg font-semibold ${theme.text.primary}`}>
                        Choose Role Template
                      </h3>
                      <p className={`text-sm ${theme.text.secondary}`}>
                        Start with a pre-configured role template
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowTemplateModal(false)}
                    className={`w-8 h-8 rounded-xl ${theme.hover} ${theme.text.secondary} transition-colors`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 max-h-[calc(90vh-140px)] overflow-y-auto">
                <div className="grid gap-4">
                  {PREDEFINED_ROLE_TEMPLATES.map((template, index) => {
                    const stats = getPermissionStats(new Set(template.permissions));
                    
                    return (
                      <motion.div
                        key={template.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedTemplate?.name === template.name
                            ? 'border-purple-500 bg-purple-500/10'
                            : `${theme.border} ${theme.hover}`
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-base font-semibold ${theme.text.primary}`}>
                              {template.name}
                            </h4>
                            <p className={`text-sm ${theme.text.secondary} mt-1`}>
                              {template.description}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-3">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30`}>
                                {stats.granted} permissions
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30`}>
                                {template.baseRole}
                              </span>
                              {template.isDefault && (
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30`}>
                                  Default
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs ${theme.text.secondary}`}>Coverage</span>
                                <span className={`text-xs font-medium ${theme.text.primary}`}>
                                  {stats.percentage.toFixed(1)}%
                                </span>
                              </div>
                              <div className={`w-full h-1.5 rounded-full ${theme.card} overflow-hidden`}>
                                <div
                                  className={`h-full bg-gradient-to-r ${theme.gradients.secondary}`}
                                  style={{ width: `${stats.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className={`w-6 h-6 rounded-full border-2 ${
                            selectedTemplate?.name === template.name
                              ? 'border-purple-500 bg-purple-500'
                              : theme.border
                          }`}>
                            {selectedTemplate?.name === template.name && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className={`px-6 py-4 border-t ${theme.border} ${theme.card}`}>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectedTemplate && addRoleFromTemplate(selectedTemplate)}
                    disabled={!selectedTemplate}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${theme.gradients.secondary} text-white shadow-lg hover:shadow-xl`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create from Template
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowTemplateModal(false)} 
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${theme.hover} ${theme.text.primary} border ${theme.border}`}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
