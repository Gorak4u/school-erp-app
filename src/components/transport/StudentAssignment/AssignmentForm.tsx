'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AssignmentFormProps {
  form: any;
  routes: any[];
  searchResults: any[];
  searchLoading: boolean;
  yearlyFees?: any[]; // Add yearly fees data
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  label: string;
  input: string;
  btnPrimary: string;
  btnSecondary: string;
  onChange: (field: string, value: any) => void;
  onStudentSearch: (query: string) => void;
  onSelectStudent: (student: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

export function AssignmentForm({
  form,
  routes,
  searchResults,
  searchLoading,
  yearlyFees = [], // Default to empty array
  isDark,
  card,
  text,
  subtext,
  label,
  input,
  btnPrimary,
  btnSecondary,
  onChange,
  onStudentSearch,
  onSelectStudent,
  onSave,
  onCancel,
  saving
}: AssignmentFormProps) {
  // Multi-step form state
  const [currentStep, setCurrentStep] = React.useState(1);
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
    variant?: 'primary' | 'secondary' | 'success';
    size?: 'xs' | 'sm' | 'md';
    disabled?: boolean;
    icon?: React.ReactNode;
    loading?: boolean;
  }) => {
    const variants = {
      primary: `bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-purple-600`,
      secondary: `border-2 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`,
      success: `bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:from-green-600 hover:to-emerald-600`
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
        return form.studentId && form.studentName;
      case 2:
        return form.routeId;
      case 3:
        return form.pickupStop && form.dropStop && form.monthlyFee >= 0;
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onCancel}
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
                <span className="text-white text-xl">👤</span>
              </motion.div>
              <div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {form.id ? 'Edit Student Assignment' : 'Assign Student to Transport'}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2 mt-1`}>
                  <span>🤖</span>
                  <span>Smart student assignment system</span>
                </p>
              </div>
            </div>
            <WorldClassButton
              onClick={onCancel}
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
            }`}>Student</span>
            <span className={`text-xs font-bold ${
              currentStep >= 2 ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-500' : 'text-gray-400')
            }`}>Route</span>
            <span className={`text-xs font-bold ${
              currentStep >= 3 ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-500' : 'text-gray-400')
            }`}>Details</span>
          </div>
        </div>
        
        {/* World-Class Multi-Step Content */}
        <div className="p-6 space-y-4">
          {/* Step 1: Student Selection */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-blue-800/50 to-purple-800/50' : 'from-blue-50 to-purple-50'} border ${isDark ? 'border-blue-700' : 'border-blue-200'}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-md`}
                >
                  <span className="text-white text-sm">👤</span>
                </motion.div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Step 1: Select Student</h4>
              </div>
              
              <label className={enhancedLabel}>
                <span>🔍</span> Search Student
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.studentSearch || ''}
                  onChange={(e) => {
                    onChange('studentSearch', e.target.value);
                    onStudentSearch(e.target.value);
                  }}
                  className={`${enhancedInput} w-full`}
                  placeholder="Search by name, admission number..."
                />
                {searchLoading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  >
                    🔄
                  </motion.div>
                )}
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-3 max-h-32 overflow-y-auto ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                >
                  {searchResults.map((student, index) => (
                    <motion.div
                      key={student.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectStudent(student)}
                      transition={{ delay: index * 0.05 }}
                      className={`p-2 cursor-pointer transition-all ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} border-b ${isDark ? 'border-gray-600' : 'border-gray-300'} last:border-b-0`}
                    >
                      <div className={`font-medium ${text}`}>
                        {student.name}
                      </div>
                      <div className={`text-xs ${subtext} flex items-center gap-2`}>
                        <span>🎫</span>
                        <span>{student.admissionNo} • {student.class?.name} {student.section?.name}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              {/* Selected Student */}
              {form.studentId && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className={`mt-3 p-3 rounded-xl bg-gradient-to-r ${isDark ? 'from-green-600/20 to-emerald-600/20' : 'from-green-100 to-emerald-100'} border ${isDark ? 'border-green-600/30' : 'border-green-200'}`}
                >
                  <div className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'} flex items-center gap-2`}>
                    <span>✅</span> Selected: {form.studentName || 'Student'}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-green-300' : 'text-green-500'} flex items-center gap-2 mt-1`}>
                    <span>🎫</span>
                    <span>{form.studentAdmissionNo}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Route Selection */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-purple-800/50 to-pink-800/50' : 'from-purple-50 to-pink-50'} border ${isDark ? 'border-purple-700' : 'border-purple-200'}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-purple-600 to-pink-600' : 'from-purple-500 to-pink-500'} shadow-md`}
                >
                  <span className="text-white text-sm">🚌</span>
                </motion.div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Step 2: Select Route</h4>
              </div>
              
              <label className={enhancedLabel}>
                <span>🚌</span> Select Route
              </label>
              <select
                value={form.routeId || ''}
                onChange={(e) => onChange('routeId', e.target.value)}
                className={enhancedInput}
              >
                <option value="">Select Route</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.routeNumber} - {route.routeName} (Capacity: {route.capacity - (route.assignedStudents || 0)})
                  </option>
                ))}
              </select>
              
              {/* Selected Student Summary */}
              {form.studentId && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-3 rounded-xl bg-gradient-to-r ${isDark ? 'from-blue-600/20 to-purple-600/20' : 'from-blue-100 to-purple-100'} border ${isDark ? 'border-blue-600/30' : 'border-blue-200'}`}
                >
                  <div className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-1`}>Student Summary</div>
                  <div className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-500'}`}>
                    {form.studentName} ({form.studentAdmissionNo})
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 3: Assignment Details */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Pickup & Drop Stops */}
              <motion.div
                className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-orange-800/50 to-red-800/50' : 'from-orange-50 to-red-50'} border ${isDark ? 'border-orange-700' : 'border-orange-200'}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-orange-600 to-red-600' : 'from-orange-500 to-red-500'} shadow-md`}
                  >
                    <span className="text-white text-sm">📍</span>
                  </motion.div>
                  <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Step 3: Assignment Details</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={enhancedLabel}>
                      <span>📍</span> Pickup Stop
                    </label>
                    <input
                      type="text"
                      value={form.pickupStop || ''}
                      onChange={(e) => onChange('pickupStop', e.target.value)}
                      className={enhancedInput}
                      placeholder="Enter pickup location"
                    />
                  </div>
                  
                  <div>
                    <label className={enhancedLabel}>
                      <span>🏁</span> Drop Stop
                    </label>
                    <input
                      type="text"
                      value={form.dropStop || ''}
                      onChange={(e) => onChange('dropStop', e.target.value)}
                      className={enhancedInput}
                      placeholder="Enter drop location"
                    />
                  </div>
                </div>
              </motion.div>
              
              {/* Monthly Fee */}
              <motion.div
                className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-green-800/50 to-emerald-800/50' : 'from-green-50 to-emerald-50'} border ${isDark ? 'border-green-700' : 'border-green-200'}`}
              >
                <label className={enhancedLabel}>
                  <span>💰</span> Monthly Fee (₹)
                </label>
                <input
                  type="number"
                  value={form.monthlyFee || ''}
                  onChange={(e) => onChange('monthlyFee', parseFloat(e.target.value))}
                  className={enhancedInput}
                  placeholder="0"
                  min="0"
                />
              </motion.div>
              
              {/* Yearly Fees Display */}
              {form.studentId && yearlyFees.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-amber-800/50 to-yellow-800/50' : 'from-amber-50 to-yellow-50'} border ${isDark ? 'border-amber-700' : 'border-amber-200'}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-amber-600 to-yellow-600' : 'from-amber-500 to-yellow-500'} shadow-md`}
                    >
                      <span className="text-white text-sm">📊</span>
                    </motion.div>
                    <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Yearly Fees Overview</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {yearlyFees.map((fee, index) => (
                      <motion.div
                        key={fee.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-lg border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className={`font-bold ${text} text-sm mb-1`}>
                              {fee.feeStructure?.name || fee.name}
                            </div>
                            <div className={`text-xs ${subtext} mb-2`}>
                              {fee.feeStructure?.category || fee.category} • {fee.academicYear}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'} font-bold`}>
                                ₹{(fee.totalAmount || 0).toLocaleString()}
                              </span>
                              {fee.paidAmount > 0 && (
                                <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                  Paid: ₹{fee.paidAmount.toLocaleString()}
                                </span>
                              )}
                              {fee.pendingAmount > 0 && (
                                <span className={`text-xs ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                  Pending: ₹{fee.pendingAmount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                            fee.status === 'paid' 
                              ? 'bg-green-100 text-green-700'
                              : fee.status === 'partial'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {fee.status === 'paid' ? '✅ Paid' : fee.status === 'partial' ? '⚠️ Partial' : '❌ Pending'}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Yearly Fees Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className={`mt-4 p-3 rounded-xl bg-gradient-to-r ${isDark ? 'from-amber-600/20 to-yellow-600/20' : 'from-amber-100 to-yellow-100'} border ${isDark ? 'border-amber-600/30' : 'border-amber-200'}`}
                  >
                    <div className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'} mb-2 flex items-center gap-2`}>
                      <span>💰</span> Yearly Fees Summary
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`${isDark ? 'text-amber-300' : 'text-amber-500'}`}>
                        <div>Total Amount:</div>
                        <div className="font-bold text-base">₹{yearlyFees.reduce((sum, fee) => sum + (fee.totalAmount || 0), 0).toLocaleString()}</div>
                      </div>
                      <div className={`${isDark ? 'text-amber-300' : 'text-amber-500'}`}>
                        <div>Pending Amount:</div>
                        <div className="font-bold text-base">₹{yearlyFees.reduce((sum, fee) => sum + (fee.pendingAmount || 0), 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
              
              {/* Active Assignment */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl bg-gradient-to-r ${isDark ? 'from-indigo-600/20 to-purple-600/20' : 'from-indigo-100 to-purple-100'} border ${isDark ? 'border-indigo-600/30' : 'border-indigo-200'}`}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <motion.input
                    type="checkbox"
                    checked={form.isActive || false}
                    onChange={(e) => onChange('isActive', e.target.checked)}
                    className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  />
                  <span className={`text-sm font-bold ${text} flex items-center gap-2`}>
                    <span>✨</span> Active Assignment
                  </span>
                </label>
              </motion.div>
              
              {/* Summary */}
              <motion.div
                className={`p-4 rounded-xl bg-gradient-to-r ${isDark ? 'from-gray-600/20 to-gray-700/20' : 'from-gray-100 to-gray-200'} border ${isDark ? 'border-gray-600/30' : 'border-gray-300'}`}
              >
                <div className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Assignment Summary</div>
                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'} space-y-1`}>
                  <div><strong>Student:</strong> {form.studentName} ({form.studentAdmissionNo})</div>
                  <div><strong>Route:</strong> {routes.find(r => r.id === form.routeId)?.routeNumber} - {routes.find(r => r.id === form.routeId)?.routeName}</div>
                  <div><strong>Monthly Fee:</strong> ₹{form.monthlyFee || 0}</div>
                  {form.studentId && yearlyFees.length > 0 && (
                    <div>
                      <strong>Yearly Fees:</strong> 
                      <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>
                        {' '}₹{yearlyFees.reduce((sum, fee) => sum + (fee.totalAmount || 0), 0).toLocaleString()} total
                      </span>
                      <span className={isDark ? 'text-orange-400' : 'text-orange-600'}>
                        {' '}({yearlyFees.reduce((sum, fee) => sum + (fee.pendingAmount || 0), 0).toLocaleString()} pending)
                      </span>
                    </div>
                  )}
                  <div><strong>Status:</strong> {form.isActive ? 'Active' : 'Inactive'}</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
        
        {/* World-Class Multi-Step Actions */}
        <div className={`flex justify-between items-center p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Previous Button */}
          <WorldClassButton
            onClick={handlePrevious}
            variant="secondary"
            size="sm"
            disabled={saving || currentStep === 1}
            icon="⬅️"
          >
            Previous
          </WorldClassButton>
          
          {/* Step Info */}
          <div className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Step {currentStep} of {totalSteps}
          </div>
          
          {/* Next/Save Button */}
          {currentStep < totalSteps ? (
            <WorldClassButton
              onClick={handleNext}
              variant="primary"
              size="sm"
              disabled={saving || !canProceed()}
              icon="➡️"
            >
              Next
            </WorldClassButton>
          ) : (
            <WorldClassButton
              onClick={handleSave}
              variant="success"
              size="sm"
              disabled={saving || !canProceed()}
              loading={saving}
              icon="✅"
            >
              {saving ? 'Saving...' : 'Save Assignment'}
            </WorldClassButton>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
