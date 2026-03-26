// @ts-nocheck
'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Import modern icons
import {
  TrendingUp,
  DollarSign,
  PieChart,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  X,
  Wallet,
  TrendingDown,
  Target,
  BarChart3,
  Receipt,
  Building,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Archive,
  Settings,
  Bell,
  FilterX,
  Zap,
  Shield,
  Award,
  Briefcase,
  Calculator,
  DollarSign as DollarIcon,
  MapPin,
  Bus,
  Car,
  UserPlus,
  Route,
  Wrench,
  Fuel,
  CreditCard as CreditCardIcon,
  AlertTriangle,
  UserCheck,
  Users2,
  Navigation
} from 'lucide-react';

// Enhanced Tabs matching transport page structure
const EXPENSE_TABS = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: TrendingUp, 
    description: 'Expense overview and analytics',
    gradient: 'from-blue-500 to-cyan-600'
  },
  { 
    id: 'expenses', 
    label: 'Expenses', 
    icon: DollarSign, 
    description: 'Manage expenses and transactions',
    gradient: 'from-purple-500 to-pink-600'
  },
  { 
    id: 'budgets', 
    label: 'Budgets', 
    icon: Target, 
    description: 'Budget management and tracking',
    gradient: 'from-emerald-500 to-teal-600'
  },
  { 
    id: 'categories', 
    label: 'Categories', 
    icon: Briefcase, 
    description: 'Expense categories and types',
    gradient: 'from-orange-500 to-red-600'
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: BarChart3, 
    description: 'Financial reports and insights',
    gradient: 'from-indigo-500 to-purple-600'
  },
];

const BLANK_EXP_FORM = { title: '', description: '', amount: '', categoryId: '', dateIncurred: new Date().toISOString().split('T')[0], paymentMethod: '', priority: 'medium', vendorName: '', remarks: '', academicYear: '', budgetId: '' };
const BLANK_BUDGET_FORM = { name: '', description: '', totalAmount: '', categoryId: '', startDate: '', endDate: '', alertThreshold: '80', academicYear: '2024-25' };
const BLANK_CAT_FORM = { name: '', description: '', color: '#6366f1', icon: '📦', parentId: '' };

