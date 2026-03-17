// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BudgetManagerProps {
  budgets: any[];
  loading: boolean;
  isDark: boolean;
  categories: any[];
  form: any;
  setForm: (form: any) => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editing: any;
  setEditing: (editing: any) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  saving: boolean;
  search: string;
  setSearch: (search: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
}

export default function BudgetManager({
  budgets,
  loading,
  isDark,
  categories,
  form,
  setForm,
  showForm,
  setShowForm,
  editing,
  setEditing,
  onSave,
  onDelete,
  saving,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}: BudgetManagerProps) {
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-600';
  const heading = isDark ? 'text-white' : 'text-gray-900';
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

  const getBudgetStatus = (budget: any) => {
    const spent = budget.spent || 0;
    const total = budget.totalAmount || 0;
    const percentage = total > 0 ? (spent / total) * 100 : 0;
    
    if (percentage >= 100) return { status: 'Exceeded', color: 'bg-red-100 text-red-700' };
    if (percentage >= 90) return { status: 'Critical', color: 'bg-orange-100 text-orange-700' };
    if (percentage >= 75) return { status: 'Warning', color: 'bg-yellow-100 text-yellow-700' };
    return { status: 'Healthy', color: 'bg-green-100 text-green-700' };
  };

  const filteredBudgets = budgets?.filter(budget => {
    const matchesSearch = budget.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || budget.status === statusFilter;
    const matchesCategory = !categoryFilter || budget.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];

  const sortedBudgets = [...filteredBudgets].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className={card}>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${heading}`}>Budget Management</h3>
              <p className={`text-sm ${subtext}`}>Create and manage budget limits</p>
            </div>
            <button onClick={() => setShowForm(true)} className={btnPrimary}>
              + Create Budget
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search budgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={input}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={input}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={input}
            >
              <option value="">All Categories</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort);
                setSortOrder(order);
              }}
              className={input}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="totalAmount-desc">Amount (High-Low)</option>
              <option value="totalAmount-asc">Amount (Low-High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Budget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${heading}`}>
              {editing ? 'Edit Budget' : 'Create Budget'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className={label}>Budget Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={input}
                  placeholder="Enter budget name"
                />
              </div>
              <div>
                <label className={label}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={input}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div>
                <label className={label}>Total Amount</label>
                <input
                  type="number"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                  className={input}
                  placeholder="Enter total amount"
                />
              </div>
              <div>
                <label className={label}>Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className={input}
                >
                  <option value="">Select category</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className={input}
                  />
                </div>
              </div>
              <div>
                <label className={label}>Alert Threshold (%)</label>
                <input
                  type="number"
                  value={form.alertThreshold}
                  onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })}
                  className={input}
                  placeholder="80"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowForm(false); setEditing(null); }} className={btnSecondary}>
                Cancel
              </button>
              <button onClick={onSave} disabled={saving} className={btnPrimary}>
                {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budgets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedBudgets.map((budget: any) => {
          const statusInfo = getBudgetStatus(budget);
          const spent = budget.spent || 0;
          const total = budget.totalAmount || 0;
          const percentage = total > 0 ? (spent / total) * 100 : 0;

          return (
            <div key={budget.id} className={card}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className={`text-lg font-semibold ${text}`}>{budget.name}</h4>
                    <p className={`text-sm ${subtext}`}>{budget.category?.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={subtext}>Spent</span>
                      <span className={text}>₹{spent.toLocaleString('en-IN')} / ₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          percentage >= 100 ? 'bg-red-500' :
                          percentage >= 90 ? 'bg-orange-500' :
                          percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${subtext} mt-1`}>{percentage.toFixed(1)}% used</p>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>Period: {budget.startDate} to {budget.endDate}</p>
                    <p>Alert at: {budget.alertThreshold}%</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setEditing(budget); setForm(budget); setShowForm(true); }} className={btnSecondary}>
                    Edit
                  </button>
                  <button onClick={() => onDelete(budget.id)} className={btnDanger}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedBudgets.length === 0 && !loading && (
        <div className={card}>
          <div className="p-8 text-center">
            <p className={subtext}>No budgets found</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
