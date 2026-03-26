'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';
import useRefundCalculation from '@/hooks/useRefunds';
import { refundPerformanceMonitor } from '@/lib/refundLogger';

// Icons
import {
  X,
  Plus,
  Search,
  Calculator,
  DollarSign,
  CreditCard,
  BanknoteIcon,
  AlertTriangle,
  CheckCircle,
  User,
  FileText,
  Building,
  Mail,
  Phone
} from 'lucide-react';

interface RefundFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (refund: any) => void;
  initialData?: any;
}

// Enhanced field configuration
interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'radio' | 'search';
  required?: boolean;
  options?: Array<{ value: string; label: string; icon?: string }>;
  placeholder?: string;
  validation?: (value: any) => string | null;
}

// AI-Optimized Refund Form Component following settings modal pattern
export default function RefundForm({ isOpen, onClose, onSuccess, initialData }: RefundFormProps) {
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  // Enhanced state management
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [calculation, setCalculation] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  
  const [formData, setFormData] = useState({
    studentId: '',
    type: '',
    sourceId: '',
    sourceType: '',
    amount: '',
    adminFee: '',
    reason: '',
    refundMethod: '',
    bankDetails: {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountHolder: ''
    }
  });

  // AI-optimized hooks
  const refundCalculation = useRefundCalculation();

  // Memoized field configurations
  const refundTypes = useMemo(() => [
    { value: 'academic_fee', label: 'Academic Fee', icon: '📚' },
    { value: 'transport_fee', label: 'Transport Fee', icon: '🚌' },
    { value: 'fine', label: 'Fine', icon: '⚖️' },
    { value: 'overpayment', label: 'Overpayment', icon: '💰' }
  ], []);

  const refundMethods = useMemo(() => [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
    { value: 'credit_future', label: 'Credit to Future Fees', icon: '💳' },
    { value: 'cash', label: 'Cash', icon: '💵' }
  ], []);

  // CSS class generators following settings modal pattern
  const modalClasses = useMemo(() =>
    `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`,
    []
  );

  const modalContentClasses = useMemo(() =>
    `w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`,
    [isDark]
  );

  const cardClasses = useMemo(() =>
    `rounded-2xl border p-6 shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`,
    [isDark]
  );

  const inputClasses = useMemo(() =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${
      isDark 
        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
        : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-400'
    }`,
    [isDark]
  );

  const labelClasses = useMemo(() =>
    `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`,
    [isDark]
  );

  const btnPrimaryClasses = useMemo(() =>
    `flex-1 px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${
      isDark 
        ? 'bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white' 
        : 'bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white'
    }`,
    [isDark]
  );

  const btnSecondaryClasses = useMemo(() =>
    `flex-1 px-6 py-3 rounded-xl text-sm font-medium border transition-all transform hover:scale-105 ${
      isDark 
        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
    }`,
    [isDark]
  );

  const stepIndicatorClasses = useMemo(() =>
    `flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
    }`,
    [isDark]
  );

  const activeStepClasses = useMemo(() =>
    `flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
      isDark ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg' : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
    }`,
    [isDark]
  );

  // Enhanced validation
  const validateStep = useCallback((stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!selectedStudent) {
        newErrors.student = 'Please select a student';
      }
    } else if (stepNumber === 2) {
      if (!formData.type) newErrors.type = 'Please select refund type';
      if (!formData.amount) newErrors.amount = 'Please enter amount';
      if (!formData.reason) newErrors.reason = 'Please enter reason';
    } else if (stepNumber === 3) {
      if (!formData.refundMethod) newErrors.refundMethod = 'Please select refund method';
      if (formData.refundMethod === 'bank_transfer') {
        if (!formData.bankDetails.accountNumber) newErrors.accountNumber = 'Please enter account number';
        if (!formData.bankDetails.bankName) newErrors.bankName = 'Please enter bank name';
        if (!formData.bankDetails.ifscCode) newErrors.ifscCode = 'Please enter IFSC code';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedStudent, formData]);

  // Enhanced student search
  const searchStudents = useCallback(async (query: string) => {
    if (!query.trim()) {
      setStudents([]);
      return;
    }

    try {
      const response = await fetch(`/api/students?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Error searching students:', error);
      setStudents([]);
    }
  }, []);

  // Enhanced refund calculation
  const performRefundCalculation = useCallback(async () => {
    if (!selectedStudent || !formData.type || !formData.amount) return;

    setCalculating(true);
    const operationId = `calculate_refund_${Date.now()}`;
    refundPerformanceMonitor.startOperation(operationId);

    try {
      const response = await fetch('/api/refunds/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          type: formData.type,
          amount: parseFloat(formData.amount),
          sourceId: formData.sourceId,
          sourceType: formData.sourceType
        })
      });

      const result = await response.json();

      if (response.ok) {
        setCalculation(result);
        setFormData(prev => ({
          ...prev,
          adminFee: result.adminFee?.toString() || '0',
          netAmount: result.netAmount?.toString() || formData.amount
        }));
      } else {
        throw new Error(result.error || 'Failed to calculate refund');
      }
    } catch (error) {
      console.error('Error calculating refund:', error);
      showErrorToast('Error', 'Failed to calculate refund amount');
    } finally {
      refundPerformanceMonitor.endOperation(operationId, 'RefundForm.performRefundCalculation');
      setCalculating(false);
    }
  }, [selectedStudent, formData.type, formData.amount, formData.sourceId, formData.sourceType]);

  // Enhanced form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    setLoading(true);
    const operationId = `submit_refund_${Date.now()}`;
    refundPerformanceMonitor.startOperation(operationId);

    try {
      const payload = {
        studentId: selectedStudent.id,
        type: formData.type,
        sourceId: formData.sourceId,
        sourceType: formData.sourceType,
        amount: parseFloat(formData.amount),
        adminFee: parseFloat(formData.adminFee || '0'),
        reason: formData.reason,
        refundMethod: formData.refundMethod,
        bankDetails: formData.refundMethod === 'bank_transfer' ? formData.bankDetails : null
      };

      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        showSuccessToast('Success', 'Refund request created successfully');
        onSuccess(result.refund);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create refund request');
      }
    } catch (error) {
      console.error('Error submitting refund:', error);
      showErrorToast('Error', error instanceof Error ? error.message : 'Failed to create refund request');
    } finally {
      refundPerformanceMonitor.endOperation(operationId, 'RefundForm.handleSubmit');
      setLoading(false);
    }
  }, [selectedStudent, formData, validateStep, onSuccess, onClose]);

  // Enhanced step navigation
  const nextStep = useCallback(() => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  }, [step, validateStep]);

  const prevStep = useCallback(() => {
    setStep(step - 1);
  }, []);

  // Enhanced student selection
  const selectStudent = useCallback((student: any) => {
    setSelectedStudent(student);
    setFormData(prev => ({ ...prev, studentId: student.id }));
    setStudents([]);
    setStudentSearchTerm(student.name);
  }, []);

  // Enhanced form field update
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const updateBankDetails = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value }
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Enhanced effects
  useEffect(() => {
    if (studentSearchTerm) {
      const timeoutId = setTimeout(() => searchStudents(studentSearchTerm), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setStudents([]);
    }
  }, [studentSearchTerm, searchStudents]);

  useEffect(() => {
    if (formData.type && formData.amount && selectedStudent) {
      performRefundCalculation();
    }
  }, [formData.type, formData.amount, selectedStudent, performRefundCalculation]);

  // Render step 1: Student Selection
  const renderStudentSelection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <label className={labelClasses}>Select Student</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or admission number..."
            value={studentSearchTerm}
            onChange={(e) => setStudentSearchTerm(e.target.value)}
            className={`${inputClasses} pl-10`}
          />
        </div>
        {errors.student && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1"
          >
            {errors.student}
          </motion.p>
        )}
      </div>

      {students.length > 0 && (
        <div className={`max-h-60 overflow-y-auto rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          {students.map((student) => (
            <motion.button
              key={student.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectStudent(student)}
              className={`w-full p-4 text-left border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {student.name}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {student.admissionNo} • {student.class}{student.section && `-${student.section}`}
                  </div>
                </div>
                <User className="w-5 h-5 text-gray-400" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {selectedStudent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cardClasses}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-teal-600/20' : 'bg-teal-100'}`}>
              <User className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selectedStudent.name}
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {selectedStudent.admissionNo} • {selectedStudent.class}{selectedStudent.section && `-${selectedStudent.section}`}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  // Render step 2: Refund Details
  const renderRefundDetails = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <label className={labelClasses}>Refund Type</label>
        <div className="grid grid-cols-2 gap-3">
          {refundTypes.map((type) => (
            <motion.button
              key={type.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateFormData('type', type.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.type === type.value
                  ? isDark ? 'border-teal-600 bg-teal-600/20' : 'border-teal-500 bg-teal-50'
                  : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {type.label}
              </div>
            </motion.button>
          ))}
        </div>
        {errors.type && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1"
          >
            {errors.type}
          </motion.p>
        )}
      </div>

      <div>
        <label className={labelClasses}>Amount (₹)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => updateFormData('amount', e.target.value)}
            className={`${inputClasses} pl-10`}
          />
        </div>
        {errors.amount && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1"
          >
            {errors.amount}
          </motion.p>
        )}
      </div>

      {calculation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cardClasses}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Refund Calculation
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Gross Amount:</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{parseFloat(formData.amount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Admin Fee:</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{parseFloat(calculation.adminFee || 0).toFixed(2)}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Net Amount:</span>
                <span className={`font-bold text-teal-600`}>
                  ₹{parseFloat(calculation.netAmount || formData.amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div>
        <label className={labelClasses}>Reason for Refund</label>
        <textarea
          placeholder="Please provide a detailed reason for this refund request..."
          value={formData.reason}
          onChange={(e) => updateFormData('reason', e.target.value)}
          rows={4}
          className={inputClasses}
        />
        {errors.reason && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1"
          >
            {errors.reason}
          </motion.p>
        )}
      </div>
    </motion.div>
  );

  // Render step 3: Refund Method
  const renderRefundMethod = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <label className={labelClasses}>Refund Method</label>
        <div className="grid grid-cols-1 gap-3">
          {refundMethods.map((method) => (
            <motion.button
              key={method.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateFormData('refundMethod', method.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.refundMethod === method.value
                  ? isDark ? 'border-teal-600 bg-teal-600/20' : 'border-teal-500 bg-teal-50'
                  : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{method.icon}</div>
                <div className="text-left">
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {method.label}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        {errors.refundMethod && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1"
          >
            {errors.refundMethod}
          </motion.p>
        )}
      </div>

      {formData.refundMethod === 'bank_transfer' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cardClasses}
        >
          <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Bank Details
          </h4>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Account Number</label>
              <input
                type="text"
                placeholder="Enter account number"
                value={formData.bankDetails.accountNumber}
                onChange={(e) => updateBankDetails('accountNumber', e.target.value)}
                className={inputClasses}
              />
              {errors.accountNumber && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.accountNumber}
                </motion.p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Bank Name</label>
              <input
                type="text"
                placeholder="Enter bank name"
                value={formData.bankDetails.bankName}
                onChange={(e) => updateBankDetails('bankName', e.target.value)}
                className={inputClasses}
              />
              {errors.bankName && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.bankName}
                </motion.p>
              )}
            </div>

            <div>
              <label className={labelClasses}>IFSC Code</label>
              <input
                type="text"
                placeholder="Enter IFSC code"
                value={formData.bankDetails.ifscCode}
                onChange={(e) => updateBankDetails('ifscCode', e.target.value)}
                className={inputClasses}
              />
              {errors.ifscCode && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.ifscCode}
                </motion.p>
              )}
            </div>

            <div>
              <label className={labelClasses}>Account Holder Name</label>
              <input
                type="text"
                placeholder="Enter account holder name"
                value={formData.bankDetails.accountHolder}
                onChange={(e) => updateBankDetails('accountHolder', e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={modalClasses}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className={modalContentClasses}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Create Refund Request
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3].map((stepNumber) => (
                  <React.Fragment key={stepNumber}>
                    <div className={stepNumber <= step ? activeStepClasses : stepIndicatorClasses}>
                      {stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`flex-1 h-0.5 ${stepNumber < step ? 'bg-teal-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-around mt-2">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Student</span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Details</span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Method</span>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {step === 1 && renderStudentSelection()}
                  {step === 2 && renderRefundDetails()}
                  {step === 3 && renderRefundMethod()}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8">
                  {step > 1 && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={prevStep}
                      className={btnSecondaryClasses}
                    >
                      Previous
                    </motion.button>
                  )}
                  
                  {step < 3 ? (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={nextStep}
                      className={btnPrimaryClasses}
                    >
                      Next
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={loading}
                      className={btnPrimaryClasses}
                    >
                      <AnimatePresence mode="wait">
                        {loading ? (
                          <motion.span
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Creating...
                          </motion.span>
                        ) : (
                          <motion.span
                            key="action"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Create Refund
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
