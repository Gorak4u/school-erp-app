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
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [extendDays, setExtendDays] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSchools, setTotalSchools] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkPlan, setBulkPlan] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', pageSize.toString());
    if (search) params.append('search', search);
    if (filterPlan) params.append('plan', filterPlan);
    if (filterStatus) params.append('status', filterStatus);
    params.append('includeCounts', 'true');
    params.append('cache', 'true');
    
    Promise.all([
      fetch(`/api/admin/schools?${params}`).then(r => r.json()),
      fetch('/api/admin/plans?cache=true').then(r => r.json()),
    ]).then(([schoolsData, plansData]) => {
      setSchools(schoolsData.schools || []);
      setPlans((plansData.plans || []).filter((p: any) => p.isActive));
      
      // Handle pagination metadata
      if (schoolsData.pagination) {
        setTotalPages(schoolsData.pagination.totalPages);
        setTotalSchools(schoolsData.pagination.total);
      } else {
        // Fallback calculation
        const schoolCount = schoolsData.schools?.length || 0;
        setTotalPages(Math.max(1, Math.ceil(schoolCount / pageSize)));
        setTotalSchools(schoolCount);
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, pageSize, search, filterPlan, filterStatus]);

  const doAction = async (schoolId: string, action: string, extra?: any) => {
    if (action === 'delete') {
      // Show confirmation for individual delete
      setSelected(new Set([schoolId]));
      setBulkAction('delete');
      setShowDeleteConfirm(true);
      return;
    }
    
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
    
    // Show confirmation for delete action
    if (bulkAction === 'delete') {
      setShowDeleteConfirm(true);
      return;
    }
    
    executeBulkAction();
  };

  const executeBulkAction = async () => {
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
      if (res.ok) { setSelected(new Set()); setBulkAction(''); setShowDeleteConfirm(false); load(); }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'City', 'State', 'Status', 'Plan', 'Students', 'Teachers', 'Created'].join(','),
      ...schools.map(s => [
        `"${s.name}"`, s.email, s.phone || '', s.city || '', s.state || '', s.isActive ? 'Active' : 'Blocked',
        s.subscription?.plan || 'None', s._count.students, s._count.teachers, new Date(s.createdAt).toLocaleDateString()
      ].join(','))
    ];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    a.download = 'schools.csv'; a.click();
  };

  // Filter schools based on search and filters
  const filtered = schools.filter(school => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${school.name} ${school.email} ${school.city} ${school.state}`.toLowerCase().includes(q);
    const matchStatus = !filterStatus || (
      filterStatus === 'active' ? school.isActive && school.subscription?.status !== 'expired' :
      filterStatus === 'blocked' ? !school.isActive :
      filterStatus === 'trial' ? school.subscription?.status === 'trial' :
      filterStatus === 'expired' ? school.subscription?.status === 'expired' : true
    );
    const matchPlan = !filterPlan || school.subscription?.plan === filterPlan;
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
            {totalSchools} total · {schools.filter(s => s.isActive).length} active · {schools.filter(s => !s.isActive).length} blocked
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
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setPage(1); // Reset to first page when changing page size
              }}
              className={`px-2 py-1 rounded text-sm border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
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
            <option value="delete" style={{color: '#ef4444'}}>🗑️ Delete All (Permanent)</option>
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
                        <button onClick={() => doAction(school.id, 'delete')} disabled={actionLoading === school.id}
                          className={btnCls('bg-red-600 text-white hover:bg-red-700')}>
                          🗑️ Delete
                        </button>

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

          {/* Pagination */}
          {(totalPages > 1 || totalSchools > 0) && (
            <div className="flex items-center justify-between mt-6">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Page {page} of {totalPages} · {totalSchools} schools
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-blue-600 text-white' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ⚠️ Delete Schools Permanently?
            </h3>
            <div className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <p className="mb-2">You are about to delete <strong>{selected.size}</strong> school(s) and ALL their related data:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>All students and their records</li>
                <li>All teachers and their records</li>
                <li>All user accounts</li>
                <li>All subscriptions and payments</li>
                <li>All school data and settings</li>
              </ul>
              <p className="mt-3 text-red-500 font-medium">This action cannot be undone!</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={executeBulkAction}
                disabled={actionLoading === 'bulk'}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'bulk' ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
