'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, GraduationCap, School, AlertTriangle, CheckCircle } from 'lucide-react';

interface BulkFineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bulkData: BulkFineData) => void;
  loading?: boolean;
  theme?: 'dark' | 'light';
}

interface BulkFineData {
  targetType: 'class' | 'medium' | 'school';
  targetValue: string;
  fineType: string;
  amount: number;
  description: string;
  dueDate: string;
  reason: string;
  previewCount?: number;
}

interface StudentPreview {
  id: string;
  name: string;
  admissionNo: string;
  class: string;
  section: string;
  languageMedium: string;
}

export default function BulkFineModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false,
  theme = 'light' 
}: BulkFineModalProps) {
  const isDark = theme === 'dark';

  // CSS Variables
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  // Form state
  const [formData, setFormData] = useState<BulkFineData>({
    targetType: 'class',
    targetValue: '',
    fineType: 'late_fee',
    amount: 0, // Changed from '' to number
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    reason: '',
    previewCount: 0
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-set targetValue when targetType changes to school
  useEffect(() => {
    if (formData.targetType === 'school') {
      setFormData(prev => ({ ...prev, targetValue: 'all-students' }));
    } else if (formData.targetValue === 'all-students') {
      setFormData(prev => ({ ...prev, targetValue: '' }));
    }
  }, [formData.targetType]);

  // Available options
  const [classes, setClasses] = useState<Array<{value: string, label: string, medium: string, classId: string, sections: any[]}>>([]);
  const [mediums, setMediums] = useState<string[]>([]);
  const [previewStudents, setPreviewStudents] = useState<StudentPreview[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch available options
  useEffect(() => {
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  const fetchOptions = async () => {
    try {
      // Fetch classes from school structure API
      const classesResponse = await fetch('/api/school-structure/classes?isActive=true', {
        credentials: 'include'
      });
      
      // Fetch mediums from school structure
      const mediumsResponse = await fetch('/api/school-structure/mediums?isActive=true', {
        credentials: 'include'
      });
      
      if (classesResponse.ok && mediumsResponse.ok) {
        const classesData = await classesResponse.json();
        const mediumsData = await mediumsResponse.json();
        
        console.log('Bulk fine modal - Classes data:', classesData); // Debug log
        console.log('Bulk fine modal - Mediums data:', mediumsData); // Debug log
        
        if (classesData.classes && mediumsData.mediums) {
          // Convert classes to rich object structure
          const classOptions = classesData.classes.map((classItem: any) => {
            console.log('Processing class item:', classItem); // Debug log
            
            return {
              value: classItem.name,
              label: `${classItem.name} (${classItem.medium?.name || 'N/A'})`, // Will be enhanced with student count
              medium: classItem.medium?.name || 'N/A',
              classId: classItem.id,
              sections: classItem.sections || []
            };
          });
          
          console.log('Class options before deduplication:', classOptions); // Debug log
          
          // Set classes and mediums
          setClasses(classOptions);
          setMediums(mediumsData.mediums.map((m: any) => m.name));
          
          // Now enhance class labels with student count information
          if (classOptions.length > 0) {
            await enhanceClassesWithStudentCount(classOptions);
          }
        } else {
          console.error('Bulk fine modal - API returned no data');
          setClasses([]);
          setMediums([]);
        }
      } else {
        console.error('Bulk fine modal - API response not ok:', { classes: classesResponse.status, mediums: mediumsResponse.status });
        setClasses([]);
        setMediums([]);
      }
    } catch (error) {
      console.error('Error fetching options:', error);
      setClasses([]);
      setMediums([]);
    }
  };

  // Helper function to enhance classes with student count information
  const enhanceClassesWithStudentCount = async (classOptions: Array<{value: string, label: string, medium: string, classId: string, sections: any[]}>) => {
    try {
      // For each class, get student count
      const enhancedClasses = await Promise.all(
        classOptions.map(async (classOption) => {
          // Get students for this specific class
          const studentsResponse = await fetch(
            `/api/students?class=${encodeURIComponent(classOption.value)}&pageSize=1`,
            { credentials: 'include' }
          );
          
          let studentCount = 0;
          if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            // The students API might return total count or we need to count
            studentCount = studentsData.total || studentsData.students?.length || 0;
          }
          
          return {
            ...classOption,
            label: `${classOption.value} (${classOption.medium}) - ${studentCount} students`
          };
        })
      );
      
      setClasses(enhancedClasses);
    } catch (error) {
      console.error('Error enhancing classes with student count:', error);
      // Keep original classes if enhancement fails
    }
  };

  // Preview affected students
  const fetchPreview = async () => {
    if (!formData.targetValue || !formData.targetType) return;

    setLoadingPreview(true);
    try {
      let url = `/api/students?pageSize=10`; 
      
      if (formData.targetType === 'class') {
        const [className] = formData.targetValue.split('-');
        url += `&class=${encodeURIComponent(className)}`;
      } else if (formData.targetType === 'medium') {
        url += `&languageMedium=${encodeURIComponent(formData.targetValue)}`;
      }
      // For 'school', no filter needed - we'll just get first 10 students
      
      const response = await fetch(url, { credentials: 'include' });
      
      if (response.ok) {
        const data = await response.json();
        setPreviewStudents(data.students?.slice(0, 5) || []); 
        setFormData(prev => ({ ...prev, previewCount: data.total || data.students?.length || 0 }));
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (formData.targetValue && formData.targetType) {
      fetchPreview();
    } else {
      setPreviewStudents([]);
      setFormData(prev => ({ ...prev, previewCount: 0 }));
    }
  }, [formData.targetValue, formData.targetType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationErrors({});
    
    // Comprehensive validation
    const errors: Record<string, string> = {};
    
    // Target validation
    if (!formData.targetValue) {
      errors.targetValue = 'Please select a target for the bulk fine';
    }
    
    // Amount validation
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount greater than 0';
    } else if (Number(formData.amount) > 100000) {
      errors.amount = 'Amount cannot exceed ₹1,00,000';
    }
    
    // Description validation
    if (!formData.description || formData.description.trim().length === 0) {
      errors.description = 'Please enter a description for the fine';
    } else if (formData.description.trim().length < 5) {
      errors.description = 'Description must be at least 5 characters long';
    } else if (formData.description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }
    
    // Due date validation
    if (!formData.dueDate) {
      errors.dueDate = 'Please select a due date';
    } else {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.dueDate = 'Due date cannot be in the past';
      } else if (selectedDate > new Date(today.getTime() + (365 * 24 * 60 * 60 * 1000))) {
        errors.dueDate = 'Due date cannot be more than 1 year in the future';
      }
    }
    
    // Reason validation (optional but if provided, must be valid)
    if (formData.reason && formData.reason.trim().length > 0) {
      if (formData.reason.trim().length < 3) {
        errors.reason = 'Reason must be at least 3 characters long if provided';
      } else if (formData.reason.trim().length > 200) {
        errors.reason = 'Reason cannot exceed 200 characters';
      }
    }
    
    // Preview count validation
    if ((formData.previewCount || 0) === 0) {
      errors.previewCount = 'No students found for the selected target';
    }
    
    // Large operation warning
    if ((formData.previewCount || 0) > 1000) {
      errors.largeOperation = `Warning: You are about to create fines for ${formData.previewCount} students. This will take significant time to process.`;
    }
    
    // Set errors and stop submission if any validation errors exist
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      
      // Show alert for critical errors
      const criticalErrors = Object.entries(errors).filter(([key, message]) => 
        !['largeOperation', 'reason'].includes(key)
      );
      
      if (criticalErrors.length > 0) {
        const errorMessages = criticalErrors.map(([key, message]) => `${getTargetLabel()}: ${message}`).join('\n');
        alert(`Please fix the following errors:\n\n${errorMessages}`);
      }
      return;
    }

    onSubmit(formData);
  };

  const getTargetIcon = () => {
    switch (formData.targetType) {
      case 'class': return <GraduationCap className="w-5 h-5" />;
      case 'medium': return <Users className="w-5 h-5" />;
      case 'school': return <School className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getTargetLabel = () => {
    switch (formData.targetType) {
      case 'class': return 'Class';
      case 'medium': return 'Medium';
      case 'school': return 'Entire School';
      default: return 'Target';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`${card} w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
        >
          {/* Header */}
          <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                  {getTargetIcon()}
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Create Bulk Fine
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Assign fines to multiple students at once
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Target Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={label}>Target Type *</label>
                <select
                  value={formData.targetType}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetType: e.target.value as any, targetValue: '' }))}
                  className={input}
                  required
                >
                  <option value="class">Class</option>
                  <option value="medium">Medium</option>
                  <option value="school">Entire School</option>
                </select>
              </div>

              <div>
                <label className={label}>{getTargetLabel()} *</label>
                {formData.targetType === 'class' ? (
                  <>
                    <select
                      value={formData.targetValue}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, targetValue: e.target.value }));
                        // Clear error when user makes selection
                        if (validationErrors.targetValue) {
                          setValidationErrors(prev => ({ ...prev, targetValue: '' }));
                        }
                      }}
                      className={`${input} ${validationErrors.targetValue ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
                        <option key={cls.classId} value={cls.value}>{cls.label}</option>
                      ))}
                    </select>
                    {validationErrors.targetValue && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.targetValue}</p>
                    )}
                  </>
                ) : formData.targetType === 'medium' ? (
                  <>
                    <select
                      value={formData.targetValue}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, targetValue: e.target.value }));
                        // Clear error when user makes selection
                        if (validationErrors.targetValue) {
                          setValidationErrors(prev => ({ ...prev, targetValue: '' }));
                        }
                      }}
                      className={`${input} ${validationErrors.targetValue ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                      required
                    >
                      <option value="">Select Medium</option>
                      {mediums.map(medium => (
                        <option key={medium} value={medium}>{medium}</option>
                      ))}
                    </select>
                    {validationErrors.targetValue && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.targetValue}</p>
                    )}
                  </>
                ) : (
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-200'} border`}>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      All active students in the school
                    </p>
                    <input
                      type="hidden"
                      value="all-students"
                      onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Fine Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={label}>Fine Type *</label>
                <select
                  value={formData.fineType}
                  onChange={(e) => setFormData(prev => ({ ...prev, fineType: e.target.value }))}
                  className={input}
                  required
                >
                  <option value="late_fee">Late Fee</option>
                  <option value="library">Library</option>
                  <option value="uniform">Uniform</option>
                  <option value="discipline">Discipline</option>
                  <option value="damage">Damage</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={label}>Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="Enter fine amount"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }));
                    // Clear error when user corrects the value
                    if (validationErrors.amount) {
                      setValidationErrors(prev => ({ ...prev, amount: '' }));
                    }
                  }}
                  className={`${input} ${validationErrors.amount ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                  min="1"
                  max="100000"
                  step="0.01"
                  required
                />
                {validationErrors.amount && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
                )}
              </div>
            </div>

            <div>
              <label className={label}>Description *</label>
              <textarea
                placeholder="Describe the reason for this fine..."
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                  // Clear error when user types
                  if (validationErrors.description) {
                    setValidationErrors(prev => ({ ...prev, description: '' }));
                  }
                }}
                className={`${input} resize-none ${validationErrors.description ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                rows={3}
                maxLength={500}
                required
              />
              {validationErrors.description && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
              )}
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                {formData.description.length}/500 characters
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={label}>Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, dueDate: e.target.value }));
                    // Clear error when user selects a date
                    if (validationErrors.dueDate) {
                      setValidationErrors(prev => ({ ...prev, dueDate: '' }));
                    }
                  }}
                  className={`${input} ${validationErrors.dueDate ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]}
                  required
                />
                {validationErrors.dueDate && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.dueDate}</p>
                )}
              </div>

              <div>
                <label className={label}>Reason for Bulk Fine</label>
                <input
                  type="text"
                  placeholder="e.g., Late submission, uniform violation..."
                  value={formData.reason}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, reason: e.target.value }));
                    // Clear error when user types
                    if (validationErrors.reason) {
                      setValidationErrors(prev => ({ ...prev, reason: '' }));
                    }
                  }}
                  className={`${input} ${validationErrors.reason ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                  maxLength={200}
                />
                {validationErrors.reason && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.reason}</p>
                )}
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Optional (max 200 characters)
                </div>
              </div>
            </div>

            {/* Preview Section */}
            {formData.targetValue && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-200'} border`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Preview Affected Students
                  </h3>
                  {loadingPreview ? (
                    <div className="text-sm text-gray-500">Loading...</div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {formData.previewCount} students will be affected
                      </span>
                    </div>
                  )}
                </div>

                {previewStudents.length > 0 && (
                  <div className="space-y-2">
                    {/* Show sample message for large operations */}
                    {(formData.previewCount || 0) > 5 && (
                      <div className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} italic pb-2`}>
                        Showing sample of {Math.min(5, previewStudents.length)} students out of {formData.previewCount || 0} total
                      </div>
                    )}
                    
                    {previewStudents.slice(0, 5).map((student) => (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-700/50' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'} flex items-center justify-center`}>
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {student.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {student.name}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {student.admissionNo} • {student.class}-{student.section} • {student.languageMedium || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          ₹{formData.amount}
                        </div>
                      </div>
                    ))}
                    
                    {(formData.previewCount || 0) > 5 && (
                      <div className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} italic pt-2`}>
                        ... and {(formData.previewCount || 0) - 5} more students
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Validation Errors Summary */}
            {Object.keys(validationErrors).length > 0 && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20 border-red-600/30' : 'bg-red-50 border-red-200'} border`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                      Please Fix Validation Errors
                    </p>
                    <ul className={`text-xs ${isDark ? 'text-red-300' : 'text-red-600'} mt-1 space-y-1`}>
                      {Object.entries(validationErrors)
                        .filter(([key, message]) => !['largeOperation'].includes(key))
                        .map(([key, message]) => (
                          <li key={key}>• {message}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Large Operation Warning */}
            {validationErrors.largeOperation && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-yellow-900/20 border-yellow-600/30' : 'bg-yellow-50 border-yellow-200'} border`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      Large Bulk Operation
                    </p>
                    <p className={`text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-600'} mt-1`}>
                      {validationErrors.largeOperation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={`flex gap-3 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                type="button"
                onClick={onClose}
                className={btnSecondary}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || Object.keys(validationErrors).some(key => 
                  !['largeOperation', 'reason'].includes(key)
                )}
                className={btnPrimary}
              >
                {loading ? 'Creating...' : `Create Bulk Fine (${formData.previewCount || 0} students)`}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
