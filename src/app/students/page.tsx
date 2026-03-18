// @ts-nocheck
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { Student } from './types';
import { useStudentState } from './hooks/useStudentState';
import { useTheme } from '@/contexts/ThemeContext';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { studentsApi, academicYearsApi, classesApi, sectionsApi } from '@/lib/apiClient';
import { usePermissions } from '@/hooks/usePermissions';

import { createSearchHandlers } from './handlers/searchHandlers';
import { createActionsHandlers } from './handlers/actionsHandlers';
import { createMobileHandlers } from './handlers/mobileHandlers';
import { createDocumentHandlers } from './handlers/documentHandlers';
import { createTrackingHandlers } from './handlers/trackingHandlers';
import { createFeeHandlers } from './handlers/feeHandlers';
import { createStudentHandlers } from './handlers/studentHandlers';

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
import StudentProfileModal from './components/StudentProfileModal';
import BulkOperationsModal from './components/BulkOperationsModal';
import ColumnSettingsModal from './components/ColumnSettingsModal';
import SaveFilterModal from './components/SaveFilterModal';
import PromotionModal from './components/PromotionModal';
import ExitStudentModal from './components/ExitStudentModal';
import SearchPerformanceMonitor from '../shared/search/components/SearchPerformanceMonitor';
import { StudentSearchEngine } from './search/StudentSearchEngine';

