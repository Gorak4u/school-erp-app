// @ts-nocheck
'use client';
import { DEFAULT_CATEGORIES } from './utils';

interface Props {
  categories: any[];
  isDark: boolean;
  form: any;
  setForm: (f: any) => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editing: any;
  setEditing: (v: any) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onSeedDefaults: () => void;
  saving: boolean;
}

const ICON_OPTIONS = ['📦','👥','🏗️','📚','🚌','⚡','🎉','🗂️','💊','🖥️','🏆','🎨','🔧','📋','🏫','🌿'];
const COLOR_OPTIONS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#6b7280','#ef4444','#f97316'];

export default function CategoryManager({
  categories, isDark, form, setForm, showForm, setShowForm, editing, setEditing, onSave, onDelete, onSeedDefaults, saving,
}: Props) {
  const card = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-500';
  const inp  = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const lbl  = `block text-xs font-semibold uppercase tracking-wide mb-1 ${sub}`;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', color: '#6366f1', icon: '📦', parentId: '' });
    setShowForm(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '', color: c.color || '#6366f1', icon: c.icon || '📦', parentId: c.parentId || '' });
    setShowForm(true);
  };

  const parentCats = categories.filter(c => !c.parentId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className={`text-lg font-bold ${text}`}>Expense Categories</h2>
          <p className={`text-sm ${sub}`}>{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} configured</p>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <button onClick={onSeedDefaults} disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
              {saving ? 'Creating...' : '⚡ Seed Defaults'}
            </button>
          )}
          <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ New Category</button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center ${card}`}>
          <div className="text-5xl mb-3">🗂️</div>
          <p className={`font-medium ${text}`}>No categories yet</p>
          <p className={`text-sm mt-1 mb-5 ${sub}`}>Create categories to organise your expenses, or seed the defaults to get started fast.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={onSeedDefaults} disabled={saving} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>
              {saving ? 'Creating...' : '⚡ Seed Default Categories'}
            </button>
            <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Custom Category</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map(c => (
            <div key={c.id} className={`rounded-xl border p-4 group hover:shadow-md transition-shadow ${card}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: (c.color || '#6366f1') + '22' }}>
                    {c.icon || '📦'}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-sm truncate ${text}`}>{c.name}</h3>
                    {c.description && <p className={`text-xs truncate ${sub}`}>{c.description}</p>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: c.color || '#6366f1' }} />
                  <span className={`text-xs font-mono ${sub}`}>{c.color}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {typeof c._count?.expenses === 'number' && (
                <p className={`text-xs mb-3 ${sub}`}>{c._count.expenses} expense{c._count.expenses !== 1 ? 's' : ''}</p>
              )}

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(c)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                  ✏️ Edit
                </button>
                <button onClick={() => onDelete(c.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-lg font-bold ${text}`}>{editing ? '✏️ Edit Category' : '+ New Category'}</h2>
              <button onClick={() => setShowForm(false)} className={`w-8 h-8 flex items-center justify-center rounded-full text-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={lbl}>Name *</label>
                <input className={inp} placeholder="e.g. Staff & HR" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Description</label>
                <input className={inp} placeholder="Optional description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>Icon</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ICON_OPTIONS.map(i => (
                    <button key={i} onClick={() => setForm({ ...form, icon: i })}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${form.icon === i ? 'ring-2 ring-blue-500' : ''} ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Color</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Parent Category (optional)</label>
                <select className={inp} value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}>
                  <option value="">Top-level Category</option>
                  {parentCats.filter(c => c.id !== editing?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div className={`p-3 rounded-xl flex items-center gap-3 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: (form.color || '#6366f1') + '22' }}>
                  {form.icon || '📦'}
                </div>
                <div>
                  <p className={`text-sm font-medium ${text}`}>{form.name || 'Category Preview'}</p>
                  <p className={`text-xs ${sub}`}>{form.description || 'No description'}</p>
                </div>
              </div>
            </div>
            <div className={`flex gap-3 justify-end px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setShowForm(false)} disabled={saving} className={`px-4 py-2 rounded-lg text-sm font-medium border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
              <button onClick={onSave} disabled={saving || !form.name.trim()}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
