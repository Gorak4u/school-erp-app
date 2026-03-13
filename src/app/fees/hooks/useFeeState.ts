// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from '../types';

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

  // Column settings
  const [selectedColumns, setSelectedColumns] = useState([
    'select', 'studentName', 'rollNo', 'studentClass', 'totalFees', 
    'totalPaid', 'totalPending', 'totalOverdue', 'paymentStatus', 'lastPaymentDate', 'actions'
  ]);
  
  const columnSettings = {
    availableColumns: [
      { key: 'select', label: 'Select', fixed: true },
      { key: 'studentName', label: 'Student Name', fixed: true },
      { key: 'rollNo', label: 'Roll No', fixed: false },
      { key: 'studentClass', label: 'Class', fixed: false },
      { key: 'totalFees', label: 'Total Fees', fixed: false },
      { key: 'totalPaid', label: 'Paid Amount', fixed: false },
      { key: 'totalPending', label: 'Pending Amount', fixed: false },
      { key: 'totalOverdue', label: 'Overdue Amount', fixed: false },
      { key: 'paymentStatus', label: 'Payment Status', fixed: false },
      { key: 'lastPaymentDate', label: 'Last Payment Date', fixed: false },
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

  const resetColumns = () => {
    setSelectedColumns([
      'select', 'studentName', 'rollNo', 'studentClass', 'totalFees', 
      'totalPaid', 'totalPending', 'totalOverdue', 'paymentStatus', 'lastPaymentDate', 'actions'
    ]);
  };
  const [showFeeStructureModal, setShowFeeStructureModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
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
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
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

  // Enhanced filtering with AI search capabilities
  const filteredStudentSummaries = studentFeeSummaries.filter(student => {
    let matchesSearch = true;
    
    if (searchTerm) {
      const lowerQuery = searchTerm.toLowerCase();
      
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
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, type: 'payment', message: 'Rahul Kumar paid tuition fee', time: '2 mins ago', icon: '💰' },
    { id: 2, type: 'overdue', message: '5 students have overdue fees', time: '15 mins ago', icon: '⚠️' },
    { id: 3, type: 'discount', message: 'Sibling discount applied to 2 students', time: '1 hour ago', icon: '🎁' },
    { id: 4, type: 'collection', message: 'Daily collection target achieved', time: '2 hours ago', icon: '✅' }
  ]);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const [collectionForm, setCollectionForm] = useState({
    studentId: '',
    feeStructureId: '',
    amount: 0,
    paymentMethod: 'cash' as const,
    transactionId: '',
    remarks: ''
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
    showAdvancedFilters, setShowAdvancedFilters,
    advancedFilters, setAdvancedFilters,
    showColumnSettings, setShowColumnSettings,
    showBulkOperations, setShowBulkOperations,
    showFeeStructureModal, setShowFeeStructureModal,
    showCollectionModal, setShowCollectionModal,
    showDiscountModal, setShowDiscountModal,
    showReceiptModal, setShowReceiptModal,
    showBulkCollectionModal, setShowBulkCollectionModal,
    showBulkDiscountModal, setShowBulkDiscountModal,
    showImportModal, setShowImportModal,
    showExportModal, setShowExportModal,
    pageSize, setPageSize,
    currentPage, setCurrentPage,
    mobileView, setMobileView,
    isMobile, setIsMobile,
    selectedColumns, setSelectedColumns,
    columnSettings, toggleColumn, resetColumns,
    searchTerm, setSearchTerm,
    selectedClass, setSelectedClass,
    selectedStatus, setSelectedStatus,
    showAISuggestions, setShowAISuggestions,
    handleAISearch,
    searchAnalytics, setSearchAnalytics,
    bulkOperationType, setBulkOperationType,
    bulkOperationData, setBulkOperationData,
    bulkOperationProgress, setBulkOperationProgress,
    dashboardCollapsed, setDashboardCollapsed,
    showDashboard, setShowDashboard,
    recentActivities, setRecentActivities,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    feeStructureForm, setFeeStructureForm,
    collectionForm, setCollectionForm,
  };
}
