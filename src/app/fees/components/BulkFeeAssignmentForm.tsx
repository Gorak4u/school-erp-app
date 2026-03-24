'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  School, 
  Building, 
  Search, 
  X, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown,
  FileText,
  Target,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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

  // CSS Variables - World-Class Compact UI Design
  const isDark = theme === 'dark';
  const card = `rounded-2xl border shadow-xl backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 shadow-black/20' : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-gray-200/50 shadow-gray-200/50'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder:transition-all placeholder:duration-200 ${isDark ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400/70 focus:bg-gray-700/60 focus:border-blue-400/50 focus:shadow-lg focus:shadow-blue-500/10' : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-400/50 focus:bg-white focus:border-blue-400/60 focus:shadow-lg focus:shadow-blue-500/10'}`;
  const label = `block text-sm font-bold mb-2 tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-800'}`;
  const btnPrimary = `px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl backdrop-blur-sm ${isDark ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white shadow-blue-600/25 hover:shadow-blue-600/40' : 'bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 hover:from-blue-600 hover:via-blue-500 hover:to-blue-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm ${isDark ? 'border-gray-600/50 text-gray-200 hover:bg-gray-700/50 hover:border-gray-500/60 hover:shadow-lg' : 'border-gray-300/50 text-gray-700 hover:bg-gray-100/80 hover:border-gray-400/60 hover:shadow-lg'}`;
  const btnDanger = `px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20' : 'bg-red-100/80 text-red-600 hover:bg-red-200/80 border border-red-200/60 hover:border-red-300/60 hover:shadow-lg hover:shadow-red-500/20'}`;
  const row = `p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 ${isDark ? 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/30' : 'border-gray-200/30 bg-gray-50/30 hover:bg-gray-100/40'}`;
  const tile = `p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 backdrop-blur-sm ${isDark ? 'border-gray-600/50 hover:border-blue-400/60 bg-gray-700/30 hover:bg-gray-600/40' : 'border-gray-300/50 hover:border-blue-400/60 bg-white/60 hover:bg-blue-50/40'}`;
  const tileSelected = `p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ring-2 ring-blue-400/20 border-blue-500 bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/40 dark:to-blue-800/40 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transform scale-105`;
  const glassCard = `rounded-2xl border shadow-xl backdrop-blur-2xl transition-all duration-300 ${isDark ? 'bg-gray-800/80 border-gray-700/30 shadow-black/30' : 'bg-white/85 border-gray-200/30 shadow-gray-300/30'}`;
  const successBadge = `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm transition-all duration-200 ${isDark ? 'bg-green-900/40 text-green-300 border border-green-600/40 shadow-green-500/20' : 'bg-green-100/80 text-green-700 border border-green-200/60 shadow-green-500/20'}`;
  const warningBadge = `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm transition-all duration-200 ${isDark ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-600/40 shadow-yellow-500/20' : 'bg-yellow-100/80 text-yellow-700 border border-yellow-200/60 shadow-yellow-500/20'}`;
  const errorBadge = `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm transition-all duration-200 ${isDark ? 'bg-red-900/40 text-red-300 border border-red-600/40 shadow-red-500/20' : 'bg-red-100/80 text-red-700 border border-red-200/60 shadow-red-500/20'}`;
  const premiumGradient = `bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700`;
  const successGradient = `bg-gradient-to-br from-green-500 via-emerald-600 to-green-600`;
  const warningGradient = `bg-gradient-to-br from-yellow-500 via-orange-600 to-yellow-600`;
  const errorGradient = `bg-gradient-to-br from-red-500 via-pink-600 to-red-600`;
  
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

        {/* Target Type Selection - Compact */}
        <div className={`${glassCard} p-5 mb-5`}>
          <div className="grid grid-cols-4 gap-3">
            {[
              { value: 'student', label: 'Students', icon: Users, gradient: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-500' },
              { value: 'class', label: 'Classes', icon: GraduationCap, gradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-500' },
              { value: 'medium', label: 'Mediums', icon: School, gradient: 'from-emerald-500 to-emerald-600', iconBg: 'bg-emerald-500' },
              { value: 'school', label: 'School', icon: Building, gradient: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-500' }
            ].map((target, index) => (
              <motion.div
                key={target.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, targetType: target.value as any, studentIds: [], classIds: [], mediumIds: [] }))}
                  className={`w-full p-3 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group h-20 ${
                    formData.targetType === target.value 
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50/90 to-blue-100/90 dark:from-blue-900/60 dark:to-blue-800/60 shadow-lg shadow-blue-500/20' 
                      : `${isDark ? 'border-gray-600/50 hover:border-blue-400/60 bg-gray-700/30 hover:bg-gray-600/40' : 'border-gray-300/50 hover:border-blue-400/60 bg-white/70 hover:bg-blue-50/40'} hover:shadow-lg`
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br ${target.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                  
                  <div className="flex flex-col items-center text-center relative z-10 h-full justify-center">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1.5 transition-all duration-300 ${
                      formData.targetType === target.value 
                        ? `${target.iconBg} text-white shadow-lg transform scale-110` 
                        : `${isDark ? 'bg-gray-600/50 text-gray-300' : 'bg-gray-100/80 text-gray-600'} group-hover:transform group-hover:scale-105`
                    }`}>
                      <target.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className={`font-bold text-xs transition-colors duration-300 ${
                      formData.targetType === target.value ? 'text-blue-600 dark:text-blue-400' : textPrimary
                    }`}>
                      {target.label}
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
            
            {/* Compact Search Input */}
            {formData.targetType === 'student' && (
              <div className="mb-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-500" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-11 pr-10 py-2.5 ${input} shadow-md hover:shadow-lg transition-all duration-200`}
                  />
                  {searchTerm && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </motion.button>
                  )}
                  <div className="absolute bottom-1.5 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"></div>
                </div>
              </div>
            )}

            {/* World-Class Selection List */}
            <div className={`rounded-3xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${isDark ? 'border-gray-600/50 bg-gray-700/20' : 'border-gray-300/50 bg-white/70'}`}>
              {/* List Header */}
              <div className={`px-6 py-4 border-b backdrop-blur-sm rounded-t-3xl ${isDark ? 'border-gray-600/30 bg-gray-700/30' : 'border-gray-200/30 bg-gray-50/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      formData.targetType === 'student' ? 'bg-blue-500 text-white' :
                      formData.targetType === 'class' ? 'bg-purple-500 text-white' :
                      'bg-emerald-500 text-white'
                    }`}>
                      {formData.targetType === 'student' && <Users className="w-4 h-4" />}
                      {formData.targetType === 'class' && <GraduationCap className="w-4 h-4" />}
                      {formData.targetType === 'medium' && <Building className="w-4 h-4" />}
                    </div>
                    <h4 className={`font-bold text-base ${textPrimary}`}>
                      {formData.targetType === 'student' ? 'Students' : 
                       formData.targetType === 'class' ? 'Classes' : 'Mediums'}
                    </h4>
                  </div>
                  {formData.targetType === 'student' && isSearching && (
                    <div className="flex items-center gap-2 text-blue-500">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Searching...</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* List Content */}
              <div className="max-h-80 overflow-y-auto">
                {formData.targetType === 'student' && !isSearching && searchTerm && searchResults.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className={`w-20 h-20 rounded-3xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'} flex items-center justify-center mx-auto mb-6 backdrop-blur-sm`}>
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className={`text-lg font-medium ${textSecondary} mb-2`}>No students found</div>
                    <div className={`text-sm ${textTertiary}`}>Try adjusting your search terms</div>
                  </motion.div>
                )}
                
                {formData.targetType === 'student' && !isSearching && searchTerm.length < 2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className={`w-20 h-20 rounded-3xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100/50'} flex items-center justify-center mx-auto mb-6 backdrop-blur-sm`}>
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className={`text-lg font-medium ${textSecondary} mb-2`}>Type to search students</div>
                    <div className={`text-sm ${textTertiary}`}>Enter at least 2 characters</div>
                  </motion.div>
                )}
                
                {/* Compact Student List */}
                {formData.targetType === 'student' && !isSearching && searchTerm.length >= 2 && searchResults.length > 0 && (
                  <div className={`divide-y ${isDark ? 'divide-gray-600/30' : 'divide-gray-200/30'} max-h-64 overflow-y-auto rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    {searchResults.map((target: any, index: number) => {
                      const status = target.status?.toLowerCase();
                      const alumniStatuses = ['graduated', 'transferred', 'exit', 'exited', 'suspended', 'alumni'];
                      const isAlumni = alumniStatuses.includes(status);
                      
                      if (formData.category === 'fine' && isAlumni) {
                        return null;
                      }
                      
                      return (
                        <motion.label
                          key={target.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className={`flex items-center p-3 cursor-pointer transition-all duration-200 hover:bg-opacity-50 ${
                            formData.studentIds.includes(target.id)
                              ? isDark ? 'bg-blue-900/30 border-blue-500/30' : 'bg-blue-50/80 border-blue-200/60'
                              : isDark ? 'hover:bg-gray-600/20' : 'hover:bg-gray-50/60'
                          }`}
                        >
                          <div className="flex items-center flex-1">
                            <motion.div 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="relative"
                            >
                              <input
                                type="checkbox"
                                checked={formData.studentIds.includes(target.id)}
                                onChange={() => handleTargetSelection(target.id, 'student')}
                                className="w-4 h-4 text-blue-600 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500/20 mr-3 cursor-pointer"
                              />
                              {formData.studentIds.includes(target.id) && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -inset-1 rounded-lg border-2 border-blue-500 pointer-events-none"
                                />
                              )}
                            </motion.div>
                            <div className="flex-1">
                              <div className={`font-semibold text-sm ${textPrimary}`}>{target.name}</div>
                              <div className={`text-xs ${textSecondary} flex items-center gap-3 mt-1`}>
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100/60 dark:bg-gray-700/40">
                                  <span className="text-xs opacity-70">📚</span>
                                  <span className="text-gray-700 dark:text-gray-300">{target.class || 'N/A'}</span>
                                </span>
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100/60 dark:bg-gray-700/40">
                                  <span className="text-xs opacity-70">🎫</span>
                                  <span className="text-gray-700 dark:text-gray-300">{target.admissionNo}</span>
                                </span>
                                {target.status && (
                                  <motion.span 
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm transition-all duration-200 ${
                                      target.status === 'active' 
                                        ? successBadge 
                                        : isAlumni
                                          ? errorBadge
                                          : warningBadge
                                    }`}
                                  >
                                    {target.status.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}
                                  </motion.span>
                                )}
                              </div>
                            </div>
                          </div>
                          {formData.studentIds.includes(target.id) && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="ml-3"
                            >
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            </motion.div>
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-black ${textPrimary}`}>Fee Details</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm ${isDark ? 'bg-purple-900/40 text-purple-300 border border-purple-600/40' : 'bg-purple-100/80 text-purple-700 border border-purple-200/60'}`}>
            Step 2 of 3
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${glassCard} p-5`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className={label}>Category *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'fee', label: 'Fee', gradient: 'from-blue-500 to-blue-600', icon: '💰' },
                  { value: 'fine', gradient: 'from-red-500 to-red-600', icon: '⚠️' }
                ].map((category) => (
                  <motion.button
                    key={category.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.value as 'fee' | 'fine' }))}
                    className={`p-3 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group h-14 ${
                      formData.category === category.value
                        ? `border-${category.value === 'fee' ? 'blue' : 'red'}-500 bg-gradient-to-br from-${category.value === 'fee' ? 'blue' : 'red'}-50/90 to-${category.value === 'fee' ? 'blue' : 'red'}-100/90 dark:from-${category.value === 'fee' ? 'blue' : 'red'}-900/60 dark:to-${category.value === 'fee' ? 'blue' : 'red'}-800/60 shadow-lg shadow-${category.value === 'fee' ? 'blue' : 'red'}-500/20`
                        : `${isDark ? 'border-gray-600/50 hover:border-' + (category.value === 'fee' ? 'blue' : 'red') + '-400/60 bg-gray-700/30 hover:bg-gray-600/40' : 'border-gray-300/50 hover:border-' + (category.value === 'fee' ? 'blue' : 'red') + '-400/60 bg-white/70 hover:bg-' + (category.value === 'fee' ? 'blue' : 'red') + '-50/40'} hover:shadow-lg`
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                    <div className="flex items-center justify-center h-full relative z-10">
                      <span className="text-lg mr-2">{category.icon}</span>
                      <span className={`font-bold text-sm transition-colors duration-300 ${
                        formData.category === category.value 
                          ? category.value === 'fee' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                          : textPrimary
                      }`}>
                        {category.label}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
              {formData.category === 'fine' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-2 p-2 rounded-lg text-xs ${errorBadge}`}
                >
                  <span className="font-bold">⚠️ Alumni Protected:</span> Alumni students will be automatically excluded
                </motion.div>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className={label}>Fee/Fine Name *</label>
              <div className="relative group">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter fee/fine name"
                  className={`${input} shadow-md hover:shadow-lg transition-all duration-200`}
                />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className={label}>Amount *</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-bold text-gray-400">₹</div>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  className={`${input} pl-10 shadow-md hover:shadow-lg transition-all duration-200`}
                />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className={label}>Due Date *</label>
              <div className="relative group">
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className={`${input} shadow-md hover:shadow-lg transition-all duration-200`}
                />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className={label}>Frequency</label>
              <div className="relative group">
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                  className={`${input} shadow-md hover:shadow-lg transition-all duration-200 appearance-none cursor-pointer`}
                >
                  <option value="once">Once</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <div className="absolute right-5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
                <div className="absolute bottom-2 left-5 right-5 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"></div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label className={label}>Late Fee (Optional)</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold text-lg">₹</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.lateFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, lateFee: e.target.value }))}
                  placeholder="0.00"
                  className={`pl-12 ${input} shadow-lg hover:shadow-xl transition-all duration-200`}
                />
                <div className="absolute bottom-2 left-5 right-5 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 transition-opacity duration-200 group-focus-within:opacity-100"></div>
              </div>
            </motion.div>
          </div>
        </motion.div>

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
    <div className="space-y-12">
      {/* World-Class Success Animation */}
      <motion.div 
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.8 }}
        className="text-center"
      >
        <div className="relative inline-block">
          {/* Glowing background effect */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.3 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full blur-3xl"
          />
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/30 relative z-10">
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
          </div>
        </div>
        <motion.h3 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`text-3xl font-black mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent`}
        >
          Fee/Fine Assigned Successfully!
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className={`${textSecondary} text-lg max-w-md mx-auto`}
        >
          {previewData?.message || 'The fee/fine has been assigned to the selected targets.'}
        </motion.p>
      </motion.div>

      {/* World-Class Assignment Summary Card */}
      {previewData?.summary && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className={`${glassCard} p-10`}
        >
          <div className="flex items-center justify-between mb-8">
            <h4 className={`font-black text-2xl ${textPrimary}`}>Assignment Summary</h4>
            <div className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide backdrop-blur-sm ${isDark ? 'bg-green-900/40 text-green-300 border border-green-600/40' : 'bg-green-100/80 text-green-700 border border-green-200/60'}`}>
              Step 3 of 3
            </div>
          </div>
          
          {/* World-Class Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {[
              { value: previewData.summary.studentsAssigned, label: 'Students', icon: Users, gradient: 'from-blue-500 to-blue-600', delay: 0.7 },
              { value: `₹${previewData.summary.amount}`, label: 'Per Student', icon: DollarSign, gradient: 'from-green-500 to-green-600', delay: 0.75 },
              { value: `₹${previewData.summary.totalAmount}`, label: 'Total Amount', icon: DollarSign, gradient: 'from-purple-500 to-purple-600', delay: 0.8 },
              { value: previewData.summary.category, label: 'Type', icon: Calendar, gradient: 'from-orange-500 to-orange-600', delay: 0.85 }
            ].map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: metric.delay, duration: 0.4 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className={`text-center p-6 rounded-3xl backdrop-blur-sm border transition-all duration-300 hover:shadow-xl ${
                  isDark ? 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-600/40' : 'bg-gray-50/50 border-gray-200/30 hover:bg-gray-100/60'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${metric.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`text-3xl font-black ${textPrimary} mb-2`}>
                  {metric.value}
                </div>
                <div className={`text-sm font-bold ${textSecondary}`}>
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* World-Class Detailed Information */}
          <div className="space-y-4">
            {[
              { label: 'Target Type', value: previewData.summary.targetType, badge: true },
              { label: 'Fee Name', value: previewData.summary.feeName, badge: false },
              { label: 'Due Date', value: previewData.summary.dueDate, badge: false }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                className="flex items-center justify-between p-5 rounded-2xl border backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${
                  isDark ? 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/30' : 'border-gray-200/30 bg-gray-50/30 hover:bg-gray-100/40'
                }"
              >
                <span className={`font-bold ${textSecondary}`}>{item.label}</span>
                <div className="flex items-center gap-3">
                  {item.badge && (
                    <span className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide backdrop-blur-sm transition-all duration-200 ${
                      previewData.summary.targetType === 'student' ? successBadge :
                      previewData.summary.targetType === 'class' ? warningBadge :
                      errorBadge
                    }`}>
                      {previewData.summary.targetType}
                    </span>
                  )}
                  {!item.badge && (
                    <span className={`font-bold text-lg ${textPrimary}`}>{item.value}</span>
                  )}
                </div>
              </motion.div>
            ))}
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
          {/* Modern Compact Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25`}
              >
                <FileText className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`text-lg font-black ${textPrimary}`}
                >
                  Bulk Fee/Fine Assignment
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-xs ${textSecondary}`}
                >
                  Complete the 3-step process
                </motion.p>
              </div>
            </div>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={onClose}
              className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'}`}
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Modern Step Progress Bar */}
          <div className="mb-8">
            {/* Step Labels */}
            <div className="flex items-center justify-between mb-4">
              {[
                { step: 1, label: 'Select Targets', icon: Target },
                { step: 2, label: 'Fee Details', icon: DollarSign },
                { step: 3, label: 'Confirmation', icon: CheckCircle }
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-1 text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <motion.div
                      animate={{ 
                        scale: currentStep === item.step ? 1.1 : 1,
                        opacity: currentStep >= item.step ? 1 : 0.5
                      }}
                      transition={{ duration: 0.3 }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        currentStep > item.step
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                          : currentStep === item.step
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                          : isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-200/50 text-gray-500'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {currentStep > item.step ? (
                        <motion.div
                          initial={{ rotate: -180 }}
                          animate={{ rotate: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <item.icon className="w-4 h-4" />
                      )}
                    </motion.div>
                    <span className={`text-xs font-bold transition-colors duration-300 ${
                      currentStep >= item.step ? textPrimary : textTertiary
                    }`}>
                      {item.label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Progress Line */}
            <div className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              />
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

          {/* World-Class Action Buttons */}
          <div className="flex justify-between mt-10 pt-8 border-t backdrop-blur-sm ${isDark ? 'border-gray-600/30' : 'border-gray-200/30'}">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={btnSecondary}
            >
              {currentStep === 3 ? 'Close' : 'Cancel'}
            </motion.button>

            <div className="flex space-x-4">
              {currentStep > 1 && currentStep < 3 && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrevious}
                  className={btnSecondary}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </motion.button>
              )}

              {currentStep < 2 && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className={btnPrimary}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </motion.button>
              )}

              {currentStep === 2 && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`${btnPrimary} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      Assign {formData.category === 'fine' ? 'Fine' : 'Fee'}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </motion.button>
              )}

              {currentStep === 3 && onSuccess && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSuccess}
                  className={btnPrimary}
                >
                  Done
                  <CheckCircle className="w-4 h-4 ml-2" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
