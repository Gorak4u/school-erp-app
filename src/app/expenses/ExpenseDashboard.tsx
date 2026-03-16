// @ts-nocheck
'use client';
import { fmt, STATUS_COLORS } from './utils';

interface Props {
  analytics: any;
  isDark: boolean;
  onAddExpense: () => void;
}

export default function ExpenseDashboard({ analytics, isDark, onAddExpense }: Props) {
  const card = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-500';

  const kpis = [
    { label: 'Total Spent',      value: fmt(analytics?.summary?.totalAmount || 0),  icon: '💸', gradient: 'from-blue-500 to-blue-700',    sub: `${analytics?.summary?.totalCount || 0} expenses` },
    { label: 'Pending Approval', value: fmt(analytics?.summary?.pendingAmount || 0), icon: '⏳', gradient: 'from-amber-500 to-orange-500',  sub: `${analytics?.summary?.pendingCount || 0} awaiting` },
    { label: 'Approved',         value: fmt(analytics?.summary?.approvedAmount || 0),icon: '✅', gradient: 'from-emerald-500 to-green-600', sub: 'Ready to pay' },
    { label: 'Paid Out',         value: fmt(analytics?.summary?.paidAmount || 0),    icon: '🏦', gradient: 'from-violet-500 to-purple-600', sub: `${analytics?.summary?.rejectedCount || 0} rejected` },
  ];

  if (!analytics) {
    return (
      <div className={`rounded-xl border p-12 text-center ${card}`}>
        <div className="text-5xl mb-3 animate-pulse">📊</div>
        <p className={`text-sm ${sub}`}>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`rounded-xl p-5 bg-gradient-to-br ${k.gradient} text-white shadow-lg relative overflow-hidden group hover:scale-105 transition-transform duration-200`}>
            <div className="absolute top-3 right-4 text-3xl opacity-20 group-hover:opacity-40 transition-opacity">{k.icon}</div>
            <div className="text-2xl font-bold mb-1">{k.value}</div>
            <div className="text-sm font-medium opacity-90">{k.label}</div>
            <div className="text-xs opacity-70 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className={`lg:col-span-2 rounded-xl border p-5 ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${text}`}>Monthly Spend Trend</h3>
            <span className={`text-xs ${sub}`}>Last 8 months</span>
          </div>
          {!analytics?.monthlyTrend?.length ? (
            <div className={`py-8 text-center ${sub}`}>
              <p className="text-sm">No trend data yet.</p>
              <button onClick={onAddExpense} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Add First Expense</button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(() => {
                const data = analytics.monthlyTrend.slice(-8);
                const max  = Math.max(...data.map((d: any) => d.total), 1);
                return data.map((d: any) => (
                  <div key={d.month} className="flex items-center gap-3 group">
                    <span className={`text-xs w-16 flex-shrink-0 font-mono ${sub}`}>{d.month}</span>
                    <div className="flex-1 h-7 rounded-lg overflow-hidden relative" style={{ background: isDark ? '#374151' : '#f3f4f6' }}>
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg transition-all duration-700 flex items-center" style={{ width: `${Math.max((d.total / max) * 100, 2)}%` }}>
                        <span className="text-xs text-white font-medium px-2 whitespace-nowrap hidden group-hover:block">{fmt(d.total)}</span>
                      </div>
                    </div>
                    <span className={`text-xs w-28 text-right flex-shrink-0 font-semibold ${text}`}>{fmt(d.total)}</span>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Budget Utilization */}
        <div className={`rounded-xl border p-5 ${card}`}>
          <h3 className={`text-sm font-bold mb-4 ${text}`}>Budget Utilization</h3>
          {!analytics?.budgetSummary?.length ? (
            <p className={`text-sm ${sub}`}>No budgets configured.</p>
          ) : (
            <div className="space-y-4">
              {analytics.budgetSummary.slice(0, 6).map((b: any) => (
                <div key={b.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-medium truncate max-w-[130px] ${text}`}>{b.name}</span>
                    <span className={`text-xs font-bold ml-1 ${b.isOverBudget ? 'text-red-500' : b.isNearLimit ? 'text-orange-400' : 'text-emerald-500'}`}>{b.utilization}%</span>
                  </div>
                  <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#e5e7eb' }}>
                    <div className={`h-full rounded-full transition-all duration-700 ${b.isOverBudget ? 'bg-red-500' : b.isNearLimit ? 'bg-orange-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(b.utilization, 100)}%` }} />
                  </div>
                  <div className={`flex justify-between text-xs mt-0.5 ${sub}`}>
                    <span>{fmt(b.spentAmount)}</span>
                    <span>{fmt(b.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className={`rounded-xl border p-5 ${card}`}>
          <h3 className={`text-sm font-bold mb-4 ${text}`}>Spend by Category</h3>
          {!analytics?.categoryBreakdown?.length ? (
            <p className={`text-sm ${sub}`}>No data yet.</p>
          ) : (
            <div className="space-y-3">
              {(() => {
                const total = analytics.categoryBreakdown.reduce((s: number, c: any) => s + c.total, 0) || 1;
                return analytics.categoryBreakdown.slice(0, 7).map((c: any) => (
                  <div key={c.categoryId} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: (c.category?.color || '#6366f1') + '22' }}>
                      {c.category?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className={`text-xs font-medium truncate ${text}`}>{c.category?.name || 'Unknown'}</span>
                        <span className={`text-xs ml-1 flex-shrink-0 ${sub}`}>{fmt(c.total)}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#e5e7eb' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.total / total) * 100}%`, background: c.category?.color || '#6366f1' }} />
                      </div>
                    </div>
                    <span className={`text-xs w-8 text-right flex-shrink-0 font-semibold ${sub}`}>{Math.round((c.total / total) * 100)}%</span>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Recent Expenses Feed */}
        <div className={`rounded-xl border p-5 ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${text}`}>Recent Expenses</h3>
          </div>
          {!analytics?.recentExpenses?.length ? (
            <div className={`py-6 text-center ${sub}`}>
              <p className="text-sm">No expenses yet.</p>
              <button onClick={onAddExpense} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Add First Expense</button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {analytics.recentExpenses.map((e: any) => {
                const sc = STATUS_COLORS[e.status] || STATUS_COLORS.pending;
                return (
                  <div key={e.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isDark ? 'border-gray-700 bg-gray-700/30 hover:bg-gray-700/50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: (e.category?.color || '#6366f1') + '22' }}>
                      {e.category?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${text}`}>{e.title}</p>
                      <p className={`text-xs ${sub}`}>{e.dateIncurred}{e.category?.name ? ` · ${e.category.name}` : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${text}`}>{fmt(e.amount)}</p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${sc.dot}`} />
                        {e.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
