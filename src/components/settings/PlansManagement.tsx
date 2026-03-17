'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxStudents: number;
  maxTeachers: number;
  features: string;
  isActive: boolean;
  sortOrder: number;
  trialDays: number;
  createdAt: string;
  updatedAt: string;
}

export default function PlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans/admin');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setMessage({ type: 'error', text: 'Failed to fetch plans' });
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultPlans = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/plans/seed-defaults', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `Seeded ${data.results.filter((r: any) => r.status === 'created').length} new plans` 
        });
        fetchPlans();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to seed plans' });
      }
    } catch (error) {
      console.error('Failed to seed plans:', error);
      setMessage({ type: 'error', text: 'Failed to seed plans' });
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async (planData: Partial<Plan>) => {
    try {
      setSaving(true);
      const url = editingPlan ? '/api/plans/admin' : '/api/plans/admin';
      const method = editingPlan ? 'PUT' : 'POST';
      
      const payload = editingPlan 
        ? { id: editingPlan.id, ...planData }
        : { plans: [planData] };

      const response = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Plan ${editingPlan ? 'updated' : 'created'} successfully` });
        setShowAddModal(false);
        setEditingPlan(null);
        fetchPlans();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save plan' });
      }
    } catch (error) {
      console.error('Failed to save plan:', error);
      setMessage({ type: 'error', text: 'Failed to save plan' });
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/plans/admin?id=${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Plan deleted successfully' });
        fetchPlans();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to delete plan' });
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
      setMessage({ type: 'error', text: 'Failed to delete plan' });
    } finally {
      setSaving(false);
    }
  };

  const PlanModal = ({ plan, onClose }: { plan?: Plan; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: plan?.name || '',
      displayName: plan?.displayName || '',
      description: plan?.description || '',
      priceMonthly: plan?.priceMonthly || 0,
      priceYearly: plan?.priceYearly || 0,
      currency: plan?.currency || 'INR',
      maxStudents: plan?.maxStudents || 50,
      maxTeachers: plan?.maxTeachers || 5,
      features: plan?.features ? JSON.parse(plan.features) : [],
      isActive: plan?.isActive ?? true,
      sortOrder: plan?.sortOrder || 0,
      trialDays: plan?.trialDays || 14,
    });

    const [featureInput, setFeatureInput] = useState('');

    const addFeature = () => {
      if (featureInput.trim()) {
        setFormData(prev => ({
          ...prev,
          features: [...prev.features, featureInput.trim()]
        }));
        setFeatureInput('');
      }
    };

    const removeFeature = (index: number) => {
      setFormData(prev => ({
        ...prev,
        features: prev.features.filter((_: any, i: number) => i !== index)
      }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      savePlan(formData);
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {plan ? 'Edit Plan' : 'Add New Plan'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan Name (Internal)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={e => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monthly Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.priceMonthly}
                  onChange={e => setFormData(prev => ({ ...prev, priceMonthly: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Yearly Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.priceYearly}
                  onChange={e => setFormData(prev => ({ ...prev, priceYearly: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Students
                </label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={e => setFormData(prev => ({ ...prev, maxStudents: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Teachers
                </label>
                <input
                  type="number"
                  value={formData.maxTeachers}
                  onChange={e => setFormData(prev => ({ ...prev, maxTeachers: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trial Days
                </label>
                <input
                  type="number"
                  value={formData.trialDays}
                  onChange={e => setFormData(prev => ({ ...prev, trialDays: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Features
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={e => setFeatureInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  placeholder="Add a feature"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="space-y-1">
                {formData.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={e => setFormData(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (plan ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plans Management</h1>
        <div className="flex gap-3">
          <button
            onClick={seedDefaultPlans}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Seeding...' : 'Seed Default Plans'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Plan
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Pricing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Limits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Trial
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {plan.displayName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {plan.name}
                    </div>
                    {plan.description && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {plan.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    ₹{plan.priceMonthly}/mo
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ₹{plan.priceYearly}/yr
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {plan.maxStudents} students
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {plan.maxTeachers} teachers
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {plan.trialDays} days
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    plan.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {plans.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No plans found. Seed default plans or create your first plan.
            </div>
            <button
              onClick={seedDefaultPlans}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Seed Default Plans
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {(showAddModal || editingPlan) && (
          <PlanModal
            plan={editingPlan || undefined}
            onClose={() => {
              setShowAddModal(false);
              setEditingPlan(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
