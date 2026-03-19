'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';

interface PlanData {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxStudents: number;
  maxTeachers: number;
  features: string;
  isActive: boolean;
  sortOrder: number;
  trialDays: number;
}

const PLAN_GRADIENTS: Record<string, string> = {
  free:         'from-green-500 to-emerald-500',
  trial:        'from-gray-500 to-gray-600',
  basic:        'from-blue-500 to-cyan-500',
  professional: 'from-purple-500 to-indigo-500',
  enterprise:   'from-orange-500 to-red-500',
  unlimited:    'from-pink-500 to-rose-500',
};
const PLAN_ICONS: Record<string, string> = {
  free: '🆓', trial: '🆓', basic: '📦', professional: '⚡', enterprise: '🏢', unlimited: '♾️',
};

const ALL_FEATURES = [
  'attendance', 'fees', 'exams', 'assignments', 'timetable',
  'library', 'transport', 'hostel', 'hr', 'analytics',
  'sms', 'parent_portal', 'api_access', 'custom_domain', 'white_label',
];

const FEATURE_LABELS: Record<string, string> = {
  attendance: 'Attendance', fees: 'Fee Management', exams: 'Exams & Results',
  assignments: 'Assignments', timetable: 'Timetable', library: 'Library',
  transport: 'Transport', hostel: 'Hostel', hr: 'HR & Payroll',
  analytics: 'Analytics', sms: 'SMS Alerts', parent_portal: 'Parent Portal',
  api_access: 'API Access', custom_domain: 'Custom Domain', white_label: 'White Label',
};

