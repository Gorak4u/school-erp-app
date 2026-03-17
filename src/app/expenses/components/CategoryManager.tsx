// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CategoryManagerProps {
  categories: any[];
  isDark: boolean;
  form: any;
  setForm: (form: any) => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editing: any;
  setEditing: (editing: any) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onSeedDefaults: () => void;
  saving: boolean;
  search: string;
  setSearch: (search: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
}

export default function CategoryManager({
  categories,
  isDark,
  form,
  setForm,
  showForm,
  setShowForm,
  editing,
  setEditing,
  onSave,
  onDelete,
  onSeedDefaults,
  saving,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}: CategoryManagerProps) {
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-600';
  const heading = isDark ? 'text-white' : 'text-gray-900';
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

  const filteredCategories = categories?.filter(category => {
    const matchesSearch = category.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || category.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const iconOptions = ['📦', '🏢', '🚗', '💻', '📚', '🍔', '🏥', '⚡', '🔧', '🎯', '📊', '🎨'];

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
              <h3 className={`text-lg font-semibold ${heading}`}>Category Management</h3>
              <p className={`text-sm ${subtext}`}>Create and manage expense categories</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onSeedDefaults} disabled={saving} className={btnSecondary}>
                🌱 Seed Defaults
              </button>
              <button onClick={() => setShowForm(true)} className={btnPrimary}>
                + Create Category
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search categories..."
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
              <option value="createdAt-desc">Created (Newest)</option>
              <option value="createdAt-asc">Created (Oldest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${heading}`}>
              {editing ? 'Edit Category' : 'Create Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className={label}>Category Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={input}
                  placeholder="Enter category name"
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
                <label className={label}>Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`p-3 rounded-xl border text-lg transition-all ${
                        form.icon === icon
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={label}>Color</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className={`w-full h-12 rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCategories.map((category: any) => (
          <div key={category.id} className={card}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold ${text}`}>{category.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {category.description && (
                <p className={`text-sm ${subtext} mb-4`}>{category.description}</p>
              )}

              <div className="flex gap-2">
                <button onClick={() => { setEditing(category); setForm(category); setShowForm(true); }} className={btnSecondary}>
                  Edit
                </button>
                <button onClick={() => onDelete(category.id)} className={btnDanger}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedCategories.length === 0 && !saving && (
        <div className={card}>
          <div className="p-8 text-center">
            <p className={subtext}>No categories found</p>
            <p className={`text-sm ${subtext} mt-2`}>Create your first category or seed default categories</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
