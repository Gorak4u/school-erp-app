// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from '../types';
import { feeStructuresApi, feeRecordsApi, paymentsApi, discountsApi, studentsApi } from '@/lib/apiClient';

export function useFeeState() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all-students');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isClient, setIsClient] = useState(false);

  // State management
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [feeCollections, setFeeCollections] = useState<FeeCollection[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentFeeSummaries, setStudentFeeSummaries] = useState<StudentFeeSummary[]>([]);

  // Advanced filtering states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    studentName: '',
    rollNo: '',
    class: '',
    paymentStatus: '',
    feeType: '',
    amountMin: '',
    amountMax: '',
    amountRange: '',
    dueDateFrom: '',
    dueDateTo: '',
    paidDateFrom: '',
    paidDateTo: '',
    overdueDaysMin: '',
    overdueDaysMax: '',
    overdueRange: '',
    discountApplied: '',
    collectedBy: '',
    session: '',
    receiptNumber: '',
    admissionNumber: ''
  });

  // UI states
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);

  // Column settings with localStorage persistence
  const [selectedColumns, setSelectedColumns] = useState(() => {
    if (typeof window === 'undefined') return [
      'select', 'studentName', 'rollNo', 'studentClass', 'totalFees', 
      'totalPaid', 'totalPending', 'totalOverdue', 'paymentStatus', 'lastPaymentDate', 'actions'
    ];
    try {
      const saved = localStorage.getItem('fees-page-selectedColumns');
      return saved ? JSON.parse(saved) : [
        'select', 'studentName', 'rollNo', 'studentClass', 'totalFees', 
        'totalPaid', 'totalPending', 'totalOverdue', 'paymentStatus', 'lastPaymentDate', 'actions'
      ];
    } catch {
      return [
        'select', 'studentName', 'rollNo', 'studentClass', 'totalFees', 
        'totalPaid', 'totalPending', 'totalOverdue', 'paymentStatus', 'lastPaymentDate', 'actions'
      ];
    }
  });
  
  const columnSettings = {
    availableColumns: [
      { key: 'select', label: 'Select', fixed: true },
      { key: 'studentName', label: 'Student Name', fixed: true },
      { key: 'admissionNo', label: 'Admission No', fixed: false },
      { key: 'rollNo', label: 'Roll No', fixed: false },
      { key: 'studentClass', label: 'Class / Section', fixed: false },
      { key: 'medium', label: 'Medium', fixed: false },
      { key: 'parentName', label: 'Parent Name', fixed: false },
      { key: 'parentPhone', label: 'Parent Phone', fixed: false },
      { key: 'totalFees', label: 'Total Fees', fixed: false },
      { key: 'totalPaid', label: 'Paid Amount', fixed: false },
      { key: 'totalPending', label: 'Pending Amount', fixed: false },
      { key: 'totalOverdue', label: 'Overdue Amount', fixed: false },
      { key: 'discount', label: 'Discount', fixed: false },
      { key: 'fineAmount', label: 'Fine / Late Fee', fixed: false },
      { key: 'paymentStatus', label: 'Payment Status', fixed: false },
      { key: 'dueDate', label: 'Due Date', fixed: false },
      { key: 'lastPaymentDate', label: 'Last Payment Date', fixed: false },
      { key: 'paymentMode', label: 'Payment Mode', fixed: false },
      { key: 'receiptNo', label: 'Receipt No', fixed: false },
      { key: 'concession', label: 'Concession', fixed: false },
      { key: 'actions', label: 'Actions', fixed: true },
    ]
  };

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const reorderColumns = (newOrder: string[]) => {
    setSelectedColumns(newOrder);
  };

  const moveColumn = (columnKey: string, direction: 'up' | 'down') => {
    setSelectedColumns(prev => {
      const idx = prev.indexOf(columnKey);
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'up' && idx > 0) {
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      } else if (direction === 'down' && idx < next.length - 1) {
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      }
      return next;
    });
  };

  const resetColumns = () => {
    setSelectedColumns([
      'select', 'studentName', 'rollNo', 'studentClass', 'totalFees', 
      'totalPaid', 'totalPending', 'totalOverdue', 'paymentStatus', 'lastPaymentDate', 'actions'
    ]);
  };
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedFeeRecord, setSelectedFeeRecord] = useState<any>(null);
  const [showBulkCollectionModal, setShowBulkCollectionModal] = useState(false);
  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Pagination and view states
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileView, setMobileView] = useState<'list' | 'grid' | 'card'>('list');
  const [isMobile, setIsMobile] = useState(false);

  // Search and analytics
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchAnalytics, setSearchAnalytics] = useState({
    totalSearches: 0,
    averageResults: 0,
    recentSearches: [] as string[]
  });

  // AI Search Handler
  const handleAISearch = (query: string) => {
    // Update search analytics
    setSearchAnalytics(prev => ({
      ...prev,
      totalSearches: prev.totalSearches + 1,
      recentSearches: [query, ...prev.recentSearches.slice(0, 4)]
    }));
  };

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Persist selectedColumns to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fees-page-selectedColumns', JSON.stringify(selectedColumns));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [selectedColumns]);

  // Live statistics derived from studentFeeSummaries (always fresh)
  const calculateStatistics = () => {
    const totalFees = studentFeeSummaries.reduce((sum, s) => sum + (s.totalFees || 0), 0);
    const collectedFees = studentFeeSummaries.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
    const pendingFees = studentFeeSummaries.reduce((sum, s) => sum + (s.totalPending || 0), 0);
    const overdueFees = studentFeeSummaries.reduce((sum, s) => sum + (s.totalOverdue || 0), 0);
    return {
      totalFees,
      collectedFees,
      pendingFees,
      overdueFees,
      collectionRate: totalFees > 0 ? (collectedFees / totalFees) * 100 : 0,
    };
  };

  // Filter fee records based on current filters
  const filteredFeeRecords = feeRecords.filter(record => {
    if (selectedClass !== 'all' && record.student?.class !== selectedClass) return false;
    if (selectedStatus !== 'all' && record.status !== selectedStatus) return false;
    if (debouncedSearchTerm && !record.student?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) return false;
    return true;
  });

  // Enhanced filtering with AI search capabilities
  const filteredStudentSummaries = studentFeeSummaries.filter(student => {
    let matchesSearch = true;
    
    if (debouncedSearchTerm) {
      const lowerQuery = debouncedSearchTerm.toLowerCase();
      
      // Basic text matching
      const basicMatch = student.studentName.toLowerCase().includes(lowerQuery) ||
        student.rollNo.toLowerCase().includes(lowerQuery) ||
        student.studentClass.toLowerCase().includes(lowerQuery);
      
      // AI-powered semantic matching
      const aiMatch = 
        // Fee status queries
        (lowerQuery.includes('pending') && student.totalPending > 0) ||
        (lowerQuery.includes('overdue') && student.paymentStatus === 'overdue') ||
        (lowerQuery.includes('paid') && student.paymentStatus === 'fully_paid') ||
        (lowerQuery.includes('partial') && student.paymentStatus === 'partially_paid') ||
        
        // Amount-based queries
        (lowerQuery.includes('> 50000') && student.totalFees > 50000) ||
        (lowerQuery.includes('> 100000') && student.totalFees > 100000) ||
        (lowerQuery.includes('high') && student.totalFees > 75000) ||
        (lowerQuery.includes('low') && student.totalFees < 30000) ||
        
        // Class-specific queries
        (lowerQuery.includes('class 10') && student.studentClass === '10') ||
        (lowerQuery.includes('class 12') && student.studentClass === '12') ||
        
        // Payment-related queries
        (lowerQuery.includes('defaulter') && student.totalPending > 0) ||
        (lowerQuery.includes('scholarship') && student.discountApplied > 0) ||
        (lowerQuery.includes('transport') && student.totalFees > 60000) ||
        
        // Time-based queries
        (lowerQuery.includes('this month') && student.lastPaymentDate && 
         new Date(student.lastPaymentDate).getMonth() === new Date().getMonth()) ||
        
        // Risk assessment
        (lowerQuery.includes('risk') && student.paymentStatus === 'overdue') ||
        (lowerQuery.includes('good') && student.paymentStatus === 'fully_paid');
      
      matchesSearch = basicMatch || aiMatch;
    }
    
    const matchesClass = selectedClass === 'all' || student.studentClass === selectedClass;
    const matchesStatus = selectedStatus === 'all' || student.paymentStatus === selectedStatus;
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Bulk operations
  const [bulkOperationType, setBulkOperationType] = useState<'collect' | 'discount' | 'reminder' | 'export' | 'delete'>('collect');
  const [bulkOperationData, setBulkOperationData] = useState({
    amount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    message: '',
    paymentMethod: 'cash' as 'cash' | 'online' | 'cheque' | 'bank_transfer'
  });
  const [bulkOperationProgress, setBulkOperationProgress] = useState({
    current: 0,
    total: 0,
    status: 'idle' as 'idle' | 'processing' | 'completed' | 'error',
    errors: [] as string[]
  });

  // Dashboard widgets state
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [recentActivities, setRecentActivities] = useState<{ id: number; type: string; message: string; time: string; icon: string }[]>([]);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load fee data from API
  useEffect(() => {
    const loadFeeData = async () => {
      try {
        setIsLoading(true);
        
        // Load all data in parallel
        const [feeStructuresResponse, feeRecordsResponse, discountsResponse, studentsResponse, paymentsResponse] = await Promise.all([
          feeStructuresApi.list(),
          feeRecordsApi.list(),
          discountsApi.list(),
          studentsApi.list({ pageSize: 1000 }),
          paymentsApi.list()
        ]);
        
        // Extract arrays from API responses
        const feeStructuresData = feeStructuresResponse?.structures || [];
        const feeRecordsData = feeRecordsResponse?.records || [];
        const discountsData = discountsResponse?.discounts || discountsResponse || [];
        const studentsData = studentsResponse?.students || [];
        
        setFeeStructures(feeStructuresData);
        setFeeRecords(feeRecordsData);
        setDiscounts(discountsData);
        
        // Set fee collections from payments data
        const paymentsData = paymentsResponse?.payments || [];
        setFeeCollections(paymentsData);
        
        // Calculate student fee summaries using pre-aggregated fee data from students API
        if (studentsData.length > 0) {
          const summaries = studentsData.map((student: any) => {
            const fees = student.fees || {};
            const totalFees = fees.total || 0;
            const totalPaid = fees.paid || 0;
            const totalPending = fees.pending || 0;
            const lastPaymentDate = fees.lastPaymentDate || '';

            // Also compute overdue from raw fee records if available
            const studentRecords = feeRecordsData.filter((r: any) => r.studentId === student.id);
            const totalOverdue = studentRecords
              .filter((r: any) => r.status === 'overdue')
              .reduce((sum: number, r: any) => sum + (r.pendingAmount || 0), 0);

            let paymentStatus: 'fully_paid' | 'partially_paid' | 'no_payment' | 'overdue';
            if (totalOverdue > 0) {
              paymentStatus = 'overdue';
            } else if (totalPaid === 0) {
              paymentStatus = 'no_payment';
            } else if (totalPaid >= totalFees) {
              paymentStatus = 'fully_paid';
            } else {
              paymentStatus = 'partially_paid';
            }

            return {
              studentId: student.id,
              studentName: student.name,
              studentClass: student.class,
              section: student.section || '',
              rollNo: student.rollNo || '',
              totalFees,
              totalPaid,
              totalPending,
              totalOverdue,
              feeRecords: studentRecords,
              lastPaymentDate,
              paymentStatus,
              discountApplied: 0,
              netPayable: totalFees,
              concession: 0,
              medium: student.languageMedium || '',
              parentName: student.fatherName || student.motherName || '',
              parentPhone: student.fatherPhone || student.motherPhone || '',
              admissionNo: student.admissionNo || '',
              dueDate: studentRecords[0]?.dueDate || '',
              paymentMode: studentRecords.find((r: any) => r.paidDate)?.paymentMethod || '',
              receiptNo: studentRecords.find((r: any) => r.paidDate)?.receiptNumber || '',
              fineAmount: 0
            } as StudentFeeSummary;
          });

          setStudentFeeSummaries(summaries);
        }
        
        setIsClient(true);
      } catch (error) {
        console.error('Error loading fee data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFeeData();
  }, []);

  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form states
  const [feeStructureForm, setFeeStructureForm] = useState<Partial<FeeStructure>>({
    name: '',
    category: 'tuition',
    amount: 0,
    frequency: 'monthly',
    dueDate: 1,
    lateFee: 0,
    description: '',
    applicableClasses: [],
    applicableCategories: [],
    isActive: true
  });

  return {
    router,
    activeTab, setActiveTab,
    theme, setTheme,
    isClient, setIsClient,
    feeStructures, setFeeStructures,
    feeRecords, setFeeRecords,
    feeCollections, setFeeCollections,
    discounts, setDiscounts,
    selectedStudents, setSelectedStudents,
    studentFeeSummaries, setStudentFeeSummaries,
    filteredStudentSummaries,
    filteredFeeRecords,
    calculateStatistics,
    showAdvancedFilters, setShowAdvancedFilters,
    advancedFilters, setAdvancedFilters,
    showColumnSettings, setShowColumnSettings,
    showBulkOperations, setShowBulkOperations,
    showFeeStructureModal, setShowFeeStructureModal,
        showDiscountModal, setShowDiscountModal,
    showReceiptModal, setShowReceiptModal,
    selectedFeeRecord, setSelectedFeeRecord,
    showBulkCollectionModal, setShowBulkCollectionModal,
    showBulkDiscountModal, setShowBulkDiscountModal,
    showImportModal, setShowImportModal,
    showExportModal, setShowExportModal,
    pageSize, setPageSize,
    currentPage, setCurrentPage,
    mobileView, setMobileView,
    isMobile, setIsMobile,
    selectedColumns, setSelectedColumns,
    columnSettings, toggleColumn, resetColumns, moveColumn, reorderColumns,
    searchTerm, setSearchTerm,
    debouncedSearchTerm,
    selectedClass, setSelectedClass,
    selectedStatus, setSelectedStatus,
    showAISuggestions, setShowAISuggestions,
    handleAISearch,
    searchAnalytics, setSearchAnalytics,
    isLoading, setIsLoading,
    bulkOperationType, setBulkOperationType,
    bulkOperationData, setBulkOperationData,
    bulkOperationProgress, setBulkOperationProgress,
    dashboardCollapsed, setDashboardCollapsed,
    showDashboard, setShowDashboard,
    recentActivities, setRecentActivities,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    feeStructureForm, setFeeStructureForm,
      };
}
