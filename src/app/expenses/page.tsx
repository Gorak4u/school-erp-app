// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import ExpenseDashboard from './components/ExpenseDashboard';
import ExpenseList from './components/ExpenseList';
import BudgetManager from './components/BudgetManager';
import CategoryManager from './components/CategoryManager';
import ExpenseReports from './components/ExpenseReports';
import ExpenseForm from './ExpenseForm';
import { DEFAULT_CATEGORIES } from './utils';
import { usePermissions } from '@/hooks/usePermissions';

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
  { id: 'expenses',   label: 'Expenses',   icon: '💸' },
  { id: 'budgets',    label: 'Budgets',    icon: '🎯' },
  { id: 'categories', label: 'Categories', icon: '🗂️' },
  { id: 'reports',    label: 'Reports',    icon: '📈' },
];

const BLANK_EXP_FORM = { title: '', description: '', amount: '', categoryId: '', dateIncurred: new Date().toISOString().split('T')[0], paymentMethod: '', priority: 'medium', vendorName: '', remarks: '', academicYear: '', budgetId: '' };
const BLANK_BUDGET_FORM = { name: '', description: '', totalAmount: '', categoryId: '', startDate: '', endDate: '', alertThreshold: '80', academicYear: '2024-25' };
const BLANK_CAT_FORM = { name: '', description: '', color: '#6366f1', icon: '📦', parentId: '' };

