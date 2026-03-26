'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { Student } from './types';
import { useStudentState } from './hooks/useStudentState';
import { useTheme } from '@/contexts/ThemeContext';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { studentsApi, academicYearsApi, classesApi, sectionsApi } from '@/lib/apiClient';
import { usePermissions } from '@/hooks/usePermissions';

// Modern Icons
import {
  TrendingUp,
  Users,
  GraduationCap,
  DollarSign,
  PieChart,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  X,
  Wallet,
  TrendingDown,
  Target,
  BarChart3,
  Receipt,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Archive,
  Settings,
  Bell,
  FilterX,
  Zap,
  Shield,
  Award,
  Briefcase,
  Calculator,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Award as AwardIcon,
  UserCheck,
  Users2,
  Star,
  TrendingUp as TrendingUpIcon,
  User as UserIcon,
  AlertTriangle,
  Lock,
  Unlock,
  School
} from 'lucide-react';

import { createSearchHandlers } from './handlers/searchHandlers';
import { createActionsHandlers } from './handlers/actionsHandlers';
import { createMobileHandlers } from './handlers/mobileHandlers';
import { createDocumentHandlers } from './handlers/documentHandlers';
import { createTrackingHandlers } from './handlers/trackingHandlers';
import { createFeeHandlers } from './handlers/feeHandlers';

import StudentForm from './components/StudentForm';
import StudentDashboard from './components/StudentDashboard';
import StudentFilters from './components/StudentFilters';
import StudentTable from './components/StudentTable';
import ImportModal from './components/ImportModal';
import ExportModal from './components/ExportModal';
import DocumentModal from './components/DocumentModal';
import CommunicationModal from './components/CommunicationModal';
import AttendanceModal from './components/AttendanceModal';
import AcademicModal from './components/AcademicModal';
import FeeModal from './components/FeeModal';
import StudentProfileModalRefactored from './components/StudentProfileModalRefactored';
import BulkOperationsModal from './components/BulkOperationsModal';
import ColumnSettingsModal from './components/ColumnSettingsModal';
import SaveFilterModal from './components/SaveFilterModal';
import PromotionModal from './components/PromotionModal';
import ExitStudentModal from './components/ExitStudentModal';
import SearchPerformanceMonitor from '../shared/search/components/SearchPerformanceMonitor';
import { StudentSearchEngine } from './search/StudentSearchEngine';

// Type definitions for student context
interface StudentContext {
  // State properties from useStudentState
  getSetting: (group: string, key: string, defaultValue?: string) => string;
  // Handler methods
  search?: unknown;
  actions?: unknown;
  mobile?: unknown;
  document?: unknown;
  tracking?: unknown;
  fee?: unknown;
  // Allow additional properties
  [key: string]: unknown;
}

// Modern Constants
const STUDENT_TABS = [
  { 
    id: 'overview', 
    label: 'Overview', 
    icon: TrendingUp, 
    description: 'Student dashboard and analytics',
    gradient: 'from-blue-500 to-cyan-600'
  },
  { 
    id: 'students', 
    label: 'Students', 
    icon: Users, 
    description: 'Manage student records',
    gradient: 'from-emerald-500 to-teal-600'
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: BarChart3, 
    description: 'Performance and attendance analytics',
    gradient: 'from-purple-500 to-pink-600'
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: FileText, 
    description: 'Student reports and documents',
    gradient: 'from-orange-500 to-red-600'
  },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings, 
    description: 'Student management settings',
    gradient: 'from-indigo-500 to-purple-600'
  },
];

