'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  // Change Password state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPwForm, setShowPwForm] = useState(false);

  const isDark = theme === 'dark';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Password changed successfully!' });
        setPwForm({ current: '', newPw: '', confirm: '' });
        setShowPwForm(false);
      } else {
        setPwMsg({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPwLoading(false);
    }
  };

  const firstName = (user as any)?.firstName || (user as any)?.name?.split(' ')[0] || '';
  const lastName = (user as any)?.lastName || (user as any)?.name?.split(' ').slice(1).join(' ') || '';
  const email = user?.email || '';
  const role = (user as any)?.role || 'user';
  const initials = (firstName[0] || 'U').toUpperCase();

  return (
    <AppLayout 
      currentPage="profile" 
      title="Profile"
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Profile
          </h2>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your personal information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className={`rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="p-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl font-bold">{initials}</span>
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {firstName} {lastName}
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </p>
                {user?.employeeId && user.role === 'teacher' && (
                  <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    theme === 'dark' ? 'bg-indigo-600/20 text-indigo-200' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    <span>Employee ID:</span>
                    <span className="font-mono tracking-wide">{user.employeeId}</span>
                  </div>
                )}
                <button className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}>
                  Change Photo
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  First Name
                </label>
                <input
                  type="text"
                  defaultValue={firstName}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Last Name
                </label>
                <input
                  type="text"
                  defaultValue={lastName}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={email}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              {user?.employeeId && user.role === 'teacher' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={user.employeeId}
                    readOnly
                    className={`w-full px-3 py-2 rounded-lg border font-mono tracking-wide ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-indigo-600/40 text-indigo-200'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    This ID is auto-generated for staff accounts and is used for login and records.
                  </p>
                </div>
              )}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone
                </label>
                <input
                  type="tel"
                  defaultValue="+1 234 567 8900"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Bio
                </label>
                <textarea
                  rows={3}
                  defaultValue="Experienced school administrator with a passion for education technology."
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}>
                Cancel
              </button>
              <button
                onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
              }`}>
                {saved ? '✅ Saved!' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className={`rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Password & Security</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Update your password to keep your account secure</p>
              </div>
              <button
                onClick={() => { setShowPwForm(!showPwForm); setPwMsg(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isDark ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}>
                {showPwForm ? 'Cancel' : '🔑 Change Password'}
              </button>
            </div>

            {pwMsg && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${
                pwMsg.type === 'success'
                  ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-700'
                  : isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-700'
              }`}>{pwMsg.text}</div>
            )}

            {showPwForm && (
              <form onSubmit={handleChangePassword} className="space-y-4 mt-2">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Current Password</label>
                  <input
                    type="password"
                    value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                    required
                    placeholder="Enter your current password"
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
                    <input
                      type="password"
                      value={pwForm.newPw}
                      onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                      required
                      placeholder="Min. 6 characters"
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Confirm New Password</label>
                    <input
                      type="password"
                      value={pwForm.confirm}
                      onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                      required
                      placeholder="Repeat new password"
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
                      } ${pwForm.confirm && pwForm.confirm !== pwForm.newPw ? 'border-red-500' : ''}`}
                    />
                    {pwForm.confirm && pwForm.confirm !== pwForm.newPw && (
                      <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={pwLoading}
                    className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                      pwLoading ? 'opacity-50 cursor-not-allowed' : ''
                    } ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            {!showPwForm && !pwMsg && (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Last changed: unknown · <a href="/forgot-password" className="text-blue-400 hover:underline">Forgot your password?</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
