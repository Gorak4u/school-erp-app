// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmt } from './utils';

interface Props {
  budgets: any[];
  loading: boolean;
  isDark: boolean;
  categories: any[];
  form: any;
  setForm: (f: any) => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editing: any;
  setEditing: (v: any) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  saving: boolean;
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  sortOrder: string;
  setSortOrder: (s: string) => void;
  card: string;
  text: string;
  subtext: string;
  label: string;
  input: string;
  btnPrimary: string;
  btnSecondary: string;
}

export default function BudgetManager({
  budgets, loading, isDark, categories, form, setForm, showForm, setShowForm, editing, setEditing, onSave, onDelete, saving,
  search, setSearch, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, sortBy, setSortBy, sortOrder, setSortOrder,
  card, text, subtext, label, input, btnPrimary, btnSecondary
}: Props) {

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // World-Class AI-Powered Form Styles
  const enhancedCard = `rounded-2xl border shadow-xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const enhancedInput = `w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] focus:scale-[1.02] ${isDark ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600 text-white placeholder-gray-400 hover:border-purple-500/50' : 'bg-gradient-to-br from-white to-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 hover:border-purple-400'}`;
  const enhancedLabel = `block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`;
  
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

  // Step validation
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return form.name && form.totalAmount;
      case 2:
        return form.categoryId && form.academicYear;
      case 3:
        return form.startDate && form.endDate && form.alertThreshold;
      default:
        return false;
    }
  };

  const canProceed = () => {
    return isStepValid(currentStep);
  };

  const handleNext = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    if (canProceed()) {
      onSave();
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ 
      name: '', 
      description: '', 
      totalAmount: '', 
      categoryId: '', 
      startDate: '', 
      endDate: '', 
      alertThreshold: '80', 
      academicYear: '2024-25' 
    });
    setCurrentStep(1);
    setShowForm(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ 
      name: b.name, 
      description: b.description || '', 
      totalAmount: String(b.totalAmount), 
      categoryId: b.categoryId || '', 
      startDate: b.startDate, 
      endDate: b.endDate, 
      alertThreshold: String(b.alertThreshold), 
      academicYear: b.academicYear 
    });
    setCurrentStep(1);
    setShowForm(true);
  };

  const filteredBudgets = budgets.filter(b => {
    const matchesSearch = !search || b.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const matchesCategory = !categoryFilter || b.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name': return (a.name.localeCompare(b.name)) * modifier;
      case 'totalAmount': return ((a.totalAmount || 0) - (b.totalAmount || 0)) * modifier;
      case 'spent': return ((a.spentAmount || 0) - (b.spentAmount || 0)) * modifier;
      case 'remaining': return (((a.totalAmount || 0) - (a.spentAmount || 0)) - ((b.totalAmount || 0) - (b.spentAmount || 0))) * modifier;
      default: return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={enhancedCard}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Budgets</p>
                <p className={`text-2xl font-bold ${text}`}>{budgets.length}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg`}>
                <span className="text-white text-xl">💰</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={enhancedCard}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                <p className={`text-2xl font-bold ${text}`}>{fmt(budgets.reduce((sum, b) => sum + (b.totalAmount || 0), 0))}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg`}>
                <span className="text-white text-xl">📈</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={enhancedCard}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Spent</p>
                <p className={`text-2xl font-bold ${text}`}>{fmt(budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0))}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 shadow-lg`}>
                <span className="text-white text-xl">💸</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={enhancedCard}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Remaining</p>
                <p className={`text-2xl font-bold ${text}`}>{fmt(budgets.reduce((sum, b) => sum + ((b.totalAmount || 0) - (b.spentAmount || 0)), 0))}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg`}>
                <span className="text-white text-xl">🎯</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className={enhancedCard}>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              <input
                type="text"
                placeholder="Search budgets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={enhancedInput}
              />
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={enhancedInput}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={enhancedInput}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={enhancedInput}
              >
                <option value="name">Sort by Name</option>
                <option value="totalAmount">Sort by Total</option>
                <option value="spent">Sort by Spent</option>
                <option value="remaining">Sort by Remaining</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={enhancedInput}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            
            <WorldClassButton
              onClick={openAdd}
              variant="primary"
              icon="➕"
            >
              Add Budget
            </WorldClassButton>
          </div>
        </div>
      </div>

      {/* Budget List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 text-4xl"
            >
              🔄
            </motion.div>
          </div>
        ) : filteredBudgets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className={subtext}>No budgets found</p>
          </div>
        ) : (
          filteredBudgets.map((budget) => {
            const spentAmount = budget.spentAmount || 0;
            const remainingAmount = (budget.totalAmount || 0) - spentAmount;
            const spentPercentage = budget.totalAmount ? (spentAmount / budget.totalAmount) * 100 : 0;
            const isOverBudget = spentPercentage > 100;
            const isNearLimit = spentPercentage > (budget.alertThreshold || 80);
            
            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={enhancedCard}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold ${text} mb-1`}>{budget.name}</h3>
                      {budget.description && (
                        <p className={`text-sm ${subtext} mb-2`}>{budget.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          budget.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : budget.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {budget.status}
                        </span>
                        {budget.categoryId && (
                          <span className={`px-2 py-1 text-xs rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            {categories.find(c => c.id === budget.categoryId)?.icon} {categories.find(c => c.id === budget.categoryId)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${subtext}`}>Total Budget</span>
                      <span className={`text-sm font-bold ${text}`}>{fmt(budget.totalAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${subtext}`}>Spent</span>
                      <span className={`text-sm font-bold ${isOverBudget ? 'text-red-500' : text}`}>{fmt(spentAmount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${subtext}`}>Remaining</span>
                      <span className={`text-sm font-bold ${remainingAmount < 0 ? 'text-red-500' : 'text-green-500'}`}>{fmt(remainingAmount)}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <motion.div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverBudget 
                              ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                              : isNearLimit 
                              ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(spentPercentage, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs ${subtext}`}>{spentPercentage.toFixed(1)}% used</span>
                        {(isOverBudget || isNearLimit) && (
                          <span className={`text-xs font-medium ${
                            isOverBudget ? 'text-red-500' : 'text-orange-500'
                          }`}>
                            {isOverBudget ? '⚠️ Over budget' : '⚡ Near limit'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {budget.startDate && budget.endDate && (
                      <div className={`text-xs ${subtext} pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        📅 {budget.startDate} → {budget.endDate}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                    <WorldClassButton
                      onClick={() => openEdit(budget)}
                      variant="secondary"
                      size="xs"
                      icon="✏️"
                    >
                      Edit
                    </WorldClassButton>
                    
                    <WorldClassButton
                      onClick={() => onDelete(budget.id)}
                      variant="danger"
                      size="xs"
                      icon="🗑️"
                    >
                      Delete
                    </WorldClassButton>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Multi-Step Budget Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`${enhancedCard} max-w-4xl w-full max-h-[90vh] overflow-y-auto hover:shadow-2xl transition-all duration-300`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* World-Class Header with Steps */}
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r ${isDark ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-50 to-gray-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500'} shadow-lg`}
                    >
                      <span className="text-white text-xl">💰</span>
                    </motion.div>
                    <div>
                      <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {editing ? 'Edit Budget' : 'Create New Budget'}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2 mt-1`}>
                        <span>🤖</span>
                        <span>Smart budget management system</span>
                      </p>
                    </div>
                  </div>
                  <WorldClassButton
                    onClick={() => setShowForm(false)}
                    variant="secondary"
                    size="xs"
                    icon="❌"
                  >
                    Close
                  </WorldClassButton>
                </div>
                
                {/* Step Progress Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {Array.from({ length: totalSteps }, (_, index) => {
                      const stepNumber = index + 1;
                      const isCompleted = stepNumber < currentStep;
                      const isCurrent = stepNumber === currentStep;
                      const isValid = isStepValid(stepNumber);
                      
                      return (
                        <React.Fragment key={stepNumber}>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                              isCompleted
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                                : isCurrent
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                                : isValid
                                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}
                          >
                            {isCompleted ? '✅' : stepNumber}
                          </motion.div>
                          {index < totalSteps - 1 && (
                            <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                              stepNumber < currentStep
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gray-300'
                            }`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                
                {/* Step Labels */}
                <div className="flex justify-between mt-3">
                  <span className={`text-xs font-bold ${
                    currentStep >= 1 ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-500' : 'text-gray-400')
                  }`}>Basic Info</span>
                  <span className={`text-xs font-bold ${
                    currentStep >= 2 ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-500' : 'text-gray-400')
                  }`}>Category</span>
                  <span className={`text-xs font-bold ${
                    currentStep >= 3 ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-500' : 'text-gray-400')
                  }`}>Timeline</span>
                </div>
              </div>
              
              {/* Form Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className={enhancedLabel}>
                          <span>📝</span>
                          Budget Name *
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className={enhancedInput}
                          placeholder="e.g., Annual Marketing Budget"
                        />
                      </div>
                      
                      <div>
                        <label className={enhancedLabel}>
                          <span>💵</span>
                          Total Amount *
                        </label>
                        <div className="relative">
                          <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium ${subtext}`}>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.totalAmount}
                            onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                            className={`${enhancedInput} pl-10`}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className={enhancedLabel}>
                          <span>📄</span>
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className={`${enhancedInput} resize-none`}
                          placeholder="Describe the purpose and scope of this budget..."
                        />
                      </div>
                    </motion.div>
                  )}
                  
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div>
                        <label className={enhancedLabel}>
                          <span>🏷️</span>
                          Category *
                        </label>
                        <select
                          value={form.categoryId}
                          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                          className={enhancedInput}
                        >
                          <option value="">Select a category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className={enhancedLabel}>
                          <span>🎓</span>
                          Academic Year *
                        </label>
                        <select
                          value={form.academicYear}
                          onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                          className={enhancedInput}
                        >
                          <option value="">Select academic year</option>
                          <option value="2024-25">2024-25</option>
                          <option value="2025-26">2025-26</option>
                          <option value="2026-27">2026-27</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                  
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={enhancedLabel}>
                            <span>📅</span>
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={form.startDate}
                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                            className={enhancedInput}
                          />
                        </div>
                        
                        <div>
                          <label className={enhancedLabel}>
                            <span>📅</span>
                            End Date *
                          </label>
                          <input
                            type="date"
                            value={form.endDate}
                            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                            className={enhancedInput}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className={enhancedLabel}>
                          <span>⚠️</span>
                          Alert Threshold (%) *
                        </label>
                        <select
                          value={form.alertThreshold}
                          onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })}
                          className={enhancedInput}
                        >
                          <option value="50">50% - Early Warning</option>
                          <option value="70">70% - Moderate Warning</option>
                          <option value="80">80% - Standard Warning</option>
                          <option value="90">90% - Critical Warning</option>
                          <option value="95">95% - Urgent Warning</option>
                        </select>
                        <p className={`text-xs ${subtext} mt-1`}>
                          Get notified when budget usage reaches this percentage
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Footer with Navigation */}
              <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <WorldClassButton
                    onClick={handlePrevious}
                    variant="secondary"
                    disabled={currentStep === 1}
                    icon="⬅️"
                  >
                    Previous
                  </WorldClassButton>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${subtext}`}>
                      Step {currentStep} of {totalSteps}
                    </span>
                    {isStepValid(currentStep) && (
                      <span className="text-green-500 text-sm">✅ Valid</span>
                    )}
                  </div>
                  
                  {currentStep === totalSteps ? (
                    <WorldClassButton
                      onClick={handleSave}
                      variant="success"
                      disabled={!canProceed() || saving}
                      loading={saving}
                      icon="💾"
                    >
                      {saving ? 'Saving...' : (editing ? 'Update Budget' : 'Create Budget')}
                    </WorldClassButton>
                  ) : (
                    <WorldClassButton
                      onClick={handleNext}
                      variant="primary"
                      disabled={!canProceed()}
                      icon="➡️"
                    >
                      Next
                    </WorldClassButton>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
