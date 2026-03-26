'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BulkAssignmentProps {
  routes: any[];
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  label: string;
  input: string;
  btnPrimary: string;
  btnSecondary: string;
  onBulkAssign: (routeId: string, studentIds: string[]) => void;
  onClose: () => void;
}

export function BulkAssignment({
  routes,
  isDark,
  card,
  text,
  subtext,
  label,
  input,
  btnPrimary,
  btnSecondary,
  onBulkAssign,
  onClose
}: BulkAssignmentProps) {
  const [selectedRoute, setSelectedRoute] = React.useState('');
  const [studentList, setStudentList] = React.useState('');
  const [processing, setProcessing] = React.useState(false);
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = React.useState(1);
  const totalSteps = 2;

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
        return selectedRoute;
      case 2:
        return studentList.trim();
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

  const handleBulkAssign = async () => {
    if (!canProceed()) return;
    
    setProcessing(true);
    const studentIds = studentList
      .split('\n')
      .map(id => id.trim())
      .filter(id => id);
    
    await onBulkAssign(selectedRoute, studentIds);
    setProcessing(false);
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
        className={`${enhancedCard} max-w-4xl w-full hover:shadow-2xl transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* World-Class Header with Steps */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r ${isDark ? 'from-gray-800/50 to-gray-700/50' : 'from-gray-50 to-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'} shadow-lg`}
              >
                <span className="text-white text-xl">👥</span>
              </motion.div>
              <div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Bulk Student Assignment
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2 mt-1`}>
                  <span>🤖</span>
                  <span>Smart bulk assignment system</span>
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
            }`}>Route</span>
            <span className={`text-xs font-bold ${
              currentStep >= 2 ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-gray-500' : 'text-gray-400')
            }`}>Students</span>
          </div>
        </div>
        
        {/* World-Class Multi-Step Content */}
        <div className="p-6 space-y-4">
          {/* Step 1: Route Selection */}
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
                  <span className="text-white text-sm">🚌</span>
                </motion.div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Step 1: Select Route</h4>
              </div>
              
              <label className={enhancedLabel}>
                <span>🚌</span> Select Route
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className={enhancedInput}
              >
                <option value="">Choose a route...</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.routeNumber} - {route.routeName} (Available: {route.capacity - (route.assignedStudents || 0)})
                  </option>
                ))}
              </select>
              
              {selectedRoute && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className={`mt-4 p-3 rounded-xl bg-gradient-to-r ${isDark ? 'from-green-600/20 to-emerald-600/20' : 'from-green-100 to-emerald-100'} border ${isDark ? 'border-green-600/30' : 'border-green-200'}`}
                >
                  <div className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'} flex items-center gap-2`}>
                    <span>✅</span> Selected Route
                  </div>
                  <div className={`text-xs ${isDark ? 'text-green-300' : 'text-green-500'} mt-1`}>
                    {routes.find(r => r.id === selectedRoute)?.routeNumber} - {routes.find(r => r.id === selectedRoute)?.routeName}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Student List */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-4 rounded-xl bg-gradient-to-br ${isDark ? 'from-green-800/50 to-emerald-800/50' : 'from-green-50 to-emerald-50'} border ${isDark ? 'border-green-700' : 'border-green-200'}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500'} shadow-md`}
                >
                  <span className="text-white text-sm">👤</span>
                </motion.div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Step 2: Add Students</h4>
              </div>
              
              <label className={enhancedLabel}>
                <span>👤</span> Student Admission Numbers
              </label>
              <textarea
                value={studentList}
                onChange={(e) => setStudentList(e.target.value)}
                className={`${enhancedInput} resize-none`}
                rows={6}
                placeholder="Enter student admission numbers, one per line:
STU001
STU002
STU003
..."
              />
              <div className={`text-xs ${subtext} mt-2 flex items-center gap-2`}>
                <span>ℹ️</span>
                <span>Enter one admission number per line. Maximum 50 students at a time.</span>
              </div>
              
              {/* Selected Route Summary */}
              {selectedRoute && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-3 rounded-xl bg-gradient-to-r ${isDark ? 'from-blue-600/20 to-purple-600/20' : 'from-blue-100 to-purple-100'} border ${isDark ? 'border-blue-600/30' : 'border-blue-200'}`}
                >
                  <div className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'} mb-1`}>Selected Route</div>
                  <div className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-500'}`}>
                    {routes.find(r => r.id === selectedRoute)?.routeNumber} - {routes.find(r => r.id === selectedRoute)?.routeName}
                  </div>
                </motion.div>
              )}
              
              {/* Assignment Preview */}
              {selectedRoute && studentList.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className={`mt-4 p-4 rounded-xl bg-gradient-to-r ${isDark ? 'from-indigo-600/20 to-purple-600/20' : 'from-indigo-100 to-purple-100'} border ${isDark ? 'border-indigo-600/30' : 'border-indigo-200'}`}
                >
                  <div className={`font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'} mb-2 flex items-center gap-2`}>
                    <span>📋</span> Assignment Preview
                  </div>
                  <div className={`text-sm ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="inline-block"
                    >
                      <span className="font-bold text-lg">{studentList.split('\n').filter(id => id.trim()).length}</span> students will be assigned to:
                    </motion.div>
                    <br />
                    <strong className="text-base">
                      {routes.find(r => r.id === selectedRoute)?.routeNumber} - {routes.find(r => r.id === selectedRoute)?.routeName}
                    </strong>
                  </div>
                </motion.div>
              )}
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
            disabled={processing || currentStep === 1}
            icon="⬅️"
          >
            Previous
          </WorldClassButton>
          
          {/* Step Info */}
          <div className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Step {currentStep} of {totalSteps}
          </div>
          
          {/* Next/Assign Button */}
          {currentStep < totalSteps ? (
            <WorldClassButton
              onClick={handleNext}
              variant="primary"
              size="sm"
              disabled={processing || !canProceed()}
              icon="➡️"
            >
              Next
            </WorldClassButton>
          ) : (
            <WorldClassButton
              onClick={handleBulkAssign}
              variant="success"
              size="sm"
              disabled={processing || !canProceed()}
              loading={processing}
              icon="✅"
            >
              {processing ? 'Processing...' : 'Assign Students'}
            </WorldClassButton>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
