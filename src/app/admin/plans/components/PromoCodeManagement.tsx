'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount: number | null;
  applicablePlans: string;
  usageLimit: number | null;
  usageCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  isExhausted: boolean;
  isExpired: boolean;
}

interface PlanFromDB {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxStudents: number;
  maxTeachers: number;
  features: string;
  isActive: boolean;
  trialDays: number;
  sortOrder: number;
}

interface PromoCodeManagementProps {
  theme: 'dark' | 'light';
}

export default function PromoCodeManagement({ theme }: PromoCodeManagementProps) {
  const isDark = theme === 'dark';
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alerts, setAlerts] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    exhausted: 0
  });
  const [availablePlans, setAvailablePlans] = useState<PlanFromDB[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    maxDiscountAmount: '',
    applicablePlans: 'all',
    customPlans: [] as string[],
    usageLimit: '',
    validFrom: '',
    validTo: ''
  });

  useEffect(() => {
    loadPromoCodes();
    loadAlerts();
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch('/api/admin/plans?cache=true');
      if (res.ok) {
        const data = await res.json();
        setAvailablePlans((data.plans || []).filter((p: PlanFromDB) => p.isActive));
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadPromoCodes = async () => {
    try {
      const res = await fetch('/api/admin/promo-codes');
      if (res.ok) {
        const data = await res.json();
        setPromoCodes(data.promoCodes || []);
        calculateStats(data.promoCodes || []);
      } else {
        setError('Failed to load promo codes');
      }
    } catch (err) {
      setError('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/admin/promo-codes/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const calculateStats = (promos: PromoCode[]) => {
    const now = new Date();
    const stats = {
      total: promos.length,
      active: promos.filter(p => p.isActive && new Date(p.validFrom) <= now && new Date(p.validTo) >= now).length,
      expired: promos.filter(p => new Date(p.validTo) < now).length,
      exhausted: promos.filter(p => p.usageLimit && p.usageCount >= p.usageLimit).length
    };
    setStats(stats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        applicablePlans: formData.applicablePlans === 'all' ? 'all' : formData.customPlans
      };

      const url = editingPromo ? '/api/admin/promo-codes' : '/api/admin/promo-codes';
      const method = editingPromo ? 'PUT' : 'POST';

      const body = editingPromo ? { ...payload, id: editingPromo.id } : payload;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await loadPromoCodes();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to save promo code:', error);
      alert('Failed to save promo code');
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingPromo(code);
    setFormData({
      code: code.code,
      description: code.description || '',
      discountType: code.discountType,
      discountValue: code.discountValue.toString(),
      maxDiscountAmount: code.maxDiscountAmount?.toString() || '',
      applicablePlans: code.applicablePlans === 'all' ? 'all' : 'custom',
      customPlans: code.applicablePlans === 'all' ? [] : JSON.parse(code.applicablePlans),
      usageLimit: code.usageLimit?.toString() || '',
      validFrom: new Date(code.validFrom).toISOString().slice(0, 16),
      validTo: new Date(code.validTo).toISOString().slice(0, 16)
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const response = await fetch(`/api/admin/promo-codes?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadPromoCodes();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to delete promo code:', error);
      alert('Failed to delete promo code');
    }
  };

  const handleCleanup = async () => {
    setLoadingData(true);
    try {
      const response = await fetch('/api/admin/promo-codes/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deactivate_expired' })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Cleanup completed: ${result.message}`);
        await loadPromoCodes();
        await loadAlerts();
      } else {
        const error = await response.json();
        alert(error.error || 'Cleanup failed');
      }
    } catch (error) {
      console.error('Failed to cleanup promo codes:', error);
      alert('Failed to cleanup promo codes');
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      maxDiscountAmount: '',
      applicablePlans: 'all',
      customPlans: [],
      usageLimit: '',
      validFrom: '',
      validTo: ''
    });
    setEditingPromo(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className={card + ' p-6'}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${card} p-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${isDark ? 'text-white' : 'text-gray-900'}`}>🎁 Promo Code Management</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Create and manage subscription discount codes</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCleanup}
            disabled={loadingData}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              loadingData 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {loadingData ? 'Cleaning...' : '🧹 Cleanup'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className={btnPrimary}
          >
            + Create Promo Code
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Codes</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-green-700/30' : 'bg-green-50'}`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{stats.active}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-red-700/30' : 'bg-red-50'}`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{stats.expired}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Expired</div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-yellow-700/30' : 'bg-yellow-50'}`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.exhausted}</div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Exhausted</div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts && (alerts.expiringSoon.length > 0 || alerts.lowUsage.length > 0) && (
        <div className={`space-y-4 ${card} p-6`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>🚨 Alerts</h3>
          
          {alerts.expiringSoon.length > 0 && (
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-yellow-900/20 border-yellow-600/30' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500">⏰</span>
                <h4 className={`font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>Expiring Soon ({alerts.expiringSoon.length})</h4>
              </div>
              <div className="space-y-1">
                {alerts.expiringSoon.map((alert: any) => (
                  <div key={alert.id} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="font-mono">{alert.code}</span> - Expires {new Date(alert.validTo).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {alerts.lowUsage.length > 0 && (
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-orange-900/20 border-orange-600/30' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-500">📊</span>
                <h4 className={`font-semibold ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Low Usage ({alerts.lowUsage.length})</h4>
              </div>
              <div className="space-y-1">
                {alerts.lowUsage.map((alert: any) => (
                  <div key={alert.id} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="font-mono">{alert.code}</span> - {alert.remaining} uses remaining
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Promo Codes Table */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
        <div className={`overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <table className="w-full">
            <thead className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Discount</th>
                <th className="px-4 py-3 text-left">Plans</th>
                <th className="px-4 py-3 text-left">Usage</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Valid Until</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-600 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
              {promoCodes.map((code) => (
                <tr key={code.id} className={`hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-blue-600">{code.code}</div>
                    {code.description && (
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{code.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {code.discountType === 'percentage' ? `${code.discountValue}%` : `₹${code.discountValue}`}
                    </div>
                    {code.maxDiscountAmount && (
                      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Max: ₹{code.maxDiscountAmount}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${code.applicablePlans === 'all' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {code.applicablePlans === 'all' ? 'All Plans' : 'Custom'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {code.usageCount}{code.usageLimit ? `/${code.usageLimit}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      code.isActive && !code.isExpired && !code.isExhausted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {code.isActive && !code.isExpired && !code.isExhausted ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(code.validTo).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(code)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No promo codes created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col ${card}`}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
              </h2>
              <button
                onClick={resetForm}
                className={`p-3 rounded-xl transition-all hover:scale-105 ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Promo Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className={input}
                    placeholder="WELCOME20"
                    required
                    disabled={!!editingPromo}
                  />
                </div>

                <div>
                  <label className={label}>Description (Optional)</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={input}
                    placeholder="Welcome discount for new schools"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={label}>Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value as 'percentage' | 'fixed'})}
                    className={input}
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className={label}>Discount Value</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    className={input}
                    placeholder={formData.discountType === 'percentage' ? "20" : "1000"}
                    min="0"
                    step={formData.discountType === 'percentage' ? "0.01" : "1"}
                    required
                  />
                </div>

                {formData.discountType === 'percentage' && (
                  <div>
                    <label className={label}>Max Discount Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({...formData, maxDiscountAmount: e.target.value})}
                      className={input}
                      placeholder="5000"
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={label}>Applicable Plans</label>
                <div className="space-y-2">
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="all"
                        checked={formData.applicablePlans === 'all'}
                        onChange={(e) => setFormData({...formData, applicablePlans: e.target.value})}
                        className="mr-2"
                      />
                      All Plans
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="custom"
                        checked={formData.applicablePlans === 'custom'}
                        onChange={(e) => setFormData({...formData, applicablePlans: e.target.value})}
                        className="mr-2"
                      />
                      Custom Plans
                    </label>
                  </div>

                  {formData.applicablePlans === 'custom' && (
                    <div className="flex flex-wrap gap-2">
                      {loadingPlans ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                          Loading plans...
                        </div>
                      ) : availablePlans.length > 0 ? (
                        availablePlans.map(plan => (
                          <label key={plan.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.customPlans.includes(plan.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({...formData, customPlans: [...formData.customPlans, plan.name]});
                                } else {
                                  setFormData({...formData, customPlans: formData.customPlans.filter(p => p !== plan.name)});
                                }
                              }}
                              className="mr-2"
                            />
                            {plan.displayName}
                          </label>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No active plans available</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>Usage Limit (Optional)</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    className={input}
                    placeholder="100"
                    min="1"
                  />
                </div>

                <div>
                  <label className={label}>Valid From</label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                    className={input}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={label}>Valid To</label>
                <input
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={(e) => setFormData({...formData, validTo: e.target.value})}
                  className={input}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className={btnPrimary}>
                  {editingPromo ? 'Update Code' : 'Create Code'}
                </button>
                <button type="button" onClick={resetForm} className={btnSecondary}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