export default function ExpensesPage() {
  const { theme } = useTheme();
  const { isAdmin, isSuperAdmin, hasPermission } = usePermissions();
  const isDark = theme === 'dark';
  const canCreateExpenses = isSuperAdmin || isAdmin || hasPermission('create_expenses');

  // Modern UI template CSS variables
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-600';
  const heading = isDark ? 'text-white' : 'text-gray-900';

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
  
  // Budget filters
  const [budgetSearch, setBudgetSearch] = useState('');
  const [budgetStatusFilter, setBudgetStatusFilter] = useState('all');
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState('');
  const [budgetSortBy, setBudgetSortBy] = useState('name');
  const [budgetSortOrder, setBudgetSortOrder] = useState('asc');
  
  // Category filters
  const [catSearch, setCatSearch] = useState('');
  const [catStatusFilter, setCatStatusFilter] = useState('all');
  const [catSortBy, setCatSortBy] = useState('name');
  const [catSortOrder, setCatSortOrder] = useState('asc');
  
  // Reports filters
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('');

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
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3500);
  };

  // ── Fetchers ──────────────────────────────────────────────────────────────────
  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await fetch('/api/school-structure/academic-years');
      if (res.ok) {
        const data = (await res.json()).academicYears || [];
        setAcademicYears(data);
        
        // Auto-select active academic year if available
        const activeYear = data.find((ay: any) => ay.isActive);
        if (activeYear) {
          setSelectedAY(activeYear.year);
        } else if (data.length > 0) {
          // Fallback to first available year if no active year found
          setSelectedAY(data[0].year);
        }
      }
    } catch {}
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/expenses/analytics?academicYear=${selectedAY}`);
      if (res.ok) setAnalytics(await res.json());
    } catch {}
  }, [selectedAY]);

  // ── Category CRUD ─────────────────────────────────────────────────────────────
  const seedCategories = async () => {
    setSaving(true);
    let count = 0;
    const createdCategories = [];
    for (const c of DEFAULT_CATEGORIES) {
      try {
        const res = await fetch('/api/expenses/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
        if (res.ok) {
          count++;
          createdCategories.push(c);
        }
      } catch {}
    }
    
    // Update categories state directly to avoid infinite loop
    if (count > 0) {
      setCategories(createdCategories);
      showMsg(`${count} default categories created`);
    }
    
    setSaving(false);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/expenses/categories?includeSubcategories=false');
      const data = await res.json();
      const categories = data.categories || [];
      setCategories(categories);
      
      // Auto-seed default categories if none exist
      if (categories.length === 0) {
        console.log('No expense categories found, creating default categories...');
        await seedCategories();
      }
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
      
      let res: Response;
      
      // Handle file upload
      if (expForm.receiptFile) {
        const formData = new FormData();
        formData.append('title', expForm.title);
        formData.append('description', expForm.description || '');
        formData.append('amount', String(Number(expForm.amount)));
        formData.append('categoryId', expForm.categoryId);
        formData.append('dateIncurred', expForm.dateIncurred);
        formData.append('paymentMethod', expForm.paymentMethod || '');
        formData.append('priority', expForm.priority);
        formData.append('vendorName', expForm.vendorName || '');
        formData.append('remarks', expForm.remarks || '');
        formData.append('academicYear', expForm.academicYear);
        formData.append('budgetId', expForm.budgetId || '');
        formData.append('receiptFile', expForm.receiptFile);
        
        res = await fetch(url, { method, body: formData });
      } else {
        // Regular JSON subtextmission without file
        res = await fetch(url, { 
          method, 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ...expForm, amount: Number(expForm.amount) }) 
        });
      }
      
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || 'Failed', 'error'); return; }
      
      // Handle X-Toast header from API
      const toastHeader = res.headers.get('X-Toast');
      if (toastHeader) {
        try {
          const toast = JSON.parse(toastHeader);
          showMsg(toast.message, toast.type === 'error' ? 'error' : 'success');
        } catch {
          showMsg(editingExp ? 'Expense updated' : 'Expense created');
        }
      } else {
        showMsg(editingExp ? 'Expense updated' : 'Expense created');
      }
      
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
    // Get the active academic year or fallback to the first available year
    const activeAcademicYear = academicYears.find(ay => ay.isActive)?.year || 
                               academicYears[0]?.year || 
                               new Date().getFullYear().toString();
    setExpForm({ ...BLANK_EXP_FORM, academicYear: selectedAY === 'all' ? activeAcademicYear : selectedAY });
    setExpFormShow(true);
  };

  const doAction = async () => {
    if (!actionModal) return;
    
    // Prevent duplicate actions
    const actionKey = `${actionModal.expense.id}-${actionModal.action}`;
    if (processingActions.has(actionKey)) {
      showMsg('Action already in progress', 'error');
      return;
    }
    
    setSaving(true);
    setProcessingActions(prev => new Set(prev).add(actionKey));
    
    try {
      const body: any = { action: actionModal.action };
      if (actionModal.action === 'approve') body.approvalNote = actionNote;
      if (actionModal.action === 'reject')  body.rejectionReason = actionNote;
      if (actionModal.action === 'pay')     body.paymentMethod = actionNote;
      const res  = await fetch(`/api/expenses/${actionModal.expense.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { 
        showMsg(data.error || 'Failed', 'error'); 
        return; 
      }
      
      // Handle X-Toast header from API
      const toastHeader = res.headers.get('X-Toast');
      if (toastHeader) {
        try {
          const toast = JSON.parse(toastHeader);
          showMsg(toast.message, toast.type === 'error' ? 'error' : 'success');
        } catch {
          showMsg(`Expense ${actionModal.action}d successfully`);
        }
      } else {
        showMsg(`Expense ${actionModal.action}d successfully`);
      }
      
      setActionModal(null); setActionNote('');
      fetchExpenses(); fetchAnalytics(); fetchBudgets();
    } finally { 
      setSaving(false);
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
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
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-4 md:p-6`}>
        <div className="space-y-8 pb-8">
          {/* Modern Header */}
          <div className={`rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-8 shadow-lg`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className={`text-3xl font-bold ${text}`}>Expense Management</h1>
                    <p className={`text-sm ${subtext}`}>
                      Track, manage and analyse all school expenses efficiently
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className={`relative ${isDark ? 'bg-gray-800/50' : 'bg-white/50'} rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center gap-2 px-4 py-2">
                    <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <select 
                      value={selectedAY} 
                      onChange={e => { setSelectedAY(e.target.value); setExpFilters(f => ({ ...f, academicYear: e.target.value })); }} 
                      className={`bg-transparent border-0 text-sm font-medium focus:outline-none focus:ring-0 ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                      <option value="all">All Academic Years</option>
                      {academicYears.map(y => (
                        <option key={y.id} value={y.year}>
                          {y.isActive ? '📚 ' : ''}{y.name || y.year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {canCreateExpenses && (
                  <button 
                    onClick={openAddExpense} 
                    className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg ${
                      isDark 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Expense
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Toast messages */}
          {msg.text && (
            <div className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
              msg.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : 'bg-green-500/10 border-green-500/20 text-green-400'
            }`}>
              {msg.type === 'error' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {msg.text}
            </div>
          )}

          {/* Modern Tabs */}
          <div className={`rounded-2xl border p-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
            <div className="flex gap-1">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === t.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : isDark 
                        ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <ExpenseDashboard analytics={analytics} isDark={isDark} categories={categories} academicYear={selectedAY} />
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
            budgets={budgets} loading={loading} isDark={isDark} categories={categories}
            form={budgetForm} setForm={setBudgetForm} showForm={budgetFormShow} setShowForm={setBudgetFormShow}
            editing={editingBudget} setEditing={setEditingBudget} onSave={saveBudget} onDelete={deleteBudget} saving={saving}
            search={budgetSearch} setSearch={setBudgetSearch}
            statusFilter={budgetStatusFilter} setStatusFilter={setBudgetStatusFilter}
            categoryFilter={budgetCategoryFilter} setCategoryFilter={setBudgetCategoryFilter}
            sortBy={budgetSortBy} setSortBy={setBudgetSortBy}
            sortOrder={budgetSortOrder} setSortOrder={setBudgetSortOrder}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories} isDark={isDark}
            form={catForm} setForm={setCatForm} showForm={catFormShow} setShowForm={setCatFormShow}
            editing={editingCat} setEditing={setEditingCat} onSave={saveCategory} onDelete={deleteCategory} onSeedDefaults={seedCategories} saving={saving}
            search={catSearch} setSearch={setCatSearch}
            statusFilter={catStatusFilter} setStatusFilter={setCatStatusFilter}
            sortBy={catSortBy} setSortBy={setCatSortBy}
            sortOrder={catSortOrder} setSortOrder={setCatSortOrder}
          />
        )}

        {activeTab === 'reports' && (
          <ExpenseReports 
            analytics={analytics} isDark={isDark} onExport={exportCSV} academicYear={selectedAY}
            dateFrom={reportDateFrom} dateTo={reportDateTo} setDateFrom={setReportDateFrom} setDateTo={setReportDateTo}
            categoryFilter={reportCategoryFilter} setCategoryFilter={setReportCategoryFilter} categories={categories}
            refreshAnalytics={fetchAnalytics}
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
          academicYears={academicYears}
        />
      )}

      {/* ── Action Modal (Approve / Reject / Pay) ───────────────────────────── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-lg font-bold ${text}`}>
                {actionModal.action === 'approve' ? '✅ Approve Expense' : actionModal.action === 'reject' ? '❌ Reject Expense' : '💳 Mark as Paid'}
              </h2>
              <button onClick={() => setActionModal(null)} className={`w-8 h-8 flex items-center justify-center rounded-xl text-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>×</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Expense Details */}
              <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-semibold ${text}`}>{actionModal.expense.title}</p>
                <p className={`text-lg font-bold mt-1 ${text}`}>
                  {actionModal.expense.amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </p>
                <p className={`text-xs mt-0.5 ${subtext}`}>{actionModal.expense.category?.name} · {actionModal.expense.dateIncurred}</p>
                {actionModal.expense.vendorName && (
                  <p className={`text-xs mt-1 ${subtext}`}>Vendor: {actionModal.expense.vendorName}</p>
                )}
                {actionModal.expense.description && (
                  <p className={`text-xs mt-2 ${subtext}`}>{actionModal.expense.description}</p>
                )}
              </div>

              {/* Document Preview Section */}
              {actionModal.expense.receiptUrl && (
                <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'} flex items-center gap-2`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Attached Receipt/Bill
                    </h3>
                    <a 
                      href={actionModal.expense.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                        isDark 
                          ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      Open in New Tab ↗
                    </a>
                  </div>
                  
                  <div className="rounded-lg overflow-hidden border border-opacity-20">
                    {actionModal.expense.receiptUrl.toLowerCase().includes('.pdf') ? (
                      // PDF Preview
                      <div className="relative">
                        <iframe 
                          src={`${actionModal.expense.receiptUrl}#view=FitH&toolbar=0`}
                          className="w-full h-64 border-0"
                          title="Receipt Preview"
                        />
                        <div className={`absolute bottom-0 left-0 right-0 p-2 text-center ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}>
                          <p className={`text-xs ${subtext}`}>PDF Document - Click "Open in New Tab" for full view</p>
                        </div>
                      </div>
                    ) : (
                      // Image Preview
                      <div className="relative group">
                        <img 
                          src={actionModal.expense.receiptUrl} 
                          alt="Receipt/Bill"
                          className="w-full h-64 object-contain bg-white"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <a 
                            href={actionModal.expense.receiptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-3 py-1 rounded-lg text-sm font-medium shadow-lg"
                          >
                            View Full Size
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Note */}
              <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${subtext}`}>
                {actionModal.action === 'approve' ? 'Approval Note (optional)' : actionModal.action === 'reject' ? 'Rejection Reason *' : 'Payment Method (optional)'}
              </label>
              <textarea rows={3} value={actionNote} onChange={e => setActionNote(e.target.value)}
                placeholder={actionModal.action === 'reject' ? 'Reason for rejection...' : actionModal.action === 'approve' ? 'Optional note for approver...' : 'cash, upi, bank_transfer...'}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`} />
            </div>
            
            <div className={`flex gap-3 justify-end px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setActionModal(null)} disabled={saving} className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}>Cancel</button>
              <button onClick={doAction} disabled={saving || (actionModal.action === 'reject' && !actionNote.trim())}
                className={`px-5 py-2.5 text-white rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 ${
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
        </div>
    </AppLayout>
  );
}