export default function ExpensesPage() {
  const { theme } = useTheme();
  const { isAdmin, isSuperAdmin, hasPermission } = usePermissions();
  const isDark = theme === 'dark';
  const canCreateExpenses = isSuperAdmin || isAdmin || hasPermission('create_expenses');

  // Modern theme configuration matching transport page
  const themeConfig = useMemo(() => ({
    bg: isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-white via-gray-50 to-white',
    border: isDark ? 'border-gray-700/50' : 'border-gray-200/50',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      muted: isDark ? 'text-gray-500' : 'text-gray-500',
      accent: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    card: isDark 
      ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-sm' 
      : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200/50 backdrop-blur-sm',
    input: isDark 
      ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20' 
      : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20',
    button: {
      primary: isDark 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25' 
        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25',
      secondary: isDark 
        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50 hover:border-gray-500/50' 
        : 'bg-white/50 hover:bg-gray-100/50 text-gray-700 border-gray-300/50 hover:border-gray-400/50',
      danger: isDark 
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25' 
        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25',
      success: isDark 
        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25' 
        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25',
    },
    gradients: {
      primary: 'from-blue-500 to-cyan-600',
      secondary: 'from-purple-500 to-pink-600',
      success: 'from-green-500 to-emerald-600',
      warning: 'from-orange-500 to-red-600',
      danger: 'from-red-500 to-pink-600',
      info: 'from-indigo-500 to-purple-600',
    }
  }), [isDark]);

  // Helper functions matching transport page
  const getCardClass = () => themeConfig.card;
  const getInputClass = () => themeConfig.input;
  const getBtnClass = (type: 'primary' | 'secondary' | 'danger' | 'success' = 'primary') => themeConfig.button[type];
  const getTextClass = (type: 'primary' | 'secondary' | 'muted' | 'accent' = 'primary') => themeConfig.text[type];

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

  // World-Class AI-Powered Button Component
  const WorldClassButton = ({ 
    onClick, 
    children, 
    variant = 'primary',
    size = 'sm',
    disabled = false,
    icon = null,
    loading = false
  }: {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    size?: 'xs' | 'sm' | 'md';
    disabled?: boolean;
    icon?: React.ReactNode;
    loading?: boolean;
  }) => {
    const variants = {
      primary: `bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-purple-600`,
      secondary: `border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`,
      success: `bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:from-green-600 hover:to-emerald-600`,
      danger: `bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-pink-600`
    };
    
    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-4 py-2.5 text-sm',
      md: 'px-5 py-3 text-sm'
    };
    
    return (
      <motion.button
        whileHover={{ scale: disabled || loading ? 1 : 1.05 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          ${variants[variant]}
          ${sizes[size]}
          rounded-xl font-bold transition-all duration-300 transform ${
            disabled || loading
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-xl active:scale-95'
          } flex items-center justify-center gap-2`}
      >
        {loading && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4"
          >
            🔄
          </motion.div>
        )}
        {!loading && icon && <span className="text-sm">{icon}</span>}
        {children}
      </motion.button>
    );
  };

  return (
    <AppLayout currentPage="expenses" title="Expense Management">
      <div className="space-y-0 pb-6">
        {/* Modern Tabs matching transport page */}
        <div className="relative">
          <div className={`flex space-x-1 p-1 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm border ${themeConfig.border}`}>
            {EXPENSE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 relative overflow-hidden group ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                    : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:scale-105`
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-100`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">
                  <tab.icon className="w-4 h-4" />
                </span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Tab Description */}
          <div className="mt-4 text-center">
            <p className={`text-sm ${getTextClass('secondary')}`}>
              {EXPENSE_TABS.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content matching transport page */}
        <div className="transition-all duration-300">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <ExpenseDashboard
              analytics={analytics}
              isDark={isDark}
              categories={categories}
              academicYear={selectedAY}
              card={getCardClass()}
              text={getTextClass('primary')}
              subtext={getTextClass('secondary')}
              label={getTextClass('primary')}
              input={getInputClass()}
              btnPrimary={getBtnClass('primary')}
              btnSecondary={getBtnClass('secondary')}
            />
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${EXPENSE_TABS.find(t => t.id === 'expenses')?.gradient}`}>
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Expense Management</h2>
                    <p className={`text-sm ${getTextClass('secondary')}`}>Manage expenses and transactions</p>
                  </div>
                </div>
                <WorldClassButton
                  onClick={openAddExpense}
                  variant="primary"
                  icon="➕"
                >
                  Add Expense
                </WorldClassButton>
              </div>

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
                card={getCardClass()}
                text={getTextClass('primary')}
                subtext={getTextClass('secondary')}
                label={getTextClass('primary')}
                input={getInputClass()}
                btnPrimary={getBtnClass('primary')}
                btnSecondary={getBtnClass('secondary')}
              />
            </motion.div>
          )}

          {/* Budgets Tab */}
          {activeTab === 'budgets' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${EXPENSE_TABS.find(t => t.id === 'budgets')?.gradient}`}>
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Budget Management</h2>
                    <p className={`text-sm ${getTextClass('secondary')}`}>Budget management and tracking</p>
                  </div>
                </div>
                <WorldClassButton
                  onClick={() => {
                    setEditingBudget(null);
                    setBudgetForm({ ...BLANK_BUDGET_FORM });
                    setBudgetFormShow(true);
                  }}
                  variant="primary"
                  icon="➕"
                >
                  Add Budget
                </WorldClassButton>
              </div>

              <BudgetManager
                budgets={budgets} loading={loading} isDark={isDark} categories={categories}
                form={budgetForm} setForm={setBudgetForm} showForm={budgetFormShow} setShowForm={setBudgetFormShow}
                editing={editingBudget} setEditing={setEditingBudget} onSave={saveBudget} onDelete={deleteBudget} saving={saving}
                search={budgetSearch} setSearch={setBudgetSearch}
                statusFilter={budgetStatusFilter} setStatusFilter={setBudgetStatusFilter}
                categoryFilter={budgetCategoryFilter} setCategoryFilter={setBudgetCategoryFilter}
                sortBy={budgetSortBy} setSortBy={setBudgetSortBy}
                sortOrder={budgetSortOrder} setSortOrder={setBudgetSortOrder}
                card={getCardClass()}
                text={getTextClass('primary')}
                subtext={getTextClass('secondary')}
                label={getTextClass('primary')}
                input={getInputClass()}
                btnPrimary={getBtnClass('primary')}
                btnSecondary={getBtnClass('secondary')}
              />
            </motion.div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${EXPENSE_TABS.find(t => t.id === 'categories')?.gradient}`}>
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Category Management</h2>
                    <p className={`text-sm ${getTextClass('secondary')}`}>Expense categories and types</p>
                  </div>
                </div>
                <WorldClassButton
                  onClick={() => {
                    setEditingCat(null);
                    setCatForm({ ...BLANK_CAT_FORM });
                    setCatFormShow(true);
                  }}
                  variant="primary"
                  icon="➕"
                >
                  Add Category
                </WorldClassButton>
              </div>

              <CategoryManager
                categories={categories} isDark={isDark}
                form={catForm} setForm={setCatForm} showForm={catFormShow} setShowForm={setCatFormShow}
                editing={editingCat} setEditing={setEditingCat} onSave={saveCategory} onDelete={deleteCategory} onSeedDefaults={seedCategories} saving={saving}
                search={catSearch} setSearch={setCatSearch}
                statusFilter={catStatusFilter} setStatusFilter={setCatStatusFilter}
                sortBy={catSortBy} setSortBy={setCatSortBy}
                sortOrder={catSortOrder} setSortOrder={setCatSortOrder}
                card={getCardClass()}
                text={getTextClass('primary')}
                subtext={getTextClass('secondary')}
                label={getTextClass('primary')}
                input={getInputClass()}
                btnPrimary={getBtnClass('primary')}
                btnSecondary={getBtnClass('secondary')}
              />
            </motion.div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${EXPENSE_TABS.find(t => t.id === 'reports')?.gradient}`}>
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Financial Reports</h2>
                    <p className={`text-sm ${getTextClass('secondary')}`}>Financial reports and insights</p>
                  </div>
                </div>
                <button
                  onClick={exportCSV}
                  className={getBtnClass('secondary')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </button>
              </div>

              <ExpenseReports 
                analytics={analytics} isDark={isDark} onExport={exportCSV} academicYear={selectedAY}
                dateFrom={reportDateFrom} dateTo={reportDateTo} setDateFrom={setReportDateFrom} setDateTo={setReportDateTo}
                categoryFilter={reportCategoryFilter} setCategoryFilter={setReportCategoryFilter} categories={categories}
                refreshAnalytics={fetchAnalytics}
                card={getCardClass()}
                text={getTextClass('primary')}
                subtext={getTextClass('secondary')}
                label={getTextClass('primary')}
                input={getInputClass()}
                btnPrimary={getBtnClass('primary')}
                btnSecondary={getBtnClass('secondary')}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Expense Form Modal with Animations ──────────────────────────────────────── */}
      <AnimatePresence>
        {expFormShow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl"
            >
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
                card={getCardClass()}
                text={getTextClass('primary')}
                subtext={getTextClass('secondary')}
                label={getTextClass('primary')}
                input={getInputClass()}
                btnPrimary={getBtnClass('primary')}
                btnSecondary={getBtnClass('secondary')}
                academicYears={academicYears}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action Modal (Approve / Reject / Pay) with Animations ───────────────────────────── */}
      <AnimatePresence>
        {actionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`w-full max-w-2xl rounded-2xl border shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} max-h-[90vh] overflow-hidden flex flex-col`}
            >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-lg font-bold ${text}`}>
                {actionModal.action === 'approve' ? '✅ Approve Expense' : actionModal.action === 'reject' ? '❌ Reject Expense' : '💳 Mark as Paid'}
              </h2>
              <button onClick={() => setActionModal(null)} className={`w-8 h-8 flex items-center justify-center rounded-xl text-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
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
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* World-Class AI-Powered Floating Action Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={openAddExpense}
          className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-500/25' 
              : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-blue-500/25'
          }`}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </AppLayout>
  );
}
