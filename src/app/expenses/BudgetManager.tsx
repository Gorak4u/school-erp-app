// @ts-nocheck
'use client';
import { fmt } from './utils';

interface Props {
  budgets: any[];
  loading: boolean;
  isDark: boolean;
  categories: any[];
  form: any;
  setForm: (f: any) => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editing: any;
  setEditing: (v: any) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  saving: boolean;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  sortOrder: string;
  setSortOrder: (s: string) => void;
}

export default function BudgetManager({
  budgets, loading, isDark, categories, form, setForm, showForm, setShowForm, editing, setEditing, onSave, onDelete, saving,
  search, setSearch, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, sortBy, setSortBy, sortOrder, setSortOrder,
}: Props) {
  const card = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-500';
  const inp  = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const lbl  = `block text-xs font-semibold uppercase tracking-wide mb-1 ${sub}`;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', totalAmount: '', categoryId: '', startDate: '', endDate: '', alertThreshold: '80', academicYear: '2024-25' });
    setShowForm(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ name: b.name, description: b.description || '', totalAmount: String(b.totalAmount), categoryId: b.categoryId || '', startDate: b.startDate, endDate: b.endDate, alertThreshold: String(b.alertThreshold), academicYear: b.academicYear });
    setShowForm(true);
  };

  // Filter and sort budgets
  const filteredBudgets = budgets.filter(b => {
    const matchesSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.description && b.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesCategory = !categoryFilter || b.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a] || '';
    const bValue = b[sortBy as keyof typeof b] || '';
    const modifier = sortOrder === 'desc' ? -1 : 1;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * modifier;
    }
    return String(aValue).localeCompare(String(bValue)) * modifier;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-lg font-bold ${text}`}>Budget Management</h2>
          <p className={`text-sm ${sub}`}>{filteredBudgets.length} of {budgets.length} budget{budgets.length !== 1 ? 's' : ''} shown</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ New Budget</button>
      </div>

      {/* Filters Bar */}
      <div className={`rounded-xl border p-4 ${card}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <input className={`${inp} w-full`} placeholder="🔍 Search budget name or description..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <select className={`${inp} w-full`} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
          <select className={`${inp} w-full`} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <div className="flex gap-2">
            <select className={`${inp} flex-1`} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="totalAmount">Amount</option>
              <option value="utilization">Utilization</option>
              <option value="startDate">Start Date</option>
              <option value="endDate">End Date</option>
            </select>
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className={`text-xs ${sub}`}>Showing {filteredBudgets.length} of {budgets.length} budgets</span>
          <button onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter(''); setSortBy('name'); setSortOrder('asc'); }} className={`text-xs ${sub} hover:text-blue-500 transition-colors`}>
            Clear filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`rounded-xl border p-12 text-center ${card}`}>
          <div className="text-4xl mb-3 animate-pulse">🎯</div>
          <p className={`text-sm ${sub}`}>Loading budgets...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center ${card}`}>
          <div className="text-5xl mb-3">🎯</div>
          <p className={`font-medium ${text}`}>No budgets yet</p>
          <p className={`text-sm mt-1 ${sub}`}>Create budgets to track spending limits by category</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Create First Budget</button>
        </div>
      ) : filteredBudgets.length === 0 ? (
          <div className={`rounded-xl border p-12 text-center ${card}`}>
            <div className="text-5xl mb-3">🎯</div>
            <p className={`font-medium ${text}`}>No budgets found</p>
            <p className={`text-sm mt-1 ${sub}`}>Try adjusting your filters or create your first budget</p>
            <button onClick={openAdd} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Create First Budget</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBudgets.map(b => {
            const pct = b.utilization || 0;
            const isOver = b.isOverBudget;
            const isNear = b.isNearLimit && !isOver;
            const barColor = isOver ? 'from-red-500 to-red-400' : isNear ? 'from-orange-500 to-orange-400' : 'from-emerald-500 to-emerald-400';
            const cat = categories.find(c => c.id === b.categoryId);

            return (
              <div key={b.id} className={`rounded-xl border p-5 hover:shadow-md transition-shadow ${card} ${isOver ? 'border-red-400/50' : isNear ? 'border-orange-400/50' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {cat && (
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: (cat.color || '#6366f1') + '22' }}>
                        {cat.icon || '🎯'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className={`font-bold text-sm truncate ${text}`}>{b.name}</h3>
                      <p className={`text-xs ${sub}`}>{b.academicYear}{cat ? ` · ${cat.name}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>

                {/* Budget Progress */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs ${sub}`}>Utilization</span>
                    <span className={`text-sm font-bold ${isOver ? 'text-red-500' : isNear ? 'text-orange-500' : 'text-emerald-500'}`}>
                      {pct}%{isOver ? ' 🔴' : isNear ? ' ⚠️' : ''}
                    </span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#e5e7eb' }}>
                    <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className={`text-xs ${sub}`}>Spent: <span className={`font-semibold ${text}`}>{fmt(b.spentAmount)}</span></span>
                    <span className={`text-xs ${sub}`}>Total: <span className={`font-semibold ${text}`}>{fmt(b.totalAmount)}</span></span>
                  </div>
                </div>

                {/* Remaining */}
                <div className={`p-2.5 rounded-lg mb-3 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between">
                    <span className={`text-xs ${sub}`}>Remaining</span>
                    <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>{fmt(Math.max(0, b.remainingAmount))}</span>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className={`text-xs ${sub}`}>Period</span>
                    <span className={`text-xs ${sub}`}>{b.startDate} → {b.endDate}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => onDelete(b.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-lg font-bold ${text}`}>{editing ? '✏️ Edit Budget' : '+ New Budget'}</h2>
              <button onClick={() => setShowForm(false)} className={`w-8 h-8 flex items-center justify-center rounded-full text-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={lbl}>Budget Name *</label>
                <input className={inp} placeholder="e.g. Science Department Q1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Total Amount (₹) *</label>
                  <input type="number" min="0" className={inp} placeholder="0.00" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>Alert at (%)</label>
                  <input type="number" min="0" max="100" className={inp} placeholder="80" value={form.alertThreshold} onChange={e => setForm({ ...form, alertThreshold: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={lbl}>Category (optional)</label>
                <select className={inp} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Start Date *</label>
                  <input type="date" className={inp} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>End Date *</label>
                  <input type="date" className={inp} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={lbl}>Description</label>
                <input className={inp} placeholder="Optional notes" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className={`flex gap-3 justify-end px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setShowForm(false)} disabled={saving} className={`px-4 py-2 rounded-lg text-sm font-medium border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
              <button onClick={onSave} disabled={saving || !form.name || !form.totalAmount || !form.startDate || !form.endDate}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : editing ? 'Update Budget' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