export default function AdminPlansPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [subscriptionCounts, setSubscriptionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null);
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isCreating, setIsCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/plans?cache=true').then(r => r.json()),
      fetch('/api/admin/dashboard?period=30days&cache=true').then(r => r.json()),
    ]).then(([pData, dData]) => {
      setPlans(pData.plans || []);
      setSubscriptionCounts(dData.subscriptionsByPlan || {});
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (plan: PlanData) => {
    setEditingPlan({ ...plan });
    setIsCreating(false);
    try { setEditFeatures(JSON.parse(plan.features) || []); } catch { setEditFeatures([]); }
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingPlan({
      id: '',
      name: '',
      displayName: '',
      description: '',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'INR',
      maxStudents: 50,
      maxTeachers: 5,
      features: '[]',
      isActive: true,
      sortOrder: plans.length + 1,
      trialDays: 14,
    });
    setEditFeatures([]);
  };

  const savePlan = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const payload = { ...editingPlan, features: JSON.stringify(editFeatures) };
      const res = await fetch('/api/admin/plans', {
        method: isCreating ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast(`"${editingPlan.displayName}" ${isCreating ? 'created' : 'updated'}!`);
        setEditingPlan(null);
        setIsCreating(false);
        load();
      } else {
        showErrorToast('Error', data.error);
      }
    } catch {
      showErrorToast('Network Error', 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const seedDefaultPlans = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/plans/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        const createdCount = data.results.filter((r: any) => r.status === 'created').length;
        const existingCount = data.results.filter((r: any) => r.status === 'already_exists').length;
        showSuccessToast(`Seeded ${createdCount} new plans (${existingCount} already existed)`);
        load();
      } else {
        showErrorToast('Error', data.error);
      }
    } catch {
      showErrorToast('Network Error', 'Failed to seed plans');
    } finally {
      setSeeding(false);
    }
  };

  const deletePlan = async (plan: PlanData) => {
    if (!window.confirm(`Are you sure you want to delete "${plan.displayName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/plans?id=${plan.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showSuccessToast(`"${plan.displayName}" deleted successfully`);
        load();
      } else {
        if (data.code === 'FOREIGN_KEY_CONSTRAINT') {
          showErrorToast('Cannot Delete', data.details || 'Plan is in use by schools');
        } else {
          showErrorToast('Error', data.error || 'Failed to delete plan');
        }
      }
    } catch {
      showErrorToast('Network Error', 'Failed to delete plan');
    }
  };

  const toggleFeature = (f: string) =>
    setEditFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const totalMRR = plans.reduce((acc, p) => acc + (subscriptionCounts[p.name] || 0) * p.priceMonthly, 0);

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const cardCls = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Plans & Pricing</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage plan pricing, limits, and features. Changes apply to new subscriptions immediately.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={seedDefaultPlans} disabled={seeding}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 disabled:opacity-50">
            {seeding ? 'Seeding...' : '🌱 Seed Default Plans'}
          </button>
          <button onClick={startCreate}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90">
            + Create New Plan
          </button>
        </div>
        <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <button onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Monthly
          </button>
          <button onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Yearly
          </button>
        </div>
      </div>

      {/* MRR Summary */}
      <div className={`${cardCls} p-5`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total MRR</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ₹{totalMRR.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <button onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Monthly
        </button>
        <button onClick={() => setBillingCycle('yearly')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Yearly
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading plans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Create New Plan Form */}
            {isCreating && editingPlan && (
              <div className={`${cardCls} overflow-hidden ring-2 ring-green-500`}>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    <span className="text-white font-bold text-lg">New Plan</span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Plan Name (slug)</label>
                    <input type="text" value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      placeholder="e.g., premium" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Display Name</label>
                    <input type="text" value={editingPlan.displayName} onChange={e => setEditingPlan({ ...editingPlan, displayName: e.target.value })}
                      placeholder="e.g., Premium Plan" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <input type="text" value={editingPlan.description} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    placeholder="Short description" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Monthly Price (₹)</label>
                    <input type="number" value={editingPlan.priceMonthly} onChange={e => setEditingPlan({ ...editingPlan, priceMonthly: parseFloat(e.target.value) || 0 })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Yearly Price (₹)</label>
                    <input type="number" value={editingPlan.priceYearly} onChange={e => setEditingPlan({ ...editingPlan, priceYearly: parseFloat(e.target.value) || 0 })}
                      className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Max Students</label>
                    <input type="number" value={editingPlan.maxStudents} onChange={e => setEditingPlan({ ...editingPlan, maxStudents: parseInt(e.target.value) || 0 })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Max Teachers</label>
                    <input type="number" value={editingPlan.maxTeachers} onChange={e => setEditingPlan({ ...editingPlan, maxTeachers: parseInt(e.target.value) || 0 })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Trial Days</label>
                    <input type="number" value={editingPlan.trialDays} onChange={e => setEditingPlan({ ...editingPlan, trialDays: parseInt(e.target.value) || 0 })}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Features</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {ALL_FEATURES.map(f => (
                      <label key={f} className="flex items-center gap-2 cursor-pointer">
                        <span onClick={() => toggleFeature(f)}
                          className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${editFeatures.includes(f) ? 'bg-orange-500 border-orange-500 text-white' : isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                          {editFeatures.includes(f) ? '✓' : ''}
                        </span>
                        <span className="text-xs">{FEATURE_LABELS[f]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => { setEditingPlan(null); setIsCreating(false); }}
                    className={`px-4 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                    Cancel
                  </button>
                  <button onClick={savePlan} disabled={saving || !editingPlan.name || !editingPlan.displayName}
                    className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 disabled:opacity-50">
                    {saving ? 'Creating...' : '✓ Create Plan'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Existing Plans */}
          {plans.length === 0 && !isCreating && (
            <div className="col-span-full">
              <div className={`${cardCls} p-12 text-center`}>
                <div className="text-6xl mb-4">📦</div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  No Plans Found
                </h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                  Get started by seeding default plans or creating your first custom plan.
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={seedDefaultPlans} disabled={seeding}
                    className="px-6 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 disabled:opacity-50">
                    {seeding ? 'Seeding...' : '🌱 Seed Default Plans'}
                  </button>
                  <button onClick={startCreate}
                    className="px-6 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90">
                    + Create Custom Plan
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {plans.sort((a, b) => a.sortOrder - b.sortOrder).map(plan => {
            const gradient = PLAN_GRADIENTS[plan.name] || 'from-gray-500 to-gray-600';
            const icon = PLAN_ICONS[plan.name] || '📋';
            const subCount = subscriptionCounts[plan.name] || 0;
            let features: string[] = [];
            try { features = JSON.parse(plan.features) || []; } catch {}
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const isEditing = editingPlan?.id === plan.id;

            return (
              <div key={plan.id} className={`${cardCls} overflow-hidden ${isEditing ? 'ring-2 ring-orange-500' : ''}`}>
                {/* Card header */}
                <div className={`bg-gradient-to-r ${gradient} p-5`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{icon}</span>
                        <span className="text-white font-bold text-lg">{plan.displayName}</span>
                        {!plan.isActive && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Inactive</span>}
                      </div>
                      <p className="text-white/80 text-sm">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-2xl font-bold">
                        {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
                      </div>
                      <div className="text-white/70 text-xs">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                      👥 {subCount} subscriber{subCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                      🎓 {plan.maxStudents >= 999999 ? '∞' : plan.maxStudents} students
                    </span>
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                      ⏱ {plan.trialDays}d trial
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  {isEditing && editingPlan ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Display Name</label>
                          <input className={inputCls} value={editingPlan.displayName}
                            onChange={e => setEditingPlan({ ...editingPlan, displayName: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Description</label>
                          <input className={inputCls} value={editingPlan.description}
                            onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} />
                        </div>
                        <div>
                          <label className={labelCls}>Monthly Price (₹)</label>
                          <input className={inputCls} type="number" value={editingPlan.priceMonthly}
                            onChange={e => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className={labelCls}>Yearly Price (₹)</label>
                          <input className={inputCls} type="number" value={editingPlan.priceYearly}
                            onChange={e => setEditingPlan({ ...editingPlan, priceYearly: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className={labelCls}>Max Students</label>
                          <input className={inputCls} type="number" value={editingPlan.maxStudents}
                            onChange={e => setEditingPlan({ ...editingPlan, maxStudents: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className={labelCls}>Max Teachers</label>
                          <input className={inputCls} type="number" value={editingPlan.maxTeachers}
                            onChange={e => setEditingPlan({ ...editingPlan, maxTeachers: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className={labelCls}>Trial Days</label>
                          <input className={inputCls} type="number" value={editingPlan.trialDays}
                            onChange={e => setEditingPlan({ ...editingPlan, trialDays: Number(e.target.value) })} />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editingPlan.isActive}
                              onChange={e => setEditingPlan({ ...editingPlan, isActive: e.target.checked })} />
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Plan Active</span>
                          </label>
                        </div>
                      </div>

                      {/* Feature toggles */}
                      <div>
                        <label className={`${labelCls} mb-2`}>Features</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {ALL_FEATURES.map(f => (
                            <label key={f} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all ${
                              editFeatures.includes(f)
                                ? isDark ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-orange-50 border-orange-300 text-orange-700'
                                : isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
                            }`}>
                              <input type="checkbox" className="sr-only" checked={editFeatures.includes(f)} onChange={() => toggleFeature(f)} />
                              <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
                                editFeatures.includes(f) ? 'bg-orange-500 border-orange-500 text-white' : isDark ? 'border-gray-600' : 'border-gray-300'
                              }`}>
                                {editFeatures.includes(f) ? '✓' : ''}
                              </span>
                              <span className="text-xs">{FEATURE_LABELS[f]}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button onClick={() => setEditingPlan(null)}
                          className={`px-4 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                          Cancel
                        </button>
                        <button onClick={savePlan} disabled={saving}
                          className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:opacity-90 disabled:opacity-50">
                          {saving ? 'Saving...' : '✓ Save Plan'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Features list */}
                      <div className="flex flex-wrap gap-1.5">
                        {features.length > 0 ? features.map(f => (
                          <span key={f} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                            ✓ {FEATURE_LABELS[f] || f}
                          </span>
                        )) : (
                          <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No features configured</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-800/30">
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          MRR contribution: <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            ₹{(subCount * plan.priceMonthly).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(plan)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                            ✏ Edit Plan
                          </button>
                          <button onClick={() => deletePlan(plan)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30' : 'bg-red-100 hover:bg-red-200 text-red-600 border border-red-200'}`}>
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
  );
}
