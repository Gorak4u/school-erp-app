'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface School {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    trialEndsAt: string | null;
    maxStudents: number;
    maxTeachers: number;
  } | null;
  _count: { users: number; students: number; teachers: number };
}

export default function AdminSchoolsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [extendDays, setExtendDays] = useState<Record<string, number>>({});

  const load = () => {
    setLoading(true);
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(d => setSchools(d.schools || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const doAction = async (schoolId: string, action: string, extra?: any) => {
    setActionLoading(schoolId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/schools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: schoolId, action, ...extra }),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      load();
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = schools.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      trial: 'bg-blue-500/20 text-blue-400',
      active: 'bg-green-500/20 text-green-400',
      expired: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-gray-500/20 text-gray-400',
      past_due: 'bg-yellow-500/20 text-yellow-400',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>{status}</span>;
  };

  const cardCls = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;
  const inputCls = `px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`;
  const btnCls = (color: string) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${color}`;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Schools</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{schools.length} registered schools</p>
        </div>
        <input className={`${inputCls} w-64`} placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(school => (
            <div key={school.id} className={`${cardCls} p-5`}>
              <div className="flex items-start justify-between gap-4">
                {/* School Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{school.name}</h3>
                    {school.isDemo && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">DEMO</span>}
                    {!school.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">BLOCKED</span>}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {school.email} · {school.city || '—'}, {school.state || '—'} · /{school.slug}
                  </div>
                  <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span>{school._count.users} users</span>
                    <span>{school._count.students} students</span>
                    <span>{school._count.teachers} teachers</span>
                    <span>Joined {new Date(school.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Subscription */}
                <div className="text-right flex-shrink-0">
                  {school.subscription ? (
                    <>
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <span className={`text-sm font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{school.subscription.plan}</span>
                        {statusBadge(school.subscription.status)}
                      </div>
                      {school.subscription.trialEndsAt && (
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Trial ends: {new Date(school.subscription.trialEndsAt).toLocaleDateString()}
                        </div>
                      )}
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {school.subscription.maxStudents} students / {school.subscription.maxTeachers} teachers limit
                      </div>
                    </>
                  ) : (
                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No subscription</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={`flex items-center gap-2 mt-4 pt-3 border-t flex-wrap ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                {school.isActive ? (
                  <button onClick={() => doAction(school.id, 'block')} disabled={actionLoading === school.id}
                    className={btnCls(isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100')}>
                    Block School
                  </button>
                ) : (
                  <button onClick={() => doAction(school.id, 'unblock')} disabled={actionLoading === school.id}
                    className={btnCls(isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100')}>
                    Unblock School
                  </button>
                )}

                {school.subscription?.status === 'trial' && (
                  <div className="flex items-center gap-1">
                    <input type="number" min="1" max="365" placeholder="30"
                      className={`${inputCls} w-16 text-center`}
                      value={extendDays[school.id] || ''}
                      onChange={e => setExtendDays(p => ({ ...p, [school.id]: Number(e.target.value) }))} />
                    <button onClick={() => doAction(school.id, 'extend_trial', { days: extendDays[school.id] || 30 })}
                      disabled={actionLoading === school.id}
                      className={btnCls(isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100')}>
                      Extend Trial
                    </button>
                  </div>
                )}

                <select
                  className={`${inputCls} text-xs`}
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) doAction(school.id, 'change_plan', { plan: e.target.value });
                    e.target.value = '';
                  }}>
                  <option value="" disabled>Change Plan...</option>
                  <option value="trial">Trial</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No schools found</div>
          )}
        </div>
      )}
    </div>
  );
}
