'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, DollarSign, Calendar, CheckCircle, AlertCircle, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface DiscountRequestFormProps {
  theme: 'dark' | 'light';
  onClose: () => void;
}

interface FormData {
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'full_waiver';
  discountValue: string;
  maxCapAmount: string;
  scope: 'student' | 'class' | 'transport';
  targetType: 'total' | 'fee_structure';
  feeStructureIds: string[];
  studentIds: string[];
  classIds: string[];
  sectionIds: string[];
  mediumIds: string[];
  transportRouteIds: string[];
  academicYear: string;
  reason: string;
  validFrom: string;
  validTo: string;
}

interface ValidationState {
  step: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export default function DiscountRequestForm({ theme, onClose }: DiscountRequestFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    step: 1,
    isValid: false,
    errors: [],
    warnings: []
  });
  
  // Data States
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [mediums, setMediums] = useState<any[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<Array<{id: string; year: string; name: string}>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentLookup, setSelectedStudentLookup] = useState<Record<string, any>>({});
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // CSS Variables
  const isDark = theme === 'dark';
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;
  const row = `p-4 rounded-xl border ${isDark ? 'border-gray-600/50 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'}`;

  // Form State
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxCapAmount: '',
    scope: 'student',
    targetType: 'fee_structure',
    feeStructureIds: [],
    studentIds: [],
    classIds: [],
    sectionIds: [],
    mediumIds: [],
    transportRouteIds: [],
    academicYear: '',
    reason: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [feeRes, classRes, sectionRes, mediumRes, transportRes, yearRes] = await Promise.all([
          fetch('/api/fees/structures'),
          fetch('/api/school-structure/classes'),
          fetch('/api/school-structure/sections'),
          fetch('/api/school-structure/mediums'),
          fetch('/api/transport/routes'),
          fetch('/api/school-structure/academic-years')
        ]);

        if (feeRes.ok) {
          const feeData = await feeRes.json();
          setFeeStructures(feeData.feeStructures || feeData.structures || []);
        }
        if (classRes.ok) {
          const classData = await classRes.json();
          setClasses(classData.classes || []);
        }
        if (sectionRes.ok) {
          const sectionData = await sectionRes.json();
          console.log('Sections data:', sectionData);
          setSections(sectionData.sections || []);
        }
        if (mediumRes.ok) {
          const mediumData = await mediumRes.json();
          console.log('Mediums data:', mediumData);
          setMediums(mediumData.mediums || []);
        }
        if (transportRes.ok) {
          const transportData = await transportRes.json();
          setTransportRoutes(transportData.routes || []);
        }
        if (yearRes.ok) {
          const yearData = await yearRes.json();
          setAcademicYears(yearData.academicYears || []);
          // Set default academic year
          if (yearData.academicYears?.length > 0) {
            const currentYear = new Date().getFullYear();
            const currentAcademicYear = yearData.academicYears.find((ay: any) => ay.year.includes(currentYear.toString())) || yearData.academicYears[0];
            setFormData(prev => ({ ...prev, academicYear: currentAcademicYear.year }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const fetchStudents = async () => {
        try {
          const res = await fetch(`/api/students?search=${encodeURIComponent(searchTerm)}`);
          
          if (res.status === 429) {
            setValidationState(prev => ({ ...prev, errors: ['Too many search requests. Please wait a moment.'] }));
            return;
          }
          
          if (res.ok) {
            const result = await res.json();
            const fetchedStudents = result.students || [];
            setStudents(fetchedStudents);
            setSelectedStudentLookup(prev => {
              const next = { ...prev };
              fetchedStudents.forEach((student: any) => {
                next[student.id] = student;
              });
              return next;
            });
          } else {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to search students');
          }
        } catch (err: any) {
          console.error('Failed to search students:', err);
          setValidationState(prev => ({ ...prev, errors: [err.message || 'Failed to search students'] }));
        }
      };
      const timeoutId = setTimeout(fetchStudents, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setStudents([]);
    }
  }, [searchTerm]);

  // Memoized calculations
  const classIdToName = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((cls: any) => {
      if (cls?.id) map.set(cls.id, cls.name);
      if (cls?.name) map.set(cls.name, cls.name);
      if (cls?.code) map.set(cls.code, cls.name);
    });
    return map;
  }, [classes]);

  const selectedStudentClassNames = useMemo(() => {
    if (formData.scope !== 'student' || formData.studentIds.length === 0) return [] as string[];

    return Array.from(new Set(
      formData.studentIds
        .map((studentId: string) => selectedStudentLookup[studentId])
        .filter(Boolean)
        .map((student: any) => student.class?.name || student.class)
        .filter(Boolean)
    ));
  }, [formData.scope, formData.studentIds, selectedStudentLookup]);

  const selectedClassNames = useMemo(() => {
    if (formData.scope !== 'class' || formData.classIds.length === 0) return [] as string[];
    return Array.from(new Set(formData.classIds.map((id: string) => classIdToName.get(id) || id).filter(Boolean)));
  }, [classIdToName, formData.classIds, formData.scope]);

  const visibleFeeStructures = useMemo(() => {
    return feeStructures.filter((structure: any) => {
      const structureAcademicYear = structure.academicYear?.year || structure.academicYear?.name || structure.academicYear || '';
      if (formData.academicYear && structureAcademicYear && structureAcademicYear !== formData.academicYear) {
        return false;
      }

      if (formData.scope === 'transport') {
        return true;
      }

      const structureClassName = structure.class?.name || structure.className || '';
      const structureClassId = structure.class?.id || structure.classId || '';

      if (formData.scope === 'student') {
        if (selectedStudentClassNames.length === 0) return false;
        return selectedStudentClassNames.includes(structureClassName) || formData.classIds.includes(structureClassId);
      }

      if (formData.scope === 'class') {
        if (selectedClassNames.length === 0 && formData.classIds.length === 0) return false;
        return formData.classIds.includes(structureClassId) || selectedClassNames.includes(structureClassName);
      }

      return true;
    });
  }, [feeStructures, formData.academicYear, formData.classIds, formData.scope, selectedClassNames, selectedStudentClassNames]);

  // Map classes with their fee structures
  const classesWithFees = useMemo(() => {
    console.log('Computing classesWithFees - classes:', classes.length, 'feeStructures:', feeStructures.length);
    
    return classes.map((cls: any) => {
      // Find fee structures for this class - match both direct classId and relation class.id
      const classFeeStructures = feeStructures.filter((fs: any) => {
        const directMatch = fs.classId === cls.id;
        const relationMatch = fs.class?.id === cls.id;
        return directMatch || relationMatch;
      });
      
      console.log(`Class ${cls.name} (${cls.id}):`, classFeeStructures.length, 'fee structures found');
      
      // Calculate total fees from all structures for this class
      const monthlyFees = classFeeStructures
        .filter((fs: any) => fs.category === 'monthly' || fs.frequency === 'monthly')
        .reduce((sum: number, fs: any) => sum + (fs.amount || 0), 0);
      
      const yearlyFees = classFeeStructures
        .filter((fs: any) => fs.category === 'yearly' || fs.frequency === 'yearly')
        .reduce((sum: number, fs: any) => sum + (fs.amount || 0), 0);
      
      const totalFees = classFeeStructures
        .reduce((sum: number, fs: any) => sum + (fs.amount || 0), 0);

      const result = {
        ...cls,
        // Count students from sections
        studentCount: cls.sections?.reduce((sum: number, section: any) => sum + (section.studentCount || 0), 0) || 0,
        // Fee information
        monthlyFee: monthlyFees > 0 ? monthlyFees : null,
        yearlyFee: yearlyFees > 0 ? yearlyFees : null,
        totalFee: totalFees > 0 ? totalFees : null,
        feeStructures: classFeeStructures,
        hasFeeData: classFeeStructures.length > 0
      };
      
      console.log(`Class ${cls.name} result:`, { 
        monthlyFee: result.monthlyFee, 
        yearlyFee: result.yearlyFee, 
        hasFeeData: result.hasFeeData,
        foundStructures: classFeeStructures.length
      });
      
      return result;
    });
  }, [classes, feeStructures]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      feeStructureIds: prev.feeStructureIds.filter(id => visibleFeeStructures.some((fs: any) => fs.id === id))
    }));
  }, [visibleFeeStructures]);

  const formatStudentStatus = (status?: string) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const validateStep = (step: number): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (step === 1) {
      if (!formData.name.trim()) errors.push('Discount name is required');
      if (!formData.academicYear) errors.push('Academic year is required');
      if (!formData.scope) errors.push('Scope selection is required');
      if (formData.scope === 'student' && formData.studentIds.length === 0) errors.push('Please select at least one student');
      if (formData.scope === 'class' && formData.classIds.length === 0) errors.push('Please select at least one class');
      if (formData.scope === 'transport' && formData.transportRouteIds.length === 0) errors.push('Please select at least one transport route');
    }

    if (step === 2) {
      if (!formData.targetType) errors.push('Target type selection is required');
      if (formData.targetType === 'fee_structure' && formData.feeStructureIds.length === 0) errors.push('Please select at least one fee structure');
      if (formData.discountType !== 'full_waiver' && (!formData.discountValue || parseFloat(formData.discountValue) <= 0)) {
        errors.push('Discount value must be greater than 0');
      }
      if (formData.discountType === 'percentage' && parseFloat(formData.discountValue) > 100) {
        errors.push('Percentage discount cannot exceed 100%');
      }
      if (!formData.validFrom || !formData.validTo) errors.push('Validity dates are required');
      if (formData.validFrom > formData.validTo) errors.push('Valid From date must be before Valid To date');
    }

    if (step === 3) {
      if (!formData.reason.trim()) errors.push('Reason for discount is required');
    }

    return { isValid: errors.length === 0, errors, warnings };
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setValidationState(prev => ({ ...prev, errors: [], warnings: [] }));

      const response = await fetch('/api/fees/discount-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: Number(formData.discountValue),
          maxCapAmount: formData.maxCapAmount ? Number(formData.maxCapAmount) : null,
          transportRouteIds: formData.transportRouteIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      onClose();
    } catch (err: any) {
      setValidationState(prev => ({ ...prev, errors: [err.message] }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    const validation = validateStep(currentStep);
    if (validation.isValid) {
      setValidationState({ ...validation, step: currentStep });
      setCurrentStep(prev => prev + 1);
    } else {
      setValidationState({ ...validation, step: currentStep });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const steps = [
    { id: 1, title: 'Scope & Targeting', icon: '🎯' },
    { id: 2, title: 'Discount Details', icon: '💰' },
    { id: 3, title: 'Review & Submit', icon: '📋' }
  ];

  return (
    <div className="space-y-4">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-3">
        {steps.map((stepInfo, index) => {
          const isActive = currentStep === stepInfo.id;
          const isCompleted = currentStep > stepInfo.id;
          
          return (
            <React.Fragment key={stepInfo.id}>
              <div className="flex flex-col items-center">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105' 
                      : isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm">{stepInfo.icon}</span>}
                </motion.div>
                <span className={`text-xs mt-1 font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stepInfo.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${
                  isCompleted ? 'bg-gradient-to-r from-green-600 to-green-700' : isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {validationState.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Please fix the following errors:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  {validationState.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {currentStep === 1 && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Scope & Targeting
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={label}>
                    Discount Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Financial hardship, merit scholarship, sibling discount..."
                    className={input}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className={label}>
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={input}
                    value={formData.academicYear}
                    onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.year}>
                        {year.name || year.year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={label}>Application Scope</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'student', label: 'Individual Students', icon: '👥' },
                      { value: 'class', label: 'By Class', icon: '🎓' },
                      { value: 'transport', label: 'By Transport Route', icon: '🚌' }
                    ].map((scope) => (
                      <motion.button
                        key={scope.value}
                        onClick={() => setFormData({...formData, scope: scope.value as 'student' | 'class' | 'transport'})}
                        className={`p-3 rounded-lg border text-center transition-all hover:scale-105 ${
                          formData.scope === scope.value
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 shadow-lg'
                            : isDark ? 'border-gray-700 hover:border-gray-600 text-gray-300' : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-2xl mb-1">{scope.icon}</div>
                        <div className="text-xs font-medium">{scope.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Student Selection */}
                {formData.scope === 'student' && (
                  <div className="space-y-4">
                    <label className={label}>
                      Select Students <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Compact Search and Selection */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search students (min 2 chars)..."
                          className={`${input} pl-10 text-sm`}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {formData.studentIds.length > 0 && (
                          <div className="absolute right-3 top-3">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                              {formData.studentIds.length} selected
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Add all currently visible students
                            const visibleStudentIds = students.map((s: any) => s.id);
                            const newStudentIds = [...new Set([...formData.studentIds, ...visibleStudentIds])];
                            setFormData({...formData, studentIds: newStudentIds, feeStructureIds: []});
                            // Update lookup
                            students.forEach((student: any) => {
                              setSelectedStudentLookup(prev => ({
                                ...prev,
                                [student.id]: student,
                              }));
                            });
                          }}
                          disabled={students.length === 0}
                          className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          + Add All ({students.length})
                        </button>
                        <button
                          onClick={() => {
                            setFormData({...formData, studentIds: [], feeStructureIds: []});
                            setSelectedStudentLookup({});
                          }}
                          disabled={formData.studentIds.length === 0}
                          className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      
                      {/* Selected Students Preview */}
                      {formData.studentIds.length > 0 && (
                        <div className={`p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Selected Students:</div>
                          <div className="flex flex-wrap gap-1">
                            {formData.studentIds.slice(0, 8).map((studentId) => {
                              const student = students.find((s: any) => s.id === studentId);
                              return student ? (
                                <span key={studentId} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                                  {student.name}
                                  <button
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        studentIds: formData.studentIds.filter(id => id !== studentId),
                                        feeStructureIds: []
                                      });
                                    }}
                                    className="hover:text-red-500 transition-colors ml-1"
                                  >
                                    ×
                                  </button>
                                </span>
                              ) : null;
                            })}
                            {formData.studentIds.length > 8 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5">
                                +{formData.studentIds.length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Search Results */}
                      {students.length > 0 && (
                        <div className={`max-h-48 overflow-y-auto rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                          {students.map((student: any) => (
                            <motion.div
                              key={student.id}
                              className={`p-3 cursor-pointer border-b last:border-0 flex justify-between items-center transition-colors ${
                                formData.studentIds.includes(student.id)
                                  ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50')
                                  : (isDark ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-100')
                              }`}
                              onClick={() => {
                                setSelectedStudentLookup(prev => ({
                                  ...prev,
                                  [student.id]: student,
                                }));

                                if (formData.studentIds.includes(student.id)) {
                                  setFormData({
                                    ...formData,
                                    studentIds: formData.studentIds.filter(id => id !== student.id),
                                    feeStructureIds: []
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    studentIds: [...formData.studentIds, student.id],
                                    feeStructureIds: []
                                  });
                                }
                              }}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{student.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-3">
                                  <span>Class: {student.class?.name || student.class}</span>
                                  <span>Adm No: {student.admissionNo}</span>
                                  <span>Status: {formatStudentStatus(student.status)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {formData.studentIds.includes(student.id) && (
                                  <CheckCircle className="w-4 h-4 text-blue-500" />
                                )}
                                <input
                                  type="checkbox"
                                  checked={formData.studentIds.includes(student.id)}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Class Selection */}
                {formData.scope === 'class' && (
                  <div className="space-y-4">
                    <div>
                      <label className={label}>
                        Select Medium <span className="text-xs text-gray-500">(Optional - will filter classes)</span>
                      </label>
                      <select
                        className={input}
                        value={formData.mediumIds.length === 0 ? '' : formData.mediumIds[0]}
                        onChange={(e) => {
                          if (e.target.value === '') {
                            setFormData({...formData, mediumIds: [], classIds: []});
                          } else {
                            setFormData({...formData, mediumIds: [e.target.value], classIds: []});
                          }
                        }}
                      >
                        <option value="">All Mediums</option>
                        {mediums.map((medium: any) => (
                          <option key={medium.id} value={medium.id}>
                            {medium.name} {medium.code && `(${medium.code})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={label}>
                        Select Classes <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const visibleClassIds = classes
                                .filter((cls: any) => formData.mediumIds.length === 0 || formData.mediumIds.includes(cls.mediumId))
                                .map((cls: any) => cls.id);
                              const newClassIds = [...new Set([...formData.classIds, ...visibleClassIds])];
                              setFormData({...formData, classIds: newClassIds, feeStructureIds: []});
                            }}
                            disabled={classes.filter((cls: any) => formData.mediumIds.length === 0 || formData.mediumIds.includes(cls.mediumId)).length === 0}
                            className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            + Add All ({classes.filter((cls: any) => formData.mediumIds.length === 0 || formData.mediumIds.includes(cls.mediumId)).length})
                          </button>
                          <button
                            onClick={() => setFormData({...formData, classIds: [], feeStructureIds: []})}
                            disabled={formData.classIds.length === 0}
                            className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Clear All
                          </button>
                        </div>
                        
                        {formData.classIds.length > 0 && (
                          <div className={`p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Selected Classes:</div>
                            <div className="flex flex-wrap gap-1">
                              {formData.classIds.slice(0, 8).map((classId) => {
                                const cls = classesWithFees.find((c: any) => c.id === classId);
                                return cls ? (
                                  <span key={classId} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                    {cls.name}
                                    {cls.monthlyFee && (
                                      <span className="ml-1 text-green-800 dark:text-green-200">
                                        ₹{cls.monthlyFee.toLocaleString()}/mo
                                      </span>
                                    )}
                                    {cls.yearlyFee && !cls.monthlyFee && (
                                      <span className="ml-1 text-blue-800 dark:text-blue-200">
                                        ₹{cls.yearlyFee.toLocaleString()}/yr
                                      </span>
                                    )}
                                    <button
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          classIds: formData.classIds.filter(id => id !== classId),
                                          feeStructureIds: []
                                        });
                                      }}
                                      className="hover:text-red-500 transition-colors ml-1"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ) : null;
                              })}
                              {formData.classIds.length > 8 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5">
                                  +{formData.classIds.length - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className={`max-h-56 overflow-y-auto p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                          <div className="space-y-1">
                            {classesWithFees
                              .filter((cls: any) => formData.mediumIds.length === 0 || formData.mediumIds.includes(cls.mediumId))
                              .map((cls: any) => (
                              <label key={cls.id} className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  checked={formData.classIds.includes(cls.id)}
                                  onChange={(e) => {
                                    const newIds = e.target.checked
                                      ? [...formData.classIds, cls.id]
                                      : formData.classIds.filter(id => id !== cls.id);
                                    setFormData({...formData, classIds: newIds, feeStructureIds: []});
                                  }}
                                  className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-xs truncate">{cls.name}</div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {cls.medium?.name || 'No Medium'}
                                  </div>
                                  <div className="flex gap-2 truncate">
                                    {cls.monthlyFee && (
                                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                        ₹{cls.monthlyFee.toLocaleString()}/mo
                                      </span>
                                    )}
                                    {cls.yearlyFee && (
                                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                        ₹{cls.yearlyFee.toLocaleString()}/yr
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className={label}>Select Sections (Optional)</label>
                      <div className="space-y-2">
                        <div className={`max-h-32 overflow-y-auto p-3 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.sectionIds.length === 0}
                                onChange={(e) => {
                                  setFormData({...formData, sectionIds: []});
                                }}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium">All Sections</span>
                            </label>
                            {sections.map((section: any) => (
                              <label key={section.id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.sectionIds.includes(section.id)}
                                  onChange={(e) => {
                                    const newIds = e.target.checked
                                      ? [...formData.sectionIds, section.id]
                                      : formData.sectionIds.filter(id => id !== section.id);
                                    setFormData({...formData, sectionIds: newIds});
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium">{section.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(formData.classIds.length > 0 || formData.sectionIds.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-green-600 dark:text-green-400 font-medium"
                      >
                        {formData.classIds.length} class(es) and {formData.sectionIds.length} section(s) selected
                      </motion.div>
                    )}
                  </div>
                )}
                
                {/* Transport Route Selection */}
                {formData.scope === 'transport' && (
                  <div className="space-y-4">
                    <div className={`p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🚌</span>
                        <div>
                          <h4 className="font-semibold text-sm">Transport Route Application</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            This discount will apply to all students in selected routes
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className={label}>
                          Select Transport Routes <span className="text-red-500">*</span>
                        </label>
                        
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search routes by name, number, or area..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className={`${input} pl-10 text-sm`}
                            />
                            {formData.transportRouteIds.length > 0 && (
                              <div className="absolute right-3 top-3">
                                <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
                                  {formData.transportRouteIds.length} selected
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const visibleRouteIds = transportRoutes
                                  .filter((route: any) => !searchTerm || 
                                    route.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    route.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    route.description?.toLowerCase().includes(searchTerm.toLowerCase())
                                  )
                                  .map((route: any) => route.id);
                                const newRouteIds = [...new Set([...formData.transportRouteIds, ...visibleRouteIds])];
                                setFormData({...formData, transportRouteIds: newRouteIds, feeStructureIds: []});
                              }}
                              disabled={transportRoutes.filter((route: any) => !searchTerm || 
                                route.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                route.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                route.description?.toLowerCase().includes(searchTerm.toLowerCase())
                              ).length === 0}
                              className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              + Add All ({transportRoutes.filter((route: any) => !searchTerm || 
                                route.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                route.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                route.description?.toLowerCase().includes(searchTerm.toLowerCase())
                              ).length})
                            </button>
                            <button
                              onClick={() => setFormData({...formData, transportRouteIds: [], feeStructureIds: []})}
                              disabled={formData.transportRouteIds.length === 0}
                              className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Clear All
                            </button>
                          </div>
                          
                          {/* Search Results */}
                          <div className={`max-h-56 overflow-y-auto p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                            <div className="space-y-1">
                              {transportRoutes
                                .filter((route: any) => !searchTerm || 
                                  route.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  route.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  route.description?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((route: any) => (
                                <label key={route.id} className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={formData.transportRouteIds.includes(route.id)}
                                    onChange={(e) => {
                                      const newIds = e.target.checked
                                        ? [...formData.transportRouteIds, route.id]
                                        : formData.transportRouteIds.filter(id => id !== route.id);
                                      setFormData({...formData, transportRouteIds: newIds, feeStructureIds: []});
                                    }}
                                    className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs truncate">{route.routeName || route.name || `Route ${route.routeNumber}`}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2 truncate">
                                      {route.routeNumber && <span>No: {route.routeNumber}</span>}
                                      {route.description && <span>{route.description}</span>}
                                      <span>{route.students?.length || 0}st</span>
                                    </div>
                                    <div className="flex gap-2 truncate">
                                      {route.monthlyFee && (
                                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                          ₹{route.monthlyFee.toLocaleString()}/mo
                                        </span>
                                      )}
                                      {route.yearlyFee && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                          ₹{route.yearlyFee.toLocaleString()}/yr
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              ))}
                              
                              {transportRoutes.length === 0 && (
                                <div className="text-center p-3 text-gray-500 text-xs">
                                  No transport routes found
                                </div>
                              )}
                              
                              {transportRoutes.length > 0 && transportRoutes.filter((route: any) => 
                                searchTerm && (
                                  route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  route.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  route.area?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                              ).length === 0 && (
                                <div className="text-center p-3 text-gray-500 text-xs">
                                  No transport routes found matching "{searchTerm}"
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Selected Routes Preview */}
                          {formData.transportRouteIds.length > 0 && (
                            <div className={`p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                              <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Selected Routes:</div>
                              <div className="flex flex-wrap gap-1">
                                {formData.transportRouteIds.slice(0, 8).map((routeId) => {
                                  const route = transportRoutes.find((r: any) => r.id === routeId);
                                  return route ? (
                                    <span key={routeId} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                                      {route.routeName || route.name || `Route ${route.routeNumber}`}
                                      {route.monthlyFee && (
                                        <span className="ml-1 text-orange-800 dark:text-orange-200">
                                          ₹{route.monthlyFee.toLocaleString()}/mo
                                        </span>
                                      )}
                                      {route.yearlyFee && !route.monthlyFee && (
                                        <span className="ml-1 text-blue-800 dark:text-blue-200">
                                          ₹{route.yearlyFee.toLocaleString()}/yr
                                        </span>
                                      )}
                                      <button
                                        onClick={() => {
                                          setFormData({
                                            ...formData,
                                            transportRouteIds: formData.transportRouteIds.filter(id => id !== routeId),
                                            feeStructureIds: []
                                          });
                                        }}
                                        className="hover:text-red-500 transition-colors ml-1"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ) : null;
                                })}
                                {formData.transportRouteIds.length > 8 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5">
                                    +{formData.transportRouteIds.length - 8} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Search Results */}
                          <div className={`max-h-56 overflow-y-auto p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                            <div className="space-y-1">
                              {students
                                .filter((student: any) => !searchTerm || 
                                  student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  student.phone?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((student: any) => (
                                <label key={student.id} className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={formData.studentIds.includes(student.id)}
                                    onChange={(e) => {
                                      const newIds = e.target.checked
                                        ? [...formData.studentIds, student.id]
                                        : formData.studentIds.filter(id => id !== student.id);
                                      setFormData({...formData, studentIds: newIds, feeStructureIds: []});
                                    }}
                                    className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs truncate">{student.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2 truncate">
                                      <span>{student.admissionNumber}</span>
                                      <span>{student.class}</span>
                                      <span>{student.status}</span>
                                    </div>
                                  </div>
                                </label>
                              ))}
                              
                              {students.length === 0 && (
                                <div className="text-center p-3 text-gray-500 text-xs">
                                  No students found
                                </div>
                              )}
                              
                              {students.length > 0 && students.filter((student: any) => 
                                searchTerm && (
                                  student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  student.phone?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                              ).length === 0 && (
                                <div className="text-center p-3 text-gray-500 text-xs">
                                  No transport routes found matching "{searchTerm}"
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {formData.transportRouteIds.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-green-600 dark:text-green-400 font-medium"
                          >
                            {formData.transportRouteIds.length} transport route(s) selected
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">💰</span>
                Discount Configuration
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className={label}>Target Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'total', label: 'Total Fees', description: 'Apply to entire fee amount' },
                      { value: 'fee_structure', label: 'Specific Fee Structures', description: 'Apply to selected fee items only' }
                    ].map((target) => (
                      <motion.button
                        key={target.value}
                        onClick={() => setFormData({...formData, targetType: target.value as 'total' | 'fee_structure'})}
                        className={`p-4 rounded-xl border text-left transition-all hover:scale-105 ${
                          formData.targetType === target.value
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-700 dark:text-blue-300 shadow-lg'
                            : isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="font-medium">{target.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{target.description}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                {formData.targetType === 'fee_structure' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <label className={label}>
                      Select Fee Structures <span className="text-red-500">*</span>
                    </label>
                    <div className={`max-h-64 overflow-y-auto p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                      {visibleFeeStructures.length > 0 ? visibleFeeStructures.map((fs: any) => (
                        <label key={fs.id} className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.feeStructureIds.includes(fs.id)}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...formData.feeStructureIds, fs.id]
                                : formData.feeStructureIds.filter(id => id !== fs.id);
                              setFormData({...formData, feeStructureIds: newIds});
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {fs.name} <span className="text-gray-500 text-xs">({fs.category})</span>
                            </span>
                            <div className="text-xs text-gray-500">
                              ₹{fs.amount}{fs.class?.name ? ` • ${fs.class.name}` : ''}
                            </div>
                          </div>
                        </label>
                      )) : (
                        <div className="text-center p-6 text-gray-500 text-sm">
                          No fee structures available for the selected student/class and academic year
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={label}>Discount Type</label>
                    <select
                      className={input}
                      value={formData.discountType}
                      onChange={(e) => setFormData({...formData, discountType: e.target.value as 'percentage' | 'fixed' | 'full_waiver'})}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                      <option value="full_waiver">Full Waiver (100%)</option>
                    </select>
                  </div>
                  
                  {formData.discountType !== 'full_waiver' && (
                    <div>
                      <label className={label}>
                        Discount Value {formData.discountType === 'percentage' ? '(%)' : '(₹)'}
                      </label>
                      <input
                        type="number"
                        className={input}
                        value={formData.discountValue}
                        onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                        placeholder={formData.discountType === 'percentage' ? 'e.g., 10' : 'e.g., 5000'}
                        min="0"
                        max={formData.discountType === 'percentage' ? '100' : undefined}
                        step={formData.discountType === 'percentage' ? '0.1' : '1'}
                      />
                    </div>
                  )}
                </div>

                {formData.discountType === 'percentage' && (
                  <div>
                    <label className={label}>Maximum Cap Amount (Optional)</label>
                    <input
                      type="number"
                      className={input}
                      value={formData.maxCapAmount}
                      onChange={(e) => setFormData({...formData, maxCapAmount: e.target.value})}
                      placeholder="e.g., 10000"
                      min="0"
                      step="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum discount amount that can be applied regardless of percentage
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={label}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Valid From
                    </label>
                    <input
                      type="date"
                      className={input}
                      value={formData.validFrom}
                      onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={label}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Valid To
                    </label>
                    <input
                      type="date"
                      className={input}
                      value={formData.validTo}
                      onChange={(e) => setFormData({...formData, validTo: e.target.value})}
                      min={formData.validFrom}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Review & Submit
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className={label}>
                    Reason for Discount <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    className={input}
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Please provide a detailed justification for this discount request..."
                  />
                </div>

                <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Request Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="opacity-70">Name:</span>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <span className="opacity-70">Academic Year:</span>
                      <p className="font-medium">{formData.academicYear}</p>
                    </div>
                    <div>
                      <span className="opacity-70">Scope:</span>
                      <p className="font-medium capitalize">{formData.scope}</p>
                    </div>
                    <div>
                      <span className="opacity-70">Target:</span>
                      <p className="font-medium capitalize">{formData.targetType}</p>
                    </div>
                    <div>
                      <span className="opacity-70">Discount:</span>
                      <p className="font-medium">
                        {formData.discountType === 'percentage' ? `${formData.discountValue}%` : 
                         formData.discountType === 'fixed' ? `₹${formData.discountValue}` : 'Full Waiver'}
                        {formData.maxCapAmount && ` (max ₹${formData.maxCapAmount})`}
                      </p>
                    </div>
                    <div>
                      <span className="opacity-70">Validity:</span>
                      <p className="font-medium">{formData.validFrom} to {formData.validTo}</p>
                    </div>
                  </div>
                  
                  {(formData.studentIds.length > 0 || formData.classIds.length > 0 || formData.transportRouteIds.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="opacity-70 text-sm">Affected:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.studentIds.length > 0 && (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                            {formData.studentIds.length} Student(s)
                          </span>
                        )}
                        {formData.classIds.length > 0 && (
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                            {formData.classIds.length} Class(es)
                          </span>
                        )}
                        {formData.sectionIds.length > 0 && (
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                            {formData.sectionIds.length} Section(s)
                          </span>
                        )}
                        {formData.transportRouteIds.length > 0 && (
                          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                            {formData.transportRouteIds.length} Transport Route(s)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
        <motion.button
          onClick={currentStep > 1 ? prevStep : onClose}
          className={`${currentStep > 1 ? btnSecondary : 'px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors'}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {currentStep > 1 ? (
            <>
              <ChevronLeft className="w-4 h-4 inline mr-1" />
              Back
            </>
          ) : (
            'Cancel'
          )}
        </motion.button>

        {currentStep < 3 ? (
          <motion.button
            onClick={nextStep}
            disabled={currentStep === 1 && (!formData.name.trim() || !formData.academicYear || !formData.scope)}
            className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue
            <ChevronRight className="w-4 h-4 inline ml-1" />
          </motion.button>
        ) : (
          <motion.button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.reason.trim()}
            className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Submit for Approval
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}
