// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback } from 'react';

const NOTE_TYPES = ['general', 'student', 'behavior', 'achievement', 'concern', 'reminder'];
const TYPE_COLORS: Record<string, string> = {
  general: 'bg-blue-500/20 text-blue-400',
  student: 'bg-green-500/20 text-green-400',
  behavior: 'bg-orange-500/20 text-orange-400',
  achievement: 'bg-purple-500/20 text-purple-400',
  concern: 'bg-red-500/20 text-red-400',
  reminder: 'bg-yellow-500/20 text-yellow-400',
};
const EMPTY = { title: '', content: '', type: 'general', isPrivate: false, studentId: '', classId: '' };

interface Props { teacherId: string; schoolConfig: any; isDark: boolean; txt: string; sub: string; card: string; }

export default function TeacherNotesTab({ teacherId, schoolConfig, isDark, txt, sub, card }: Props) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const classes = schoolConfig?.classes || [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/teachers/${teacherId}/notes?${params}`);
      if (res.ok) { const d = await res.json(); setNotes(d.notes || []); }
    } finally { setLoading(false); }
  }, [teacherId, filterType]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teachers/${teacherId}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (res.ok) { setShowForm(false); setForm({ ...EMPTY }); load(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    await fetch(`/api/teachers/${teacherId}/notes?noteId=${noteId}`, { method: 'DELETE' });
    load();
  };

  const filtered = notes.filter(n =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const className = (id: string) => classes.find((c: any) => c.id === id)?.name || id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className={`text-base font-semibold ${txt}`}>Notes <span className={`text-sm font-normal ${sub}`}>({filtered.length})</span></h3>
        <button onClick={() => { setShowForm(true); setForm({ ...EMPTY }); }} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">+ New Note</button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <svg className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${sub}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterType('')} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${!filterType ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
          {NOTE_TYPES.map(t => (
            <button key={t} onClick={() => setFilterType(t === filterType ? '' : t)} className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filterType === t ? TYPE_COLORS[t] : isDark ? 'bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Note Form */}
      {showForm && (
        <div className={`p-4 rounded-xl border ${card} space-y-3`}>
          <div className="flex items-center justify-between"><h4 className={`text-sm font-semibold ${txt}`}>New Note</h4><button onClick={() => setShowForm(false)} className={`text-xs ${sub} hover:text-red-400`}>✕</button></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className={`text-xs ${sub}`}>Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Note title..." className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                {NOTE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs ${sub}`}>Class (Optional)</label>
              <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                <option value="">Select Class</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPrivate} onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))} className="w-4 h-4 rounded text-blue-600" />
                <span className={`text-xs ${sub}`}>🔒 Private note (only visible to you)</span>
              </label>
            </div>
          </div>
          <div>
            <label className={`text-xs ${sub}`}>Content *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Note content..." rows={4} className={`w-full mt-1 px-2 py-1.5 rounded-lg border text-sm resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save Note'}</button>
            <button onClick={() => setShowForm(false)} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-16 ${sub}`}><p className="text-4xl mb-3">🗒️</p><p className="font-medium">{search ? 'No notes match your search' : 'No notes yet'}</p><p className="text-xs mt-1">Create notes to remember important observations</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(n => (
            <div key={n.id} className={`p-4 rounded-xl border ${card} hover:border-blue-500/30 transition-all cursor-pointer`} onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[n.type] || TYPE_COLORS.general}`}>{n.type}</span>
                    {n.isPrivate && <span className={`text-xs ${sub}`}>🔒</span>}
                    {n.classId && <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{className(n.classId)}</span>}
                  </div>
                  <h4 className={`text-sm font-semibold ${txt}`}>{n.title}</h4>
                  <p className={`text-xs mt-1 ${sub} ${expandedId !== n.id ? 'line-clamp-2' : ''}`}>{n.content}</p>
                  <p className={`text-xs mt-1.5 ${sub}`}>{formatDate(n.createdAt)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(n.id); }} className="shrink-0 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
