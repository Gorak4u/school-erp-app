'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  targetPlans: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  info:        { label: 'Info',        color: 'bg-blue-500/20 text-blue-400 border-blue-500/20',    icon: 'ℹ️' },
  warning:     { label: 'Warning',     color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20', icon: '⚠️' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-500/20 text-orange-400 border-orange-500/20', icon: '🔧' },
  feature:     { label: 'New Feature', color: 'bg-purple-500/20 text-purple-400 border-purple-500/20', icon: '✨' },
};

const EMPTY_FORM = { title: '', message: '', type: 'info', targetPlans: [] as string[], expiresAt: '' };

export default function AnnouncementsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [plans, setPlans] = useState<{ name: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/announcements').then(r => r.json()),
      fetch('/api/admin/plans').then(r => r.json()),
    ]).then(([aData, pData]) => {
      setAnnouncements(aData.announcements || []);
      setPlans((pData.plans || []).filter((p: any) => p.isActive));
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setMessage({ type: 'error', text: 'Title and message are required' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const method = editId ? 'PUT' : 'POST';
      const body = { ...form, ...(editId ? { id: editId } : {}), targetPlans: form.targetPlans.length ? form.targetPlans : null };
      const res = await fetch('/api/admin/announcements', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: editId ? 'Announcement updated' : 'Announcement created' });
        setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM });
        load();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (ann: Announcement) => {
    await fetch('/api/admin/announcements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ann.id, isActive: !ann.isActive }),
    });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
    load();
  };

  const startEdit = (ann: Announcement) => {
    let tp: string[] = [];
    try { tp = ann.targetPlans ? JSON.parse(ann.targetPlans) : []; } catch {}
    setForm({ title: ann.title, message: ann.message, type: ann.type, targetPlans: tp, expiresAt: ann.expiresAt ? ann.expiresAt.slice(0, 16) : '' });
    setEditId(ann.id); setShowForm(true);
  };

  const cardCls = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;
  const inputCls = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Announcements</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Broadcast messages to all schools on the platform</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY_FORM }); }}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          + New Announcement
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className={`${cardCls} p-6 space-y-4`}>
          <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {editId ? 'Edit Announcement' : 'New Announcement'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Title *</label>
              <input className={inputCls} placeholder="Announcement title..." value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Type</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Message *</label>
            <textarea className={`${inputCls} h-24 resize-none`} placeholder="Write your announcement..." value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Target Plans (leave empty for all)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {plans.map(p => (
                  <label key={p.name} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={form.targetPlans.includes(p.name)}
                      onChange={e => setForm(f => ({
                        ...f,
                        targetPlans: e.target.checked ? [...f.targetPlans, p.name] : f.targetPlans.filter(x => x !== p.name),
                      }))} />
                    <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{p.displayName}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Expires At (optional)</label>
              <input type="datetime-local" className={inputCls} value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={save} disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? 'Saving...' : editId ? 'Update' : 'Publish'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); }}
              className={`px-5 py-2 rounded-lg text-sm border transition-colors ${isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className={`h-24 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'} animate-pulse`} />)}
        </div>
      ) : announcements.length === 0 ? (
        <div className={`${cardCls} p-12 text-center`}>
          <div className="text-4xl mb-3">📢</div>
          <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>No announcements yet. Create one to broadcast to schools.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => {
            const typeConf = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
            let targets: string[] = [];
            try { targets = ann.targetPlans ? JSON.parse(ann.targetPlans) : []; } catch {}
            const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();

            return (
              <div key={ann.id} className={`${cardCls} p-5 ${!ann.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{typeConf.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{ann.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${typeConf.color}`}>{typeConf.label}</span>
                        {!ann.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">Inactive</span>}
                        {isExpired && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Expired</span>}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>{ann.message}</p>
                      <div className={`flex items-center gap-3 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span>By {ann.createdBy}</span>
                        <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                        {ann.expiresAt && <span>Expires {new Date(ann.expiresAt).toLocaleDateString()}</span>}
                        {targets.length > 0 && <span>Plans: {targets.join(', ')}</span>}
                        {targets.length === 0 && <span>All plans</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggle(ann)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        ann.isActive
                          ? isDark ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                          : isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}>
                      {ann.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => startEdit(ann)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      Edit
                    </button>
                    <button onClick={() => del(ann.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
