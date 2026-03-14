'use client';

import React, { useState, useEffect } from 'react';
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

  const card = (label: string, value: string | number, icon: string, color: string) => (
    <div className={`rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-gradient-to-br ${color} text-white`}>{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
    </div>
  );

  if (loading) {
    return <div className={`text-center py-20 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-center py-20 text-red-400">Failed to load stats</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Platform Dashboard</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Overview of your SaaS platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {card('Total Schools', stats.totalSchools, '🏫', 'from-blue-500 to-cyan-500')}
        {card('Active Schools', stats.activeSchools, '✅', 'from-green-500 to-emerald-500')}
        {card('Total Users', stats.totalUsers, '👥', 'from-purple-500 to-pink-500')}
        {card('Total Students', stats.totalStudents, '🎓', 'from-orange-500 to-red-500')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subscriptions by Plan */}
        <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Subscriptions by Plan</h3>
          <div className="space-y-3">
            {Object.entries(stats.subscriptionsByPlan || {}).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className={`text-sm capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{plan}</span>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                }`}>{count as number}</span>
              </div>
            ))}
            {Object.keys(stats.subscriptionsByPlan || {}).length === 0 && (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No subscriptions yet</p>
            )}
          </div>
        </div>

        {/* Subscriptions by Status */}
        <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Subscriptions by Status</h3>
          <div className="space-y-3">
            {Object.entries(stats.subscriptionsByStatus || {}).map(([status, count]) => {
              const colors: Record<string, string> = {
                trial: 'bg-blue-500/20 text-blue-400',
                active: 'bg-green-500/20 text-green-400',
                expired: 'bg-red-500/20 text-red-400',
                cancelled: 'bg-gray-500/20 text-gray-400',
                past_due: 'bg-yellow-500/20 text-yellow-400',
              };
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className={`text-sm capitalize px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>{status}</span>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count as number}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {card('Demo Schools', stats.demoSchools, '🎪', 'from-yellow-500 to-orange-500')}
        {card('Teachers', stats.totalTeachers, '👩‍🏫', 'from-teal-500 to-cyan-500')}
        {card('Subscriptions', stats.totalSubscriptions, '📋', 'from-indigo-500 to-purple-500')}
        {card('Blocked', (stats.totalSchools - stats.activeSchools), '🚫', 'from-red-500 to-pink-500')}
      </div>
    </div>
  );
}
