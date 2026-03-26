'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showErrorToast, showSuccessToast } from '@/lib/toastUtils';
import { BASE_ROLE_OPTIONS } from '@/lib/permissions';
import { useSession } from 'next-auth/react';

interface UsersTabProps {
  isDark: boolean;
}

interface CustomRole { 
  id: string; 
  name: string; 
  description?: string; 
}

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

export const UsersTab: React.FC<UsersTabProps> = ({ isDark }) => {
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
      primary: 'from-teal-500 to-cyan-600',
      secondary: 'from-purple-500 to-pink-600',
      success: 'from-green-500 to-emerald-600',
      warning: 'from-orange-500 to-red-600',
    }
  }), [isDark]);

  const load = useCallback(() => {
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
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = useCallback(() => {
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
  }, []);

  const openEdit = useCallback((user: SchoolUser) => {
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
  }, []);

  const save = useCallback(async () => {
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
  }, [form, editingUser, session, load]);

  const toggleStatus = useCallback(async (user: SchoolUser) => {
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
  }, [load]);

  const deleteUser = useCallback(async (user: SchoolUser) => {
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
  }, [load]);

  const getRoleBadge = useCallback((user: SchoolUser) => {
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
  }, [customRoles]);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: any = {
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </motion.div>
              
              <div>
                <h1 className={`text-2xl font-bold bg-gradient-to-r ${theme.gradients.primary} bg-clip-text text-transparent`}>
                  Users & Access Management
                </h1>
                <p className={`text-sm ${theme.text.secondary} mt-1`}>
                  Manage user accounts and permissions • {users.length} total users
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreate}
              className={`px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add User
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Users Grid */}
      {loading ? (
        <motion.div
          variants={itemVariants}
          className={`text-center py-12 rounded-2xl border border-dashed ${theme.border} ${theme.card}`}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={`mx-auto h-12 w-12 ${isDark ? 'text-teal-400' : 'text-teal-500'}`}
          >
            <svg fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.div>
          <p className={`mt-4 text-sm font-medium ${theme.text.secondary}`}>Loading users...</p>
        </motion.div>
      ) : users.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className={`text-center py-12 rounded-2xl border border-dashed ${theme.border} ${theme.card}`}
        >
          <div className={`mx-auto h-12 w-12 ${isDark ? 'text-teal-400' : 'text-teal-500'}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className={`mt-4 text-lg font-medium ${theme.text.primary}`}>No users found</h3>
          <p className={`mt-2 text-sm ${theme.text.secondary}`}>Get started by adding your first user</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openCreate}
            className={`mt-4 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl transition-all`}
          >
            Add First User
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="grid gap-4"
        >
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`group relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              {/* Gradient Accent */}
              <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradients.primary} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
              
              <div className="relative p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* User Avatar */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`relative w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${
                        user.isActive 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                          : isDark ? 'bg-gray-700' : 'bg-gray-200'
                      } shadow-lg`}
                    >
                      <svg className={`w-6 h-6 text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {/* Status Indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${theme.bg} ${
                        user.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </motion.div>
                    
                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-base font-semibold ${theme.text.primary} truncate`}>
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className={`text-sm ${theme.text.secondary} truncate`}>
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getRoleBadge(user)}
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${
                          user.isActive 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEdit(user)}
                      className={`p-2 rounded-xl ${theme.hover} ${theme.text.secondary} transition-colors`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleStatus(user)}
                      className={`p-2 rounded-xl ${
                        user.isActive 
                          ? 'hover:bg-orange-500/20 text-orange-400'
                          : 'hover:bg-green-500/20 text-green-400'
                      } transition-colors`}
                    >
                      {user.isActive ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteUser(user)}
                      className={`p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* User Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${theme.bg} border ${theme.border}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b ${theme.border} bg-gradient-to-r ${theme.gradients.primary} bg-opacity-10`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${theme.gradients.primary} shadow-lg`}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </motion.div>
                    <div>
                      <h3 className={`text-lg font-semibold ${theme.text.primary}`}>
                        {editingUser ? 'Edit User' : 'Create New User'}
                      </h3>
                      <p className={`text-sm ${theme.text.secondary}`}>
                        {editingUser ? 'Update user information and permissions' : 'Add a new user to the system'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowForm(false)}
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
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.text.primary}`}>
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${theme.input}`}
                      placeholder="user@example.com"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme.text.primary}`}>
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.firstName}
                        onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${theme.input}`}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme.text.primary}`}>
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={form.lastName}
                        onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${theme.input}`}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.text.primary}`}>
                      Base Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${theme.input}`}
                    >
                      {BASE_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.text.primary}`}>
                      Custom Role Permissions
                    </label>
                    {customRoles.length > 0 ? (
                      <div className={`p-4 rounded-xl border ${theme.border} ${theme.card}`}>
                        <div className="space-y-3">
                          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            !form.customRoleId
                              ? 'border-teal-500 bg-teal-500/10'
                              : theme.hover
                          }`}>
                            <input
                              type="radio"
                              name="customRole"
                              checked={!form.customRoleId}
                              onChange={() => setForm(f => ({ ...f, customRoleId: '' }))}
                              className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                            />
                            <div className="flex-1">
                              <div className={`text-sm font-medium ${theme.text.primary}`}>
                                Base Role Only
                              </div>
                              <div className={`text-xs ${theme.text.secondary}`}>
                                No additional custom permissions
                              </div>
                            </div>
                          </label>
                          {customRoles.map((role, index) => (
                            <label key={role.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              form.customRoleId === role.id
                                ? 'border-teal-500 bg-teal-500/10'
                                : theme.hover
                            }`}>
                              <input
                                type="radio"
                                name="customRole"
                                checked={form.customRoleId === role.id}
                                onChange={() => setForm(f => ({ ...f, customRoleId: role.id }))}
                                className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                              />
                              <div className="flex-1">
                                <div className={`text-sm font-medium ${theme.text.primary}`}>
                                  {role.name}
                                </div>
                                <div className={`text-xs ${theme.text.secondary}`}>
                                  {role.description || 'Custom permissions applied'}
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-[10px] font-semibold rounded-full border ${getRoleColor(index)}`}>
                                Custom
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={`p-6 rounded-xl border border-dashed ${theme.border} ${theme.card}`}>
                        <div className="text-center">
                          <svg className={`mx-auto h-10 w-10 ${theme.text.secondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <p className={`mt-2 text-sm font-medium ${theme.text.primary}`}>
                            No Custom Roles Available
                          </p>
                          <p className={`text-xs ${theme.text.secondary} mt-1`}>
                            Create custom roles first to assign additional permissions
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.text.primary}`}>
                      Password {editingUser && <span className={`text-xs ${theme.text.muted}`}>(leave blank to keep current)</span>}
                      {!editingUser && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${theme.input}`}
                      placeholder={editingUser ? '••••••••' : 'Enter secure password'}
                    />
                  </div>
                  
                  <div className={`p-4 rounded-xl border ${theme.border} ${theme.card}`}>
                    <label className={`flex items-center gap-3 cursor-pointer`}>
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={form.isActive}
                        onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <span className={`text-sm font-medium ${theme.text.primary}`}>
                          Active Account
                        </span>
                        <p className={`text-xs ${theme.text.secondary}`}>
                          User can login and access the system
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className={`px-6 py-4 border-t ${theme.border} ${theme.card}`}>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={save} 
                    disabled={saving}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${theme.gradients.primary} text-white shadow-lg hover:shadow-xl`}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
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
                        {editingUser ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {editingUser ? 'Update User' : 'Create User'}
                      </span>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowForm(false)} 
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
