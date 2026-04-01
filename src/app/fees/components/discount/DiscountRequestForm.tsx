'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, DollarSign, Calendar, CheckCircle, AlertCircle, X, ChevronRight, ChevronLeft, Plus, Users, Building, GraduationCap, School, Lightbulb, TrendingUp } from 'lucide-react';

interface DiscountRequestFormProps {
  theme: 'dark' | 'light';
  onClose: () => void;
  onSuccess?: () => void;
  initialScope?: 'student' | 'class' | 'transport';
  initialStudent?: {
    id: string;
    name: string;
    admissionNo?: string;
    class?: string;
    status?: string;
  };
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

export default function DiscountRequestForm({ theme, onClose, onSuccess, initialScope, initialStudent }: DiscountRequestFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [routeType, setRouteType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({ step: 0, isValid: false, errors: [], warnings: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Data States
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>(initialStudent ? [initialStudent] : []);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [mediums, setMediums] = useState<any[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<Array<{id: string; year: string; name: string}>>([]);
  const [selectedStudentLookup, setSelectedStudentLookup] = useState<Record<string, any>>(initialStudent ? { [initialStudent.id]: initialStudent } : {});
  const [previewData, setPreviewData] = useState<any>(null);
  const [feeTypeBalances, setFeeTypeBalances] = useState<Record<string, { totalAmount: number; paidAmount: number; pendingAmount: number; discountAmount: number }>>({});
  const [loadingFeeBalances, setLoadingFeeBalances] = useState(false);

  // CSS Variables - World-Class Best-in-Class UI Design
  const isDark = theme === 'dark';
  const card = `rounded-3xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 shadow-black/20' : 'bg-gradient-to-br from-white/95 to-gray-50/95 border-gray-200/50 shadow-gray-200/50'}`;
  const input = `w-full px-5 py-4 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 placeholder:transition-all placeholder:duration-200 ${isDark ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400/70 focus:bg-gray-700/60 focus:border-blue-400/50 focus:shadow-lg focus:shadow-blue-500/10' : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-400/50 focus:bg-white focus:border-blue-400/60 focus:shadow-lg focus:shadow-blue-500/10'}`;
  const label = `block text-sm font-bold mb-3 tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-800'}`;
  const btnPrimary = `px-8 py-4 rounded-2xl text-sm font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl backdrop-blur-sm ${isDark ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white shadow-blue-600/25 hover:shadow-blue-600/40' : 'bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 hover:from-blue-600 hover:via-blue-500 hover:to-blue-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40'}`;
  const btnSecondary = `px-6 py-4 rounded-2xl text-sm font-bold border-2 transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm ${isDark ? 'border-gray-600/50 text-gray-200 hover:bg-gray-700/50 hover:border-gray-500/60 hover:shadow-lg' : 'border-gray-300/50 text-gray-700 hover:bg-gray-100/80 hover:border-gray-400/60 hover:shadow-lg'}`;
  const btnDanger = `px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/20' : 'bg-red-100/80 text-red-600 hover:bg-red-200/80 border border-red-200/60 hover:border-red-300/60 hover:shadow-lg hover:shadow-red-500/20'}`;
  const row = `p-6 rounded-2xl border backdrop-blur-sm transition-all duration-200 ${isDark ? 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/30' : 'border-gray-200/30 bg-gray-50/30 hover:bg-gray-100/40'}`;
  const glassCard = `rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 ${isDark ? 'bg-gray-800/80 border-gray-700/30 shadow-black/30' : 'bg-white/85 border-gray-200/30 shadow-gray-300/30'}`;
  const successBadge = `inline-flex items-center px-4 py-2 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm transition-all duration-200 ${isDark ? 'bg-green-900/40 text-green-300 border border-green-600/40 shadow-green-500/20' : 'bg-green-100/80 text-green-700 border border-green-200/60 shadow-green-500/20'}`;
  const warningBadge = `inline-flex items-center px-4 py-2 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm transition-all duration-200 ${isDark ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-600/40 shadow-yellow-500/20' : 'bg-yellow-100/80 text-yellow-700 border border-yellow-200/60 shadow-yellow-500/20'}`;
  const errorBadge = `inline-flex items-center px-4 py-2 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm transition-all duration-200 ${isDark ? 'bg-red-900/40 text-red-300 border border-red-600/40 shadow-red-500/20' : 'bg-red-100/80 text-red-700 border border-red-200/60 shadow-red-500/20'}`;
  
  // World-Class Enhanced UI Elements
  const worldClassCard = `rounded-3xl border-2 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:shadow-3xl ${isDark ? 'bg-gradient-to-br from-slate-900/95 via-blue-900/10 to-slate-800/95 border-blue-500/20 shadow-blue-500/10 hover:border-blue-400/30 hover:shadow-blue-500/20' : 'bg-gradient-to-br from-white/95 via-blue-50/30 to-white/95 border-blue-200/50 shadow-blue-200/20 hover:border-blue-300/60 hover:shadow-blue-300/30'}`;
  const worldClassInput = `w-full px-6 py-4 rounded-2xl border-2 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:transition-all placeholder:duration-300 ${isDark ? 'bg-gradient-to-br from-gray-800/80 to-gray-700/60 border-gray-600/50 text-white placeholder-gray-400/60 focus:bg-gradient-to-br focus:from-gray-700/80 focus:to-gray-600/60 focus:border-blue-400/60 focus:shadow-2xl focus:shadow-blue-500/20' : 'bg-gradient-to-br from-white/90 to-gray-50/80 border-gray-300/60 text-gray-900 placeholder-gray-500/60 focus:bg-gradient-to-br focus:from-white focus:to-gray-50/90 focus:border-blue-400/70 focus:shadow-2xl focus:shadow-blue-500/20'}`;
  const worldClassButton = `px-10 py-4 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-3xl backdrop-blur-xl border ${isDark ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-700 hover:via-cyan-600 hover:to-blue-700 text-white border-blue-400/30 shadow-blue-500/30 hover:shadow-blue-400/50' : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 hover:from-blue-600 hover:via-cyan-500 hover:to-blue-600 text-white border-blue-300/50 shadow-blue-400/30 hover:shadow-blue-300/50'}`;
  const worldClassSuccess = `inline-flex items-center px-6 py-3 rounded-full text-sm font-bold tracking-wide backdrop-blur-xl transition-all duration-300 transform hover:scale-105 ${isDark ? 'bg-gradient-to-r from-green-600/40 to-emerald-600/40 text-green-300 border border-green-500/40 shadow-green-500/30 hover:shadow-green-400/50' : 'bg-gradient-to-r from-green-100/90 to-emerald-100/90 text-green-700 border border-green-300/60 shadow-green-400/30 hover:shadow-green-300/50'}`;
  const worldClassWarning = `inline-flex items-center px-6 py-3 rounded-full text-sm font-bold tracking-wide backdrop-blur-xl transition-all duration-300 transform hover:scale-105 ${isDark ? 'bg-gradient-to-r from-amber-600/40 to-yellow-600/40 text-amber-300 border border-amber-500/40 shadow-amber-500/30 hover:shadow-amber-400/50' : 'bg-gradient-to-r from-amber-100/90 to-yellow-100/90 text-amber-700 border border-amber-300/60 shadow-amber-400/30 hover:shadow-amber-300/50'}`;
  const worldClassError = `inline-flex items-center px-6 py-3 rounded-full text-sm font-bold tracking-wide backdrop-blur-xl transition-all duration-300 transform hover:scale-105 ${isDark ? 'bg-gradient-to-r from-red-600/40 to-rose-600/40 text-red-300 border border-red-500/40 shadow-red-500/30 hover:shadow-red-400/50' : 'bg-gradient-to-r from-red-100/90 to-rose-100/90 text-red-700 border border-red-300/60 shadow-red-400/30 hover:shadow-red-300/50'}`;
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const textTertiary = isDark ? 'text-gray-500' : 'text-gray-500';
  const premiumGradient = `bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700`;
  const successGradient = `bg-gradient-to-br from-green-500 via-emerald-600 to-green-600`;
  const warningGradient = `bg-gradient-to-br from-yellow-500 via-orange-600 to-yellow-600`;
  const errorGradient = `bg-gradient-to-br from-red-500 via-pink-600 to-red-600`;

  // Form State
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxCapAmount: '',
    scope: initialScope || (initialStudent ? 'student' : 'student'),
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
      
      // Load fee structures
      const feeRes = await fetch('/api/fees/structures');
      if (feeRes.ok) {
        const feeData = await feeRes.json();
        const allFeeStructures = feeData.feeStructures || [];
        setFeeStructures(allFeeStructures);
      } else {
        console.error('Failed to load fee structures:', await feeRes.text());
      }
      
      // Load school config
      const configRes = await fetch('/api/school-config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setClasses(configData.classes || []);
        setSections(configData.sections || []);
        setMediums(configData.mediums || []);
        setAcademicYears(configData.academicYears || []);
        
        // Set default academic year
        if (configData.academicYears?.length > 0) {
          const currentYear = new Date().getFullYear();
          const activeYear = configData.academicYears.find((year: any) => 
            year.isActive || year.year.includes(String(currentYear))
          ) || configData.academicYears[0];
          setFormData(prev => ({ ...prev, academicYear: activeYear.year || activeYear.name }));
        }
      }
      
      // Load transport routes separately
      const transportRes = await fetch('/api/transport/routes');
      if (transportRes.ok) {
        const transportData = await transportRes.json();
        const routes = transportData.routes || [];
        setTransportRoutes(routes);
      } else {
        console.error('Failed to load transport routes:', await transportRes.text());
        // Fallback to school config transport routes
        if (configRes.ok) {
          const configData = await configRes.json();
          setTransportRoutes(configData.transportRoutes || []);
        }
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!initialStudent?.id) return;

    setStudents(prev => prev.some(student => student.id === initialStudent.id) ? prev : [initialStudent, ...prev]);
    setSelectedStudentLookup(prev => ({
      ...prev,
      [initialStudent.id]: {
        ...prev[initialStudent.id],
        ...initialStudent,
      },
    }));
    setFormData(prev => ({
      ...prev,
      scope: initialScope || 'student',
      studentIds: [initialStudent.id],
    }));
    setSearchTerm(initialStudent.name || '');
  }, [initialStudent?.id]);

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
            setStudents(initialStudent
              ? [
                  initialStudent,
                  ...fetchedStudents.filter((student: any) => student.id !== initialStudent.id)
                ]
              : fetchedStudents);
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
      setStudents(initialStudent ? [initialStudent] : []);
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
    const filtered = feeStructures.filter((structure: any) => {
      const structureAcademicYear = structure.academicYear?.year || structure.academicYear?.name || structure.academicYear || '';
      
      if (formData.academicYear && structureAcademicYear && structureAcademicYear !== formData.academicYear) {
        return false;
      }

      // Filter by selected medium (from Step 1)
      if (formData.mediumIds.length > 0) {
        const structureMediumId = structure.mediumId || structure.medium?.id;
        if (structureMediumId && !formData.mediumIds.includes(structureMediumId)) {
          return false;
        }
      }

      if (formData.scope === 'transport') {
        return true;
      }

      // Check if this is a transport fee structure using multiple detection methods
      const isTransportFee = (structure.name || '').toLowerCase().includes('transport') || 
                           (structure.category || '').toLowerCase().includes('transport') ||
                           (structure.description || '').toLowerCase().includes('transport') ||
                           (structure.name || '').toLowerCase().includes('bus') ||
                           (structure.name || '').toLowerCase().includes('van') ||
                           (structure.name || '').toLowerCase().includes('vehicle');

      // Transport fees should be visible to all students who have transport assigned
      if (formData.scope === 'student' && isTransportFee) {
        const studentsWithTransport = Object.values(selectedStudentLookup).filter(student => student.transport?.isActive);
        if (studentsWithTransport.length > 0) {
          return true;
        } else {
          return false;
        }
      }

      const structureClassName = structure.class?.name || structure.className || '';
      const structureClassId = structure.class?.id || structure.classId || '';
      const structureMediumId = structure.mediumId || structure.medium?.id || '';

      // For student scope, if no students selected yet, show all applicable fee structures
      if (formData.scope === 'student') {
        // If no students selected, show fee structures that could apply
        if (selectedStudentClassNames.length === 0 && formData.classIds.length === 0) {
          // Show fee structures that are not class-specific or are for common classes
          return !structureClassId || structureClassName === '' || structureClassName === 'All';
        }
        // If students selected, match their classes OR show school-wide fee structures
        const matches = selectedStudentClassNames.includes(structureClassName) || 
                       formData.classIds.includes(structureClassId) ||
                       !structureClassId; // Show school-wide fee structures
        return matches;
      }

      if (formData.scope === 'class') {
        // Filter by class AND medium if selected
        if (formData.classIds.length === 0 && formData.mediumIds.length === 0) {
          // Show all fee structures when no filters selected
          return true;
        }
        
        const classMatches = formData.classIds.length === 0 || 
                            formData.classIds.includes(structureClassId) || 
                            selectedClassNames.includes(structureClassName);
        
        return classMatches;
      }

      return true;
    });
    
    return filtered;
  }, [feeStructures, formData.academicYear, formData.classIds, formData.mediumIds, formData.scope, selectedClassNames, selectedStudentClassNames, selectedStudentLookup]);

  // Map classes with their fee structures
  const classesWithFees = useMemo(() => {
    return classes.map((cls: any) => {
      // Find fee structures for this class - match both direct classId and relation class.id
      const classFeeStructures = feeStructures.filter((fs: any) => {
        const directMatch = fs.classId === cls.id;
        const relationMatch = fs.class?.id === cls.id;
        return directMatch || relationMatch;
      });
      
      // Calculate total fees from all structures for this class
      const monthlyFees = classFeeStructures
        .filter((fs: any) => fs.category === 'monthly' || fs.frequency === 'monthly')
        .reduce((sum: number, fs: any) => sum + (Number(fs.amount) || 0), 0);
      
      const yearlyFees = classFeeStructures
        .filter((fs: any) => fs.category === 'yearly' || fs.frequency === 'yearly')
        .reduce((sum: number, fs: any) => sum + (Number(fs.amount) || 0), 0);
      
      const totalFees = classFeeStructures
        .reduce((sum: number, fs: any) => sum + (Number(fs.amount) || 0), 0);

      return {
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
    });
  }, [classes, feeStructures]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      feeStructureIds: prev.feeStructureIds.filter(id => visibleFeeStructures.some((fs: any) => fs.id === id))
    }));
  }, [visibleFeeStructures]);

  useEffect(() => {
    let cancelled = false;

    const loadFeeTypeBalances = async () => {
      if (formData.scope !== 'student' || formData.studentIds.length === 0) {
        setFeeTypeBalances({});
        return;
      }

      setLoadingFeeBalances(true);
      try {
        const summaries = await Promise.all(
          formData.studentIds.map(async (studentId) => {
            const res = await fetch(`/api/fees/students/${studentId}/summary`);
            if (!res.ok) return null;
            const result = await res.json();
            return result.success ? result.data : null;
          })
        );

        const selectedYear = formData.academicYear && formData.academicYear !== 'all' ? formData.academicYear : '';
        const aggregated = new Map<string, { totalAmount: number; paidAmount: number; pendingAmount: number; discountAmount: number }>();

        summaries.filter(Boolean).forEach((summary: any) => {
          (summary?.feeRecords || [])
            .filter((record: any) => !selectedYear || record.academicYear === selectedYear)
            .forEach((record: any) => {
              const key = record.feeStructureId || record.id;
              const current = aggregated.get(key) || { totalAmount: 0, paidAmount: 0, pendingAmount: 0, discountAmount: 0 };
              current.totalAmount += Number(record.amount || 0);
              current.paidAmount += Number(record.paidAmount || 0);
              current.pendingAmount += Number(record.pendingAmount || Math.max(0, (record.amount || 0) - (record.paidAmount || 0) - (record.discount || 0)));
              current.discountAmount += Number(record.discount || 0);
              aggregated.set(key, current);
            });
        });

        if (!cancelled) {
          setFeeTypeBalances(Object.fromEntries(aggregated.entries()));
        }
      } catch (error) {
        console.error('Failed to load fee type balances:', error);
        if (!cancelled) {
          setFeeTypeBalances({});
        }
      } finally {
        if (!cancelled) {
          setLoadingFeeBalances(false);
        }
      }
    };

    loadFeeTypeBalances();

    return () => {
      cancelled = true;
    };
  }, [formData.scope, formData.studentIds, formData.academicYear]);

  const formatStudentStatus = (status?: string) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Generate automatic discount name based on scope and targets
  const generateDiscountName = (): string => {
    const scopeText = formData.scope === 'student' ? 'Student' : 
                      formData.scope === 'class' ? 'Class' : 
                      formData.scope === 'transport' ? 'Transport' : 'Bulk';
    
    let targetDetails = '';
    
    if (formData.scope === 'student' && formData.studentIds.length > 0) {
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
    } else if (formData.scope === 'class' && formData.classIds.length > 0) {
      const classNames = formData.classIds.slice(0, 2).map(id => {
        const cls = classes.find(c => c.id === id);
        return cls ? cls.name : '';
      }).filter(Boolean);
      
      if (classNames.length === 1) {
        targetDetails = classNames[0];
      } else if (classNames.length === 2) {
        targetDetails = `${classNames[0]} & ${classNames[1]}`;
      } else {
        targetDetails = `${classNames[0]} +${formData.classIds.length - 1} more`;
      }
    } else if (formData.scope === 'transport' && formData.transportRouteIds.length > 0) {
      targetDetails = `${formData.transportRouteIds.length} route(s)`;
    }
    
    const discountText = formData.discountType === 'percentage' ? `${formData.discountValue}%` :
                        formData.discountType === 'fixed' ? `₹${formData.discountValue}` :
                        formData.discountType === 'full_waiver' ? 'Full Waiver' : 'Discount';
    
    return `${scopeText}${targetDetails ? ' - ' + targetDetails : ''} - ${discountText}`;
  };

  // Auto-update name when form data changes
  useEffect(() => {
    if (formData.scope && (formData.studentIds.length > 0 || formData.classIds.length > 0 || formData.transportRouteIds.length > 0)) {
      const autoName = generateDiscountName();
      if (autoName && autoName !== formData.name) {
        setFormData(prev => ({ ...prev, name: autoName }));
      }
    }
  }, [formData.scope, formData.studentIds, formData.classIds, formData.transportRouteIds, formData.discountType, formData.discountValue, selectedStudentLookup, classes]);

  const validateStep = (step: number): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (step === 1) {
      if (!formData.academicYear) errors.push('Academic year is required');
      if (!formData.scope) errors.push('Scope selection is required');
      if (formData.scope === 'student' && formData.studentIds.length === 0) errors.push('Please select at least one student');
      if (formData.scope === 'class' && formData.classIds.length === 0) errors.push('Please select at least one class');
      if (formData.scope === 'transport' && formData.transportRouteIds.length === 0) errors.push('Please select at least one transport route');
    }

    if (step === 2) {
      // Auto-determine targetType based on scope for validation
      const targetType = formData.scope === 'transport' ? 'total' : 'fee_structure';
      
      if (!targetType) errors.push('Target type selection is required');
      if (targetType === 'fee_structure' && formData.feeStructureIds.length === 0) errors.push('Please select at least one fee structure');
      if (formData.discountType !== 'full_waiver' && (!formData.discountValue || Number(formData.discountValue) <= 0)) {
        errors.push('Discount value must be greater than 0');
      }
      if (formData.discountType === 'percentage' && Number(formData.discountValue) > 100) {
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
  const isFormValid = () => {
    // Basic required fields validation
    if (!formData.name.trim()) {
      return false;
    }
    if (!formData.reason.trim()) {
      return false;
    }
    if (!formData.academicYear) {
      return false;
    }
    if (!formData.scope) {
      return false;
    }
    
    // Scope-specific validations
    if (formData.scope === 'student') {
      // Student scope requires students to be selected
      if (formData.studentIds.length === 0) {
        return false;
      }
    } else if (formData.scope === 'class') {
      // Class scope requires classes to be selected
      if (formData.classIds.length === 0) {
        return false;
      }
    } else if (formData.scope === 'transport') {
      // Transport scope requires routes to be selected
      if (formData.transportRouteIds.length === 0) {
        return false;
      }
    }
    
    // Fee structure validation
    if (formData.feeStructureIds.length === 0 && formData.scope !== 'transport') {
      return false;
    }
    
    // Discount value validation
    if (formData.discountType !== 'full_waiver') {
      const discountValue = Number(formData.discountValue);
      if (isNaN(discountValue) || discountValue <= 0) {
        return false;
      }
      if (formData.discountType === 'percentage' && discountValue > 100) {
        return false;
      }
    }
    
    // Date validation
    const fromDate = new Date(formData.validFrom);
    const toDate = new Date(formData.validTo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return false;
    }
    if (fromDate > toDate) {
      return false;
    }
    if (fromDate < today) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setValidationState(prev => ({ ...prev, errors: [], warnings: [] }));

      // Auto-determine targetType based on scope
      let targetType = 'fee_structure';
      let feeStructureIds = formData.feeStructureIds;
      
      if (formData.scope === 'transport') {
        targetType = 'total';
        feeStructureIds = []; // Transport-wide applies to all transport fees
      } else if (formData.scope === 'class') {
        targetType = 'fee_structure';
        // Class scope uses selected fee structures
      } else if (formData.scope === 'student') {
        targetType = 'fee_structure';
        // Student scope uses selected fee structures
      }

      const response = await fetch('/api/fees/discount-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: generateDiscountName(), // Auto-generated discount name
          targetType,
          feeStructureIds,
          // Ensure full_waiver has discountValue: 100
          discountValue: formData.discountType === 'full_waiver' ? 100 : Number(formData.discountValue),
          maxCapAmount: formData.maxCapAmount ? Number(formData.maxCapAmount) : null,
          transportRouteIds: formData.transportRouteIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      const result = await response.json();
      
      // Show immediate success message
      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Success!',
          message: 'Discount request submitted successfully. Email notifications are being sent in the background.',
          duration: 5000
        });
      }

      onSuccess?.();

      // Close form immediately after successful submission
      onClose();
    } catch (err: any) {
      setValidationState(prev => ({ ...prev, errors: [err.message] }));
      
      // Show error message
      if ((window as any).toast) {
        (window as any).toast({
          type: 'error',
          title: 'Error',
          message: err.message || 'Failed to submit discount request',
          duration: 5000
        });
      }
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
                      : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm">{stepInfo.icon}</span>}
                </motion.div>
                <span className={`text-xs mt-1 font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
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
                          <div className="text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Selected Students:</div>
                          <div className="flex flex-wrap gap-1">
                            {formData.studentIds.slice(0, 8).map((studentId) => {
                              const student = selectedStudentLookup[studentId] || students.find((s: any) => s.id === studentId);
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
                              <span className="text-xs text-gray-600 dark:text-gray-300 px-1.5 py-0.5">
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
                                <div className="text-xs text-gray-600 flex items-center gap-3">
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
                        Select Medium <span className="text-xs text-gray-600">(Optional - will filter classes)</span>
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
                        
                        {/* Selected Classes Preview */}
                        {formData.classIds.length > 0 && (
                          <div className={`p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Selected Classes:</div>
                            <div className="flex flex-wrap gap-1">
                              {formData.classIds.slice(0, 8).map((classId) => {
                                const cls = classesWithFees.find((c: any) => c.id === classId);
                                return cls ? (
                                  <span key={classId} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                    {cls.name}
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
                                <span className="text-xs text-gray-600 dark:text-gray-300 px-1.5 py-0.5">
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
                                  <div className="text-xs text-gray-600 truncate">
                                    {cls.medium?.name || 'No Medium'}
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
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            This discount will apply to all students in selected routes
                          </p>
                        </div>
                      </div>
                      
                      {/* Show selected routes summary */}
                      {formData.transportRouteIds.length > 0 && (
                        <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-green-900/20 border-green-600' : 'bg-green-50 border-green-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600 dark:text-green-400">✓</span>
                              <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                {formData.transportRouteIds.length} Route(s) Selected
                              </span>
                            </div>
                            <button
                              onClick={() => setFormData({...formData, transportRouteIds: [], feeStructureIds: []})}
                              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="space-y-1">
                            {formData.transportRouteIds.slice(0, 3).map((routeId: string) => {
                              const route = transportRoutes.find((r: any) => r.id === routeId);
                              return route ? (
                                <div key={routeId} className="text-xs text-green-600 dark:text-green-400">
                                  🚌 {route.name || route.routeName || `Route ${route.routeNumber}`}
                                  {route.vehicleNumber && ` • ${route.vehicleNumber}`}
                                </div>
                              ) : null;
                            })}
                            {formData.transportRouteIds.length > 3 && (
                              <div className="text-xs text-green-600 dark:text-green-400">
                                ... and {formData.transportRouteIds.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <label className={label}>
                          Select Transport Routes <span className="text-red-500">*</span>
                        </label>
                        
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
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
                                    route.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    route.area?.toLowerCase().includes(searchTerm.toLowerCase())
                                  )
                                  .map((route: any) => route.id);
                                
                                // For transport scope, auto-select transport fee structures
                                let newFeeStructureIds = formData.feeStructureIds;
                                if (formData.scope === 'transport') {
                                  const transportFeeStructures = visibleFeeStructures.filter((fs: any) => {
                                    const name = (fs.name || '').toLowerCase();
                                    const category = (fs.category || '').toLowerCase();
                                    const description = (fs.description || '').toLowerCase();
                                    return name.includes('transport') || name.includes('bus') || name.includes('van') || name.includes('vehicle') ||
                                           name.includes('conveyance') || name.includes('commute') || name.includes('travel') ||
                                           category.includes('transport') || category.includes('bus') || category.includes('conveyance') ||
                                           description.includes('transport') || description.includes('bus') || description.includes('vehicle') ||
                                           description.includes('conveyance') || description.includes('commute');
                                  });
                                  
                                  newFeeStructureIds = [...new Set([...formData.feeStructureIds, ...transportFeeStructures.map(fs => fs.id)])];
                                }
                                
                                setFormData({
                                  ...formData, 
                                  transportRouteIds: [...new Set([...formData.transportRouteIds, ...visibleRouteIds])], 
                                  feeStructureIds: newFeeStructureIds
                                });
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
                                  route.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  route.area?.toLowerCase().includes(searchTerm.toLowerCase())
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
                                      
                                      // For transport scope, auto-select transport fee structures
                                      let newFeeStructureIds = formData.feeStructureIds;
                                      if (formData.scope === 'transport') {
                                        const transportFeeStructures = visibleFeeStructures.filter((fs: any) => {
                                          const name = (fs.name || '').toLowerCase();
                                          const category = (fs.category || '').toLowerCase();
                                          const description = (fs.description || '').toLowerCase();
                                          return name.includes('transport') || name.includes('bus') || name.includes('van') || name.includes('vehicle') ||
                                                 name.includes('conveyance') || name.includes('commute') || name.includes('travel') ||
                                                 category.includes('transport') || category.includes('bus') || category.includes('conveyance') ||
                                                 description.includes('transport') || description.includes('bus') || description.includes('vehicle') ||
                                                 description.includes('conveyance') || description.includes('commute');
                                        });
                                        
                                        if (e.target.checked) {
                                          // Add transport fee structures when route is selected
                                          newFeeStructureIds = [...new Set([...formData.feeStructureIds, ...transportFeeStructures.map(fs => fs.id)])];
                                        } else if (newIds.length === 0) {
                                          // Clear fee structures only if no routes selected
                                          newFeeStructureIds = [];
                                        }
                                      }
                                      
                                      setFormData({...formData, transportRouteIds: newIds, feeStructureIds: newFeeStructureIds});
                                    }}
                                    className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-xs truncate">{route.routeName || route.name || `Route ${route.routeNumber}`}</div>
                                    <div className="text-xs text-gray-600 flex items-center gap-2 truncate">
                                      {route.routeNumber && <span>No: {route.routeNumber}</span>}
                                      {route.description && <span>{route.description}</span>}
                                      {route.area && <span>{route.area}</span>}
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
                                <div className="text-center p-3 text-gray-600 text-xs">
                                  No transport routes found. Please check if transport routes are configured in the system.
                                </div>
                              )}
                              
                              {transportRoutes.length > 0 && transportRoutes.filter((route: any) => 
                                searchTerm && !(
                                  route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  route.routeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  route.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  route.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  route.area?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                              ).length === 0 && (
                                <div className="text-center p-3 text-gray-600 text-xs">
                                  No transport routes found matching "{searchTerm}"
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Selected Routes Preview */}
                          {formData.transportRouteIds.length > 0 && (
                            <div className={`p-2 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                              <div className="text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Selected Routes:</div>
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
                                  <span className="text-xs text-gray-600 dark:text-gray-300 px-1.5 py-0.5">
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
                                    <div className="text-xs text-gray-600 flex items-center gap-2 truncate">
                                      <span>{student.admissionNumber}</span>
                                      <span>{student.class}</span>
                                      <span>{student.status}</span>
                                    </div>
                                  </div>
                                </label>
                              ))}
                              
                              {students.length === 0 && (
                                <div className="text-center p-3 text-gray-600 text-xs">
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
                                <div className="text-center p-3 text-gray-600 text-xs">
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
              
              {/* Auto-generated discount name display */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-200'} mb-6`}>
                <div className="flex items-center space-x-3">
                  <span className="text-xl">🏷️</span>
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${textPrimary} mb-1`}>Auto-Generated Discount Name:</div>
                    <div className={`text-lg font-bold text-blue-700 dark:text-blue-300`}>
                      {generateDiscountName()}
                    </div>
                    <div className={`text-xs ${textSecondary} mt-1`}>
                      This name is automatically generated based on your scope, targets, and discount type
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Auto-determined Target Type Info */}
                <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'}`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {formData.scope === 'student' && '👤'}
                      {formData.scope === 'class' && '🏫'}
                      {formData.scope === 'transport' && '🚌'}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {formData.scope === 'student' && 'Student-Specific Discount'}
                        {formData.scope === 'class' && 'Class-Wide Discount'}
                        {formData.scope === 'transport' && 'Transport-Wide Discount'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formData.scope === 'student' && 'Applying to selected students only'}
                        {formData.scope === 'class' && 'Applying to all students in selected classes'}
                        {formData.scope === 'transport' && 'Applying to all students using transport'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bulk Discount Warning */}
                {(formData.scope === 'class' || formData.scope === 'transport') && (
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-amber-900/20 border-amber-600' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-start space-x-3">
                      <span className="text-xl mt-1">⚠️</span>
                      <div className="flex-1">
                        <div className={`font-semibold text-sm mb-2 text-amber-700 dark:text-amber-300`}>
                          Important: Bulk Discount Application
                        </div>
                        <div className={`text-xs space-y-1 text-amber-600 dark:text-amber-400`}>
                          <div className="font-medium">🛡️ Automatic Negative Balance Prevention:</div>
                          <div>• Students with <span className="font-bold">no outstanding fees</span> will be automatically skipped</div>
                          <div>• Students who have <span className="font-bold">already paid full amount</span> will be automatically skipped</div>
                          <div>• Discounts will <span className="font-bold">never create negative balances</span> - limited to remaining outstanding amount</div>
                          <div>• Each student's discount is calculated individually based on their actual outstanding amount</div>
                          
                          <div className="mt-2 p-2 rounded bg-amber-100 dark:bg-amber-900/30">
                            <div className={`font-medium text-amber-700 dark:text-amber-300`}>Example Scenarios:</div>
                            <div className={`text-amber-700 dark:text-amber-300`}>• Student A: Total ₹10,000, Paid ₹10,000, Outstanding ₹0 → <span className="font-bold">SKIPPED</span></div>
                            <div className={`text-amber-700 dark:text-amber-300`}>• Student B: Total ₹10,000, Paid ₹8,000, Outstanding ₹2,000, 10% discount → ₹200 discount, New Outstanding ₹1,800</div>
                            <div className={`text-amber-700 dark:text-amber-300`}>• Student C: Total ₹10,000, Paid ₹0, Outstanding ₹10,000, 10% discount → ₹1,000 discount, New Outstanding ₹9,000</div>
                          </div>
                          
                          <div className="mt-2 font-medium">
                            💡 This ensures fair and safe discount application across all students in the selected classes/transport routes.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.scope !== 'transport' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <label className={label}>
                      Select Fee Type <span className="text-red-500">*</span>
                    </label>
                    {loadingFeeBalances && formData.scope === 'student' && (
                      <div className={`mb-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading pending balances for selected students...
                      </div>
                    )}
                    <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                      {(() => {
                        // Helper function to format amounts
                        const formatAmount = (amount: number | string | null | undefined): string => {
                          const num = Number(amount || 0);
                          return num.toLocaleString('en-IN');
                        };

                        const getStructureAmount = (structure: any) => {
                          const balance = feeTypeBalances[structure.id]?.totalAmount;
                          return typeof balance === 'number' ? balance : Number(structure.amount || 0);
                        };

                        const isTransportStructure = (structure: any) => {
                          const name = (structure.name || '').toLowerCase();
                          const category = (structure.category || '').toLowerCase();
                          const description = (structure.description || '').toLowerCase();
                          return name.includes('transport') || name.includes('bus') || name.includes('van') || name.includes('vehicle') ||
                                 category.includes('transport') || category.includes('bus') ||
                                 description.includes('transport') || description.includes('bus');
                        };

                        const transportStructures = visibleFeeStructures.filter(isTransportStructure);
                        const tuitionStructures = visibleFeeStructures.filter((fs: any) => !isTransportStructure(fs));

                        return (
                          <div className="space-y-4">
                            {transportStructures.length > 0 && (
                              <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={transportStructures.every(fs => formData.feeStructureIds.includes(fs.id))}
                                      onChange={(e) => {
                                        const newIds = e.target.checked
                                          ? [...formData.feeStructureIds, ...transportStructures.filter(fs => !formData.feeStructureIds.includes(fs.id)).map(fs => fs.id)]
                                          : formData.feeStructureIds.filter(id => !transportStructures.some(fs => fs.id === id));
                                        setFormData({...formData, feeStructureIds: newIds});
                                      }}
                                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <div>
                                      <span className="font-medium text-orange-700 dark:text-orange-300">🚌 Transport Fees</span>
                                      <div className="text-xs text-gray-600">
                                        {transportStructures.length} fee structure{transportStructures.length > 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </label>
                                </div>
                                <div className="space-y-2 ml-7">
                                  {transportStructures.map((fs: any) => (
                                    <label key={fs.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={formData.feeStructureIds.includes(fs.id)}
                                          onChange={(e) => {
                                            const newIds = e.target.checked
                                              ? [...formData.feeStructureIds, fs.id]
                                              : formData.feeStructureIds.filter(id => id !== fs.id);
                                            setFormData({...formData, feeStructureIds: newIds});
                                          }}
                                          className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm">{fs.name}</span>
                                      </div>
                                      <div className="text-xs text-right text-gray-500">
                                        <div className="font-medium text-blue-600 dark:text-blue-400">
                                          {formData.scope === 'student' ? 'Outstanding:' : 'Total Fee:'} ₹{formatAmount(
                                            formData.scope === 'student' 
                                              ? Number(feeTypeBalances[fs.id]?.pendingAmount || 0)
                                              : Number(fs.amount || 0)
                                          )}
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {tuitionStructures.length > 0 && (
                              <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={tuitionStructures.every(fs => formData.feeStructureIds.includes(fs.id))}
                                      onChange={(e) => {
                                        const newIds = e.target.checked
                                          ? [...formData.feeStructureIds, ...tuitionStructures.filter(fs => !formData.feeStructureIds.includes(fs.id)).map(fs => fs.id)]
                                          : formData.feeStructureIds.filter(id => !tuitionStructures.some(fs => fs.id === id));
                                        setFormData({...formData, feeStructureIds: newIds});
                                      }}
                                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <div>
                                      <span className="font-medium text-blue-700 dark:text-blue-300">📚 Tuition Fees</span>
                                      <div className="text-xs text-gray-500">
                                        {tuitionStructures.length} fee structure{tuitionStructures.length > 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </label>
                                </div>
                                <div className="space-y-2 ml-7">
                                  {tuitionStructures.map((fs: any) => (
                                    <label key={fs.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={formData.feeStructureIds.includes(fs.id)}
                                          onChange={(e) => {
                                            const newIds = e.target.checked
                                              ? [...formData.feeStructureIds, fs.id]
                                              : formData.feeStructureIds.filter(id => id !== fs.id);
                                            setFormData({...formData, feeStructureIds: newIds});
                                          }}
                                          className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm">{fs.name}</span>
                                      </div>
                                      <div className="text-xs text-right text-gray-500">
                                        <div className="font-medium text-blue-600 dark:text-blue-400">
                                          {formData.scope === 'student' ? 'Outstanding:' : 'Total Fee:'} ₹{formatAmount(
                                            formData.scope === 'student' 
                                              ? Number(feeTypeBalances[fs.id]?.pendingAmount || 0)
                                              : Number(fs.amount || 0)
                                          )}
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Unified Fee Summary Table */}
                            {(transportStructures.length > 0 || tuitionStructures.length > 0) && (
                              <div className={`mt-4 p-3 rounded-lg border ${
                                isDark 
                                  ? 'bg-gray-700 border-gray-600' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}>
                                <div className="text-sm font-medium mb-3">Fee Summary & Discount Impact</div>
                                <div className="space-y-2">
                                  {/* Table Header */}
                                  <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-600">
                                    <div>Fee Type</div>
                                    <div className="text-right">Pending</div>
                                    <div className="text-center">Selected</div>
                                    <div className="text-right">After Discount</div>
                                  </div>
                                  
                                  {/* Fee Rows */}
                                  {(() => {
                                    const allStructures = visibleFeeStructures;
                                    const selectedIds = formData.feeStructureIds;
                                    let totalPending = 0;
                                    let totalAfterDiscount = 0;
                                    let totalDiscount = 0;
                                    
                                    const rows = allStructures.map((fs: any) => {
                                      // Use different amount calculation based on scope
                                      const pending = formData.scope === 'student' 
                                        ? Number(feeTypeBalances[fs.id]?.pendingAmount || 0)
                                        : Number(fs.amount || 0); // Use total fee amount for bulk discounts
                                      
                                      const isSelected = selectedIds.includes(fs.id);
                                      let discount = 0;
                                      let afterDiscount = pending;
                                      
                                      if (isSelected && formData.discountType && formData.discountValue) {
                                        if (formData.discountType === 'fixed') {
                                          // Fixed amount applies to EACH selected fee structure
                                          discount = Math.min(Number(formData.discountValue), pending);
                                        } else if (formData.discountType === 'percentage') {
                                          discount = Math.min((pending * Number(formData.discountValue)) / 100, pending);
                                        } else if (formData.discountType === 'full_waiver') {
                                          discount = pending;
                                        }
                                        afterDiscount = Math.max(0, pending - discount);
                                      }
                                      
                                      totalPending += pending;
                                      totalAfterDiscount += afterDiscount;
                                      totalDiscount += discount;
                                      
                                      return (
                                        <div key={fs.id} className="grid grid-cols-4 gap-2 text-xs items-center py-1">
                                          <div className="font-medium">{fs.name}</div>
                                          <div className="text-right">₹{pending.toLocaleString('en-IN')}</div>
                                          <div className="text-center">
                                            {isSelected && (
                                              <span className="inline-block w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs">✓</span>
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-right font-semibold">
                                            ₹{afterDiscount.toLocaleString('en-IN')}
                                            {discount > 0 && (
                                              <div className="text-green-600 dark:text-green-400 text-xs">
                                                -₹{discount.toLocaleString('en-IN')}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    });
                                    
                                    return (
                                      <>
                                        {rows}
                                        {/* Total Row */}
                                        <div className="grid grid-cols-4 gap-2 text-xs font-bold pt-2 mt-2 border-t border-gray-200 dark:border-gray-600">
                                          <div>Total</div>
                                          <div className="text-right">₹{totalPending.toLocaleString('en-IN')}</div>
                                          <div className="text-center text-blue-600 dark:text-blue-400">
                                            {selectedIds.length > 0 && `${selectedIds.length} selected`}
                                          </div>
                                          <div className="text-right text-green-600 dark:text-green-400">
                                            ₹{totalAfterDiscount.toLocaleString('en-IN')}
                                            {totalDiscount > 0 && (
                                              <div className="text-xs">
                                                (Saved ₹{totalDiscount.toLocaleString('en-IN')})
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}

                            {transportStructures.length === 0 && tuitionStructures.length === 0 && (
                              <div className="text-center p-6 text-gray-500 text-sm">
                                No fee structures available for the selected student/class and academic year
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}
                
                {formData.scope === 'transport' && (
                  <div className={`p-4 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'}`}>
                    <div className="text-center">
                      <span className="text-2xl mb-2">🚌</span>
                      <div className={`font-semibold text-green-700 dark:text-green-300`}>Transport-Wide Discount</div>
                      <div className={`text-sm text-gray-600 dark:text-gray-300 mt-1`}>
                        This discount will apply to all students using the selected transport services
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {formData.transportRouteIds.map((routeId: string) => {
                        const route = transportRoutes.find((r: any) => r.id === routeId);
                        return route ? (
                          <div key={routeId} className={`p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-green-600 dark:text-green-400">🚌</span>
                                <div>
                                  <div className={`font-medium text-sm text-gray-800 dark:text-gray-200`}>
                                    {route.name || route.routeName || `Route ${route.routeNumber}`}
                                  </div>
                                  <div className={`text-xs text-gray-600 dark:text-gray-300`}>
                                    {route.routeNumber && `Route #: ${route.routeNumber}`}
                                    {route.vehicleNumber && ` • Vehicle: ${route.vehicleNumber}`}
                                    {route.driverName && ` • Driver: ${route.driverName}`}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-semibold text-gray-700 dark:text-gray-300`}>
                                  ₹{route.fare || route.monthlyFee || route.yearlyFee || '0'}
                                </div>
                                <div className={`text-xs text-gray-500 dark:text-gray-400`}>
                                  {route.fare && 'per student'}
                                  {route.monthlyFee && '/month'}
                                  {route.yearlyFee && '/year'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                    
                    {/* Show total students affected */}
                    <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`text-gray-600 dark:text-gray-400`}>
                          👥 Total Students Using These Routes:
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formData.transportRouteIds.length} route(s) selected
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.scope === 'transport' && formData.transportRouteIds.length === 0 && (
                  <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-amber-900/20 border-amber-600' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
                      <span className="text-lg">⚠️</span>
                      <div className="text-sm">
                        <div className="font-semibold">No Transport Routes Selected</div>
                        <div className="text-xs mt-1">
                          Please go back to Step 1 and select at least one transport route
                        </div>
                      </div>
                    </div>
                  </div>
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

                {/* Important Discount Type Warnings */}
                <div className={`mt-4 p-4 rounded-lg border ${
                  formData.discountType === 'percentage' 
                    ? isDark ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-200'
                    : formData.discountType === 'full_waiver'
                    ? isDark ? 'bg-green-900/20 border-green-600' : 'bg-green-50 border-green-200'
                    : isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <span className="text-xl mt-1">
                      {formData.discountType === 'percentage' ? '📊' : 
                       formData.discountType === 'full_waiver' ? '🆓' : '💰'}
                    </span>
                    <div className="flex-1">
                      <div className={`font-semibold text-sm mb-2 ${textPrimary}`}>
                        {formData.discountType === 'percentage' && '⚠️ Important: Percentage Discount Calculation'}
                        {formData.discountType === 'full_waiver' && '⚠️ Important: Full Waiver Calculation'}
                        {formData.discountType === 'fixed' && '💡 Fixed Amount Discount'}
                      </div>
                      
                      {formData.discountType === 'percentage' && (
                        <div className="text-xs space-y-1">
                          <div className={`font-medium ${textPrimary}`}>How it works:</div>
                          <div className={textSecondary}>• Percentage is calculated on <span className="font-bold">TOTAL FEE AMOUNT</span>, not outstanding balance</div>
                          <div className={textSecondary}>• Example: 10% of ₹10,000 = ₹1,000 discount (even if only ₹5,000 is outstanding)</div>
                          <div className={textSecondary}>• More beneficial for students who have already made partial payments</div>
                          <div className="mt-2 p-2 rounded bg-blue-100 dark:bg-blue-900/30">
                            <div className={`font-medium ${textPrimary}`}>Scenario:</div>
                            <div className={textSecondary}>Total Fee: ₹10,000 | Already Paid: ₹5,000 | Outstanding: ₹5,000</div>
                            <div className={textSecondary}>10% Discount: ₹1,000 | New Outstanding: ₹4,000</div>
                          </div>
                        </div>
                      )}
                      
                      {formData.discountType === 'full_waiver' && (
                        <div className="text-xs space-y-1">
                          <div className={`font-medium ${textPrimary}`}>How it works:</div>
                          <div className={textSecondary}>• Waiver covers <span className="font-bold">TOTAL FEE AMOUNT</span>, but limited to remaining balance</div>
                          <div className={textSecondary}>• Example: Full waiver on ₹10,000, but only ₹5,000 outstanding = ₹0 remaining</div>
                          <div className={textSecondary}>• Will not create negative balance - limited to actual outstanding amount</div>
                          <div className="mt-2 p-2 rounded bg-green-100 dark:bg-green-900/30">
                            <div className={`font-medium ${textPrimary}`}>Scenario:</div>
                            <div className={textSecondary}>Total Fee: ₹10,000 | Already Paid: ₹5,000 | Outstanding: ₹5,000</div>
                            <div className={textSecondary}>Full Waiver: Covers remaining ₹5,000 | New Outstanding: ₹0</div>
                          </div>
                        </div>
                      )}
                      
                      {formData.discountType === 'fixed' && (
                        <div className="text-xs space-y-1">
                          <div className={`font-medium ${textPrimary}`}>How it works:</div>
                          <div className={textSecondary}>• Fixed amount is <span className="font-bold">subtracted directly from outstanding balance</span></div>
                          <div className={textSecondary}>• Example: ₹1,000 discount reduces outstanding by exactly ₹1,000</div>
                          <div className={textSecondary}>• Predictable regardless of total fee amount or partial payments</div>
                          <div className="mt-2 p-2 rounded bg-gray-100 dark:bg-gray-700/30">
                            <div className={`font-medium ${textPrimary}`}>Scenario:</div>
                            <div className={textSecondary}>Total Fee: ₹10,000 | Already Paid: ₹5,000 | Outstanding: ₹5,000</div>
                            <div className={textSecondary}>Fixed Discount: ₹1,000 | New Outstanding: ₹4,000</div>
                          </div>
                          <div className="mt-2 p-2 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
                            <div className={`font-medium text-amber-700 dark:text-amber-300`}>⚠️ Important:</div>
                            <div className="text-amber-600 dark:text-amber-400 text-xs">
                              • Fixed amount applies to <span className="font-bold">EACH selected fee structure</span><br/>
                              • Selecting 3 fee structures with ₹500 discount = ₹1,500 total discount per student<br/>
                              • Be careful with bulk selections - discount multiplies quickly!
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 pt-2 border-t border-current/20">
                        <div className={`text-xs font-medium ${textSecondary}`}>
                          🛡️ Safety: All discounts prevent negative balances and skip students with no outstanding fees
                        </div>
                      </div>
                    </div>
                  </div>
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
                    <p className="text-xs text-gray-600 mt-1">
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
                      <p className="font-medium">
                        {(() => {
                          if (formData.scope === 'student') {
                            const studentCount = formData.studentIds.length;
                            return `${studentCount} Student${studentCount !== 1 ? 's' : ''}`;
                          } else if (formData.scope === 'class') {
                            const classCount = formData.classIds.length;
                            return `${classCount} Class${classCount !== 1 ? 'es' : ''}`;
                          } else if (formData.scope === 'transport') {
                            const routeCount = formData.transportRouteIds.length;
                            return `${routeCount} Transport Route${routeCount !== 1 ? 's' : ''}`;
                          }
                          return formData.targetType;
                        })()}
                      </p>
                    </div>
                    {formData.feeStructureIds.length > 0 && (
                      <div>
                        <span className="opacity-70">Selected Fee Types:</span>
                        <p className="font-medium">
                          {(() => {
                            const selectedStructures = visibleFeeStructures.filter(fs => formData.feeStructureIds.includes(fs.id));
                            const feeNames = selectedStructures.map(fs => fs.name);
                            
                            if (feeNames.length === 0) {
                              return 'No fee structures selected';
                            } else if (feeNames.length <= 2) {
                              return feeNames.join(', ');
                            } else {
                              return `${feeNames.slice(0, 2).join(', ')} +${feeNames.length - 2} more`;
                            }
                          })()}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="opacity-70">Discount Impact:</span>
                      <p className="font-medium">
                        {(() => {
                          if (formData.discountType === 'percentage') {
                            // Calculate based on scope - bulk vs individual
                            const selectedStructures = visibleFeeStructures.filter(fs => formData.feeStructureIds.includes(fs.id));
                            
                            if (formData.scope === 'class' || formData.scope === 'transport') {
                              // Bulk discount - calculate on total fee amounts
                              const totalFeeAmount = selectedStructures.reduce((sum, fs) => {
                                return sum + (Number(fs.amount) || 0);
                              }, 0);
                              
                              const discountAmount = (totalFeeAmount * Number(formData.discountValue)) / 100;
                              const cappedAmount = formData.maxCapAmount ? Math.min(discountAmount, Number(formData.maxCapAmount)) : discountAmount;
                              
                              return `${formData.discountValue}% = ₹${cappedAmount.toLocaleString('en-IN')}`;
                            } else {
                              // Individual student discount - calculate on pending amounts
                              const totalPending = selectedStructures.reduce((sum, fs) => sum + (Number(feeTypeBalances[fs.id]?.pendingAmount || 0)), 0);
                              const discountAmount = (totalPending * Number(formData.discountValue)) / 100;
                              const cappedAmount = formData.maxCapAmount ? Math.min(discountAmount, Number(formData.maxCapAmount)) : discountAmount;
                              
                              return `${formData.discountValue}% = ₹${cappedAmount.toLocaleString('en-IN')}`;
                            }
                          } else if (formData.discountType === 'full_waiver') {
                            return 'Full Waiver';
                          } else if (formData.discountType === 'fixed') {
                            // Calculate total impact for fixed amount
                            if (formData.feeStructureIds.length === 0) {
                              return 'No fee structures selected';
                            }
                            const totalImpact = Number(formData.discountValue) * formData.feeStructureIds.length;
                            return `₹${formData.discountValue} × ${formData.feeStructureIds.length} fee${formData.feeStructureIds.length !== 1 ? 's' : ''} = ₹${totalImpact.toLocaleString('en-IN')}`;
                          }
                          return formData.discountValue;
                        })()}
                        {formData.maxCapAmount && formData.discountType === 'percentage' && (
                          <span className="text-xs opacity-70 ml-1">(capped)</span>
                        )}
                        {formData.maxCapAmount && formData.discountType !== 'percentage' && ` (max ₹${formData.maxCapAmount})`}
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
            disabled={currentStep === 1 && (!formData.academicYear || !formData.scope)}
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
            disabled={isSubmitting || !isFormValid()}
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
