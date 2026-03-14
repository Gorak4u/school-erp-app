'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  target: string | null;
  targetName: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  block_school: 'bg-red-500/20 text-red-400',
  unblock_school: 'bg-green-500/20 text-green-400',
  bulk_block_schools: 'bg-red-500/20 text-red-400',
  bulk_unblock_schools: 'bg-green-500/20 text-green-400',
  change_plan: 'bg-blue-500/20 text-blue-400',
  bulk_change_plan: 'bg-blue-500/20 text-blue-400',
  extend_trial: 'bg-yellow-500/20 text-yellow-400',
  create_announcement: 'bg-purple-500/20 text-purple-400',
  update_announcement: 'bg-purple-500/20 text-purple-400',
  delete_announcement: 'bg-red-500/20 text-red-400',
};

export default function AuditLogsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const limit = 50;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filterAction) params.set('action', filterAction);
    if (search) params.set('actor', search);
    fetch(`/api/admin/audit-logs?${params}`)
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setTotal(d.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, filterAction, search]);

  useEffect(() => { load(); }, [load]);

  const cardCls = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;
  const inputCls = `px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`;

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Audit Logs</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{total} total admin actions recorded</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input className={`${inputCls} w-52`} placeholder="Filter by email..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className={inputCls} value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}>
            <option value="">All Actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className={`${cardCls}`}>
        {loading ? (
          <div className="space-y-px">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`h-14 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse ${i === 0 ? 'rounded-t-xl' : ''} ${i === 7 ? 'rounded-b-xl' : ''}`} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className="text-4xl mb-3">🔍</div>
            <p>No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {logs.map((log, i) => {
              let details: any = null;
              try { details = log.details ? JSON.parse(log.details) : null; } catch {}
              const badgeCls = ACTION_COLORS[log.action] || 'bg-gray-500/20 text-gray-400';
              return (
                <div key={log.id} className={`flex items-start gap-4 p-4 ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'} transition-colors ${i === 0 ? 'rounded-t-xl' : ''} ${i === logs.length - 1 ? 'rounded-b-xl' : ''}`}>
                  {/* Action badge */}
                  <div className="flex-shrink-0 pt-0.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${badgeCls}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      <span className="font-medium">{log.actorEmail}</span>
                      {log.targetName && (
                        <span className={isDark ? ' text-gray-400' : ' text-gray-500'}> → {log.targetName}</span>
                      )}
                      {details && (
                        <span className={isDark ? ' text-gray-500' : ' text-gray-400'}>
                          {' '}({Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(', ')})
                        </span>
                      )}
                    </div>
                    {log.target && log.target !== log.targetName && (
                      <div className={`text-xs mt-0.5 font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>ID: {log.target}</div>
                    )}
                  </div>
                  {/* Time */}
                  <div className={`text-xs flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Page {page} of {Math.ceil(total / limit)} · {total} total
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 transition-colors ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              ← Prev
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}
              className={`px-3 py-1.5 rounded-lg text-sm border disabled:opacity-40 transition-colors ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
