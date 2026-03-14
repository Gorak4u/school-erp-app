'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

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

export default function AdminPlansPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(d.plans || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const savePlan = async (plan: PlanData) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Plan "${plan.displayName}" updated!` });
        setEditingPlan(null);
        load();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-orange-500`;
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  const cardCls = `rounded-xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Plans & Pricing</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Edit pricing, limits, and features. Changes apply to new subscriptions immediately.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => (
            <div key={plan.id} className={cardCls}>
              {editingPlan?.id === plan.id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Editing: {plan.displayName}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => savePlan(editingPlan)} disabled={saving}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg font-medium">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditingPlan(null)}
                        className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg font-medium">Cancel</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Display Name</label>
                      <input className={inputCls} value={editingPlan.displayName}
                        onChange={e => setEditingPlan({ ...editingPlan, displayName: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelCls}>Monthly Price (INR)</label>
                      <input className={inputCls} type="number" value={editingPlan.priceMonthly}
                        onChange={e => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className={labelCls}>Yearly Price (INR)</label>
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
                    <div className="md:col-span-3">
                      <label className={labelCls}>Description</label>
                      <input className={inputCls} value={editingPlan.description}
                        onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} />
                    </div>
                    <div className="md:col-span-3">
                      <label className={labelCls}>Features (JSON array)</label>
                      <textarea className={`${inputCls} min-h-[60px]`} value={editingPlan.features}
                        onChange={e => setEditingPlan({ ...editingPlan, features: e.target.value })} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.displayName}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${plan.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{plan.description}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {plan.priceMonthly === 0 ? 'Free' : `₹${plan.priceMonthly.toLocaleString()}/mo`}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {plan.maxStudents >= 999999 ? '∞' : plan.maxStudents} students / {plan.maxTeachers >= 999999 ? '∞' : plan.maxTeachers} teachers
                      </div>
                    </div>
                    <button onClick={() => setEditingPlan({ ...plan })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
