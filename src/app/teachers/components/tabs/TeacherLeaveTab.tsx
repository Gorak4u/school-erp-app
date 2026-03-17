// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback } from 'react';

const LEAVE_TYPES = ['sick', 'casual', 'earned', 'maternity', 'paternity', 'study', 'other'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
};
const EMPTY = { leaveType: 'sick', fromDate: '', toDate: '', days: 1, reason: '' };

interface Props { teacherId: string; isDark: boolean; txt: string; sub: string; card: string; }

export default function TeacherLeaveTab({ teacherId, isDark, txt, sub, card }: Props) {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [approving, setApproving] = useState<string | null>(null);
  const [approvalForm, setApprovalForm] = useState({ status: '', remarks: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: new Date().getFullYear().toString() });
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/teachers/${teacherId}/leave?${params}`);
      if (res.ok) { const d = await res.json(); setLeaves(d.leaves || []); setSummary(d.summary); }
    } finally { setLoading(false); }
  }, [teacherId, filterStatus]);

  useEffect(() => { load(); }, [load]);

  // Auto-calculate days between dates
  useEffect(() => {
    if (form.fromDate && form.toDate) {
      const from = new Date(form.fromDate);
      const to = new Date(form.toDate);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setForm(f => ({ ...f, days: diffDays }));
    }
  }, [form.fromDate, form.toDate]);

  const handleApply = async () => {
    if (!form.fromDate || !form.toDate || !form.reason) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/leave`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (res.ok) { setShowForm(false); setForm({ ...EMPTY }); load(); }
    } finally { setSaving(false); }
  };

  const handleApproveReject = async (leaveId: string) => {
    const res = await fetch(`/api/teachers/${teacherId}/leave`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaveId, status: approvalForm.status, remarks: approvalForm.remarks }),
    });
    if (res.ok) { setApproving(null); setApprovalForm({ status: '', remarks: '' }); load(); }
  };

  const formatDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className={`text-base font-semibold ${txt}`}>Leave Management</h3>
        <button onClick={() => { setShowForm(true); setForm({ ...EMPTY, fromDate: new Date().toISOString().split('T')[0] }); }} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">+ Apply Leave</button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className={`p-3 rounded-xl border ${card} grid grid-cols-2 md:grid-cols-4 gap-3 text-center`}>
          {[
            { label: 'Total', value: summary.total, color: 'text-blue-400' },
            { label: 'Pending', value: summary.pending, color: 'text-yellow-400' },
            { label: 'Approved', value: summary.approved, color: 'text-green-400' },
            { label: 'Days Taken', value: summary.totalDaysTaken, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label}><p className={`text-xl font-bold ${s.color}`}>{s.value}</p><p className={`text-xs ${sub}`}>{s.label}</p></div>
          ))}
        </div>
      )}

      {/* Leave Type Breakdown */}
      {summary?.byType && Object.keys(summary.byType).length > 0 && (
        <div className={`p-3 rounded-xl border ${card}`}>
          <h4 className={`text-xs font-semibold mb-2 ${sub}`}>Days by Leave Type (Approved)</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.byType).map(([type, days]: [string, any]) => (
              <span key={type} className={`text-xs px-2.5 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                <span className="font-medium">{type}</span>: {days}d
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'}`}>{s || 'All'}</button>
        ))}
      </div>

      {/* Apply Form */}
      {showForm && (
        <div className={`p-4 rounded-xl border ${card} space-y-3`}>
          <div className="flex items-center justify-between"><h4 className={`text-sm font-semibold ${txt}`}>Apply for Leave</h4><button onClick={() => setShowForm(false)} className={`text-xs ${sub} hover:text-red-400`}>✕</button></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={`text-xs ${sub}`}>Leave Type *</label>
              <select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs ${sub}`}>From Date *</label>
              <input type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
            <div>
              <label className={`text-xs ${sub}`}>To Date *</label>
              <input type="date" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} min={form.fromDate || new Date().toISOString().split('T')[0]} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
          </div>
          <div className={`px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <span className={sub}>Duration: </span><span className={`font-semibold ${txt}`}>{form.days} day{form.days !== 1 ? 's' : ''}</span>
          </div>
          <div>
            <label className={`text-xs ${sub}`}>Reason *</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Reason for leave..." rows={2} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleApply} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Submitting...' : 'Submit Application'}</button>
            <button onClick={() => setShowForm(false)} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
          </div>
        </div>
      )}

      {/* Leave Records */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : leaves.length === 0 ? (
        <div className={`text-center py-16 ${sub}`}><p className="text-4xl mb-3">🗓️</p><p className="font-medium">No leave records</p><p className="text-xs mt-1">Apply for leave to see records here</p></div>
      ) : (
        <div className="space-y-2">
          {leaves.map(l => (
            <div key={l.id} className={`p-4 rounded-xl border ${card}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{l.leaveType}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                    <span className={`text-xs font-semibold ${txt}`}>{l.days} day{l.days !== 1 ? 's' : ''}</span>
                  </div>
                  <p className={`text-sm mt-1.5 ${txt}`}>{formatDate(l.fromDate)} → {formatDate(l.toDate)}</p>
                  {l.reason && <p className={`text-xs mt-1 ${sub}`}>📝 {l.reason}</p>}
                  {l.approvedBy && <p className={`text-xs mt-0.5 ${sub}`}>✅ {l.status === 'approved' ? 'Approved' : 'Processed'} by {l.approvedBy}</p>}
                  {l.remarks && <p className={`text-xs mt-0.5 ${sub}`}>💬 {l.remarks}</p>}
                </div>
                {/* Admin approval actions */}
                {l.status === 'pending' && (
                  <div className="shrink-0">
                    {approving === l.id ? (
                      <div className={`p-3 rounded-xl border ${card} w-52 space-y-2`}>
                        <div className="flex gap-1">
                          <button onClick={() => setApprovalForm(f => ({ ...f, status: 'approved' }))} className={`flex-1 py-1 rounded text-xs font-medium ${approvalForm.status === 'approved' ? 'bg-green-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Approve</button>
                          <button onClick={() => setApprovalForm(f => ({ ...f, status: 'rejected' }))} className={`flex-1 py-1 rounded text-xs font-medium ${approvalForm.status === 'rejected' ? 'bg-red-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Reject</button>
                        </div>
                        <input value={approvalForm.remarks} onChange={e => setApprovalForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Remarks..." className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                        <div className="flex gap-1">
                          <button onClick={() => handleApproveReject(l.id)} disabled={!approvalForm.status} className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs disabled:opacity-50">Confirm</button>
                          <button onClick={() => setApproving(null)} className={`flex-1 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setApproving(l.id); setApprovalForm({ status: '', remarks: '' }); }} className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-xs hover:bg-orange-500/30 transition-colors">Review</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
