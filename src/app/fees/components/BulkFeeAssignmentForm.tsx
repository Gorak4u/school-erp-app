'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, DollarSign, Calendar, CheckCircle, AlertCircle, X, ChevronRight, ChevronLeft, Plus, Users, Building, GraduationCap, School } from 'lucide-react';

interface BulkFeeAssignmentFormProps {
  theme: 'dark' | 'light';
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
  amount: string;
  category: 'fee' | 'fine' | 'other';
  targetType: 'student' | 'class' | 'medium' | 'school';
  studentIds: string[];
  classIds: string[];
  mediumIds: string[];
  academicYearId: string;
  dueDate: string;
  frequency: 'once' | 'monthly' | 'quarterly' | 'yearly';
  lateFee: string;
  isOptional: boolean;
  remarks: string;
}

interface ValidationState {
  step: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export default function BulkFeeAssignmentForm({ theme, onClose, onSuccess }: BulkFeeAssignmentFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    step: 1,
    isValid: false,
    errors: [],
    warnings: []
  });
  
  // Data States
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [mediums, setMediums] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<Array<{id: string; year: string; name: string}>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudentLookup, setSelectedStudentLookup] = useState<Record<string, any>>({});
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // CSS Variables - Modern UI Design
  const isDark = theme === 'dark';
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`;
  const btnPrimary = `px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-5 py-3 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;
  const row = `p-4 rounded-xl border ${isDark ? 'border-gray-600/50 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'}`;
  const tile = `p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-105 ${isDark ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-400'}`;
  const tileSelected = `p-4 rounded-xl border-2 transition-all cursor-pointer ring-2 ring-blue-200 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20`;
  const glassCard = `rounded-2xl border shadow-xl backdrop-blur-md ${isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'}`;
  const successBadge = `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-green-900/30 text-green-400 border border-green-600/30' : 'bg-green-100 text-green-700 border border-green-200'}`;
  const warningBadge = `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-600/30' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`;
  const errorBadge = `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-red-900/30 text-red-400 border border-red-600/30' : 'bg-red-100 text-red-700 border border-red-200'}`;
  
  // Text color variables
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const textTertiary = isDark ? 'text-gray-500' : 'text-gray-500';

  // Form State
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    amount: '',
    category: 'fee',
    targetType: 'student',
    studentIds: [],
    classIds: [],
    mediumIds: [],
    academicYearId: '',
    dueDate: '',
    frequency: 'once',
    lateFee: '0',
    isOptional: false,
    remarks: ''
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Debounced search for students
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchStudents(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchStudents = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/students?search=${encodeURIComponent(query)}&pageSize=50`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        // Filter out alumni students if this is a fine
        let filteredStudents = data.students || [];
        if (formData.category === 'fine') {
          filteredStudents = filteredStudents.filter((student: any) => {
            const status = student.status?.toLowerCase();
            // Alumni statuses that should not receive fines
            const alumniStatuses = ['graduated', 'transferred', 'exit', 'exited', 'suspended', 'alumni'];
            return !alumniStatuses.includes(status);
          });
        }
        setSearchResults(filteredStudents);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to search students:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/school-config', { credentials: 'include' });
      const configData = await response.json();

      if (response.ok) {
        console.log('School config data:', configData);
        console.log('Classes data:', configData.classes);
        console.log('Mediums data:', configData.mediums);
        
        setClasses(configData.classes || []);
        setMediums(configData.mediums || []);
        setAcademicYears(configData.academicYears || []);
        
        // Set default academic year - prefer activeAcademicYear, then first in list
        if (configData.academicYears?.length > 0) {
          const activeYear = configData.activeAcademicYear || 
                             configData.academicYears.find((year: any) => year.isActive) || 
                             configData.academicYears[0];
          console.log('Setting active academic year:', activeYear);
          setFormData(prev => ({ ...prev, academicYearId: activeYear.id }));
        } else {
          console.log('No academic years found in config data');
        }
      } else {
        console.error('Failed to load school config:', configData.error);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate automatic fee name based on scope and targets
  const generateFeeName = (): string => {
    const categoryText = formData.category === 'fee' ? 'Fee' : 
                        formData.category === 'fine' ? 'Fine' : 'Charge';
    
    let targetDetails = '';
    
    if (formData.targetType === 'student' && formData.studentIds.length > 0) {
      const studentNames = formData.studentIds.slice(0, 2).map(id => {
        const student = selectedStudentLookup[id];
        return student ? student.name : '';
      }).filter(Boolean);
      
      if (studentNames.length === 1) {
        targetDetails = studentNames[0];
      } else if (studentNames.length === 2) {
        targetDetails = `${studentNames[0]} & ${studentNames[1]}`;
      } else {
        targetDetails = `${studentNames[0]} +${formData.studentIds.length - 1} more`;
      }
    } else if (formData.targetType === 'class' && formData.classIds.length > 0) {
      const classNames = formData.classIds.slice(0, 3).map(id => {
        const cls = classes.find(c => c.id === id);
        return cls ? cls.name : '';
      }).filter(Boolean);
      
      if (classNames.length === 1) {
        targetDetails = classNames[0];
      } else if (classNames.length === 2) {
        targetDetails = `${classNames[0]} & ${classNames[1]}`;
      } else if (classNames.length === 3) {
        targetDetails = `${classNames[0]}, ${classNames[1]} & ${classNames[2]}`;
      } else {
        targetDetails = `${classNames[0]} +${formData.classIds.length - 1} more`;
      }
    } else if (formData.targetType === 'medium' && formData.mediumIds.length > 0) {
      const mediumNames = formData.mediumIds.slice(0, 3).map(id => {
        const medium = mediums.find(m => m.id === id);
        return medium ? medium.name : '';
      }).filter(Boolean);
      
      if (mediumNames.length === 1) {
        targetDetails = mediumNames[0];
      } else if (mediumNames.length === 2) {
        targetDetails = `${mediumNames[0]} & ${mediumNames[1]}`;
      } else if (mediumNames.length === 3) {
        targetDetails = `${mediumNames[0]}, ${mediumNames[1]} & ${mediumNames[2]}`;
      } else {
        targetDetails = `${mediumNames[0]} +${formData.mediumIds.length - 1} more`;
      }
    }
    
    // Combine all parts
    if (targetDetails) {
      return `${targetDetails} ${categoryText}`;
    } else if (formData.targetType === 'school') {
      return `School ${categoryText}`;
    } else {
      return `Bulk ${categoryText}`;
    }
  };

  const validateStep = (step: number): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (step === 1) {
      if (!formData.academicYearId) errors.push('Academic year is required');
      if (!formData.targetType) errors.push('Target type selection is required');
      if (formData.targetType === 'student' && formData.studentIds.length === 0) errors.push('Please select at least one student');
      if (formData.targetType === 'class' && formData.classIds.length === 0) errors.push('Please select at least one class');
      if (formData.targetType === 'medium' && formData.mediumIds.length === 0) errors.push('Please select at least one medium');
      
      // Check if any selected students are alumni when assigning fines
      if (formData.category === 'fine' && formData.studentIds.length > 0) {
        const alumniStudents = formData.studentIds.filter(studentId => {
          const student = selectedStudentLookup[studentId];
          if (!student) return false;
          const status = student.status?.toLowerCase();
          const alumniStatuses = ['graduated', 'transferred', 'exit', 'exited', 'suspended', 'alumni'];
          return alumniStatuses.includes(status);
        });
        
        if (alumniStudents.length > 0) {
          errors.push(`Fines cannot be applied to alumni students. ${alumniStudents.length} alumni student(s) were selected.`);
        }
      }
    }

    if (step === 2) {
      if (!formData.name) errors.push('Fee name is required');
      if (!formData.amount || parseFloat(formData.amount) <= 0) errors.push('Amount must be greater than 0');
      if (!formData.dueDate) errors.push('Due date is required');
      
      // Warnings
      if (parseFloat(formData.amount) > 50000) warnings.push('High amount detected - please verify');
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      if (dueDate < today) warnings.push('Due date is in the past');
      
      // Warning for fines applied to classes/mediums (may include alumni)
      if (formData.category === 'fine' && (formData.targetType === 'class' || formData.targetType === 'medium')) {
        warnings.push('Fines applied to classes/mediums will only affect active students. Alumni students will be automatically excluded.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const handleNext = () => {
    const validation = validateStep(currentStep);
    setValidationState({ step: currentStep, ...validation });
    
    if (validation.isValid) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      setValidationState({ step: currentStep, ...validation });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        targetType: formData.targetType,
        targetIds: formData.targetType === 'student' ? formData.studentIds :
                   formData.targetType === 'class' ? formData.classIds :
                   formData.targetType === 'medium' ? formData.mediumIds : [],
        feeName: formData.name,
        amount: parseFloat(formData.amount),
        category: formData.category,
        dueDate: formData.dueDate,
        academicYearId: formData.academicYearId,
        description: formData.description,
        isOptional: formData.isOptional,
        frequency: formData.frequency,
        lateFee: parseFloat(formData.lateFee) || 0,
        remarks: formData.remarks
      };

      const response = await fetch('/api/fees/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign fees/fines');
      }

      setPreviewData(data);
      setCurrentStep(3);
    } catch (error: any) {
      console.error('Failed to assign fees/fines:', error);
      alert(error.message || 'Failed to assign fees/fines');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTargetSelection = (id: string, type: 'student' | 'class' | 'medium') => {
    setFormData(prev => {
      const updated = { ...prev };
      if (type === 'student') {
        const isAdding = !prev.studentIds.includes(id);
        updated.studentIds = isAdding
          ? [...prev.studentIds, id]
          : prev.studentIds.filter(studentId => studentId !== id);
        
        // Update selectedStudentLookup
        if (isAdding) {
          const student = searchResults.find(s => s.id === id);
          if (student) {
            setSelectedStudentLookup(lookup => ({
              ...lookup,
              [id]: student
            }));
          }
        }
      } else if (type === 'class') {
        updated.classIds = prev.classIds.includes(id)
          ? prev.classIds.filter(classId => classId !== id)
          : [...prev.classIds, id];
      } else if (type === 'medium') {
        updated.mediumIds = prev.mediumIds.includes(id)
          ? prev.mediumIds.filter(mediumId => mediumId !== id)
          : [...prev.mediumIds, id];
      }
      return updated;
    });
  };

  const getTargetIcon = () => {
    switch (formData.targetType) {
      case 'student': return <Users className="w-5 h-5" />;
      case 'class': return <GraduationCap className="w-5 h-5" />;
      case 'medium': return <Building className="w-5 h-5" />;
      case 'school': return <School className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Select Targets</h3>
        
        {/* Academic Year */}
        <div className="mb-4">
          <label className={label}>Academic Year *</label>
          <select
            value={formData.academicYearId}
            onChange={(e) => setFormData(prev => ({ ...prev, academicYearId: e.target.value }))}
            className={input}
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Type Selection - Modern Card Design */}
        <div className="mb-8">
          <label className={label}>Assign To *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 'student', label: 'Students', icon: Users, desc: 'Individual students' },
              { value: 'class', label: 'Classes', icon: GraduationCap, desc: 'Entire classes' },
              { value: 'medium', label: 'Mediums', icon: Building, desc: 'By medium' },
              { value: 'school', label: 'Entire School', icon: School, desc: 'All students' }
            ].map((type) => (
              <motion.div
                key={type.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    targetType: type.value as any,
                    studentIds: [],
                    classIds: [],
                    mediumIds: []
                  }))}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    formData.targetType === type.value 
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg' 
                      : `${isDark ? 'border-gray-600 hover:border-blue-400 bg-gray-700/50' : 'border-gray-300 hover:border-blue-400 bg-white'} hover:shadow-md`
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                      formData.targetType === type.value 
                        ? 'bg-blue-500 text-white shadow-lg' 
                        : `${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`
                    }`}>
                      <type.icon className="w-6 h-6" />
                    </div>
                    <div className={`font-semibold mb-1 ${
                      formData.targetType === type.value ? 'text-blue-600 dark:text-blue-400' : textPrimary
                    }`}>
                      {type.label}
                    </div>
                    <div className={`text-xs ${
                      formData.targetType === type.value ? 'text-blue-500 dark:text-blue-300' : textSecondary
                    }`}>
                      {type.desc}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Target Selection */}
        {formData.targetType !== 'school' && (
          <div>
            <label className={label}>
              Select {formData.targetType === 'student' ? 'Students' : 
                     formData.targetType === 'class' ? 'Classes' : 'Mediums'} *
            </label>
            
            {/* Enhanced Search Input */}
            {formData.targetType === 'student' && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students by name, admission number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-12 pr-4 py-3 ${input} shadow-sm`}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Modern Selection List */}
            <div className={`rounded-xl border shadow-sm ${isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-white'}`}>
              {/* List Header */}
              <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <h4 className={`font-semibold text-sm ${textPrimary}`}>
                    {formData.targetType === 'student' ? 'Students' : 
                     formData.targetType === 'class' ? 'Classes' : 'Mediums'}
                  </h4>
                  {formData.targetType === 'student' && isSearching && (
                    <div className="flex items-center text-xs text-blue-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Searching...
                    </div>
                  )}
                </div>
              </div>
              
              {/* List Content */}
              <div className="max-h-64 overflow-y-auto">
                {formData.targetType === 'student' && !isSearching && searchTerm && searchResults.length === 0 && (
                  <div className="text-center py-12">
                    <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mx-auto mb-4`}>
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className={`text-sm ${textSecondary}`}>No students found</div>
                    <div className={`text-xs ${textTertiary} mt-1`}>Try adjusting your search terms</div>
                  </div>
                )}
                
                {formData.targetType === 'student' && !isSearching && searchTerm.length < 2 && (
                  <div className="text-center py-12">
                    <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mx-auto mb-4`}>
                      <Search className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className={`text-sm ${textSecondary}`}>Type to search students</div>
                    <div className={`text-xs ${textTertiary} mt-1`}>Enter at least 2 characters</div>
                  </div>
                )}
                
                {/* Student List */}
                {formData.targetType === 'student' && !isSearching && searchTerm.length >= 2 && searchResults.length > 0 && (
                  <div className="divide-y ${isDark ? 'divide-gray-600' : 'divide-gray-200'}">
                    {searchResults.map((target: any) => {
                      const status = target.status?.toLowerCase();
                      const alumniStatuses = ['graduated', 'transferred', 'exit', 'exited', 'suspended', 'alumni'];
                      const isAlumni = alumniStatuses.includes(status);
                      
                      // Don't show alumni students when assigning fines
                      if (formData.category === 'fine' && isAlumni) {
                        return null;
                      }
                      
                      return (
                        <motion.label
                          key={target.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center p-4 cursor-pointer transition-all hover:bg-opacity-50 ${
                            formData.studentIds.includes(target.id)
                              ? isDark ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
                              : isDark ? 'hover:bg-gray-600/30' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center flex-1">
                            <input
                              type="checkbox"
                              checked={formData.studentIds.includes(target.id)}
                              onChange={() => handleTargetSelection(target.id, 'student')}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20 mr-4"
                            />
                            <div className="flex-1">
                              <div className={`font-medium ${textPrimary}`}>{target.name}</div>
                              <div className={`text-sm ${textSecondary} flex items-center gap-4 mt-1`}>
                                <span className="flex items-center gap-1">
                                  <span className="text-xs opacity-60">📚</span>
                                  {target.class || 'N/A'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="text-xs opacity-60">🎫</span>
                                  {target.admissionNo}
                                </span>
                                {target.status && (
                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                    target.status === 'active' 
                                      ? successBadge 
                                      : isAlumni
                                        ? errorBadge
                                        : warningBadge
                                  }`}>
                                    {target.status.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {formData.studentIds.includes(target.id) && (
                            <CheckCircle className="w-5 h-5 text-blue-500 ml-3" />
                          )}
                        </motion.label>
                      );
                    })}
                  </div>
                )}
                
                {/* Class/Medium List */}
                {formData.targetType !== 'student' && (
                  <div className="divide-y ${isDark ? 'divide-gray-600' : 'divide-gray-200'}">
                    {(formData.targetType === 'class' ? classes : mediums).map((target: any) => (
                      <motion.label
                        key={target.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-center p-4 cursor-pointer transition-all ${
                          (formData.targetType === 'class' && formData.classIds.includes(target.id)) ||
                          (formData.targetType === 'medium' && formData.mediumIds.includes(target.id))
                            ? isDark ? 'bg-blue-900/20' : 'bg-blue-50'
                            : isDark ? 'hover:bg-gray-600/30' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center flex-1">
                          <input
                            type="checkbox"
                            checked={
                              (formData.targetType === 'class' && formData.classIds.includes(target.id)) ||
                              (formData.targetType === 'medium' && formData.mediumIds.includes(target.id))
                            }
                            onChange={() => handleTargetSelection(target.id, formData.targetType as any)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20 mr-4"
                          />
                          <div className="flex-1">
                            <div className={`font-medium ${textPrimary}`}>
                              {target.name || target.label || target.className || 'Unnamed'}
                            </div>
                            {formData.targetType === 'class' && (
                              <div className={`text-sm ${textSecondary} mt-1`}>
                                <span className="flex items-center gap-4">
                                  {(target.code || target.classCode) && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-xs opacity-60">🏷️</span>
                                      {target.code || target.classCode}
                                    </span>
                                  )}
                                  {(target.section?.name || target.sectionName) && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-xs opacity-60">📖</span>
                                      {target.section?.name || target.sectionName}
                                    </span>
                                  )}
                                  {target.medium?.name && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-xs opacity-60">🌐</span>
                                      {target.medium.name}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            {formData.targetType === 'medium' && (
                              <div className={`text-sm ${textSecondary} mt-1`}>
                                <span className="flex items-center gap-4">
                                  {(target.code || target.mediumCode) && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-xs opacity-60">🏷️</span>
                                      {target.code || target.mediumCode}
                                    </span>
                                  )}
                                  {target.description && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-xs opacity-60">📝</span>
                                      {target.description}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {((formData.targetType === 'class' && formData.classIds.includes(target.id)) ||
                          (formData.targetType === 'medium' && formData.mediumIds.includes(target.id))) && (
                          <CheckCircle className="w-5 h-5 text-blue-500 ml-3" />
                        )}
                      </motion.label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Selection Summary */}
            {((formData.targetType === 'student' && formData.studentIds.length > 0) ||
              (formData.targetType === 'class' && formData.classIds.length > 0) ||
              (formData.targetType === 'medium' && formData.mediumIds.length > 0)) && (
              <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border-blue-600/30' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                      {formData.targetType === 'student' && `${formData.studentIds.length} student(s) selected`}
                      {formData.targetType === 'class' && `${formData.classIds.length} class(es) selected`}
                      {formData.targetType === 'medium' && `${formData.mediumIds.length} medium(s) selected`}
                    </span>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      studentIds: [],
                      classIds: [],
                      mediumIds: []
                    }))}
                    className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-colors`}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div>
        <h3 className={`text-xl font-bold mb-6 ${textPrimary}`}>Fee Details</h3>
        
        {/* Main Fee Information Card */}
        <div className={`${glassCard} p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={label}>Fee/Fine Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={generateFeeName()}
                className={input}
              />
              <div className={`text-xs ${textTertiary} mt-1`}>
                Auto-generated: {generateFeeName()}
              </div>
            </div>

            <div>
              <label className={label}>Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className={`pl-10 ${input}`}
                />
              </div>
            </div>

            <div>
              <label className={label}>Category</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'fee', label: 'Fee', color: 'blue' },
                  { value: 'fine', label: 'Fine', color: 'red' },
                  { value: 'other', label: 'Other', color: 'gray' }
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value as any }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.category === cat.value
                        ? cat.color === 'blue' ? 'bg-blue-500 text-white'
                        : cat.color === 'red' ? 'bg-red-500 text-white'
                        : 'bg-gray-500 text-white'
                        : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={label}>Due Date *</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className={input}
              />
            </div>

            <div>
              <label className={label}>Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                className={input}
              >
                <option value="once">Once</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className={label}>Late Fee (Optional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.lateFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, lateFee: e.target.value }))}
                  placeholder="0.00"
                  className={`pl-10 ${input}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className={`${glassCard} p-6 mb-6`}>
          <label className={label}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the fee/fine purpose and details..."
            rows={4}
            className={`${input} resize-none`}
          />
        </div>

        {/* Additional Options */}
        <div className={`${glassCard} p-6`}>
          <div className="space-y-4">
            <div>
              <label className={label}>Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Additional notes or special instructions..."
                rows={3}
                className={`${input} resize-none`}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isOptional"
                  checked={formData.isOptional}
                  onChange={(e) => setFormData(prev => ({ ...prev, isOptional: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500/20 mr-3"
                />
                <div>
                  <label htmlFor="isOptional" className={`text-sm font-medium ${textPrimary}`}>
                    Optional Fee/Fine
                  </label>
                  <div className={`text-xs ${textTertiary}`}>
                    Students can choose whether to pay this amount
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs ${warningBadge}`}>
                Optional
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      {/* Success Animation */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h3 className={`text-2xl font-bold mb-3 ${textPrimary}`}>Fee/Fine Assigned Successfully!</h3>
        <p className={`${textSecondary} text-lg`}>
          {previewData?.message || 'The fee/fine has been assigned to the selected targets.'}
        </p>
      </motion.div>

      {/* Assignment Summary Card */}
      {previewData?.summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${glassCard} p-6`}
        >
          <h4 className={`font-bold text-lg mb-4 ${textPrimary}`}>Assignment Summary</h4>
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${textPrimary}`}>
                {previewData.summary.studentsAssigned}
              </div>
              <div className={`text-sm ${textSecondary}`}>Students</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${textPrimary}`}>
                ₹{previewData.summary.amount}
              </div>
              <div className={`text-sm ${textSecondary}`}>Per Student</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${textPrimary}`}>
                ₹{previewData.summary.totalAmount}
              </div>
              <div className={`text-sm ${textSecondary}`}>Total Amount</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${textPrimary}`}>
                {previewData.summary.category}
              </div>
              <div className={`text-sm ${textSecondary}`}>Type</div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}">
              <span className={`font-medium ${textSecondary}`}>Target Type</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                previewData.summary.targetType === 'student' ? successBadge :
                previewData.summary.targetType === 'class' ? warningBadge :
                errorBadge
              }`}>
                {previewData.summary.targetType}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}">
              <span className={`font-medium ${textSecondary}`}>Fee Name</span>
              <span className={`font-semibold ${textPrimary}`}>{previewData.summary.feeName}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}">
              <span className={`font-medium ${textSecondary}`}>Due Date</span>
              <span className={`font-semibold ${textPrimary}`}>{previewData.summary.dueDate}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto ${card} p-6`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center`}>
                {getTargetIcon()}
              </div>
              <div>
                <h2 className={`text-xl font-bold ${textPrimary}`}>Bulk Fee/Fine Assignment</h2>
                <p className={`text-sm ${textSecondary}`}>
                  Step {currentStep} of {currentStep === 3 ? 3 : 3}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step < currentStep
                        ? 'bg-green-600 text-white'
                        : step === currentStep
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-colors ${
                        step < currentStep ? 'bg-green-600' : isDark ? 'bg-gray-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs">
              <span className={textSecondary}>Select Targets</span>
              <span className={textSecondary}>Fee Details</span>
              <span className={textSecondary}>Confirmation</span>
            </div>
          </div>

          {/* Validation Errors */}
          {validationState.errors.length > 0 && (
            <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-red-900/30 border-red-600/30' : 'bg-red-100 border-red-200'}`}>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Please fix the following errors:
                </span>
              </div>
              <ul className="mt-2 text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                {validationState.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Validation Warnings */}
          {validationState.warnings.length > 0 && (
            <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-yellow-900/30 border-yellow-600/30' : 'bg-yellow-100 border-yellow-200'}`}>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  Warnings:
                </span>
              </div>
              <ul className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 list-disc list-inside">
                {validationState.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className={btnSecondary}
            >
              {currentStep === 3 ? 'Close' : 'Cancel'}
            </button>

            <div className="flex space-x-3">
              {currentStep > 1 && currentStep < 3 && (
                <button
                  onClick={handlePrevious}
                  className={btnSecondary}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
              )}

              {currentStep < 2 && (
                <button
                  onClick={handleNext}
                  className={btnPrimary}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`${btnPrimary} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Assigning...' : `Assign ${formData.category === 'fine' ? 'Fine' : 'Fee'}`}
                </button>
              )}

              {currentStep === 3 && onSuccess && (
                <button
                  onClick={onSuccess}
                  className={btnPrimary}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
