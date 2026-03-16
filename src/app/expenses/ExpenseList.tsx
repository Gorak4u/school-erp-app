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
}

export default function ExpenseList({
  expenses, loading, loadingMore, hasMore, totalCount, selected, setSelected,
  filters, setFilters, categories, onLoadMore, onAdd, onEdit, onDelete, onAction, onExport, isDark,
}: Props) {
  const card = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-500';
  const inp  = `px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const btnSec = `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`;

  const toggleSelect = (id: string) => {
    const ns = new Set(selected);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setSelected(ns);
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(expenses.map(e => e.id)) : new Set());
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className={`rounded-xl border p-4 ${card}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="col-span-2">
            <input className={`${inp} w-full`} placeholder="🔍 Search title, vendor, description..." value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <select className={`${inp} w-full`} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="all">All Status</option>
            {['pending', 'approved', 'rejected', 'paid'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select className={`${inp} w-full`} value={filters.categoryId} onChange={e => setFilters({ ...filters, categoryId: e.target.value })}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <input type="date" className={`${inp} w-full`} value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} title="From Date" />
          <input type="date" className={`${inp} w-full`} value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })} title="To Date" />
        </div>

        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'low', 'medium', 'high'].map(p => (
              <button key={p} onClick={() => setFilters({ ...filters, priority: p })}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filters.priority === p ? 'bg-blue-600 text-white border-blue-600' :
                  isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}>
                {p === 'all' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${sub}`}>
              {totalCount.toLocaleString()} total · {expenses.length} shown
              {selected.size > 0 && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full">{selected.size} selected</span>}
            </span>
            <button onClick={onExport} className={btnSec}>⬇ CSV</button>
            <button onClick={() => setFilters({ status: 'all', categoryId: '', dateFrom: '', dateTo: '', search: '', priority: 'all', academicYear: filters.academicYear })}
              className={`text-xs hover:text-blue-500 transition-colors ${sub}`}>Clear</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${card}`}>
        {loading ? (
          <div className={`p-12 text-center ${sub}`}>
            <div className="text-5xl mb-3 animate-pulse">💸</div>
            <p className="text-sm">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className={`p-12 text-center ${sub}`}>
            <div className="text-5xl mb-3">📭</div>
            <p className={`text-sm font-medium ${text}`}>No expenses found</p>
            <p className="text-xs mt-1 mb-4">Adjust your filters or add your first expense</p>
            <button onClick={onAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Add Expense</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'bg-gray-700/50' : 'bg-gray-50'}>
                    <th className="w-10 px-3 py-3">
                      <input type="checkbox" checked={selected.size === expenses.length && expenses.length > 0}
                        onChange={e => toggleAll(e.target.checked)} className="rounded" />
                    </th>
                    {['Expense', 'Category', 'Amount', 'Status', 'Priority', 'Date', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${sub}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => {
                    const sc = STATUS_COLORS[e.status] || STATUS_COLORS.pending;
                    const pc = PRIORITY_COLORS[e.priority] || PRIORITY_COLORS.medium;
                    return (
                      <tr key={e.id} className={`border-t transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'} ${selected.has(e.id) ? isDark ? 'bg-blue-900/20' : 'bg-blue-50/50' : ''}`}>
                        <td className="px-3 py-3">
                          <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} className="rounded" />
                        </td>
                        <td className={`px-4 py-3 ${text}`}>
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                              style={{ background: (e.category?.color || '#6366f1') + '22' }}>
                              {e.category?.icon || '📦'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[180px]">{e.title}</p>
                              {e.vendorName && <p className={`text-xs ${sub} truncate max-w-[180px]`}>{e.vendorName}</p>}
                              <p className={`text-xs ${sub} font-mono`}>{e.receiptNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${sub} text-xs`}>
                          {e.category?.name || '—'}
                        </td>
                        <td className={`px-4 py-3 font-bold ${text}`}>
                          {fmt(e.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${sc.dot}`} />
                            {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pc}`}>
                            {e.priority?.charAt(0).toUpperCase() + e.priority?.slice(1)}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-xs ${sub}`}>{e.dateIncurred}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {e.status === 'pending' && (
                              <>
                                <button onClick={() => onAction(e, 'approve')} title="Approve"
                                  className="w-7 h-7 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 flex items-center justify-center text-sm transition-colors">✓</button>
                                <button onClick={() => onAction(e, 'reject')} title="Reject"
                                  className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center text-sm transition-colors">✗</button>
                              </>
                            )}
                            {e.status === 'approved' && (
                              <button onClick={() => onAction(e, 'pay')} title="Mark Paid"
                                className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 flex items-center justify-center text-sm transition-colors">💳</button>
                            )}
                            {e.status === 'pending' && (
                              <button onClick={() => onEdit(e)} title="Edit"
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>✏️</button>
                            )}
                            <button onClick={() => onDelete(e.id)} title="Delete"
                              className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center text-xs transition-colors">🗑</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <span className={`text-xs ${sub}`}>{expenses.length} of {totalCount.toLocaleString()} expenses loaded</span>
              {hasMore && (
                <button onClick={onLoadMore} disabled={loadingMore}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {loadingMore ? 'Loading...' : `Load More (${totalCount - expenses.length} remaining)`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
