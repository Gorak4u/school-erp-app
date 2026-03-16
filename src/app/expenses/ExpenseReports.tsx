// @ts-nocheck
'use client';
import { fmt, STATUS_COLORS } from './utils';

interface Props {
  analytics: any;
  isDark: boolean;
  onExport: () => void;
  academicYear: string;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (d: string) => void;
  setDateTo: (d: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  categories: any[];
  refreshAnalytics: () => void;
}

export default function ExpenseReports({ analytics, isDark, onExport, academicYear, dateFrom, dateTo, setDateFrom, setDateTo, categoryFilter, setCategoryFilter, categories, refreshAnalytics }: Props) {
  const card = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-500';

  const statusColors: Record<string, string> = {
    pending:  'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    paid:     'bg-blue-500',
  };

  if (!analytics) {
    return (
      <div className={`rounded-xl border p-12 text-center ${card}`}>
        <div className="text-5xl mb-3 animate-pulse">📈</div>
        <p className={`text-sm ${sub}`}>Loading reports...</p>
      </div>
    );
  }

  const { summary, categoryBreakdown, statusBreakdown, priorityBreakdown, monthlyTrend } = analytics;
  const totalCatAmount = categoryBreakdown?.reduce((s: number, c: any) => s + c.total, 0) || 1;

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setCategoryFilter('');
  };

