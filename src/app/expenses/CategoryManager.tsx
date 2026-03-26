// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  search: string;
  setSearch: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
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

export default function CategoryManager({
  categories, isDark, form, setForm, showForm, setShowForm, editing, setEditing, onSave, onDelete, onSeedDefaults, saving,
  search, setSearch, statusFilter, setStatusFilter, sortBy, setSortBy, sortOrder, setSortOrder,
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
        return form.name && form.icon;
      case 2:
        return form.description && form.color;
      case 3:
        return form.status;
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
      icon: '📁', 
      description: '', 
      color: '#3B82F6', 
      status: 'active',
      parentCategoryId: ''
    });
    setCurrentStep(1);
    setShowForm(true);
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({ 
      name: cat.name, 
      icon: cat.icon, 
      description: cat.description || '', 
      color: cat.color || '#3B82F6', 
      status: cat.status,
      parentCategoryId: cat.parentCategoryId || ''
    });
    setCurrentStep(1);
    setShowForm(true);
  };

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = !search || cat.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const modifier = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'name': return (a.name.localeCompare(b.name)) * modifier;
      case 'status': return (a.status.localeCompare(b.status)) * modifier;
      case 'createdAt': return ((new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())) * modifier;
      default: return 0;
    }
  });

  const availableIcons = [
    '📁', '📂', '💼', '💳', '💰', '💵', '🏪', '🏢', '🏭', '🏗️', 
    '🔧', '⚙️', '🔨', '🛠️', '📋', '📊', '📈', '📉', '🎯', '🏆',
    '🎨', '🖌️', '🖼️', '📷', '📹', '🎬', '🎵', '🎧', '🎮', '🕹️',
    '🍕', '🍔', '🌮', '🍜', '☕', '🥤', '🍰', '🍪', '🥐', '🥖'
  ];

  const availableColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Cyan', value: '#06B6D4' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={enhancedCard}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Categories</p>
                <p className={`text-2xl font-bold ${text}`}>{categories.length}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg`}>
                <span className="text-white text-xl">📁</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={enhancedCard}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active</p>
                <p className={`text-2xl font-bold ${text}`}>{categories.filter(c => c.status === 'active').length}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg`}>
                <span className="text-white text-xl">✅</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={enhancedCard}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Inactive</p>
                <p className={`text-2xl font-bold ${text}`}>{categories.filter(c => c.status === 'inactive').length}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 shadow-lg`}>
                <span className="text-white text-xl">⏸️</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={enhancedCard}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Unique Icons</p>
                <p className={`text-2xl font-bold ${text}`}>{new Set(categories.map(c => c.icon)).size}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg`}>
                <span className="text-white text-xl">🎨</span>
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
                placeholder="Search categories..."
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
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={enhancedInput}
              >
                <option value="name">Sort by Name</option>
                <option value="status">Sort by Status</option>
                <option value="createdAt">Sort by Created</option>
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
            
            <div className="flex gap-2">
              <WorldClassButton
                onClick={onSeedDefaults}
                variant="secondary"
                icon="🌱"
              >
                Seed Defaults
              </WorldClassButton>
              
              <WorldClassButton
                onClick={openAdd}
                variant="primary"
                icon="➕"
              >
                Add Category
              </WorldClassButton>
            </div>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className={subtext}>No categories found</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className={enhancedCard}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                      style={{ backgroundColor: category.color + '20', color: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${text}`}>{category.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        category.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {category.description && (
                  <p className={`text-sm ${subtext} mb-4 line-clamp-2`}>{category.description}</p>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className={`text-xs ${subtext}`}>{category.color}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <WorldClassButton
                      onClick={() => openEdit(category)}
                      variant="secondary"
                      size="xs"
                      icon="✏️"
                    >
                      Edit
                    </WorldClassButton>
                    
                    <WorldClassButton
                      onClick={() => onDelete(category.id)}
                      variant="danger"
                      size="xs"
                      icon="🗑️"
                    >
                      Delete
                    </WorldClassButton>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Multi-Step Category Form Modal */}
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
                      <span className="text-white text-xl">📁</span>
                    </motion.div>
                    <div>
                      <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {editing ? 'Edit Category' : 'Create New Category'}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2 mt-1`}>
                        <span>🤖</span>
                        <span>Smart category management system</span>
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
                  }`}>Appearance</span>
                  <span className={`text-xs font-bold ${
                    currentStep >= 3 ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-500' : 'text-gray-400')
                  }`}>Settings</span>
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
                          Category Name *
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className={enhancedInput}
                          placeholder="e.g., Office Supplies"
                        />
                      </div>
                      
                      <div>
                        <label className={enhancedLabel}>
                          <span>🎨</span>
                          Icon *
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                          {availableIcons.map((icon) => (
                            <motion.button
                              key={icon}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setForm({ ...form, icon })}
                              className={`p-3 rounded-xl text-2xl transition-all ${
                                form.icon === icon
                                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg'
                                  : isDark 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                              }`}
                            >
                              {icon}
                            </motion.button>
                          ))}
                        </div>
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
                          <span>📄</span>
                          Description *
                        </label>
                        <textarea
                          rows={3}
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          className={`${enhancedInput} resize-none`}
                          placeholder="Describe what this category is used for..."
                        />
                      </div>
                      
                      <div>
                        <label className={enhancedLabel}>
                          <span>🎨</span>
                          Color *
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                          {availableColors.map((color) => (
                            <motion.button
                              key={color.value}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setForm({ ...form, color: color.value })}
                              className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                                form.color === color.value
                                  ? 'border-blue-500 shadow-lg shadow-blue-500/25'
                                  : isDark 
                                    ? 'border-gray-600 hover:border-gray-500' 
                                    : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <div 
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: color.value }}
                              />
                              <span className={`text-sm font-medium ${
                                form.color === color.value ? 'text-blue-500' : (isDark ? 'text-gray-300' : 'text-gray-600')
                              }`}>
                                {color.name}
                              </span>
                            </motion.button>
                          ))}
                        </div>
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
                      <div>
                        <label className={enhancedLabel}>
                          <span>⚙️</span>
                          Status *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'active', label: 'Active', icon: '✅', desc: 'Category is available for use' },
                            { value: 'inactive', label: 'Inactive', icon: '⏸️', desc: 'Category is temporarily disabled' }
                          ].map((status) => (
                            <motion.button
                              key={status.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setForm({ ...form, status: status.value })}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                form.status === status.value
                                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
                                  : isDark 
                                    ? 'border-gray-600 hover:border-gray-500 bg-gray-800/50' 
                                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-xl">{status.icon}</span>
                                <span className={`font-bold ${
                                  form.status === status.value ? 'text-blue-600 dark:text-blue-400' : (isDark ? 'text-gray-300' : 'text-gray-700')
                                }`}>
                                  {status.label}
                                </span>
                              </div>
                              <p className={`text-xs ${
                                form.status === status.value ? 'text-blue-600 dark:text-blue-400' : (isDark ? 'text-gray-400' : 'text-gray-500')
                              }`}>
                                {status.desc}
                              </p>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Preview */}
                      <div>
                        <label className={enhancedLabel}>
                          <span>👁️</span>
                          Preview
                        </label>
                        <div className={`p-4 rounded-xl border-2 ${
                          isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                              style={{ backgroundColor: form.color + '20', color: form.color }}
                            >
                              {form.icon}
                            </div>
                            <div>
                              <h4 className={`font-bold ${text}`}>{form.name || 'Category Name'}</h4>
                              <p className={`text-sm ${subtext}`}>{form.description || 'Category description...'}</p>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                form.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {form.status || 'active'}
                              </span>
                            </div>
                          </div>
                        </div>
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
                      {saving ? 'Saving...' : (editing ? 'Update Category' : 'Create Category')}
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
