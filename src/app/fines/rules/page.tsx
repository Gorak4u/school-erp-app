'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  BookOpen,
  Calendar,
  User,
  TrendingUp,
  Eye,
  Copy,
  Archive,
  ArchiveRestore
} from 'lucide-react';

// Types
interface FineRule {
  id: string;
  name: string;
  code: string;
  type: 'fixed' | 'daily_accumulating' | 'percentage' | 'tiered';
  baseAmount: number;
  dailyRate?: number;
  maxAmount?: number;
  percentageOf?: string;
  graceDays: number;
  triggerEvent: string;
  applicableTo: string;
  classIds?: string;
  categoryIds?: string;
  autoApply: boolean;
  autoNotify: boolean;
  requiresApproval: boolean;
  academicYearId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  academicYear?: {
    id: string;
    name: string;
    year: string;
  };
  _count: {
    fines: number;
  };
}

export default function FineRulesPage() {
  const { theme } = useTheme();
  const [rules, setRules] = useState<FineRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<FineRule | null>(null);

  // CSS Variables based on theme
  const isDark = theme === 'dark';
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;
  const row = `p-4 rounded-xl border ${isDark ? 'border-gray-600/50 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'}`;
  const tile = `p-3 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${isDark ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-400'}`;
  const tileSelected = `p-3 rounded-lg border-2 transition-all cursor-pointer ring-2 ring-blue-200 border-blue-500`;

  useEffect(() => {
    fetchRules();
  }, [search, selectedTrigger, selectedType, showInactive]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(selectedTrigger !== 'all' && { triggerEvent: selectedTrigger }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(showInactive && { isActive: 'false' })
      });

      const response = await fetch(`/api/fines/rules?${params}`);
      const data = await response.json();

      if (data.success) {
        setRules(data.rules);
      }
    } catch (error) {
      console.error('Failed to fetch fine rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'late_payment': return <Clock className="w-4 h-4" />;
      case 'library_overdue': return <BookOpen className="w-4 h-4" />;
      case 'attendance_late': return <Calendar className="w-4 h-4" />;
      case 'attendance_absent': return <User className="w-4 h-4" />;
      case 'manual': return <Settings className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fixed': return 'text-blue-600 bg-blue-100';
      case 'daily_accumulating': return 'text-green-600 bg-green-100';
      case 'percentage': return 'text-purple-600 bg-purple-100';
      case 'tiered': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleEdit = (rule: FineRule) => {
    setSelectedRule(rule);
    setShowEditModal(true);
  };

  const handleToggleActive = async (rule: FineRule) => {
    try {
      const response = await fetch(`/api/fines/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive })
      });

      if (response.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDelete = async (rule: FineRule) => {
    if (!confirm(`Are you sure you want to delete "${rule.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/fines/rules/${rule.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchRules();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete rule');
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert('Failed to delete rule');
    }
  };

  const duplicateRule = async (rule: FineRule) => {
    try {
      const response = await fetch('/api/fines/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rule,
          name: `${rule.name} (Copy)`,
          code: `${rule.code}_COPY`
        })
      });

      if (response.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error('Failed to duplicate rule:', error);
    }
  };

  const triggerOptions = [
    { value: 'all', label: 'All Triggers' },
    { value: 'manual', label: 'Manual' },
    { value: 'late_payment', label: 'Late Payment' },
    { value: 'library_overdue', label: 'Library Overdue' },
    { value: 'attendance_late', label: 'Attendance Late' },
    { value: 'attendance_absent', label: 'Attendance Absent' }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'daily_accumulating', label: 'Daily Accumulating' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'tiered', label: 'Tiered' }
  ];

  const activeRules = rules.filter(rule => rule.isActive);
  const inactiveRules = rules.filter(rule => !rule.isActive);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AppLayout currentPage="fines" title="Fine Rules">
      <div className="space-y-6 pb-8">
        <div className={`${card} p-6 md:p-8`}>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-blue-500/20 bg-blue-500/10 text-blue-300' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Fine Rules • School operations hub
              </div>
              <h1 className={`mt-4 text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Fine Rules</h1>
              <p className={`mt-3 text-sm md:text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Configure automated fine rules and templates for library, attendance, and fee management.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full xl:w-auto">
              <button className={btnPrimary} onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </button>
              <button className={btnSecondary} onClick={() => fetchRules()}>
                <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rules</span>
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {rules.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Configured rules
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeRules.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Currently running
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Automated</span>
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {rules.filter(r => r.autoApply).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Auto-apply enabled
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fines Created</span>
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {rules.reduce((sum, rule) => sum + rule._count.fines, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total fines generated
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={card}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search rules..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`${input} pl-10`}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select
                  value={selectedTrigger}
                  onChange={(e) => setSelectedTrigger(e.target.value)}
                  className={input}
                >
                  {triggerOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className={input}
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Show inactive
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-6">
        {/* Active Rules */}
        {activeRules.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Active Rules ({activeRules.length})
            </h2>
            <div className="grid gap-4">
              <AnimatePresence>
                {activeRules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={card}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(rule.type)}`}>
                              {rule.type.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              {getTriggerIcon(rule.triggerEvent)}
                              {rule.triggerEvent.replace('_', ' ').toUpperCase()}
                            </div>
                            {rule.autoApply && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <Zap className="w-3 h-3" />
                                AUTO
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {rule.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Code: {rule.code}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Base Amount:</span>
                              <div className="font-medium text-gray-900 dark:text-white">
                                ₹{rule.baseAmount.toLocaleString()}
                              </div>
                            </div>
                            {rule.dailyRate && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Daily Rate:</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  ₹{rule.dailyRate.toLocaleString()}
                                </div>
                              </div>
                            )}
                            {rule.maxAmount && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Max Amount:</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  ₹{rule.maxAmount.toLocaleString()}
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Grace Days:</span>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {rule.graceDays} days
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>{rule._count.fines} fines created</span>
                            <span>•</span>
                            <span>Created {new Date(rule.createdAt).toLocaleDateString()}</span>
                            {rule.academicYear && (
                              <>
                                <span>•</span>
                                <span>{rule.academicYear.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(rule)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => duplicateRule(rule)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleActive(rule)}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="Deactivate"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(rule)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Inactive Rules */}
        {showInactive && inactiveRules.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Inactive Rules ({inactiveRules.length})
            </h2>
            <div className="grid gap-4">
              <AnimatePresence>
                {inactiveRules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`${card} opacity-60`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400`}>
                              INACTIVE
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(rule.type)}`}>
                              {rule.type.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                              {getTriggerIcon(rule.triggerEvent)}
                              {rule.triggerEvent.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {rule.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Code: {rule.code}
                          </p>
                          
                          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>{rule._count.fines} fines created</span>
                            <span>•</span>
                            <span>Deactivated {new Date(rule.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleToggleActive(rule)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Reactivate"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(rule)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty State */}
        {rules.length === 0 && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No fine rules found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first fine rule
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className={btnPrimary}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Rule
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Rule Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedRule(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={card}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {showEditModal ? 'Edit Fine Rule' : 'Create New Fine Rule'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        setSelectedRule(null);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={label}>Rule Name *</label>
                      <input 
                        type="text" 
                        className={input} 
                        placeholder="e.g., Library Overdue Fine"
                        defaultValue={selectedRule?.name}
                      />
                    </div>
                    <div>
                      <label className={label}>Rule Code *</label>
                      <input 
                        type="text" 
                        className={input} 
                        placeholder="e.g., LIB_OVERDUE"
                        defaultValue={selectedRule?.code}
                      />
                    </div>
                    <div>
                      <label className={label}>Rule Type *</label>
                      <select className={input} defaultValue={selectedRule?.type}>
                        <option value="">Select type...</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="daily_accumulating">Daily Accumulating</option>
                        <option value="percentage">Percentage</option>
                        <option value="tiered">Tiered</option>
                      </select>
                    </div>
                    <div>
                      <label className={label}>Trigger Event *</label>
                      <select className={input} defaultValue={selectedRule?.triggerEvent}>
                        <option value="">Select trigger...</option>
                        <option value="manual">Manual</option>
                        <option value="late_payment">Late Payment</option>
                        <option value="library_overdue">Library Overdue</option>
                        <option value="attendance_late">Attendance Late</option>
                        <option value="attendance_absent">Attendance Absent</option>
                      </select>
                    </div>
                    <div>
                      <label className={label}>Base Amount *</label>
                      <input 
                        type="number" 
                        className={input} 
                        placeholder="0.00"
                        defaultValue={selectedRule?.baseAmount}
                      />
                    </div>
                    <div>
                      <label className={label}>Daily Rate</label>
                      <input 
                        type="number" 
                        className={input} 
                        placeholder="0.00 (for accumulating fines)"
                        defaultValue={selectedRule?.dailyRate}
                      />
                    </div>
                    <div>
                      <label className={label}>Maximum Amount</label>
                      <input 
                        type="number" 
                        className={input} 
                        placeholder="No limit"
                        defaultValue={selectedRule?.maxAmount}
                      />
                    </div>
                    <div>
                      <label className={label}>Grace Days</label>
                      <input 
                        type="number" 
                        className={input} 
                        placeholder="0"
                        defaultValue={selectedRule?.graceDays}
                      />
                    </div>
                    <div>
                      <label className={label}>Applicable To</label>
                      <select className={input} defaultValue={selectedRule?.applicableTo}>
                        <option value="all">All Students</option>
                        <option value="specific_classes">Specific Classes</option>
                        <option value="specific_categories">Specific Categories</option>
                      </select>
                    </div>
                    <div>
                      <label className={label}>Academic Year</label>
                      <select className={input} defaultValue={selectedRule?.academicYearId}>
                        <option value="">All Years</option>
                        {/* Add academic year options */}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={selectedRule?.autoApply}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Auto-apply this rule
                        </span>
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={selectedRule?.autoNotify}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Send notifications when fines are created
                        </span>
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={selectedRule?.requiresApproval}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Require approval for this type of fine
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        setSelectedRule(null);
                      }}
                      className={btnSecondary}
                    >
                      Cancel
                    </button>
                    <button
                      className={btnPrimary}
                    >
                      {showEditModal ? 'Update Rule' : 'Create Rule'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </AppLayout>
  );
}
