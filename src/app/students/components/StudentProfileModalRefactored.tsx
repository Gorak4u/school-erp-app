'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionButton, ModalState } from './StudentProfile/types';
import { useStudentProfile, useStudentPermissions, useProfileTabs } from './StudentProfile/hooks';
import ProfileHeader from './StudentProfile/ProfileHeader';
import LockBanner from './StudentProfile/LockBanner';
import TabNavigation from './StudentProfile/TabNavigation';
import OverviewTab from './StudentProfile/OverviewTab';
import AcademicsTab from './StudentProfile/AcademicsTab';
import ModalManager from './StudentProfile/ModalManager';
import StudentProfileTabs from './StudentProfileTabs';
import StudentAnalytics from './StudentAnalytics';
import StudentMedicalInfo from './StudentMedicalInfo';
import StudentFines from './StudentFines';
import { buildStudentIdCardSnippet, buildStudentIdCardDocument, StudentIdCardData } from '../../../lib/idCard';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StudentProfileModalProps {
  activeTab: string;
  selectedStudent: any;
  theme: 'dark' | 'light';
  students?: any[];
  includeArchivedStudents?: boolean;
  canEditStudents?: boolean;
  canPromoteStudents?: boolean;
  isAdmin?: boolean;
  feeManagement?: any;
  attendanceTracking?: any;
  communicationCenter?: any;
  parentPortal?: any;
  onPromoteSingle?: (studentId: string) => void;
  onMarkExit?: (studentIds: string[]) => void;
  // Callback functions
  printStudentProfile: (student: any) => void;
  sendStudentSMS: (student: any) => void;
  setActiveTab: (tab: string) => void;
  setAcademicPerformance: (state: any) => void;
  setAttendanceTracking: (state: any) => void;
  setCommunicationCenter: (state: any) => void;
  setEditingStudent: (student: any) => void;
  setFeeManagement: (state: any) => void;
  setParentPortal: (state: any) => void;
  setSelectedStudent: (student: any) => void;
}

