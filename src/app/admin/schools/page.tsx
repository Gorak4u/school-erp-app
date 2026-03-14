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

interface PlanOption { name: string; displayName: string; }

function healthScore(school: School): { score: number; label: string; color: string } {
  let score = 0;
  if (school.isActive) score += 30;
  if (school._count.students > 0) score += 20;
  if (school._count.teachers > 0) score += 15;
  if (school._count.users > 1) score += 15;
  if (school.subscription?.status === 'active') score += 20;
  else if (school.subscription?.status === 'trial') score += 10;
  const label = score >= 80 ? 'Healthy' : score >= 50 ? 'Moderate' : 'At Risk';
  const color = score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  return { score, label, color };
}

export default function AdminSchoolsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [schools, setSchools] = useState<School[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [extendDays, setExtendDays] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkPlan, setBulkPlan] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/schools').then(r => r.json()),
      fetch('/api/admin/plans').then(r => r.json()),
    ]).then(([schoolsData, plansData]) => {
      setSchools(schoolsData.schools || []);
      setPlans((plansData.plans || []).filter((p: any) => p.isActive));
    }).catch(console.error)
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
      if (res.ok) load();
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  const doBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = Array.from(selected);
    setActionLoading('bulk');
    setMessage(null);
    try {
      const body: any = { id: ids[0], action: `bulk_${bulkAction}`, ids };
      if (bulkAction === 'change_plan') body.plan = bulkPlan;
      const res = await fetch('/api/admin/schools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMessage({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) { setSelected(new Set()); setBulkAction(''); load(); }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'City', 'State', 'Status', 'Plan', 'Students', 'Teachers', 'Users', 'Joined'].join(','),
      ...filtered.map(s => [
        `"${s.name}"`, s.email, s.city || '', s.state || '',
        s.isActive ? 'Active' : 'Blocked',
        s.subscription?.plan || 'None',
        s._count.students, s._count.teachers, s._count.users,
        new Date(s.createdAt).toLocaleDateString(),
      ].join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'schools.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = schools.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
    const matchStatus = !filterStatus || (
      filterStatus === 'active' ? s.isActive && s.subscription?.status !== 'expired' :
      filterStatus === 'blocked' ? !s.isActive :
      filterStatus === 'trial' ? s.subscription?.status === 'trial' :
      filterStatus === 'expired' ? s.subscription?.status === 'expired' : true
    );
    const matchPlan = !filterPlan || s.subscription?.plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  const allSelected = filtered.length > 0 && filtered.every(s => selected.has(s.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  const statusColors: Record<string, string> = {
    trial: 'bg-blue-500/20 text-blue-400',
    active: 'bg-green-500/20 text-green-400',
    expired: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
    past_due: 'bg-yellow-500/20 text-yellow-400',
  };

  const cardCls = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;
  const inputCls = `px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`;
  const btnCls = (color: string) => `px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${color}`;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Schools</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {schools.length} total · {schools.filter(s => s.isActive).length} active · {schools.filter(s => !s.isActive).length} blocked
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input className={`${inputCls} w-56`} placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className={`${inputCls}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="blocked">Blocked</option>
            <option value="expired">Expired</option>
          </select>
          <select className={`${inputCls}`} value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
            <option value="">All Plans</option>
            {plans.map(p => <option key={p.name} value={p.name}>{p.displayName}</option>)}
          </select>
          <button onClick={exportCSV} className={btnCls(isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
          <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{selected.size} selected</span>
          <select className={`${inputCls} text-xs`} value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
            <option value="">Bulk action...</option>
            <option value="block">Block All</option>
            <option value="unblock">Unblock All</option>
            <option value="change_plan">Change Plan</option>
          </select>
          {bulkAction === 'change_plan' && (
            <select className={`${inputCls} text-xs`} value={bulkPlan} onChange={e => setBulkPlan(e.target.value)}>
              <option value="">Select plan...</option>
              {plans.map(p => <option key={p.name} value={p.name}>{p.displayName}</option>)}
            </select>
          )}
          <button onClick={doBulkAction} disabled={actionLoading === 'bulk' || !bulkAction || (bulkAction === 'change_plan' && !bulkPlan)}
            className={btnCls('bg-blue-600 text-white hover:bg-blue-700')}>
            {actionLoading === 'bulk' ? 'Processing...' : 'Apply'}
          </button>
          <button onClick={() => setSelected(new Set())} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Clear</button>
        </div>
      )}

      {/* Results count */}
      {(search || filterStatus || filterPlan) && (
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Showing {filtered.length} of {schools.length} schools
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className={`h-28 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`} />)}
        </div>
      ) : (
        <>
          {/* Select all */}
          {filtered.length > 0 && (
            <div className={`flex items-center gap-2 px-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
              <span>Select all {filtered.length} schools on this page</span>
            </div>
          )}
          <div className="space-y-3">
            {filtered.map(school => {
              const health = healthScore(school);
              const trialEndsAt = school.subscription?.trialEndsAt ? new Date(school.subscription.trialEndsAt) : null;
              const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
              const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;

              return (
                <div key={school.id} className={`${cardCls} p-5 ${isExpiringSoon ? (isDark ? 'border-yellow-500/30' : 'border-yellow-300') : ''}`}>
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input type="checkbox" checked={selected.has(school.id)}
                      onChange={e => {
                        const next = new Set(selected);
                        e.target.checked ? next.add(school.id) : next.delete(school.id);
                        setSelected(next);
                      }} className="mt-1 rounded flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{school.name}</h3>
                            {school.isDemo && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">DEMO</span>}
                            {!school.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">BLOCKED</span>}
                            {isExpiringSoon && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">⚠ {daysLeft}d left</span>}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {school.email} · {school.city || '—'}, {school.state || '—'} · /{school.slug}
                          </div>
                          <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span>👥 {school._count.users}</span>
                            <span>🎓 {school._count.students}</span>
                            <span>👩‍🏫 {school._count.teachers}</span>
                            <span>Joined {new Date(school.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Right side: subscription + health */}
                        <div className="text-right flex-shrink-0 space-y-1">
                          {school.subscription ? (
                            <>
                              <div className="flex items-center gap-2 justify-end">
                                <span className={`text-sm font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{school.subscription.plan}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[school.subscription.status] || 'bg-gray-500/20 text-gray-400'}`}>{school.subscription.status}</span>
                              </div>
                              {trialEndsAt && (
                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  Trial: {trialEndsAt.toLocaleDateString()}
                                </div>
                              )}
                              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {school.subscription.maxStudents} stu / {school.subscription.maxTeachers} tea
                              </div>
                            </>
                          ) : (
                            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No subscription</span>
                          )}
                          {/* Health Score */}
                          <div className={`text-xs font-medium ${health.color}`}>
                            ● {health.label} ({health.score}/100)
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={`flex items-center gap-2 mt-4 pt-3 border-t flex-wrap ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        {school.isActive ? (
                          <button onClick={() => doAction(school.id, 'block')} disabled={actionLoading === school.id}
                            className={btnCls(isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100')}>
                            Block
                          </button>
                        ) : (
                          <button onClick={() => doAction(school.id, 'unblock')} disabled={actionLoading === school.id}
                            className={btnCls(isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100')}>
                            Unblock
                          </button>
                        )}

                        {(school.subscription?.status === 'trial' || school.subscription?.status === 'expired') && (
                          <div className="flex items-center gap-1">
                            <input type="number" min="1" max="365" placeholder="30"
                              className={`${inputCls} w-16 text-center py-1`}
                              value={extendDays[school.id] || ''}
                              onChange={e => setExtendDays(p => ({ ...p, [school.id]: Number(e.target.value) }))} />
                            <button onClick={() => doAction(school.id, 'extend_trial', { days: extendDays[school.id] || 30 })}
                              disabled={actionLoading === school.id}
                              className={btnCls(isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100')}>
                              Extend Trial
                            </button>
                          </div>
                        )}

                        <select className={`${inputCls} text-xs py-1`} defaultValue=""
                          onChange={e => { if (e.target.value) doAction(school.id, 'change_plan', { plan: e.target.value }); e.target.value = ''; }}>
                          <option value="" disabled>Change Plan...</option>
                          {plans.map(p => <option key={p.name} value={p.name}>{p.displayName}</option>)}
                        </select>

                        {actionLoading === school.id && (
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Saving...</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No schools found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
