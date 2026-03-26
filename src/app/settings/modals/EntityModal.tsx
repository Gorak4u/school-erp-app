'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced TypeScript interfaces
interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  data?: any;
  onSave: (data: any) => Promise<void>;
  isDark: boolean;
  academicYears?: any[];
}

// Enhanced entity types
type EntityType = 'academicYear' | 'board' | 'medium' | 'class' | 'section' | 'timing' | 'feeStructure';

// Enhanced field configuration
interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'date' | 'time' | 'select' | 'checkbox' | 'textarea';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  validation?: (value: any) => string | null;
}

export const EntityModal: React.FC<EntityModalProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  data, 
  onSave, 
  isDark, 
  academicYears = [] 
}) => {
  // Enhanced state management
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoized field configurations for each entity type
  const fieldConfigs = useMemo((): Record<EntityType, FieldConfig[]> => ({
    academicYear: [
      { key: 'name', label: 'Academic Year Name', type: 'text', required: true, placeholder: 'e.g., 2024-2025' },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date', required: true },
      { key: 'isActive', label: 'Active Status', type: 'checkbox' },
    ],
    board: [
      { key: 'name', label: 'Board Name', type: 'text', required: true, placeholder: 'e.g., CBSE, ICSE' },
      { key: 'code', label: 'Board Code', type: 'text', required: true, placeholder: 'e.g., CBSE, ICSE' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
      { key: 'isActive', label: 'Active Status', type: 'checkbox' },
    ],
    medium: [
      { key: 'name', label: 'Medium Name', type: 'text', required: true, placeholder: 'e.g., English, Hindi' },
      { key: 'code', label: 'Medium Code', type: 'text', required: true, placeholder: 'e.g., EN, HI' },
      { key: 'academicYearId', label: 'Academic Year', type: 'select', required: true },
      { key: 'isActive', label: 'Active Status', type: 'checkbox' },
    ],
    class: [
      { key: 'name', label: 'Class Name', type: 'text', required: true, placeholder: 'e.g., Grade 1, Class 10' },
      { key: 'code', label: 'Class Code', type: 'text', required: true, placeholder: 'e.g., G1, C10' },
      { key: 'level', label: 'Class Level', type: 'select', required: true, options: ['primary', 'middle', 'high', 'senior'] },
      { key: 'academicYearId', label: 'Academic Year', type: 'select', required: true },
      { key: 'isActive', label: 'Active Status', type: 'checkbox' },
    ],
    section: [
      { key: 'name', label: 'Section Name', type: 'text', required: true, placeholder: 'e.g., A, B, C' },
      { key: 'academicYearId', label: 'Academic Year', type: 'select', required: true },
      { key: 'isActive', label: 'Active Status', type: 'checkbox' },
    ],
    timing: [
      { key: 'name', label: 'Timing Name', type: 'text', required: true, placeholder: 'e.g., Morning Shift, Evening Shift' },
      { key: 'startTime', label: 'Start Time', type: 'time', required: true },
      { key: 'endTime', label: 'End Time', type: 'time', required: true },
      { key: 'breakTime', label: 'Break Time', type: 'text', placeholder: 'e.g., 12:00-13:00' },
      { key: 'isActive', label: 'Active Status', type: 'checkbox' },
    ],
    feeStructure: [
      { key: 'name', label: 'Fee Structure Name', type: 'text', required: true, placeholder: 'e.g., Standard Fee, Premium Fee' },
      { key: 'academicYearId', label: 'Academic Year', type: 'select', required: true },
      { key: 'totalAmount', label: 'Total Amount', type: 'text', required: true, placeholder: 'e.g., 50000' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
      { key: 'isActive', label: 'Active Status', type: 'checkbox' },
    ],
  }), []);

  // Enhanced default data generator
  const getDefaultData = useCallback((entityType: EntityType) => {
    const config = fieldConfigs[entityType];
    const defaultData: Record<string, any> = {};
    
    config.forEach(field => {
      switch (field.type) {
        case 'checkbox':
          defaultData[field.key] = field.key === 'isActive';
          break;
        case 'select':
          defaultData[field.key] = '';
          break;
        case 'time':
          defaultData[field.key] = field.key === 'startTime' ? '09:00' : field.key === 'endTime' ? '15:00' : '';
          break;
        default:
          defaultData[field.key] = '';
      }
    });
    
    return defaultData;
  }, [fieldConfigs]);

  // Enhanced form initialization
  useEffect(() => {
    if (isOpen) {
      setFormData(data || getDefaultData(type as EntityType));
      setErrors({});
    }
  }, [isOpen, data, type, getDefaultData]);

  // Enhanced form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const config = fieldConfigs[type as EntityType] || [];
    
    config.forEach(field => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
      
      // Custom validations
      if (field.validation) {
        const error = field.validation(formData[field.key]);
        if (error) newErrors[field.key] = error;
      }
    });
    
    // Date validation for academic years
    if (type === 'academicYear' && formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    // Time validation for timings
    if (type === 'timing' && formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, type, fieldConfigs]);

  // Enhanced form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save entity:', error);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, onSave, onClose]);

  // Enhanced input change handler
  const handleInputChange = useCallback((key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev: any) => ({ ...prev, [key]: '' }));
    }
  }, [errors]);

  // Memoized CSS classes with world-class UI template
  const modalClasses = useMemo(() =>
    `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm`,
    []
  );

  const cardClasses = useMemo(() =>
    `w-full max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-gradient-to-br ${
      isDark 
        ? 'from-gray-800/95 to-gray-900/95 border-gray-700/50' 
        : 'from-white/95 to-gray-50/95 border-gray-200/50'
    } rounded-3xl shadow-2xl p-6 border backdrop-blur-xl`,
    [isDark]
  );

  const inputClasses = useMemo(() =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
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
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
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
            className={cardClasses}
          >
            {/* Enhanced Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex justify-between items-center mb-8"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20' : 'bg-gradient-to-br from-blue-100 to-blue-200'
                  }`}
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </motion.div>
                <h2 className={`text-xl font-bold bg-gradient-to-r ${isDark ? 'from-blue-400 to-blue-300' : 'from-blue-600 to-blue-500'} bg-clip-text text-transparent`}>
                  {data?.id ? 'Edit' : 'Create'} {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`p-2 rounded-xl transition-all ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </motion.div>

            {/* Enhanced Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {(fieldConfigs[type as EntityType] || []).map((field, index) => (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="space-y-2"
                  >
                    <label className={labelClasses}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {/* Text/Date/Time Inputs */}
                    {['text', 'date', 'time'].includes(field.type) && (
                      <motion.input
                        whileFocus={{ scale: 1.02 }}
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className={`${inputClasses} ${errors[field.key] ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        required={field.required}
                      />
                    )}

                    {/* Textarea */}
                    {field.type === 'textarea' && (
                      <motion.textarea
                        whileFocus={{ scale: 1.02 }}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className={`${inputClasses} min-h-[80px] resize-none ${errors[field.key] ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        rows={3}
                      />
                    )}

                    {/* Select Dropdown */}
                    {field.type === 'select' && (
                      <motion.select
                        whileFocus={{ scale: 1.02 }}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className={`${inputClasses} ${errors[field.key] ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.key === 'academicYearId' && academicYears
                          .filter((ay: any) => ay.isActive)
                          .map((ay: any) => (
                            <option key={ay.id} value={ay.id}>
                              {ay.name} ({ay.startDate?.slice(0, 10)} - {ay.endDate?.slice(0, 10)})
                            </option>
                          ))}
                        {field.options?.map(option => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </motion.select>
                    )}

                    {/* Checkbox */}
                    {field.type === 'checkbox' && (
                      <motion.div 
                        className="flex items-center gap-3"
                        whileHover={{ scale: 1.02 }}
                      >
                        <input
                          type="checkbox"
                          id={field.key}
                          checked={formData[field.key] || false}
                          onChange={(e) => handleInputChange(field.key, e.target.checked)}
                          className="w-5 h-5 rounded-lg accent-blue-500"
                        />
                        <label htmlFor={field.key} className={labelClasses}>
                          {field.label}
                        </label>
                      </motion.div>
                    )}

                    {/* Error Messages */}
                    <AnimatePresence>
                      {errors[field.key] && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-xs text-red-500 mt-1"
                        >
                          {errors[field.key]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Enhanced Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex gap-4 pt-6"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={onClose}
                  className={btnSecondaryClasses}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
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
                        Saving...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="action"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {data?.id ? 'Update' : 'Create'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
