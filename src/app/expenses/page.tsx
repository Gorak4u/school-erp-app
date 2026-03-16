// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import ExpenseDashboard from './ExpenseDashboard';
import ExpenseList from './ExpenseList';
import BudgetManager from './BudgetManager';
import CategoryManager from './CategoryManager';
import ExpenseReports from './ExpenseReports';
import ExpenseForm from './ExpenseForm';
import { DEFAULT_CATEGORIES } from './utils';

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
  { id: 'expenses',   label: 'Expenses',   icon: '💸' },
  { id: 'budgets',    label: 'Budgets',    icon: '🎯' },
  { id: 'categories', label: 'Categories', icon: '🗂️' },
  { id: 'reports',    label: 'Reports',    icon: '📈' },
];

const BLANK_EXP_FORM = { title: '', description: '', amount: '', categoryId: '', dateIncurred: new Date().toISOString().split('T')[0], paymentMethod: '', priority: 'medium', vendorName: '', remarks: '', academicYear: '2024-25', budgetId: '' };
const BLANK_BUDGET_FORM = { name: '', description: '', totalAmount: '', categoryId: '', startDate: '', endDate: '', alertThreshold: '80', academicYear: '2024-25' };
const BLANK_CAT_FORM = { name: '', description: '', color: '#6366f1', icon: '📦', parentId: '' };