  const hasFilters = dateFrom || dateTo || categoryFilter;

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className={`rounded-xl border p-4 ${card}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1 ${sub}`}>From Date</label>
            <input type="date" className={`${inp} w-full`} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1 ${sub}`}>To Date</label>
            <input type="date" className={`${inp} w-full`} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wide mb-1 ${sub}`}>Category</label>
            <select className={`${inp} w-full`} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={refreshAnalytics} className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors`}>
              🔄 Refresh
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
                Clear
              </button>
            )}
          </div>
        </div>
        {hasFilters && (
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs ${sub}`}>Active filters:</span>
            {dateFrom && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">From: {dateFrom}</span>}
            {dateTo && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">To: {dateTo}</span>}
            {categoryFilter && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{categories.find(c => c.id === categoryFilter)?.name || 'Category'}</span>}
          </div>
        )}
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses',   value: summary?.totalCount || 0,         sub: fmt(summary?.totalAmount || 0), icon: '📊' },
          { label: 'Pending',          value: summary?.pendingCount || 0,        sub: fmt(summary?.pendingAmount || 0), icon: '⏳' },
          { label: 'Paid',             value: fmt(summary?.paidAmount || 0),     sub: 'Disbursed', icon: '🏦' },
          { label: 'Rejected',         value: summary?.rejectedCount || 0,       sub: 'Not approved', icon: '❌' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 ${card}`}>
            <div className="flex items-center gap-2 mb-2">
              <span>{k.icon}</span>
              <span className={`text-xs ${sub}`}>{k.label}</span>
            </div>
            <p className={`text-xl font-bold ${text}`}>{k.value}</p>
            <p className={`text-xs mt-0.5 ${sub}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className={`rounded-xl border p-5 ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${text}`}>Spend by Category</h3>
            <button onClick={onExport} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
              ⬇ Export CSV
            </button>
          </div>
          {!categoryBreakdown?.length ? (
            <p className={`text-sm ${sub}`}>No data available.</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 10).map((c: any) => (
                <div key={c.categoryId} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: (c.category?.color || '#6366f1') + '22' }}>
                    {c.category?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className={`text-xs font-medium truncate ${text}`}>{c.category?.name || 'Unknown'}</span>
                      <span className={`text-xs font-semibold ml-2 flex-shrink-0 ${text}`}>{fmt(c.total)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#e5e7eb' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.total / totalCatAmount) * 100}%`, background: c.category?.color || '#6366f1' }} />
                      </div>
                      <span className={`text-xs flex-shrink-0 w-8 text-right ${sub}`}>{Math.round((c.total / totalCatAmount) * 100)}%</span>
                    </div>
                    <p className={`text-xs mt-0.5 ${sub}`}>{c.count} expense{c.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className={`rounded-xl border p-5 ${card}`}>
          <h3 className={`text-sm font-bold mb-4 ${text}`}>Status Distribution</h3>
          {!statusBreakdown?.length ? (
            <p className={`text-sm ${sub}`}>No data available.</p>
          ) : (
            <>
              {/* Donut-style visual */}
              <div className="flex gap-3 flex-wrap mb-4">
                {statusBreakdown.map((s: any) => {
                  const sc = STATUS_COLORS[s.status] || STATUS_COLORS.pending;
                  const pct = summary?.totalCount > 0 ? Math.round((s.count / summary.totalCount) * 100) : 0;
                  return (
                    <div key={s.status} className={`flex-1 min-w-[120px] p-3 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-700/40' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusColors[s.status] || 'bg-gray-400'}`} />
                        <span className={`text-xs capitalize ${sub}`}>{s.status}</span>
                      </div>
                      <p className={`text-xl font-bold ${text}`}>{s.count}</p>
                      <p className={`text-xs ${sub}`}>{pct}% · {fmt(s.total)}</p>
                    </div>
                  );
                })}
              </div>
              {/* Stacked bar */}
              <div className="h-4 rounded-full overflow-hidden flex gap-0.5">
                {statusBreakdown.map((s: any) => {
                  const pct = summary?.totalCount > 0 ? (s.count / summary.totalCount) * 100 : 0;
                  return pct > 0 ? (
                    <div key={s.status} className={`h-full rounded-sm ${statusColors[s.status] || 'bg-gray-400'} transition-all duration-700`} style={{ width: `${pct}%` }} title={`${s.status}: ${s.count}`} />
                  ) : null;
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly Trend Table */}
      <div className={`rounded-xl border p-5 ${card}`}>
        <h3 className={`text-sm font-bold mb-4 ${text}`}>Monthly Spend — {academicYear === 'all' ? 'All Years' : academicYear}</h3>
        {!monthlyTrend?.length ? (
          <p className={`text-sm ${sub}`}>No trend data for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'bg-gray-700/50' : 'bg-gray-50'}>
                  {['Month', 'Total Expenses', 'Paid Amount', 'Count', 'Trend'].map(h => (
                    <th key={h} className={`px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide ${sub}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const maxTotal = Math.max(...monthlyTrend.map((m: any) => m.total), 1);
                  return monthlyTrend.map((m: any) => (
                    <tr key={m.month} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <td className={`px-4 py-3 font-mono text-sm ${text}`}>{m.month}</td>
                      <td className={`px-4 py-3 font-bold ${text}`}>{fmt(m.total)}</td>
                      <td className={`px-4 py-3 text-emerald-500 font-medium`}>{fmt(m.paid)}</td>
                      <td className={`px-4 py-3 ${sub}`}>{m.count}</td>
                      <td className="px-4 py-3 w-40">
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#e5e7eb' }}>
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500" style={{ width: `${(m.total / maxTotal) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
              <tfoot>
                <tr className={`border-t-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <td className={`px-4 py-3 font-bold text-xs uppercase ${sub}`}>Total</td>
                  <td className={`px-4 py-3 font-bold ${text}`}>{fmt(monthlyTrend.reduce((s: number, m: any) => s + m.total, 0))}</td>
                  <td className={`px-4 py-3 font-bold text-emerald-500`}>{fmt(monthlyTrend.reduce((s: number, m: any) => s + m.paid, 0))}</td>
                  <td className={`px-4 py-3 font-bold ${text}`}>{monthlyTrend.reduce((s: number, m: any) => s + m.count, 0)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Priority Breakdown */}
      {priorityBreakdown?.length > 0 && (
        <div className={`rounded-xl border p-5 ${card}`}>
          <h3 className={`text-sm font-bold mb-4 ${text}`}>Priority Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            {priorityBreakdown.map((p: any) => {
              const colors: Record<string, string> = { low: 'text-gray-500', medium: 'text-orange-500', high: 'text-red-500' };
              const bgs: Record<string, string> = { low: 'bg-gray-100', medium: 'bg-orange-100', high: 'bg-red-100' };
              return (
                <div key={p.priority} className={`p-4 rounded-xl ${bgs[p.priority] || 'bg-gray-100'}`}>
                  <p className={`text-sm font-bold capitalize ${colors[p.priority] || 'text-gray-700'}`}>{p.priority}</p>
                  <p className={`text-xl font-bold mt-1 ${isDark ? 'text-gray-800' : 'text-gray-900'}`}>{p.count}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>{fmt(p.total)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
