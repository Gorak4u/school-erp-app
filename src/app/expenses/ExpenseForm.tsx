// @ts-nocheck
'use client';
import { fmt, PAYMENT_METHODS } from './utils';

interface Props {
  form: any;
  setForm: (f: any) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  editing: boolean;
  categories: any[];
  budgets: any[];
  isDark: boolean;
}

export default function ExpenseForm({ form, setForm, onSave, onClose, saving, editing, categories, budgets, isDark }: Props) {
  const inp = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const lbl = `block text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 flex items-center justify-between px-6 py-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editing ? '✏️ Edit Expense' : '+ New Expense'}</h2>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-full text-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>×</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={lbl}>Title *</label>
              <input className={inp} placeholder="e.g. Science Lab Equipment" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>

            <div>
              <label className={lbl}>Amount (₹) *</label>
              <input type="number" min="0" step="0.01" className={inp} placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>

            <div>
              <label className={lbl}>Date Incurred *</label>
              <input type="date" className={inp} value={form.dateIncurred} onChange={e => setForm({ ...form, dateIncurred: e.target.value })} />
            </div>

            <div>
              <label className={lbl}>Category *</label>
              <select className={inp} value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">— Select Category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div>
              <label className={lbl}>Priority</label>
              <select className={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className={lbl}>Vendor Name</label>
              <input className={inp} placeholder="Supplier / vendor name" value={form.vendorName} onChange={e => setForm({ ...form, vendorName: e.target.value })} />
            </div>

            <div>
              <label className={lbl}>Payment Method</label>
              <select className={inp} value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="">— Select —</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
              </select>
            </div>

            <div>
              <label className={lbl}>Link to Budget</label>
              <select className={inp} value={form.budgetId} onChange={e => setForm({ ...form, budgetId: e.target.value })}>
                <option value="">No budget</option>
                {budgets.filter(b => b.status === 'active').map(b => (
                  <option key={b.id} value={b.id}>{b.name} · {fmt(b.remainingAmount)} remaining</option>
                ))}
              </select>
            </div>

            <div>
              <label className={lbl}>Academic Year</label>
              <input className={inp} placeholder="2024-25" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <label className={lbl}>Description</label>
              <textarea rows={2} className={`${inp} resize-none`} placeholder="Details about this expense..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <label className={lbl}>Remarks</label>
              <input className={inp} placeholder="Internal notes" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>
        </div>

        <div className={`sticky bottom-0 flex gap-3 justify-end px-6 py-4 border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <button onClick={onClose} disabled={saving} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
          <button onClick={onSave} disabled={saving || !form.title || !form.amount || !form.categoryId} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : editing ? 'Update Expense' : 'Create Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}