export default function ExpensesPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bg   = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const card = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const sub  = isDark ? 'text-gray-400' : 'text-gray-500';
  const inp  = `px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState({ text: '', type: '' });

  // Academic years
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedAY,    setSelectedAY]    = useState('all');

  // Data
  const [analytics,   setAnalytics]   = useState<any>(null);
  const [categories,  setCategories]  = useState<any[]>([]);
  const [budgets,     setBudgets]     = useState<any[]>([]);
  const [expenses,    setExpenses]    = useState<any[]>([]);
  const [nextCursor,  setNextCursor]  = useState<string | null>(null);
  const [hasMore,     setHasMore]     = useState(false);
  const [totalCount,  setTotalCount]  = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  // Filters
  const [expFilters, setExpFilters] = useState({ status: 'all', categoryId: '', dateFrom: '', dateTo: '', search: '', priority: 'all', academicYear: 'all' });

  // Expense form
  const [expFormShow, setExpFormShow] = useState(false);
  const [editingExp,  setEditingExp]  = useState<any>(null);
  const [expForm,     setExpForm]     = useState({ ...BLANK_EXP_FORM });

  // Budget form
  const [budgetFormShow, setBudgetFormShow] = useState(false);
  const [editingBudget,  setEditingBudget]  = useState<any>(null);
  const [budgetForm,     setBudgetForm]     = useState({ ...BLANK_BUDGET_FORM });

  // Category form
  const [catFormShow, setCatFormShow] = useState(false);
  const [editingCat,  setEditingCat]  = useState<any>(null);
  const [catForm,     setCatForm]     = useState({ ...BLANK_CAT_FORM });

  // Action modal (approve / reject / pay)
  const [actionModal, setActionModal] = useState<{ expense: any; action: string } | null>(null);
  const [actionNote,  setActionNote]  = useState('');

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  };

  // ── Fetchers ──────────────────────────────────────────────────────────────────
  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await fetch('/api/school-structure/academic-years');
      if (res.ok) setAcademicYears((await res.json()).academicYears || []);
    } catch {}
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/expenses/analytics?academicYear=${selectedAY}`);
      if (res.ok) setAnalytics(await res.json());
    } catch {}
  }, [selectedAY]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/expenses/categories?includeSubcategories=false');
      if (res.ok) setCategories((await res.json()).categories || []);
    } catch {}
  }, []);

  const fetchBudgets = useCallback(async () => {
    try {
      const p = new URLSearchParams();
      if (selectedAY !== 'all') p.set('academicYear', selectedAY);
      const res = await fetch(`/api/budgets?${p}`);
      if (res.ok) setBudgets((await res.json()).budgets || []);
    } catch {}
  }, [selectedAY]);

  const buildExpUrl = (cursor?: string) => {
    const p = new URLSearchParams();
    p.set('limit', '50');
    if (cursor) p.set('cursor', cursor);
    if (expFilters.status !== 'all') p.set('status', expFilters.status);
    if (expFilters.categoryId) p.set('categoryId', expFilters.categoryId);
    if (expFilters.dateFrom) p.set('dateFrom', expFilters.dateFrom);
    if (expFilters.dateTo) p.set('dateTo', expFilters.dateTo);
    if (expFilters.search) p.set('search', expFilters.search);
    if (expFilters.priority !== 'all') p.set('priority', expFilters.priority);
    if (selectedAY !== 'all') p.set('academicYear', selectedAY);
    return `/api/expenses?${p}`;
  };

  const fetchExpenses = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(buildExpUrl());
      if (res.ok) {
        const d = await res.json();
        setExpenses(d.expenses || []);
        setNextCursor(d.nextCursor);
        setHasMore(d.hasMore);
        setTotalCount(d.total);
      }
    } finally { setLoadingList(false); }
  }, [expFilters, selectedAY]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(buildExpUrl(nextCursor));
      if (res.ok) {
        const d = await res.json();
        setExpenses(prev => [...prev, ...(d.expenses || [])]);
        setNextCursor(d.nextCursor);
        setHasMore(d.hasMore);
      }
    } finally { setLoadingMore(false); }
  };

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => { fetchAcademicYears(); fetchCategories(); }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchAnalytics();
    if (activeTab === 'expenses')  fetchExpenses();
    if (activeTab === 'budgets')   fetchBudgets();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'reports')   fetchAnalytics();
  }, [activeTab, selectedAY]);

  useEffect(() => {
    if (activeTab === 'expenses') fetchExpenses();
  }, [expFilters]);

  // ── Category CRUD ─────────────────────────────────────────────────────────────
  const seedCategories = async () => {
    setSaving(true);
    let count = 0;
    for (const c of DEFAULT_CATEGORIES) {
      try {
        const res = await fetch('/api/expenses/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
        if (res.ok) count++;
      } catch {}
    }
    showMsg(`${count} default categories created`);
    fetchCategories();
    setSaving(false);
  };

  const saveCategory = async () => {
    setSaving(true);
    try {
      const url    = editingCat ? `/api/expenses/categories/${editingCat.id}` : '/api/expenses/categories';
      const method = editingCat ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(catForm) });
      const data   = await res.json();
      if (!res.ok) { showMsg(data.error || 'Failed', 'error'); return; }
      showMsg(editingCat ? 'Category updated' : 'Category created');
      setCatFormShow(false); setEditingCat(null); setCatForm({ ...BLANK_CAT_FORM });
      fetchCategories();
    } finally { setSaving(false); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Deactivate this category?')) return;
    const res  = await fetch(`/api/expenses/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { showMsg(data.error || 'Failed', 'error'); return; }
    showMsg('Category deactivated');
    fetchCategories();
  };

  // ── Budget CRUD ───────────────────────────────────────────────────────────────
  const saveBudget = async () => {
    setSaving(true);
    try {
      const url    = editingBudget ? `/api/budgets/${editingBudget.id}` : '/api/budgets';
      const method = editingBudget ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(budgetForm) });
      const data   = await res.json();
      if (!res.ok) { showMsg(data.error || 'Failed', 'error'); return; }
      showMsg(editingBudget ? 'Budget updated' : 'Budget created');
      setBudgetFormShow(false); setEditingBudget(null); setBudgetForm({ ...BLANK_BUDGET_FORM });
      fetchBudgets();
    } finally { setSaving(false); }
  };

  const deleteBudget = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
    if (!res.ok) { showMsg('Failed to delete', 'error'); return; }
    showMsg('Budget deleted');
    fetchBudgets();
  };

  // ── Expense CRUD ──────────────────────────────────────────────────────────────
  const saveExpense = async () => {
    setSaving(true);
    try {
      const url    = editingExp ? `/api/expenses/${editingExp.id}` : '/api/expenses';
      const method = editingExp ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...expForm, amount: Number(expForm.amount) }) });
      const data   = await res.json();
      if (!res.ok) { showMsg(data.error || 'Failed', 'error'); return; }
      showMsg(editingExp ? 'Expense updated' : 'Expense created');
      setExpFormShow(false); setEditingExp(null); setExpForm({ ...BLANK_EXP_FORM });
      fetchExpenses(); fetchAnalytics(); fetchBudgets();
    } finally { setSaving(false); }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    const res  = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { showMsg(data.error || 'Failed', 'error'); return; }
    showMsg('Expense deleted');
    fetchExpenses(); fetchAnalytics();
  };

  const openEditExpense = (e: any) => {
    setEditingExp(e);
    setExpForm({ title: e.title, description: e.description || '', amount: String(e.amount), categoryId: e.categoryId, dateIncurred: e.dateIncurred, paymentMethod: e.paymentMethod || '', priority: e.priority, vendorName: e.vendorName || '', remarks: e.remarks || '', academicYear: e.academicYear, budgetId: '' });
    setExpFormShow(true);
  };

  const openAddExpense = () => {
    setEditingExp(null);
    setExpForm({ ...BLANK_EXP_FORM, academicYear: selectedAY === 'all' ? '2024-25' : selectedAY });
    setExpFormShow(true);
  };

  const doAction = async () => {
    if (!actionModal) return;
    setSaving(true);
    try {
      const body: any = { action: actionModal.action };
      if (actionModal.action === 'approve') body.approvalNote = actionNote;
      if (actionModal.action === 'reject')  body.rejectionReason = actionNote;
      if (actionModal.action === 'pay')     body.paymentMethod = actionNote;
      const res  = await fetch(`/api/expenses/${actionModal.expense.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || 'Failed', 'error'); return; }
      showMsg(`Expense ${actionModal.action}d successfully`);
      setActionModal(null); setActionNote('');
      fetchExpenses(); fetchAnalytics(); fetchBudgets();
    } finally { setSaving(false); }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!expenses.length) return;
    const headers = ['Title', 'Category', 'Amount', 'Status', 'Priority', 'Date', 'Vendor', 'Receipt No', 'Requested By'];
    const rows = expenses.map(e => [e.title, e.category?.name || '', e.amount, e.status, e.priority, e.dateIncurred, e.vendorName || '', e.receiptNumber || '', e.requestedByEmail || '']);
    const csv  = [headers, ...rows].map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `expenses-${Date.now()}.csv` });
    a.click();
  };

  // ── Selected state (passed to ExpenseList) ─────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <AppLayout currentPage="expenses" title="Expense Management" theme={theme}>
      <div className={`min-h-screen ${bg} p-4 md:p-6`}>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>💸 Expense Management</h1>
            <p className={`text-sm mt-0.5 ${sub}`}>Track, manage and analyse all school expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedAY} onChange={e => { setSelectedAY(e.target.value); setExpFilters(f => ({ ...f, academicYear: e.target.value })); }} className={`${inp} w-auto`}>
              <option value="all">All Years</option>
              {academicYears.map(y => <option key={y.id} value={y.year}>{y.name || y.year}</option>)}
            </select>
            <button onClick={openAddExpense} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              + Add Expense
            </button>
          </div>
        </div>

        {/* Toast */}
        {msg.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500/30 text-green-600'}`}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl mb-6 border overflow-x-auto ${card}`}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'bg-blue-600 text-white shadow-sm' :
                isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <ExpenseDashboard analytics={analytics} isDark={isDark} onAddExpense={openAddExpense} />
        )}

        {activeTab === 'expenses' && (
          <ExpenseList
            expenses={expenses}
            loading={loadingList}
            loadingMore={loadingMore}
            hasMore={hasMore}
            totalCount={totalCount}
            selected={selected}
            setSelected={setSelected}
            filters={expFilters}
            setFilters={setExpFilters}
            categories={categories}
            onLoadMore={loadMore}
            onAdd={openAddExpense}
            onEdit={openEditExpense}
            onDelete={deleteExpense}
            onAction={(e, action) => { setActionModal({ expense: e, action }); setActionNote(''); }}
            onExport={exportCSV}
            isDark={isDark}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetManager
            budgets={budgets}
            loading={loading}
            isDark={isDark}
            categories={categories}
            form={budgetForm}
            setForm={setBudgetForm}
            showForm={budgetFormShow}
            setShowForm={setBudgetFormShow}
            editing={editingBudget}
            setEditing={setEditingBudget}
            onSave={saveBudget}
            onDelete={deleteBudget}
            saving={saving}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            isDark={isDark}
            form={catForm}
            setForm={setCatForm}
            showForm={catFormShow}
            setShowForm={setCatFormShow}
            editing={editingCat}
            setEditing={setEditingCat}
            onSave={saveCategory}
            onDelete={deleteCategory}
            onSeedDefaults={seedCategories}
            saving={saving}
          />
        )}

        {activeTab === 'reports' && (
          <ExpenseReports
            analytics={analytics}
            isDark={isDark}
            onExport={exportCSV}
            academicYear={selectedAY}
          />
        )}
      </div>

      {/* ── Expense Form Modal ──────────────────────────────────────────────── */}
      {expFormShow && (
        <ExpenseForm
          form={expForm}
          setForm={setExpForm}
          onSave={saveExpense}
          onClose={() => { setExpFormShow(false); setEditingExp(null); }}
          saving={saving}
          editing={!!editingExp}
          categories={categories}
          budgets={budgets}
          isDark={isDark}
        />
      )}

      {/* ── Action Modal (Approve / Reject / Pay) ───────────────────────────── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-lg font-bold ${text}`}>
                {actionModal.action === 'approve' ? '✅ Approve Expense' : actionModal.action === 'reject' ? '❌ Reject Expense' : '💳 Mark as Paid'}
              </h2>
              <button onClick={() => setActionModal(null)} className={`w-8 h-8 flex items-center justify-center rounded-full text-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>×</button>
            </div>
            <div className="p-6">
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-semibold ${text}`}>{actionModal.expense.title}</p>
                <p className={`text-lg font-bold mt-1 ${text}`}>
                  {actionModal.expense.amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </p>
                <p className={`text-xs mt-0.5 ${sub}`}>{actionModal.expense.category?.name} · {actionModal.expense.dateIncurred}</p>
              </div>
              <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${sub}`}>
                {actionModal.action === 'approve' ? 'Approval Note (optional)' : actionModal.action === 'reject' ? 'Rejection Reason *' : 'Payment Method (optional)'}
              </label>
              <textarea rows={3} value={actionNote} onChange={e => setActionNote(e.target.value)}
                placeholder={actionModal.action === 'reject' ? 'Reason for rejection...' : actionModal.action === 'approve' ? 'Optional note for approver...' : 'cash, upi, bank_transfer...'}
                className={`w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`} />
            </div>
            <div className={`flex gap-3 justify-end px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setActionModal(null)} disabled={saving} className={`px-4 py-2 rounded-lg text-sm font-medium border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
              <button onClick={doAction} disabled={saving || (actionModal.action === 'reject' && !actionNote.trim())}
                className={`px-5 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
                  actionModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  actionModal.action === 'reject'  ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}>
                {saving ? 'Processing...' : actionModal.action === 'approve' ? 'Approve' : actionModal.action === 'reject' ? 'Reject' : 'Mark Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