export default function StudentsPage() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { hasPermission, isAdmin } = usePermissions();
  const { getSetting } = useSchoolConfig();
  const canCreateStudents = isAdmin || hasPermission('create_students');
  const canEditStudents = isAdmin || hasPermission('edit_students');
  const canDeleteStudents = isAdmin || hasPermission('delete_students');
  const canPromoteStudents = isAdmin || hasPermission('promote_students');
  const canManageStudentBulk = canCreateStudents || canEditStudents || canDeleteStudents || canPromoteStudents;
  const state = useStudentState();
  
  // Create context with school config
  const ctx: any = { ...state, getSetting };

  Object.assign(ctx, createSearchHandlers(ctx));
  Object.assign(ctx, createActionsHandlers(ctx));
  Object.assign(ctx, createMobileHandlers(ctx));
  Object.assign(ctx, createDocumentHandlers(ctx));
  Object.assign(ctx, createTrackingHandlers(ctx));
  Object.assign(ctx, createFeeHandlers(ctx));

  // Destructure for JSX
  const {
    academicPerformance,
    activeTab,
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
    selectedStudent,
    selectedStudents,
    sendAutomatedReminders,
    sendBulkSMS,
    sendMessage,
    sendParentNotification,
    sendPaymentConfirmation,
    sendStudentSMS,
    setAcademicPerformance,
    setActiveTab,
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
  } = ctx;

  // filteredStudents is computed in searchHandlers
  const { filteredStudents } = ctx;

  // Pagination effect (moved from handler to component level for React hooks rules)
  useEffect(() => {
    setTotalPages(Math.ceil((filteredStudents?.length || 0) / pageSize));
  }, [filteredStudents, pageSize]);

  // ── Promotion count banner ──────────────────────────────────────────────────
  const [promotionCount, setPromotionCount] = useState(0);

  useEffect(() => {
    const count = (students || []).filter((s: any) => s.needsPromotion || s.status === 'locked').length;
    setPromotionCount(count);
  }, [students]);

  const [showExitModal, setShowExitModal] = useState(false);
  const [exitStudentIds, setExitStudentIds] = useState<string[]>([]);

  const handleExitSingle = useCallback((studentId: string) => {
    setExitStudentIds([studentId]);
    setShowExitModal(true);
  }, []);

  const handleMarkExit = useCallback((studentId: string) => {
    setExitStudentIds([studentId]);
    setShowExitModal(true);
  }, []);

  return (
    <AppLayout currentPage="students" title="Students Management">
      <div className="space-y-4 pb-6">
        {/* ── Promotion Alert Banner ─────────────────────────────────────── */}
        {promotionCount > 0 && canPromoteStudents && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2">
              <span className="text-orange-500 text-lg">🔒</span>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-400' : 'text-orange-700'}`}>
                <span className="font-bold">{promotionCount} student{promotionCount !== 1 ? 's' : ''}</span> from a previous academic year {promotionCount !== 1 ? 'need' : 'needs'} promotion or exit action before they can be edited.
              </p>
            </div>
            <button
              onClick={() => { setPromotionMode('class'); setShowPromotionModal(true); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors shrink-0"
            >
              🎓 Promote All
            </button>
          </div>
        )}
        <StudentDashboard dashboardStats={dashboardStats} filteredStudents={filteredStudents} selectedStudents={selectedStudents} setBulkOperations={setBulkOperations} setShowAddModal={setShowAddModal} setShowAdvancedFilters={setShowAdvancedFilters} setShowBulkOperationModal={setShowBulkOperationModal} setShowDashboard={setShowDashboard} showAdvancedFilters={showAdvancedFilters} showDashboard={showDashboard} students={students} theme={theme} canCreateStudents={canCreateStudents} canManageStudentBulk={canManageStudentBulk} />
        <StudentFilters advancedFilters={advancedFilters} advancedSearch={advancedSearch} applySavedFilter={applySavedFilter} attendanceFilter={attendanceFilter} clearAdvancedFilters={clearAdvancedFilters} deleteSavedFilter={deleteSavedFilter} exportAllFilteredStudents={exportAllFilteredStudents} exportSelectedStudents={exportSelectedStudents} filteredStudents={filteredStudents} isMobile={isMobile} mobileView={mobileView} pageSize={pageSize} performAdvancedSearch={performAdvancedSearch} savedFilters={savedFilters} searchTerm={searchTerm} selectedClass={selectedClass} selectedGender={selectedGender} selectedLanguage={selectedLanguage} selectedStatus={selectedStatus} selectedStudents={selectedStudents} setAdvancedFilters={setAdvancedFilters} setAdvancedSearch={setAdvancedSearch} setAttendanceFilter={setAttendanceFilter} setCurrentPage={setCurrentPage} setMobileView={setMobileView} setPageSize={setPageSize} setSearchTerm={setSearchTerm} setSelectedClass={setSelectedClass} setSelectedGender={setSelectedGender} setSelectedLanguage={setSelectedLanguage} setSelectedStatus={setSelectedStatus} setSelectedStudents={setSelectedStudents} setShowAdvancedFilters={setShowAdvancedFilters} setShowBulkOperationModal={setShowBulkOperationModal} setShowColumnSettings={setShowColumnSettings} setShowSaveFilterModal={setShowSaveFilterModal} showAdvancedFilters={showAdvancedFilters} showColumnSettings={showColumnSettings} students={students} theme={theme} onPromoteBulk={() => { setPromotionMode('bulk'); setShowPromotionModal(true); }} onPromoteClass={(cls: string, section: string) => { setPromotionMode('class'); setPromotionFromClass(cls); setPromotionFromSection(section); setShowPromotionModal(true); }} canPromoteStudents={canPromoteStudents} canManageStudentBulk={canManageStudentBulk} />
        <StudentTable activeTab={activeTab} currentPage={currentPage} filteredStudents={filteredStudents} handleDeleteStudent={handleDeleteStudent} isMobile={isMobile} mobileView={mobileView} pageSize={pageSize} selectedStudents={selectedStudents} setActiveTab={setActiveTab} setCurrentPage={setCurrentPage} setEditingStudent={setEditingStudent} setSelectedStudent={setSelectedStudent} sortConfig={sortConfig} setSortConfig={setSortConfig} theme={theme} toggleAllStudentsSelection={toggleAllStudentsSelection} toggleStudentSelection={toggleStudentSelection} totalPages={totalPages} visibleColumns={visibleColumns} columnSettings={columnSettings} onPromoteSingle={(studentId: string) => { setPromotionMode('single'); setPromotionSingleStudentId(studentId); setShowPromotionModal(true); }} onPromoteClass={(cls: string, section: string) => { setPromotionMode('class'); setPromotionFromClass(cls); setPromotionFromSection(section); setShowPromotionModal(true); }} onExitSingle={handleExitSingle} canEditStudents={canEditStudents} canPromoteStudents={canPromoteStudents} isAdmin={isAdmin} />
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
      <StudentProfileModal
        activeTab={activeTab} printStudentProfile={printStudentProfile} selectedStudent={selectedStudent}
        sendStudentSMS={sendStudentSMS} setAcademicPerformance={setAcademicPerformance} setActiveTab={setActiveTab}
        setAttendanceTracking={setAttendanceTracking} setCommunicationCenter={setCommunicationCenter}
        setEditingStudent={setEditingStudent} setFeeManagement={setFeeManagement} setParentPortal={setParentPortal}
        setSelectedStudent={setSelectedStudent} theme={theme} students={students}
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

