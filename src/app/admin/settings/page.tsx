'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminSettingsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState('');
  const [stats, setStats] = useState<any>(null);

  // Change Password
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPwForm, setShowPwForm] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    fetch('/api/admin/dashboard?period=30days&cache=true').then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

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
  const inputCls = `w-full px-3 py-2.5 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900'}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const envVars = [
    {
      key: 'SUPER_ADMIN_EMAILS',
      description: 'Comma-separated list of emails with platform super-admin access. Only these users can access /admin pages.',
      howToChange: 'Edit .env → SUPER_ADMIN_EMAILS="email1@example.com,email2@example.com" → Restart server',
      status: 'required',
    },
    {
      key: 'NEXTAUTH_SECRET',
      description: 'Secret key for JWT token signing. Must be a strong random string in production.',
      howToChange: 'Edit .env → NEXTAUTH_SECRET="strong-random-string" → Restart server',
      status: 'required',
    },
    {
      key: 'DATABASE_URL',
      description: 'PostgreSQL connection string (Neon). Used by Prisma for all DB operations.',
      howToChange: 'Edit .env → DATABASE_URL="postgresql://..." → Run prisma migrate → Restart',
      status: 'required',
    },
    {
      key: 'NEXTAUTH_URL',
      description: 'Full URL of the app. Required for OAuth redirects and email links.',
      howToChange: 'Edit .env → NEXTAUTH_URL="https://yourdomain.com" → Restart server',
      status: 'production',
    },
  ];

  const roles = [
    { role: 'Super Admin', icon: '👑', color: 'orange', access: '/admin/* — All schools, plans, billing, platform config' },
    { role: 'School Admin', icon: '🏫', color: 'purple', access: '/settings, /dashboard — Own school settings, users, students' },
    { role: 'Teacher', icon: '👩‍🏫', color: 'blue', access: '/students, /attendance, /exams, /assignments' },
    { role: 'Student', icon: '🎓', color: 'green', access: '/dashboard — Grades, attendance, assignments' },
    { role: 'Parent', icon: '👨‍👩‍👧', color: 'teal', access: '/dashboard — Child\'s progress and fees' },
  ];

  const quickLinks = [
    { label: 'Razorpay Dashboard', url: 'https://dashboard.razorpay.com', icon: '💳', desc: 'Manage payments & webhooks' },
    { label: 'Neon DB Console', url: 'https://console.neon.tech', icon: '🗄️', desc: 'Database admin & branching' },
    { label: 'NextAuth Docs', url: 'https://next-auth.js.org', icon: '🔐', desc: 'Auth configuration reference' },
    { label: 'Prisma Studio', url: 'http://localhost:5555', icon: '📊', desc: 'Visual DB data editor' },
    { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard', icon: '▲', desc: 'Deployment & logs' },
    { label: 'Prisma Docs', url: 'https://www.prisma.io/docs', icon: '📖', desc: 'ORM & schema reference' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Platform Settings</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Core configuration, access control, and developer tools
        </p>
      </div>

      {/* System Health */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🩺 System Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Database', status: stats ? 'Connected' : 'Checking...', ok: !!stats, icon: '🗄️' },
            { label: 'Auth', status: 'Active', ok: true, icon: '🔐' },
            { label: 'API', status: 'Operational', ok: true, icon: '⚡' },
            { label: 'Schools', status: stats ? `${stats.totalSchools} active` : '...', ok: !!stats, icon: '🏫' },
          ].map(item => (
            <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</p>
                <p className={`text-sm font-medium ${item.ok ? 'text-green-400' : 'text-yellow-400'}`}>{item.status}</p>
              </div>
            </div>
          ))}
        </div>
        {stats && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Schools', value: stats.totalSchools },
              { label: 'Users', value: stats.totalUsers },
              { label: 'Students', value: stats.totalStudents },
              { label: 'Teachers', value: stats.totalTeachers },
              { label: 'MRR', value: `₹${(stats.mrr || 0).toLocaleString()}` },
              { label: 'New (30d)', value: stats.newSchoolsThisMonth || 0 },
            ].map(s => (
              <div key={s.label} className={`p-3 rounded-xl text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Environment Variables */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>⚙️ Environment Variables</h3>
        <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>All sensitive config is managed via <code className="font-mono">.env</code> file. Never commit secrets to git.</p>
        <div className="space-y-4">
          {envVars.map(v => (
            <div key={v.key} className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <code className={`text-sm font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{v.key}</code>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  v.status === 'required' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>{v.status}</span>
                <button onClick={() => copyToClipboard(v.key, v.key)}
                  className={`text-xs px-2 py-0.5 rounded-lg ml-auto ${isDark ? 'bg-gray-700 text-gray-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200'}`}>
                  {copied === v.key ? '✓ Copied' : 'Copy key'}
                </button>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{v.description}</p>
              <p className={`text-xs mt-1.5 font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>→ {v.howToChange}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Access Control */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>🔐 Access Control Architecture</h3>
        <p className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Role-based access — each role has a distinct set of pages and permissions</p>
        <div className="space-y-2">
          {roles.map(r => (
            <div key={r.role} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <span className="text-xl w-8 text-center">{r.icon}</span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{r.role}</p>
                <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{r.access}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={`mt-4 p-3 rounded-xl text-xs ${isDark ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
          ⚠️ Super admin access is controlled via <code>SUPER_ADMIN_EMAILS</code> env var. To add/remove super admins, update <code>.env</code> and restart the server.
        </div>
      </div>

      {/* Quick Links */}
      <div className={cardCls}>
        <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🔗 Developer Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickLinks.map(link => (
            <a key={link.label} href={link.url} target="_blank" rel="noreferrer"
              className={`flex items-center gap-3 p-4 rounded-xl transition-all group ${
                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
              }`}>
              <span className="text-2xl">{link.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-gray-900'}`}>{link.label}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{link.desc}</p>
              </div>
              <span className={`text-xs ${isDark ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-300 group-hover:text-gray-500'}`}>↗</span>
            </a>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>🔑 Super Admin Password</h3>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Change the password for your super admin account</p>
          </div>
          <button onClick={() => { setShowPwForm(!showPwForm); setPwMsg(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isDark ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
            }`}>
            {showPwForm ? 'Cancel' : 'Change Password'}
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
                required placeholder="Enter current password" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>New Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={pwForm.newPw}
                    onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                    required placeholder="Min. 6 characters" className={inputCls} />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className={`absolute right-3 top-2.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  required placeholder="Repeat new password"
                  className={`${inputCls} ${pwForm.confirm && pwForm.confirm !== pwForm.newPw ? 'border-red-500' : ''}`} />
                {pwForm.confirm && pwForm.confirm !== pwForm.newPw && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pwLoading}
                className="px-6 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 disabled:opacity-50">
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        ) : (
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Use a strong password with letters, numbers, and symbols.{' '}
            <a href="/forgot-password" className="text-orange-400 hover:underline">Forgot password? →</a>
          </p>
        )}
      </div>
    </div>
  );
}