const StudentProfileModalRefactored: React.FC<StudentProfileModalProps> = ({
  activeTab: propActiveTab,
  selectedStudent,
  theme,
  students = [],
  includeArchivedStudents = false,
  canEditStudents = true,
  canPromoteStudents = true,
  isAdmin = false,
  feeManagement,
  attendanceTracking,
  communicationCenter,
  parentPortal,
  onPromoteSingle,
  onMarkExit,
  // Callback functions
  printStudentProfile,
  sendStudentSMS,
  setActiveTab,
  setAcademicPerformance,
  setAttendanceTracking,
  setCommunicationCenter,
  setEditingStudent,
  setFeeManagement,
  setParentPortal,
  setSelectedStudent
}) => {
  // Custom hooks
  const { feeData, loadingFeeData, handleRefreshFeeData } = useStudentProfile(
    selectedStudent, 
    includeArchivedStudents
  );
  const { canEdit: canEditStudentRecord, canRunLifecycle: canRunLifecycleActions } = useStudentPermissions(
    canEditStudents,
    canPromoteStudents,
    isAdmin,
    selectedStudent
  );
  const profileTabs = useProfileTabs();

  // Local state for modal tabs - separate from main page tabs
  const [localActiveTab, setLocalActiveTab] = useState('overview');
  
  // Reset to overview when modal opens with a new student
  useEffect(() => {
    if (selectedStudent) {
      setLocalActiveTab('overview');
    }
  }, [selectedStudent?.id]);
  
  // Use local tab state instead of prop
  const currentTab = localActiveTab;
  const setCurrentTab = setLocalActiveTab;

  // Other local state
  const [showIdCard, setShowIdCard] = useState(false);
  const [showCardBack, setShowCardBack] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarStudent, setCalendarStudent] = useState<any>(null);
  const [idCardHtml, setIdCardHtml] = useState('');
  const [idCardBackHtml, setIdCardBackHtml] = useState('');
  
  // Helper functions for professional styling with proper contrast
  const getCardClass = () => {
    const isDark = theme === 'dark';
    return `rounded-2xl border p-6 shadow-lg ${
      isDark 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' 
        : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
    }`;
  };

  const getBtnPrimaryClass = () => {
    const isDark = theme === 'dark';
    return `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-lg ${
      isDark 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
    }`;
  };

  const getBtnSecondaryClass = () => {
    const isDark = theme === 'dark';
    return `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${
      isDark 
        ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
    }`;
  };

  const getRowClass = () => {
    const isDark = theme === 'dark';
    return `p-4 rounded-xl border ${
      isDark ? 'border-gray-600/50 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'
    }`;
  };

  const getHeadingClass = () => {
    const isDark = theme === 'dark';
    return `text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`;
  };

  const getSubtextClass = () => {
    const isDark = theme === 'dark';
    return `text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`;
  };

  const getLabelClass = () => {
    const isDark = theme === 'dark';
    return `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`;
  };

  const getGradientClass = (type: string) => {
    const isDark = theme === 'dark';
    const gradients = {
      primary: isDark ? 'from-blue-600 to-blue-700' : 'from-blue-500 to-blue-600',
      secondary: isDark ? 'from-gray-600 to-gray-700' : 'from-gray-500 to-gray-600',
      success: isDark ? 'from-green-600 to-green-700' : 'from-green-500 to-green-600',
      warning: isDark ? 'from-orange-600 to-orange-700' : 'from-orange-500 to-orange-600',
      danger: isDark ? 'from-red-600 to-red-700' : 'from-red-500 to-red-600'
    };
    return gradients[type as keyof typeof gradients] || gradients.primary;
  };

  const getStatusColor = (status: string) => {
    const isDark = theme === 'dark';
    const colors = {
      active: isDark ? 'text-green-400' : 'text-green-600',
      inactive: isDark ? 'text-gray-400' : 'text-gray-600',
      pending: isDark ? 'text-yellow-400' : 'text-yellow-600',
      suspended: isDark ? 'text-red-400' : 'text-red-600'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  // Modal states
  const [localFeeManagement, setLocalFeeManagement] = useState(feeManagement || { showFeeModal: false });
  const [localAttendanceTracking, setLocalAttendanceTracking] = useState(attendanceTracking || { showFeeModal: false });
  const [localCommunicationCenter, setLocalCommunicationCenter] = useState(communicationCenter || { showFeeModal: false });
  const [localParentPortal, setLocalParentPortal] = useState(parentPortal || { showFeeModal: false });
  
  // Refs
  const idCardRef = useRef<HTMLDivElement>(null);
  const idCardContainerRef = useRef<HTMLDivElement>(null);
  const { getSetting } = useSchoolConfig();

  // ID Card functionality
  const generateIdCardData = (student: any): StudentIdCardData => {
    return {
      name: student.name,
      admissionNo: student.admissionNo,
      className: `${student.class}${student.section ? ` - ${student.section}` : ''}`,
      schoolName: getSetting('school_details', 'name', 'School Name'),
      schoolLogo: getSetting('school_details', 'logo_url', ''),
      photo: student.photo,
      dateOfBirth: student.dateOfBirth,
      issueDate: student.admissionDate || new Date().toISOString().split('T')[0],
      phone: student.phone,
      address: student.address,
      academicYear: student.academicYear || '2024-25',
      bloodGroup: student.bloodGroup,
      fatherName: student.fatherName,
      motherName: student.motherName,
      transportRoute: student.transportRoute
    };
  };

  const generateIdCardHtml = async (student: any) => {
    const idCardData = generateIdCardData(student);
    const frontHtml = await buildStudentIdCardSnippet(idCardData, false);
    const backHtml = await buildStudentIdCardSnippet(idCardData, true);
    setIdCardHtml(frontHtml);
    setIdCardBackHtml(backHtml);
  };

  const handlePrintIdCard = async () => {
    const idCardData = generateIdCardData(selectedStudent);
    const frontHtml = await buildStudentIdCardDocument(idCardData, false);
    const backHtml = await buildStudentIdCardDocument(idCardData, true);
    
    const printWindow = window.open('', '_blank', 'width=1200,height=700');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ID Card - Both Sides</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f3f4f6; }
              .card-container { display: flex; gap: 40px; align-items: center; }
              .card-side { text-align: center; }
              .card-side h3 { margin-bottom: 10px; color: #374151; }
              @media print { 
                body { background: white; } 
                .card-container { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="card-container">
              <div class="card-side">
                <h3>Front Side</h3>
                ${frontHtml}
              </div>
              <div class="card-side">
                <h3>Back Side</h3>
                ${backHtml}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Action buttons configuration
  const actionButtons: ActionButton[] = [
    {
      label: 'Send SMS',
      icon: 'Smartphone',
      onClick: () => sendStudentSMS(selectedStudent),
      variant: 'primary'
    },
    {
      label: 'ID Card',
      icon: 'IdCard',
      onClick: () => setShowIdCard(true),
      variant: 'primary'
    },
    {
      label: 'Print Profile',
      icon: 'Printer',
      onClick: () => printStudentProfile(selectedStudent),
      variant: 'secondary'
    }
  ];

  if (canEditStudentRecord) {
    actionButtons.push({
      label: 'Edit Student',
      icon: 'Pencil',
      onClick: () => setEditingStudent(selectedStudent),
      variant: 'primary'
    });
  }

  if (canRunLifecycleActions) {
    actionButtons.push({
      label: 'Promote',
      icon: 'ArrowUp',
      onClick: () => onPromoteSingle?.(selectedStudent.id),
      variant: 'primary'
    });
  }

  // Generate ID card HTML when modal opens
  useEffect(() => {
    if (showIdCard && selectedStudent) {
      generateIdCardHtml(selectedStudent);
    }
  }, [showIdCard, selectedStudent]);

  if (!selectedStudent) return null;

  return (
    <>
      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`relative w-full max-w-7xl h-[90vh] mx-4 overflow-hidden rounded-2xl shadow-2xl flex flex-col ${
                theme === 'dark' 
                  ? 'bg-gray-900 border border-gray-700' 
                  : 'bg-gray-50 border border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header - Compact */}
              <div className={`px-4 py-3 border-b ${
                theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Student Profile
                  </h2>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className={`p-2 rounded-lg transition-all hover:scale-105 ${
                      theme === 'dark' 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Profile Header */}
              <div className="px-4 py-0">
                <ProfileHeader
                  selectedStudent={selectedStudent}
                  theme={theme}
                  actions={actionButtons}
                  canEditStudentRecord={canEditStudentRecord}
                />
              </div>

              {/* Lock Banner */}
              <LockBanner
                selectedStudent={selectedStudent}
                theme={theme}
                canPromoteStudents={canPromoteStudents}
                canRunLifecycleActions={canRunLifecycleActions}
                onPromoteSingle={onPromoteSingle!}
                onMarkExit={(studentId: string) => onMarkExit!([studentId])}
                onCloseModal={() => setSelectedStudent(null)}
              />

              {/* Tab Navigation */}
              <div className={`px-4 py-1 border-b ${
                theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
              }`}>
                <TabNavigation
                  activeTab={currentTab}
                  setActiveTab={setCurrentTab}
                  theme={theme}
                />
              </div>

              {/* Profile Content */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                <div className="p-4 space-y-4">
                  {/* Overview Tab */}
                  <AnimatePresence>
                    {currentTab === 'overview' && (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        <div className={getCardClass()}>
                          <OverviewTab
                            selectedStudent={selectedStudent}
                            theme={theme}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Academics Tab */}
                  <AnimatePresence>
                    {currentTab === 'academics' && (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        <div className={getCardClass()}>
                          <AcademicsTab
                            selectedStudent={selectedStudent}
                            theme={theme}
                            onViewDetailedAnalytics={() => setAcademicPerformance((prev: any) => ({ ...prev, showAcademicModal: true, selectedStudent }))}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Other Tabs */}
                  <StudentProfileTabs
                    activeTab={currentTab}
                    selectedStudent={selectedStudent}
                    feeData={feeData}
                    setFeeManagement={setFeeManagement}
                    setAttendanceTracking={setAttendanceTracking}
                    setParentPortal={setParentPortal}
                    setCommunicationCenter={setCommunicationCenter}
                    theme={theme}
                    setShowCalendarModal={setShowCalendarModal}
                    setCalendarStudent={setCalendarStudent}
                  />

                  {/* Analytics Tab */}
                  {currentTab === 'analytics' && (
                    <motion.div
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className={getCardClass()}
                    >
                      <StudentAnalytics
                        theme={theme}
                        students={selectedStudent ? [selectedStudent] : []}
                        onClose={() => setCurrentTab('overview')}
                      />
                    </motion.div>
                  )}

                  {/* Medical Tab */}
                  {currentTab === 'medical' && (
                    <motion.div
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className={getCardClass()}
                    >
                      <StudentMedicalInfo
                        theme={theme}
                        student={selectedStudent}
                        onClose={() => setCurrentTab('overview')}
                      />
                    </motion.div>
                  )}

                  {/* Fines Tab */}
                  {currentTab === 'fines' && (
                    <motion.div
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className={getCardClass()}
                    >
                      <StudentFines
                        student={selectedStudent}
                        theme={theme}
                        onClose={() => setCurrentTab('overview')}
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Manager */}
      <ModalManager
        feeManagement={localFeeManagement}
        attendanceTracking={localAttendanceTracking}
        communicationCenter={localCommunicationCenter}
        parentPortal={localParentPortal}
        showCalendarModal={showCalendarModal}
        calendarStudent={calendarStudent}
        feeData={feeData}
        loadingFeeData={loadingFeeData}
        theme={theme}
        onFeeManagementClose={() => setLocalFeeManagement({ ...localFeeManagement, showFeeModal: false })}
        onAttendanceTrackingClose={() => setLocalAttendanceTracking({ ...localAttendanceTracking, showFeeModal: false })}
        onCommunicationCenterClose={() => setLocalCommunicationCenter({ ...localCommunicationCenter, showFeeModal: false })}
        onParentPortalClose={() => setLocalParentPortal({ ...localParentPortal, showFeeModal: false })}
        onCalendarModalClose={() => setShowCalendarModal(false)}
        onRefreshFeeData={handleRefreshFeeData}
      />

      {/* ID Card Modal */}
      <AnimatePresence>
        {showIdCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]"
            onClick={() => setShowIdCard(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-3xl mx-4 overflow-hidden rounded-2xl border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ID Card Modal Header */}
              <div className={`px-4 py-3 border-b ${
                theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
              } flex justify-between items-center`}>
                <h3 className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Student ID Card</h3>
                <button
                  onClick={() => setShowIdCard(false)}
                  className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ID Card Content */}
              <div className="p-6">
                <div ref={idCardContainerRef} className="flex justify-center items-center gap-8 mb-6 flex-wrap">
                  {/* Front Side */}
                  <div className="text-center">
                    <h4 className={`text-base font-semibold mb-4 ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}>Front Side</h4>
                    <div dangerouslySetInnerHTML={{ 
                      __html: idCardHtml 
                    }} />
                  </div>
                  
                  {/* Back Side */}
                  <div className="text-center">
                    <h4 className={`text-base font-semibold mb-4 ${
                      theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                    }`}>Back Side</h4>
                    <div dangerouslySetInnerHTML={{ 
                      __html: idCardBackHtml 
                    }} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button
                    onClick={handlePrintIdCard}
                    className={getBtnPrimaryClass()}
                  >
                    🖨️ Print ID Card
                  </button>
                  <button
                    onClick={() => setShowIdCard(false)}
                    className={getBtnSecondaryClass()}
                  >
                    ✖️ Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentProfileModalRefactored;
