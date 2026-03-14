'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const card = (label: string, value: string | number, icon: string, color: string, sub?: string) => (
    <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base bg-gradient-to-br ${color} shadow-lg`}>{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
      {sub && <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</div>}
    </div>
  );

  const cardCls = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className={`h-8 w-48 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className={`h-28 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />)}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-20 text-red-400">Failed to load stats</div>;
  }

  const statusColors: Record<string, string> = {
    trial: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    active: 'bg-green-500/20 text-green-400 border-green-500/20',
    expired: 'bg-red-500/20 text-red-400 border-red-500/20',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
    past_due: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Platform Dashboard</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Real-time overview of your SaaS platform</p>
        </div>
        <div className={`text-xs px-3 py-1.5 rounded-full border ${isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200'}`}>
          ● Live
        </div>
      </div>

      {/* Trial Expiry Alerts */}
      {stats.trialsExpiringSoon?.length > 0 && (
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-yellow-500 text-lg">⚠️</span>
            <span className={`font-semibold text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
              {stats.trialsExpiringSoon.length} trial{stats.trialsExpiringSoon.length > 1 ? 's' : ''} expiring within 7 days
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.trialsExpiringSoon.map((t: any) => (
              <Link key={t.schoolId} href="/admin/schools"
                className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' : 'bg-yellow-100 border-yellow-300 text-yellow-800'}`}>
                {t.schoolName} · {t.daysLeft}d left
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {card('MRR', stats.mrr > 0 ? `₹${stats.mrr.toLocaleString()}` : '₹0', '💰', 'from-green-500 to-emerald-500', 'Monthly Recurring Revenue')}
        {card('ARR', stats.arr > 0 ? `₹${stats.arr.toLocaleString()}` : '₹0', '📈', 'from-blue-500 to-cyan-500', 'Annual Recurring Revenue')}
        {card('Trial → Paid', `${stats.trialConversion}%`, '🔄', 'from-purple-500 to-pink-500', 'Conversion rate')}
        {card('Churn Rate', `${stats.churnRate}%`, '📉', 'from-red-500 to-orange-500', 'All-time')}
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {card('Total Schools', stats.totalSchools, '🏫', 'from-blue-500 to-indigo-500', `+${stats.newSchoolsThisMonth} this month`)}
        {card('Active Schools', stats.activeSchools, '✅', 'from-green-500 to-emerald-500', `${stats.blockedSchools} blocked`)}
        {card('Total Users', stats.totalUsers, '👥', 'from-purple-500 to-pink-500')}
        {card('Students', stats.totalStudents, '🎓', 'from-orange-500 to-red-500', `${stats.totalTeachers} teachers`)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plan Distribution */}
        <div className={`${cardCls} p-6`}>
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Plan Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.subscriptionsByPlan || {}).length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No subscriptions yet</p>
            ) : (
              Object.entries(stats.subscriptionsByPlan || {}).map(([plan, count]) => {
                const total = Object.values(stats.subscriptionsByPlan).reduce((a: any, b: any) => a + b, 0) as number;
                const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{plan}</span>
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count as number} ({pct}%)</span>
                    </div>
                    <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className={`${cardCls} p-6`}>
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Subscription Status</h3>
          <div className="space-y-2.5">
            {Object.entries(stats.subscriptionsByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`text-sm capitalize px-2 py-0.5 rounded-full border ${statusColors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/20'}`}>{status}</span>
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth */}
        <div className={`${cardCls} p-6`}>
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Growth</h3>
          <div className="space-y-4">
            <div>
              <div className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>New schools (7 days)</div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>+{stats.newSchoolsThisWeek}</div>
            </div>
            <div>
              <div className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>New schools (30 days)</div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>+{stats.newSchoolsThisMonth}</div>
            </div>
            <div>
              <div className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Demo schools</div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.demoSchools}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Signups */}
        <div className={`${cardCls} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Schools</h3>
            <Link href="/admin/schools" className={`text-xs ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>View all →</Link>
          </div>
          <div className="space-y-3">
            {(stats.recentSchools || []).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>🏫</div>
                  <div>
                    <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.name}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(s.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {s.subscription && (
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[s.subscription.status] || 'bg-gray-500/20 text-gray-400'}`}>
                      {s.subscription.plan}
                    </span>
                  )}
                  {!s.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">blocked</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className={`${cardCls} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Admin Actions</h3>
            <Link href="/admin/audit-logs" className={`text-xs ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>View all →</Link>
          </div>
          <div className="space-y-3">
            {(stats.recentAuditLogs || []).length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No admin actions yet</p>
            ) : (
              (stats.recentAuditLogs || []).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    log.action.includes('block') ? 'bg-red-400' :
                    log.action.includes('plan') ? 'bg-blue-400' :
                    log.action.includes('trial') ? 'bg-yellow-400' : 'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                      {log.targetName && <span className={isDark ? 'text-gray-500' : 'text-gray-400'}> · {log.targetName}</span>}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{log.actorEmail} · {new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`${cardCls} p-6`}>
        <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/admin/schools', label: 'Manage Schools', icon: '�', color: 'from-blue-500 to-indigo-500' },
            { href: '/admin/users', label: 'Manage Users', icon: '�', color: 'from-purple-500 to-pink-500' },
            { href: '/admin/plans', label: 'Edit Plans', icon: '💰', color: 'from-green-500 to-emerald-500' },
            { href: '/admin/announcements', label: 'Announcements', icon: '�', color: 'from-orange-500 to-red-500' },
            { href: '/admin/audit-logs', label: 'Audit Logs', icon: '🔍', color: 'from-gray-500 to-gray-600' },
            { href: '/admin/payments', label: 'Payment Config', icon: '�', color: 'from-teal-500 to-cyan-500' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r ${a.color} hover:opacity-90 transition-opacity shadow-sm`}>
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
