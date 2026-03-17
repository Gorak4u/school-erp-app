// @ts-nocheck
'use client';
import { fmt, STATUS_COLORS, PRIORITY_COLORS } from './utils';

interface Props {
  expenses: any[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  selected: Set<string>;
  setSelected: (s: Set<string>) => void;
  filters: any;
  setFilters: (f: any) => void;
  categories: any[];
  onLoadMore: () => void;
  onAdd: () => void;
  onEdit: (e: any) => void;
  onDelete: (id: string) => void;
  onAction: (e: any, action: string) => void;
  onExport: () => void;
  isDark: boolean;
  userRole: string;
  isSuperAdmin: boolean;
}

export default function ExpenseList({
  expenses, loading, loadingMore, hasMore, totalCount, selected, setSelected,
  filters, setFilters, categories, onLoadMore, onAdd, onEdit, onDelete, onAction, onExport, isDark, userRole, isSuperAdmin,
}: Props) {
  const card = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-500';
  const inp  = `px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const btnSec = `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`;

  const canDeleteExpense = (expense: any) => {
    // Paid expenses cannot be deleted by anyone
    if (expense.status === 'paid') return false;
    
    // Rejected expenses can only be deleted by admins and super admins
    if (expense.status === 'rejected') {
      return userRole === 'admin' || isSuperAdmin;
    }
    
    // Pending and approved expenses can be deleted by admins and super admins
    return userRole === 'admin' || isSuperAdmin;
  };

  const toggleSelect = (id: string) => {
    const ns = new Set(selected);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelected(ns);
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(expenses.map(e => e.id)) : new Set());
  };

  return (
    <div className="space-y-6">
      {/* Modern Filter Bar */}
      <div className={`rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-6`}>
        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              className={`w-full pl-12 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                isDark 
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-700' 
                  : 'bg-gray-50/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white'
              }`} 
              placeholder="Search expenses by title, vendor, or description..." 
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })} 
            />
          </div>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</label>
            <div className={`relative rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-white'}`}>
              <select 
                className={`w-full px-4 py-2.5 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none ${
                  isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'
                }`} 
                value={filters.status} 
                onChange={e => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Status</option>
                {['pending', 'approved', 'rejected', 'paid'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category</label>
            <div className={`relative rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-white'}`}>
              <select 
                className={`w-full px-4 py-2.5 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none ${
                  isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'
                }`} 
                value={filters.categoryId} 
                onChange={e => setFilters({ ...filters, categoryId: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Date From Filter */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>From Date</label>
            <div className={`relative rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-white'}`}>
              <input 
                type="date" 
                className={`w-full px-4 py-2.5 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'
                }`} 
                value={filters.dateFrom}
                onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} 
              />
            </div>
          </div>

          {/* Date To Filter */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>To Date</label>
            <div className={`relative rounded-xl border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-white'}`}>
              <input 
                type="date" 
                className={`w-full px-4 py-2.5 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  isDark ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'
                }`} 
                value={filters.dateTo}
                onChange={e => setFilters({ ...filters, dateTo: e.target.value })} 
              />
            </div>
          </div>
        </div>

        {/* Priority Filters & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Priority Pills */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'} self-center`}>Priority:</span>
            {['all', 'low', 'medium', 'high'].map(p => (
              <button 
                key={p} 
                onClick={() => setFilters({ ...filters, priority: p })}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all transform hover:scale-105 ${
                  filters.priority === p 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                    : isDark 
                      ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Actions & Stats */}
          <div className="flex items-center gap-4">
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">{expenses.length}</span> of <span className="font-medium">{totalCount.toLocaleString()}</span> expenses
              {selected.size > 0 && (
                <span className="ml-3 px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-medium">
                  {selected.size} selected
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={onExport} 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                  isDark 
                    ? 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </span>
              </button>
              
              <button 
                onClick={() => setFilters({ status: 'all', categoryId: '', dateFrom: '', dateTo: '', search: '', priority: 'all', academicYear: filters.academicYear })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all transform hover:scale-105 ${
                  isDark 
                    ? 'bg-red-600/10 border border-red-600/30 text-red-400 hover:bg-red-600/20' 
                    : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                }`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Table */}
      <div className={`rounded-2xl border shadow-lg overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
        {loading ? (
          <div className={`p-16 text-center`}>
            <div className="text-6xl mb-4 animate-pulse">💸</div>
            <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading expenses...</p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-2`}>Please wait while we fetch your data</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className={`p-16 text-center`}>
            <div className="text-6xl mb-4">📭</div>
            <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No expenses found</p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-2 mb-6`}>Adjust your filters or add your first expense to get started</p>
            <button 
              onClick={onAdd} 
              className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Expense
              </span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="w-12 px-4 py-4">
                      <input 
                        type="checkbox" 
                        checked={selected.size === expenses.length && expenses.length > 0}
                        onChange={e => toggleAll(e.target.checked)} 
                        className={`w-4 h-4 rounded border-2 ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500/50' 
                            : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500/50'
                        }`} 
                      />
                    </th>
                    {['Expense Details', 'Category', 'Amount', 'Status', 'Priority', 'Date', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => {
                    const sc = STATUS_COLORS[e.status] || STATUS_COLORS.pending;
                    const pc = PRIORITY_COLORS[e.priority] || PRIORITY_COLORS.medium;
                    return (
                      <tr 
                        key={e.id} 
                        className={`border-b transition-all duration-200 ${
                          isDark 
                            ? 'border-gray-700 hover:bg-gray-700/30' 
                            : 'border-gray-100 hover:bg-gray-50/80'
                        } ${
                          selected.has(e.id) 
                            ? isDark 
                              ? 'bg-blue-900/20 border-blue-700/50' 
                              : 'bg-blue-50/50 border-blue-200/50' 
                            : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input 
                            type="checkbox" 
                            checked={selected.has(e.id)} 
                            onChange={() => toggleSelect(e.id)} 
                            className={`w-4 h-4 rounded border-2 ${
                              isDark 
                                ? 'bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500/50' 
                                : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500/50'
                            }`} 
                          />
                        </td>
                        <td className={`px-4 py-4`}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5 shadow-sm"
                              style={{ background: (e.category?.color || '#6366f1') + '22', color: e.category?.color || '#6366f1' }}>
                              {e.category?.icon || '📦'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`font-medium text-sm truncate max-w-[200px] ${isDark ? 'text-white' : 'text-gray-900'}`}>{e.title}</p>
                              {e.vendorName && (
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[200px] mt-0.5`}>
                                  🏢 {e.vendorName}
                                </p>
                              )}
                              <p className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                                🧾 {e.receiptNumber}
                              </p>
                              {e.receiptUrl && (
                                <div className="flex items-center gap-1 mt-1">
                                  <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs text-blue-500">Receipt attached</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                              {e.category?.icon || '📦'}
                            </span>
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {e.category?.name || '—'}
                            </span>
                          </div>
                        </td>
                        <td className={`px-4 py-4`}>
                          <div className="flex flex-col">
                            <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {fmt(e.amount)}
                            </span>
                            {e.description && (
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} truncate max-w-[120px] mt-1`}>
                                {e.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} shadow-sm`}>
                            <span className={`w-2 h-2 rounded-full inline-block ${sc.dot}`} />
                            {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${pc} shadow-sm`}>
                            {e.priority === 'high' && '🔴'}
                            {e.priority === 'medium' && '🟡'}
                            {e.priority === 'low' && '🟢'}
                            {e.priority?.charAt(0).toUpperCase() + e.priority?.slice(1)}
                          </span>
                        </td>
                        <td className={`px-4 py-4`}>
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {e.dateIncurred}
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {e.requestedByEmail?.split('@')[0] || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            {e.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => onAction(e, 'approve')} 
                                  title="Approve"
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium transition-all transform hover:scale-110 ${
                                    isDark 
                                      ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                                  }`}
                                >
                                  ✓
                                </button>
                                <button 
                                  onClick={() => onAction(e, 'reject')} 
                                  title="Reject"
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium transition-all transform hover:scale-110 ${
                                    isDark 
                                      ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                                  }`}
                                >
                                  ✗
                                </button>
                              </>
                            )}
                            {e.status === 'approved' && (
                              <button 
                                onClick={() => onAction(e, 'pay')} 
                                title="Mark Paid"
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium transition-all transform hover:scale-110 ${
                                  isDark 
                                    ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                }`}
                              >
                                💳
                              </button>
                            )}
                            {e.status === 'pending' && (
                              <button 
                                onClick={() => onEdit(e)} 
                                title="Edit"
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium transition-all transform hover:scale-110 ${
                                  isDark 
                                    ? 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                ✏️
                              </button>
                            )}
                            {canDeleteExpense(e) && (
                              <button 
                                onClick={() => onDelete(e.id)} 
                                title="Delete"
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium transition-all transform hover:scale-110 ${
                                  isDark 
                                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                                }`}
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modern Pagination */}
            <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing <span className="font-semibold">{expenses.length}</span> of <span className="font-semibold">{totalCount.toLocaleString()}</span> expenses
              </div>
              {hasMore && (
                <button 
                  onClick={onLoadMore} 
                  disabled={loadingMore}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    isDark 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                  }`}
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Load More
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${isDark ? 'bg-blue-700/50' : 'bg-blue-100'}`}>
                        {totalCount - expenses.length} remaining
                      </span>
                    </span>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
