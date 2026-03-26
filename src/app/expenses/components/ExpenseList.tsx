// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePermissions } from '@/hooks/usePermissions';

interface ExpenseListProps {
  expenses: any[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  selected: any[];
  setSelected: (selected: any[]) => void;
  filters: any;
  setFilters: (filters: any) => void;
  categories: any[];
  onLoadMore: () => void;
  onAdd: () => void;
  onEdit: (expense: any) => void;
  onDelete: (id: string) => void;
  onAction: (expense: any, action: string) => void;
  onExport: () => void;
  isDark: boolean;
}

export default function ExpenseList({
  expenses,
  loading,
  loadingMore,
  hasMore,
  totalCount,
  selected,
  setSelected,
  filters,
  setFilters,
  categories,
  onLoadMore,
  onAdd,
  onEdit,
  onDelete,
  onAction,
  onExport,
  isDark
}: ExpenseListProps) {
  const { isAdmin, isSuperAdmin, hasPermission } = usePermissions();
  const canCreateExpenses = isSuperAdmin || isAdmin || hasPermission('create_expenses');
  const canEditExpenses = isSuperAdmin || isAdmin || hasPermission('edit_expenses');
  const canApproveExpenses = isSuperAdmin || isAdmin || hasPermission('approve_expenses');
  const canPayExpenses = isSuperAdmin || isAdmin || hasPermission('pay_expenses');
  const canDeleteExpenses = isSuperAdmin || isAdmin || hasPermission('delete_expenses');
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-600';
  const heading = isDark ? 'text-white' : 'text-gray-900';
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'paid': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading && expenses.length === 0) {
    return (
      <div className={card}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={subtext}>Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Filters and Actions */}
      <div className={card}>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-semibold ${heading}`}>Expenses</h3>
              <p className={`text-sm ${subtext}`}>Manage and track all expenses</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onExport} className={btnSecondary}>
                📊 Export
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={input}
            />
            <select
              value={filters.categoryId || ''}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              className={input}
            >
              <option value="">All Categories</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={input}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </select>
            <select
              value={filters.priority || ''}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className={input}
            >
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className={card}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left p-4 text-sm font-semibold ${subtext}`}>Title</th>
                <th className={`text-left p-4 text-sm font-semibold ${subtext}`}>Category</th>
                <th className={`text-left p-4 text-sm font-semibold ${subtext}`}>Amount</th>
                <th className={`text-left p-4 text-sm font-semibold ${subtext}`}>Date</th>
                <th className={`text-left p-4 text-sm font-semibold ${subtext}`}>Status</th>
                <th className={`text-left p-4 text-sm font-semibold ${subtext}`}>Priority</th>
                <th className={`text-left p-4 text-sm font-semibold ${subtext}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses?.map((expense: any) => (
                <tr key={expense.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="p-4">
                    <div>
                      <p className={`text-sm font-medium ${text}`}>{expense.title}</p>
                      {expense.description && (
                        <p className={`text-xs ${subtext} mt-1`}>{expense.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm ${text}`}>{expense.category?.name || '—'}</span>
                  </td>
                  <td className="p-4">
                    <p className={`text-sm font-semibold ${text}`}>
                      ₹{expense.amount?.toLocaleString('en-IN') || 0}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm ${subtext}`}>{expense.dateIncurred}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(expense.priority)}`}>
                      {expense.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {canEditExpenses && expense.status === 'pending' && (
                        <button onClick={() => onEdit(expense)} className={btnSecondary}>
                          Edit
                        </button>
                      )}
                      {expense.status === 'pending' && canApproveExpenses && (
                        <>
                          <button onClick={() => onAction(expense, 'approve')} className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors">
                            Approve
                          </button>
                          <button onClick={() => onAction(expense, 'reject')} className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors">
                            Reject
                          </button>
                        </>
                      )}
                      {expense.status === 'approved' && canPayExpenses && (
                        <button onClick={() => onAction(expense, 'pay')} className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors">
                          Mark Paid
                        </button>
                      )}
                      {canDeleteExpenses && (
                        <button onClick={() => onDelete(expense.id)} className={btnDanger}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {expenses.length === 0 && !loading && (
          <div className="p-8 text-center">
            <p className={subtext}>No expenses found</p>
          </div>
        )}

        {hasMore && (
          <div className="p-4 text-center">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                loadingMore
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
