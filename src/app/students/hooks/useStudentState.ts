// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMotionValue, useSpring } from 'framer-motion';
import { Student } from '../types';
import { useDomainState } from './useDomainState';
import { studentsApi } from '@/lib/apiClient';
import { isArchivedStudentStatus } from '@/lib/studentStatus';

export function useStudentState(activeTab: string = 'students') {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedMedium, setSelectedMedium] = useState('all');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAttendanceRange, setSelectedAttendanceRange] = useState('all');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('all');
  const [includeArchivedStudents, setIncludeArchivedStudents] = useState(false);
  
  // Advanced Search State
  const [advancedSearch, setAdvancedSearch] = useState({
    enabled: false,
    query: '',
    fuzzyThreshold: 0.7,
    searchFields: ['name', 'fatherName', 'motherName', 'rollNo', 'city', 'state', 'pinCode'],
    recommendations: [] as Student[],
    searchHistory: [] as string[],
    isSearching: false,
    searchAnalytics: {
      totalSearches: 0,
      averageResults: 0,
      popularQueries: [] as { query: string; count: number }[]
    }
  });

  // Bulk Operations State
  const [bulkOperations, setBulkOperations] = useState({
    showImportModal: false,
    showExportModal: false,
    importFile: null as File | null,
    importProgress: 0,
    importStatus: 'idle' as 'idle' | 'processing' | 'success' | 'error',
    importErrors: [] as string[],
    importResults: {
      total: 0,
      successful: 0,
      failed: 0,
      duplicates: 0
    },
    exportFormat: 'csv' as 'csv' | 'excel',
    exportFields: [
      'id', 'name', 'email', 'class', 'rollNo', 'phone', 'grade', 'status',
      'admissionNo', 'dateOfBirth', 'gender', 'address', 'parentName', 'parentPhone',
      'enrollmentDate', 'board', 'section', 'bloodGroup', 'attendance', 'academics'
    ],
    bulkAction: '' as 'delete' | 'update' | 'export',
    bulkActionProgress: 0,
    bulkActionStatus: 'idle' as 'idle' | 'processing' | 'success' | 'error'
  });

  // Domain-specific state (document, communication, attendance, academic, fee, parent)
  const domainState = useDomainState();
  const { setIsClient, setMousePosition } = domainState;

  // Motion values for mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Client-side initialization and mouse tracking
  useEffect(() => {
    setIsClient(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Dashboard State
  const [showDashboard, setShowDashboard] = useState(true);
  
  // Bulk Operations State
  const [showBulkOperationModal, setShowBulkOperationModal] = useState(false);
  const [bulkOperationType, setBulkOperationType] = useState<'promote' | 'update_status' | 'assign_fees' | 'send_message' | 'delete' | 'export'>('promote');
  const [bulkOperationData, setBulkOperationData] = useState({
    targetClass: '',
    targetSection: '',
    targetStatus: '',
    feeAmount: '',
    message: '',
    exportFields: [] as string[]
  });
  const [bulkOperationProgress, setBulkOperationProgress] = useState({
    current: 0,
    total: 0,
    status: 'idle' as 'idle' | 'processing' | 'completed' | 'error',
    errors: [] as string[]
  });
  
  // Pagination & Table State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Helper to get current user identifier
  const getCurrentUserKey = () => {
    if (typeof window === 'undefined') return 'anonymous';
    try {
      // Try to get user from session storage or localStorage
      const user = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        // Handle null/undefined email with multiple fallbacks
        return parsedUser.email?.trim() || 
               parsedUser.id?.toString()?.trim() || 
               parsedUser.name?.trim() || 
               parsedUser.role?.trim() || 
               'anonymous';
      }
      return 'anonymous';
    } catch {
      return 'anonymous';
    }
  };

  // Column Customization State with user-specific localStorage persistence
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const defaultColumns = [
      'select', 'photo', 'admissionNo', 'rollNo', 'name', 'parents', 'phoneNumbers',
      'class', 'attendance', 'status', 'actions'
    ];
    
    if (typeof window === 'undefined') return defaultColumns;
    
    try {
      // Get current user email for user-specific storage
      const userKey = getCurrentUserKey();
      const saved = localStorage.getItem(`students-page-visibleColumns-${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Force include phoneNumbers if not present
        if (!parsed.includes('phoneNumbers')) {
          const updated = [...parsed];
          // Insert phoneNumbers after parents
          const parentsIndex = updated.indexOf('parents');
          if (parentsIndex !== -1) {
            updated.splice(parentsIndex + 1, 0, 'phoneNumbers');
          } else {
            updated.push('phoneNumbers');
          }
          // Save updated config
          localStorage.setItem(`students-page-visibleColumns-${userKey}`, JSON.stringify(updated));
          return updated;
        }
        return parsed;
      }
      return defaultColumns;
    } catch {
      return defaultColumns;
    }
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columnSettings, setColumnSettings] = useState({
    availableColumns: [
      { key: 'select', label: 'Select', fixed: true },
      { key: 'photo', label: 'Photo', fixed: false },
      { key: 'admissionNo', label: 'Admission No', fixed: false },
      { key: 'admissionDate', label: 'Admission Date', fixed: false },
      { key: 'rollNo', label: 'Roll No', fixed: false },
      { key: 'name', label: 'Name', fixed: true },
      { key: 'dateOfBirth', label: 'Date of Birth', fixed: false },
      { key: 'gender', label: 'Gender', fixed: false },
      { key: 'bloodGroup', label: 'Blood Group', fixed: false },
      { key: 'category', label: 'Category', fixed: false },
      { key: 'religion', label: 'Religion', fixed: false },
      { key: 'parents', label: 'Parents', fixed: false },
      { key: 'phoneNumbers', label: 'Phone Numbers', fixed: false },
      { key: 'fatherPhone', label: "Father's Phone", fixed: false },
      { key: 'motherPhone', label: "Mother's Phone", fixed: false },
      { key: 'class', label: 'Class / Section', fixed: false },
      { key: 'medium', label: 'Medium', fixed: false },
      { key: 'board', label: 'Board', fixed: false },
      { key: 'phone', label: 'Student Phone', fixed: false },
      { key: 'email', label: 'Email', fixed: false },
      { key: 'address', label: 'Address', fixed: false },
      { key: 'city', label: 'City', fixed: false },
      { key: 'state', label: 'State', fixed: false },
      { key: 'aadharNumber', label: 'Aadhar No', fixed: false },
      { key: 'stsId', label: 'STS ID', fixed: false },
      { key: 'transport', label: 'Transport', fixed: false },
      { key: 'hostel', label: 'Hostel', fixed: false },
      { key: 'attendance', label: 'Attendance', fixed: false },
      { key: 'fees', label: 'Fee Status', fixed: false },
      { key: 'grade', label: 'Grade / GPA', fixed: false },
      { key: 'status', label: 'Status', fixed: false },
      { key: 'actions', label: 'Actions', fixed: true },
    ]
  });
  
  // Promotion State
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionMode, setPromotionMode] = useState<'single' | 'bulk' | 'class'>('bulk');
  const [promotionSingleStudentId, setPromotionSingleStudentId] = useState<string | undefined>(undefined);
  const [promotionFromClass, setPromotionFromClass] = useState<string | undefined>(undefined);
  const [promotionFromSection, setPromotionFromSection] = useState<string | undefined>(undefined);

  // Mobile Responsiveness State
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'grid' | 'card'>('list');

  // Mobile responsiveness detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dashboard no longer calculates stats here - fetched from API

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadStudents = async (
    page = currentPage,
    size = pageSize,
    search = searchTerm,
    cls = selectedClass,
    status = selectedStatus,
    gender = selectedGender,
    includeArchived = includeArchivedStudents,
  ) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, pageSize: size };
      if (search) params.search = search;
      
      // Parse composite class key: "className|mediumName" -> send only className to API
      if (cls && cls !== 'all') {
        const className = cls.includes('|') ? cls.split('|')[0] : cls;
        params.class = className;
      }
      
      if (status && status !== 'all') params.status = status;
      if (gender && gender !== 'all') params.gender = gender;
      params.includeArchived = includeArchived ? 'true' : 'false';

      const data = await studentsApi.list(params);
      setStudents(data.students || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load - only for students tab
  useEffect(() => { 
    if (activeTab === 'students') {
      loadStudents(1, pageSize, searchTerm, selectedClass, selectedStatus, selectedGender, includeArchivedStudents); 
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents(1, pageSize, searchTerm, selectedClass, selectedStatus, selectedGender, includeArchivedStudents);
    }
  }, [includeArchivedStudents, activeTab]);

  // Reload when filters change (debounced) - only for students tab
  useEffect(() => {
    if (activeTab === 'students') {
      const t = setTimeout(() => loadStudents(1, pageSize, searchTerm, selectedClass, selectedStatus, selectedGender, includeArchivedStudents), 300);
      return () => clearTimeout(t);
    }
  }, [searchTerm, selectedClass, selectedStatus, selectedGender, includeArchivedStudents, activeTab]);

  // Reload when page or pageSize changes - only for students tab
  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents(currentPage, pageSize, searchTerm, selectedClass, selectedStatus, selectedGender, includeArchivedStudents);
    }
  }, [currentPage, pageSize, includeArchivedStudents, activeTab]);

  // Persist visibleColumns to user-specific localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userKey = getCurrentUserKey();
        localStorage.setItem(`students-page-visibleColumns-${userKey}`, JSON.stringify(visibleColumns));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [visibleColumns]);

  return {
    ...domainState,
    router,
    students, setStudents,
    total, loading, loadStudents,
    searchTerm, setSearchTerm,
    selectedClass, setSelectedClass,
    selectedStatus, setSelectedStatus,
    selectedGender, setSelectedGender,
    selectedLanguage, setSelectedLanguage,
    selectedMedium, setSelectedMedium,
    selectedBloodGroup, setSelectedBloodGroup,
    selectedCategory, setSelectedCategory,
    selectedAttendanceRange, setSelectedAttendanceRange,
    selectedFeeStatus, setSelectedFeeStatus,
    includeArchivedStudents, setIncludeArchivedStudents,
    advancedSearch, setAdvancedSearch,
    bulkOperations, setBulkOperations,
    showDashboard, setShowDashboard,
    showBulkOperationModal, setShowBulkOperationModal,
    bulkOperationType, setBulkOperationType,
    bulkOperationData, setBulkOperationData,
    bulkOperationProgress, setBulkOperationProgress,
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    totalPages, setTotalPages,
    sortConfig, setSortConfig,
    visibleColumns, setVisibleColumns,
    showColumnSettings, setShowColumnSettings,
    columnSettings, setColumnSettings,
    isMobile, setIsMobile,
    sidebarOpen, setSidebarOpen,
    mobileView, setMobileView,
    mouseX, mouseY,
    showPromotionModal, setShowPromotionModal,
    promotionMode, setPromotionMode,
    promotionSingleStudentId, setPromotionSingleStudentId,
    promotionFromClass, setPromotionFromClass,
    promotionFromSection, setPromotionFromSection,
  };
}