export default function StudentsPageRefactored() {
  const { theme } = useTheme();
  const { hasPermission, isAdmin } = usePermissions();
  const { getSetting } = useSchoolConfig();
  const canCreateStudents = isAdmin || hasPermission('create_students');
  const canEditStudents = isAdmin || hasPermission('edit_students');
  const canDeleteStudents = isAdmin || hasPermission('delete_students');
  const canPromoteStudents = isAdmin || hasPermission('promote_students');
  const canManageStudentBulk = canCreateStudents || canEditStudents || canDeleteStudents || canPromoteStudents;
  const isDark = theme === 'dark';
  
  // Modern theme configuration
  const themeConfig = useMemo(() => ({
    bg: isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-white via-gray-50 to-white',
    border: isDark ? 'border-gray-700/50' : 'border-gray-200/50',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      muted: isDark ? 'text-gray-500' : 'text-gray-500',
      accent: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    card: isDark 
      ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-sm' 
      : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200/50 backdrop-blur-sm',
    input: isDark 
      ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20' 
      : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20',
    button: {
      primary: isDark 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25' 
        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25',
      secondary: isDark 
        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50 hover:border-gray-500/50' 
        : 'bg-white/50 hover:bg-gray-100/50 text-gray-700 border-gray-300/50 hover:border-gray-400/50',
      danger: isDark 
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25' 
        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25',
      success: isDark 
        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25' 
        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25',
    },
    gradients: {
      primary: 'from-blue-500 to-cyan-600',
      secondary: 'from-purple-500 to-pink-600',
      success: 'from-green-500 to-emerald-600',
      warning: 'from-orange-500 to-red-600',
      danger: 'from-red-500 to-pink-600',
      info: 'from-indigo-500 to-purple-600',
    }
  }), [isDark]);

  // Helper functions
  const getCardClass = () => themeConfig.card;
  const getInputClass = () => themeConfig.input;
  const getBtnClass = (type: 'primary' | 'secondary' | 'danger' | 'success' = 'primary') => themeConfig.button[type];
  const getTextClass = (type: 'primary' | 'secondary' | 'muted' | 'accent' = 'primary') => themeConfig.text[type];

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Error/Success states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const state = useStudentState();
  
  // Create context with school config
  const ctx: StudentContext = { ...state, getSetting };

  Object.assign(ctx, createSearchHandlers(ctx));
  Object.assign(ctx, createActionsHandlers(ctx));
  Object.assign(ctx, createMobileHandlers(ctx));
  Object.assign(ctx, createDocumentHandlers(ctx));
  Object.assign(ctx, createTrackingHandlers(ctx));
  Object.assign(ctx, createFeeHandlers(ctx));

  // Destructure for JSX
  const {
    academicPerformance,
    activeTab: ctxActiveTab,
    advancedFilters,
    advancedSearch,
    analyzePerformance,
    applySavedFilter,
    attendanceFilter,
    attendanceTracking,
    bulkMarkAttendance,
    bulkOperationData,
    bulkOperationProgress,
    bulkOperationType,
    bulkOperations,
    calculateAttendancePercentage,
    calculateEstimatedCost,
    calculateExpiryDate,
    calculateGPA,
    calculateGrade,
    calculateLateFee,
    calculateRelevanceScore,
    checkGeofence,
    clearAdvancedFilters,
    columnSettings,
    communicationCenter,
    createAttendanceNotification,
    createInstallmentPlan,
    createParentAccount,
    currentPage,
    dashboardStats,
    deleteDocument,
    deleteSavedFilter,
    documentManagement,
    downloadDocument,
    downloadTemplate,
    editingStudent,
    evaluateCondition,
    executeBulkOperation,
    exportAllFilteredStudents,
    exportSelectedStudents,
    exportStudentData,
    exportStudents,
    exportStudentsLegacy,
    extractTags,
    feeManagement,
    filterName,
    formatFileSize,
    fuzzyMatch,
    generateAcademicReport,
    generateAttendanceReport,
    generateFeeReport,
    generateTrendAnalysis,
    getAttendanceStats,
    getFeeStatusColor,
    getFileType,
    getFilteredDocuments,
    getFilteredTemplates,
    getNotificationPriorityColor,
    getPaymentGatewayFees,
    getPerformanceColor,
    getRecipientCount,
    getRecipients,
    getStoragePercentage,
    handleAddStudent,
    handleDeleteStudent,
    handleEditStudent,
    handleFileImport,
    handleFileUpload,
    handleSendMessage,
    handleSort,
    isClient,
    isMobile,
    logParentActivity,
    markAttendance,
    mobileView,
    mousePosition,
    pageSize,
    parentPortal,
    parseTime,
    performAdvancedSearch,
    performBulkAction,
    personalizeMessage,
    printStudentProfile,
    printStudents,
    processPayment,
    pushRealTimeUpdate,
    renderMobileGridView,
    renderMobileListView,
    renderMobileStudentCard,
    resetColumns,
    saveCurrentFilter,
    savedFilters,
    searchTerm,
    selectTemplate,
    selectedClass,
    selectedGender,
    selectedLanguage,
    selectedStatus,
    includeArchivedStudents,
    selectedStudent,
    selectedStudents,
    sendAutomatedReminders,
    sendBulkSMS,
    sendMessage,
    sendParentNotification,
    sendPaymentConfirmation,
    sendStudentSMS,
    setAcademicPerformance,
    setActiveTab: ctxSetActiveTab,
    setAdvancedFilters,
    setAdvancedSearch,
    setAttendanceFilter,
    setAttendanceTracking,
    setBulkOperationData,
    setBulkOperationProgress,
    setBulkOperationType,
    setBulkOperations,
    setColumnSettings,
    setCommunicationCenter,
    setCurrentPage,
    setDashboardStats,
    setDocumentManagement,
    setEditingStudent,
    setFeeManagement,
    setFilterName,
    setIsClient,
    setIsMobile,
    setMobileView,
    setMousePosition,
    setPageSize,
    setParentPortal,
    setSavedFilters,
    setSearchTerm,
    setSelectedClass,
    setSelectedGender,
    setSelectedLanguage,
    setSelectedStatus,
    setIncludeArchivedStudents,
    setSelectedStudent,
    setSelectedStudents,
    setShowAddModal,
    setShowAdvancedFilters,
    setShowBulkOperationModal,
    setShowColumnSettings,
    setShowDashboard,
    setShowSaveFilterModal,
    setShowStudentDetails,
    setSidebarOpen,
    setSortConfig,
    setStudents,
    setTotalPages,
    setVisibleColumns,
    shareDocument,
    showAddModal,
    showAdvancedFilters,
    showBulkOperationModal,
    showColumnSettings,
    showDashboard,
    showSaveFilterModal,
    showStudentDetails,
    sidebarOpen,
    sortConfig,
    students,
    toggleAllStudentsSelection,
    toggleColumn,
    moveColumn,
    reorderColumns,
    toggleStudentSelection,
    totalPages,
    triggerAttendanceNotification,
    triggerFeeNotification,
    triggerGradeNotification,
    updateDocument,
    validateAndImportData,
    validateFile,
    validateMessage,
    visibleColumns,
    showPromotionModal, setShowPromotionModal,
    promotionMode, setPromotionMode,
    promotionSingleStudentId, setPromotionSingleStudentId,
    promotionFromClass, setPromotionFromClass,
    promotionFromSection, setPromotionFromSection,
    loadStudents,
  } = ctx as any;

  // Sync tab state with context
  useEffect(() => {
    if (ctxActiveTab !== activeTab) {
      ctxSetActiveTab(activeTab);
    }
  }, [activeTab, ctxActiveTab, ctxSetActiveTab]);

  // Create properly typed handlers
  const handlePromoteBulk = (() => { setPromotionMode('bulk'); setShowPromotionModal(true); }) as () => void;
  const handlePromoteClass = ((cls: string, section: string) => { setPromotionMode('class'); setPromotionFromClass(cls); setPromotionFromSection(section); setShowPromotionModal(true); }) as (cls: string, section: string) => void;
  const handlePromoteSingle = ((studentId: string) => { setPromotionMode('single'); setPromotionSingleStudentId(studentId); setShowPromotionModal(true); }) as (studentId: string) => void;

  // filteredStudents is computed in searchHandlers
  const { filteredStudents } = ctx;

  // Pagination effect (moved from handler to component level for React hooks rules)
  useEffect(() => {
    setTotalPages(Math.ceil(((filteredStudents as unknown[])?.length || 0) / pageSize));
  }, [filteredStudents, pageSize]);

  // ── Promotion count banner ──────────────────────────────────────────────────
  const [promotionCount, setPromotionCount] = useState(0);

  useEffect(() => {
    const count = (students as { needsPromotion?: boolean; status?: string }[] || []).filter((s) => s.needsPromotion || s.status === 'locked').length;
    setPromotionCount(count);
  }, [students]);

  const [showExitModal, setShowExitModal] = useState(false);
  const [exitStudentIds, setExitStudentIds] = useState<string[]>([]);

  const handleExitSingle = useCallback((studentId: string) => {
    setExitStudentIds([studentId]);
    setShowExitModal(true);
  }, []);

  const handleMarkExit = useCallback((studentIds: string[]) => {
    setExitStudentIds(studentIds);
    setShowExitModal(true);
  }, []);

  return (
    <AppLayout currentPage="students" title="Students Management">
      <div className="space-y-0 pb-6">
        {/* Modern Tabs */}
        <div className="relative">
          <div className={`flex space-x-1 p-1 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm border ${themeConfig.border}`}>
            {STUDENT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 relative overflow-hidden group ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                    : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:scale-105`
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-100`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">
                  <tab.icon className="w-4 h-4" />
                </span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Tab Description */}
          <div className="mt-4 text-center">
            <p className={`text-sm ${getTextClass('secondary')}`}>
              {STUDENT_TABS.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-2xl ${getCardClass()} border-l-4 border-red-500`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-red-600/20' : 'bg-red-100'}`}>
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className={`font-medium ${getTextClass('primary')}`}>Error</p>
                  <p className={`text-sm ${getTextClass('secondary')}`}>{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-2xl ${getCardClass()} border-l-4 border-green-500`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className={`font-medium ${getTextClass('primary')}`}>Success</p>
                  <p className={`text-sm ${getTextClass('secondary')}`}>{success}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {/* Promotion Alert Banner */}
          {promotionCount > 0 && canPromoteStudents && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${isDark ? 'from-orange-600 to-red-600' : 'from-orange-500 to-red-500'}`}>
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className={`font-semibold ${getTextClass('primary')}`}>
                      {promotionCount} student{promotionCount !== 1 ? 's' : ''} need promotion
                    </p>
                    <p className={`text-sm ${getTextClass('secondary')}`}>
                      Students from previous academic year require promotion or exit action
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setPromotionMode('class'); setShowPromotionModal(true); }}
                  className={getBtnClass('primary')}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Promote All
                </button>
              </div>
            </motion.div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <StudentDashboard 
                dashboardStats={dashboardStats} 
                filteredStudents={filteredStudents as unknown[]} 
                selectedStudents={selectedStudents as unknown as number[]} 
                setBulkOperations={setBulkOperations} 
                setShowAddModal={setShowAddModal} 
                setShowAdvancedFilters={setShowAdvancedFilters} 
                setShowBulkOperationModal={setShowBulkOperationModal} 
                setShowDashboard={setShowDashboard} 
                showAdvancedFilters={showAdvancedFilters} 
                showDashboard={showDashboard}
                students={students as any[]} 
                theme={theme} 
                canCreateStudents={canCreateStudents} 
                canManageStudentBulk={canManageStudentBulk}
                themeConfig={themeConfig}
                getCardClass={getCardClass}
                getBtnClass={getBtnClass}
                getTextClass={getTextClass}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
              />
            </motion.div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${STUDENT_TABS.find(t => t.id === 'students')?.gradient}`}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Student Management</h2>
                    <p className={`text-sm ${getTextClass('secondary')}`}>Manage student records and information</p>
                  </div>
                </div>
                {canCreateStudents && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className={getBtnClass('primary')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </button>
                )}
              </div>

              <StudentFilters 
                advancedFilters={advancedFilters} 
                advancedSearch={advancedSearch} 
                applySavedFilter={applySavedFilter} 
                attendanceFilter={attendanceFilter} 
                clearAdvancedFilters={clearAdvancedFilters} 
                deleteSavedFilter={deleteSavedFilter} 
                exportAllFilteredStudents={exportAllFilteredStudents} 
                exportSelectedStudents={exportSelectedStudents} 
                filteredStudents={filteredStudents as any[]} 
                isMobile={isMobile} 
                mobileView={mobileView} 
                pageSize={pageSize} 
                performAdvancedSearch={performAdvancedSearch} 
                savedFilters={savedFilters} 
                searchTerm={searchTerm} 
                selectedClass={selectedClass} 
                selectedGender={selectedGender} 
                selectedLanguage={selectedLanguage} 
                selectedStatus={selectedStatus} 
                selectedStudents={selectedStudents} 
                includeArchivedStudents={includeArchivedStudents} 
                setAdvancedFilters={setAdvancedFilters} 
                setAdvancedSearch={setAdvancedSearch} 
                setAttendanceFilter={setAttendanceFilter} 
                setCurrentPage={setCurrentPage} 
                setMobileView={setMobileView} 
                setPageSize={setPageSize} 
                setSearchTerm={setSearchTerm} 
                setSelectedClass={setSelectedClass} 
                setSelectedGender={setSelectedGender} 
                setSelectedLanguage={setSelectedLanguage} 
                setSelectedStatus={setSelectedStatus} 
                setSelectedStudents={setSelectedStudents} 
                setIncludeArchivedStudents={setIncludeArchivedStudents} 
                setShowAdvancedFilters={setShowAdvancedFilters} 
                setShowBulkOperationModal={setShowBulkOperationModal} 
                setShowColumnSettings={setShowColumnSettings} 
                setShowSaveFilterModal={setShowSaveFilterModal} 
                showAdvancedFilters={showAdvancedFilters} 
                showColumnSettings={showColumnSettings}
                students={students as any[]} 
                theme={theme} 
                onPromoteBulk={handlePromoteBulk} 
                onPromoteClass={handlePromoteClass} 
                canPromoteStudents={canPromoteStudents} 
                canManageStudentBulk={canManageStudentBulk}
                themeConfig={themeConfig}
                getCardClass={getCardClass}
                getInputClass={getInputClass}
                getBtnClass={getBtnClass}
                getTextClass={getTextClass}
              />

              <StudentTable 
                activeTab={ctxActiveTab} 
                currentPage={currentPage} 
                filteredStudents={filteredStudents as any[]} 
                handleDeleteStudent={handleDeleteStudent} 
                isMobile={isMobile} 
                mobileView={mobileView} 
                pageSize={pageSize} 
                selectedStudents={selectedStudents} 
                setActiveTab={setActiveTab} 
                setCurrentPage={setCurrentPage} 
                setEditingStudent={setEditingStudent} 
                setSelectedStudent={setSelectedStudent} 
                sortConfig={sortConfig} 
                setSortConfig={setSortConfig} 
                theme={theme} 
                toggleAllStudentsSelection={toggleAllStudentsSelection} 
                toggleStudentSelection={toggleStudentSelection} 
                totalPages={totalPages} 
                visibleColumns={visibleColumns} 
                columnSettings={columnSettings} 
                onPromoteSingle={handlePromoteSingle} 
                onPromoteClass={handlePromoteClass} 
                onExitSingle={handleExitSingle} 
                canEditStudents={canEditStudents} 
                canPromoteStudents={canPromoteStudents} 
                isAdmin={isAdmin}
                themeConfig={themeConfig}
                getCardClass={getCardClass}
                getBtnClass={getBtnClass}
                getTextClass={getTextClass}
              /> 
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${STUDENT_TABS.find(t => t.id === 'analytics')?.gradient}`}>
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Student Analytics</h2>
                  <p className={`text-sm ${getTextClass('secondary')}`}>Advanced analytics and insights</p>
                </div>
              </div>
              <div className={`text-center py-12 ${getCardClass()} rounded-2xl`}>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className={`text-lg font-semibold ${getTextClass('primary')} mb-2`}>Analytics Coming Soon</h3>
                <p className={`text-sm ${getTextClass('secondary')}`}>Advanced analytics will be available soon</p>
              </div>
            </motion.div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${STUDENT_TABS.find(t => t.id === 'reports')?.gradient}`}>
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Student Reports</h2>
                  <p className={`text-sm ${getTextClass('secondary')}`}>Generate and manage reports</p>
                </div>
              </div>
              <div className={`text-center py-12 ${getCardClass()} rounded-2xl`}>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className={`text-lg font-semibold ${getTextClass('primary')} mb-2`}>Reports Coming Soon</h3>
                <p className={`text-sm ${getTextClass('secondary')}`}>Advanced reporting will be available soon</p>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${STUDENT_TABS.find(t => t.id === 'settings')?.gradient}`}>
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Student Settings</h2>
                  <p className={`text-sm ${getTextClass('secondary')}`}>Configure student management settings</p>
                </div>
              </div>
              <div className={`text-center py-12 ${getCardClass()} rounded-2xl`}>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className={`text-lg font-semibold ${getTextClass('primary')} mb-2`}>Settings Coming Soon</h3>
                <p className={`text-sm ${getTextClass('secondary')}`}>Advanced settings will be available soon</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {((showAddModal && canCreateStudents) || (editingStudent && canEditStudents)) && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowAddModal(false);
              setEditingStudent(null);
            }}
          >
            <motion.div
              className={`w-[95vw] h-[95vh] max-w-6xl mx-4 rounded-2xl p-4 flex flex-col ${
                theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h2 className={`text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {editingStudent ? '📝 Edit Student' : '➕ Add Student'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStudent(null);
                  }}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 min-h-0">
                <StudentForm
                  student={editingStudent}
                  onSubmit={editingStudent ? handleEditStudent : handleAddStudent}
                  onCancel={() => {
                    setShowAddModal(false);
                    setEditingStudent(null);
                  }}
                  theme={theme}
                  themeConfig={themeConfig}
                  getCardClass={getCardClass}
                  getInputClass={getInputClass}
                  getBtnClass={getBtnClass}
                  getTextClass={getTextClass}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ImportModal bulkOperations={bulkOperations} downloadTemplate={downloadTemplate} handleFileImport={handleFileImport} setBulkOperations={setBulkOperations} theme={theme} />
      <ExportModal bulkOperations={bulkOperations} performBulkAction={performBulkAction} selectedStudents={selectedStudents} setBulkOperations={setBulkOperations} students={students} theme={theme} />
      <DocumentModal deleteDocument={deleteDocument} documentManagement={documentManagement} downloadDocument={downloadDocument} formatFileSize={formatFileSize} getFilteredDocuments={getFilteredDocuments} getStoragePercentage={getStoragePercentage} handleFileUpload={handleFileUpload} setDocumentManagement={setDocumentManagement} shareDocument={shareDocument} theme={theme} />
      <CommunicationModal calculateEstimatedCost={calculateEstimatedCost} communicationCenter={communicationCenter} getFilteredTemplates={getFilteredTemplates} getRecipientCount={getRecipientCount} handleSendMessage={handleSendMessage} selectTemplate={selectTemplate} setCommunicationCenter={setCommunicationCenter} students={students} theme={theme} />
      <AttendanceModal attendanceTracking={attendanceTracking} bulkMarkAttendance={bulkMarkAttendance} getAttendanceStats={getAttendanceStats} markAttendance={markAttendance} selectedStudents={selectedStudents} setAttendanceTracking={setAttendanceTracking} setSelectedStudents={setSelectedStudents} students={students} theme={theme} />
      <AcademicModal academicPerformance={academicPerformance} analyzePerformance={analyzePerformance} generateTrendAnalysis={generateTrendAnalysis} getPerformanceColor={getPerformanceColor} selectedStudents={selectedStudents} setAcademicPerformance={setAcademicPerformance} theme={theme} />
      <FeeModal createInstallmentPlan={createInstallmentPlan} feeManagement={feeManagement} generateFeeReport={generateFeeReport} processPayment={processPayment} selectedStudents={selectedStudents} sendAutomatedReminders={sendAutomatedReminders} setFeeManagement={setFeeManagement} students={students} theme={theme} />
      <StudentProfileModalRefactored
        activeTab={activeTab} printStudentProfile={printStudentProfile} selectedStudent={selectedStudent}
        sendStudentSMS={sendStudentSMS} setAcademicPerformance={setAcademicPerformance} setActiveTab={setActiveTab}
        setAttendanceTracking={setAttendanceTracking} setCommunicationCenter={setCommunicationCenter}
        setEditingStudent={setEditingStudent} setFeeManagement={setFeeManagement} setParentPortal={setParentPortal}
        setSelectedStudent={setSelectedStudent} theme={theme} students={students}
        includeArchivedStudents={includeArchivedStudents}
        feeManagement={feeManagement} attendanceTracking={attendanceTracking} communicationCenter={communicationCenter} parentPortal={parentPortal}
        canEditStudents={canEditStudents}
        canPromoteStudents={canPromoteStudents}
        onPromoteSingle={(studentId: string) => { setPromotionMode('single'); setPromotionSingleStudentId(studentId); setShowPromotionModal(true); }}
        onMarkExit={handleMarkExit}
        isAdmin={isAdmin}
      />
      <BulkOperationsModal bulkOperationData={bulkOperationData} bulkOperationProgress={bulkOperationProgress} bulkOperationType={bulkOperationType} executeBulkOperation={executeBulkOperation} selectedStudents={selectedStudents} setBulkOperationData={setBulkOperationData} setBulkOperationType={setBulkOperationType} setShowBulkOperationModal={setShowBulkOperationModal} showBulkOperationModal={showBulkOperationModal} students={students} theme={theme} />
      <ColumnSettingsModal columnSettings={columnSettings} resetColumns={resetColumns} setShowColumnSettings={setShowColumnSettings} showColumnSettings={showColumnSettings} theme={theme} toggleColumn={toggleColumn} visibleColumns={visibleColumns} moveColumn={moveColumn} reorderColumns={reorderColumns} />
      <SaveFilterModal filterName={filterName} saveCurrentFilter={saveCurrentFilter} setFilterName={setFilterName} setShowSaveFilterModal={setShowSaveFilterModal} showSaveFilterModal={showSaveFilterModal} theme={theme} />
      <PromotionModal
        show={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        mode={promotionMode}
        selectedStudents={selectedStudents}
        students={students}
        singleStudentId={promotionSingleStudentId}
        fromClass={promotionFromClass}
        fromSection={promotionFromSection}
        theme={theme}
        onSuccess={() => { loadStudents(); }}
      />
      <ExitStudentModal
        isOpen={showExitModal}
        onClose={() => { setShowExitModal(false); setExitStudentIds([]); }}
        studentIds={exitStudentIds}
        theme={theme}
        onSuccess={() => { loadStudents(); }}
      />
      
      {/* Search Performance Monitor */}
      <SearchPerformanceMonitor 
        theme={theme} 
        engine={StudentSearchEngine.getInstance()} 
      />
    </AppLayout>
  );
}

