// @ts-nocheck
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fmt, PAYMENT_METHODS } from './utils';
import { showToast } from '@/lib/toastUtils';

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
  card: string;
  text: string;
  subtext: string;
  label: string;
  input: string;
  btnPrimary: string;
  btnSecondary: string;
  academicYears: any[];
}

export default function ExpenseForm({ 
  form, 
  setForm, 
  onSave, 
  onClose, 
  saving, 
  editing, 
  categories, 
  budgets, 
  isDark, 
  card, 
  text, 
  subtext, 
  label, 
  input, 
  btnPrimary, 
  btnSecondary, 
  academicYears = [] 
}: Props) {

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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
        return form.title && form.amount && form.dateIncurred;
      case 2:
        return form.categoryId && form.academicYear;
      case 3:
        return form.paymentMethod;
      case 4:
        return true; // Description and vendor are optional
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showToast('warning', 'Invalid File', 'Please select a PDF or image file (JPG, PNG, WEBP)');
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        showToast('warning', 'File Too Large', 'File size must be less than 5MB');
        return;
      }
      
      // Store file for upload
      setForm({ ...form, receiptFile: file, receiptFileName: file.name });
    }
  };

  const removeFile = () => {
    setForm({ ...form, receiptFile: null, receiptFileName: '' });
    // Clear the file input
    const fileInput = document.getElementById('receipt-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
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
                <span className="text-white text-xl">💸</span>
              </motion.div>
              <div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editing ? '✏️ Edit Expense' : '+ New Expense'}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2 mt-1`}>
                  <span>🤖</span>
                  <span>Smart expense management system</span>
                </p>
              </div>
            </div>
            <WorldClassButton
              onClick={onClose}
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
            }`}>Payment</span>
            <span className={`text-xs font-bold ${
              currentStep >= 4 ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-500' : 'text-gray-400')
            }`}>Details</span>
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
                    Expense Title *
                  </label>
                  <input 
                    className={enhancedInput} 
                    placeholder="e.g. Science Lab Equipment Purchase" 
                    value={form.title} 
                    onChange={e => setForm({ ...form, title: e.target.value })} 
                  />
                </div>

                <div>
                  <label className={enhancedLabel}>
                    <span>💵</span>
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium ${subtext}`}>₹</span>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      className={`${enhancedInput} pl-10`} 
                      placeholder="0.00" 
                      value={form.amount} 
                      onChange={e => setForm({ ...form, amount: e.target.value })} 
                    />
                  </div>
                </div>

                <div>
                  <label className={enhancedLabel}>
                    <span>📅</span>
                    Date Incurred *
                  </label>
                  <input 
                    type="date" 
                    className={enhancedInput} 
                    value={form.dateIncurred} 
                    onChange={e => setForm({ ...form, dateIncurred: e.target.value })} 
                  />
                </div>

                <div>
                  <label className={enhancedLabel}>
                    <span>🎓</span>
                    Academic Year *
                  </label>
                  <select 
                    className={enhancedInput} 
                    value={form.academicYear} 
                    onChange={e => setForm({ ...form, academicYear: e.target.value })}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.year}>{ay.name || ay.year} {ay.isActive && '(Active)'}</option>
                    ))}
                  </select>
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
                    className={enhancedInput} 
                    value={form.categoryId} 
                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  >
                    <option value="">— Select Category —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={enhancedLabel}>
                    <span>⭐</span>
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map(priority => (
                      <motion.button
                        key={priority}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setForm({ ...form, priority })}
                        className={`p-3 rounded-xl text-sm font-medium transition-all ${
                          form.priority === priority
                            ? priority === 'high' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' : priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                            : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
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
                    <span>💳</span>
                    Payment Method *
                  </label>
                  <select 
                    className={enhancedInput} 
                    value={form.paymentMethod} 
                    onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                  >
                    <option value="">— Select Method —</option>
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={enhancedLabel}>
                    <span>🏪</span>
                    Vendor Name
                  </label>
                  <input 
                    className={enhancedInput} 
                    placeholder="Supplier / vendor name" 
                    value={form.vendorName} 
                    onChange={e => setForm({ ...form, vendorName: e.target.value })} 
                  />
                </div>

                <div>
                  <label className={enhancedLabel}>
                    <span>🎯</span>
                    Link to Budget
                  </label>
                  <select 
                    className={enhancedInput} 
                    value={form.budgetId} 
                    onChange={e => setForm({ ...form, budgetId: e.target.value })}
                  >
                    <option value="">No budget</option>
                    {budgets.filter(b => b.status === 'active').map(b => (
                      <option key={b.id} value={b.id}>{b.name} · {fmt(b.remainingAmount)} remaining</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
            
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label className={enhancedLabel}>
                    <span>📄</span>
                    Description
                  </label>
                  <textarea 
                    rows={3} 
                    className={`${enhancedInput} resize-none`} 
                    placeholder="Provide detailed description of this expense..." 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                  />
                </div>

                <div>
                  <label className={enhancedLabel}>
                    <span>📝</span>
                    Internal Remarks
                  </label>
                  <textarea 
                    rows={2} 
                    className={`${enhancedInput} resize-none`} 
                    placeholder="Internal notes for reference..." 
                    value={form.remarks} 
                    onChange={e => setForm({ ...form, remarks: e.target.value })} 
                  />
                </div>

                <div>
                  <label className={enhancedLabel}>
                    <span>📎</span>
                    Bill/Receipt Attachment
                  </label>
                  <div className="space-y-3">
                    {!form.receiptFile ? (
                      <div className="relative">
                        <input
                          id="receipt-file-input"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                          isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                        }`}>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-16 h-16 mx-auto mb-4 text-gray-400"
                          >
                            📁
                          </motion.div>
                          <p className={`text-sm font-medium ${subtext}`}>
                            Click to upload or drag and drop
                          </p>
                          <p className={`text-xs ${subtext} mt-1`}>
                            PDF, JPG, PNG or WEBP (MAX. 5MB)
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              form.receiptFile.type === 'application/pdf' 
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {form.receiptFile.type === 'application/pdf' ? (
                                <span className="text-2xl">📄</span>
                              ) : (
                                <span className="text-2xl">🖼️</span>
                              )}
                            </div>
                            <div>
                              <p className={`text-sm font-medium ${text}`}>{form.receiptFileName}</p>
                              <p className={`text-xs ${subtext}`}>{(form.receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <WorldClassButton
                            onClick={removeFile}
                            variant="danger"
                            size="xs"
                            icon="🗑️"
                          >
                            Remove
                          </WorldClassButton>
                        </div>
                      </div>
                    )}
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
                {saving ? 'Saving...' : (editing ? 'Update Expense' : 'Create Expense')}
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
  );
}
