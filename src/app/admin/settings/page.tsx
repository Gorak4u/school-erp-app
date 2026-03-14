'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminSettingsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState('');

  // Change Password
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPwForm, setShowPwForm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (pwForm.newPw.length < 6) { setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
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
      setPwMsg({ type: 'error', text: 'Network error' });
    } finally {
      setPwLoading(false);
    }
  };

  const cardCls = `rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const valueCls = `text-sm font-mono px-3 py-2 rounded-lg ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const envVars = [
    {
      key: 'SUPER_ADMIN_EMAILS',
      description: 'Comma-separated list of emails with platform super-admin access. Only these users can access /admin pages.',
      howToChange: 'Edit .env file → SUPER_ADMIN_EMAILS="email1@example.com,email2@example.com" → Restart the server',
    },
    {
      key: 'NEXTAUTH_SECRET',
      description: 'Secret key for JWT token signing. Must be a strong random string in production.',
      howToChange: 'Edit .env file → NEXTAUTH_SECRET="your-secret" → Restart the server',
    },
    {
      key: 'DATABASE_URL',
      description: 'PostgreSQL database connection string (Neon).',
      howToChange: 'Edit .env file → DATABASE_URL="postgresql://..." → Run prisma migrate → Restart',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Platform Settings</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Core platform configuration. These settings are managed via environment variables.
        </p>
      </div>

      {/* Environment Variables Reference */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Environment Variables</h3>
        <div className="space-y-5">
          {envVars.map(v => (
            <div key={v.key}>
              <div className="flex items-center gap-2 mb-1">
                <code className={`text-sm font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{v.key}</code>
                <button onClick={() => copyToClipboard(v.key, v.key)}
                  className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                  {copied === v.key ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{v.description}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                <strong>How to change:</strong> {v.howToChange}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Access Management */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Super Admin Access</h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Super admins are platform owners who can manage all schools, users, plans, and payment configuration.
          Regular school admins only see their own school&apos;s settings.
        </p>
        <div className={`${valueCls} mb-4`}>
          <label className={labelCls}>Current Super Admin Emails</label>
          <p className="mt-1">Defined in <code>.env</code> → <code>SUPER_ADMIN_EMAILS</code></p>
          <p className={`text-xs mt-2 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>
            To add/remove super admins, edit the .env file and restart the server.
          </p>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Access Control Architecture</h3>
        <div className="space-y-3">
          {[
            { role: 'Super Admin (Platform Owner)', access: '/admin/* — Manage all schools, users, plans, payments, platform config', color: 'orange' },
            { role: 'School Admin', access: '/settings, /dashboard — Manage their own school settings, users, students', color: 'purple' },
            { role: 'Teacher', access: '/dashboard, /students, /attendance, /exams — Teaching tools and class management', color: 'blue' },
            { role: 'Student', access: '/dashboard — View grades, attendance, assignments', color: 'green' },
            { role: 'Parent', access: '/dashboard — View child\'s progress and fees', color: 'teal' },
          ].map(r => (
            <div key={r.role} className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
              <span className={`text-xs px-2 py-1 rounded-full font-medium bg-${r.color}-500/20 text-${r.color}-400 whitespace-nowrap`}>
                {r.role}
              </span>
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{r.access}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: 'Razorpay Dashboard', url: 'https://dashboard.razorpay.com', icon: '💳' },
            { label: 'Neon DB Console', url: 'https://console.neon.tech', icon: '🗄️' },
            { label: 'NextAuth Docs', url: 'https://next-auth.js.org', icon: '🔐' },
            { label: 'Prisma Studio', url: 'http://localhost:5555', icon: '📊' },
          ].map(link => (
            <a key={link.label} href={link.url} target="_blank" rel="noreferrer"
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isDark ? 'bg-gray-800/50 hover:bg-gray-800 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}>
              <span>{link.icon}</span>
              <span className="text-sm font-medium">{link.label}</span>
              <span className={`ml-auto text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>↗</span>
            </a>
          ))}
        </div>
      </div>
      {/* Change Password — Super Admin */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Super Admin Password</h3>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Change the password for your super admin account</p>
          </div>
          <button onClick={() => { setShowPwForm(!showPwForm); setPwMsg(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isDark ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
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

        {showPwForm ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className={labelCls}>Current Password</label>
              <input type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                required placeholder="Enter current password"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                  isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>New Password</label>
                <input type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                  required placeholder="Min. 6 characters"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`} />
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  required placeholder="Repeat new password"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900'
                  } ${pwForm.confirm && pwForm.confirm !== pwForm.newPw ? 'border-red-500' : ''}`} />
                {pwForm.confirm && pwForm.confirm !== pwForm.newPw && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pwLoading}
                className={`px-6 py-2 rounded-lg font-medium text-sm bg-orange-600 hover:bg-orange-500 text-white transition-all ${
                  pwLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        ) : (
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Use a strong password. Forgot it?{' '}
            <a href="/forgot-password" className="text-orange-400 hover:underline">Reset via email →</a>
          </p>
        )}
      </div>
    </div>
  );
}
