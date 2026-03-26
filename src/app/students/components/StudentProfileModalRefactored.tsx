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
  activeTab,
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

  // Local state
  const [showIdCard, setShowIdCard] = useState(false);
  const [showCardBack, setShowCardBack] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarStudent, setCalendarStudent] = useState<any>(null);
  const [idCardHtml, setIdCardHtml] = useState('');
  const [idCardBackHtml, setIdCardBackHtml] = useState('');
  
  // Mouse tracking for world-class UI effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Modal states
  const [localFeeManagement, setLocalFeeManagement] = useState(feeManagement || { showFeeModal: false });
  const [localAttendanceTracking, setLocalAttendanceTracking] = useState(attendanceTracking || { showFeeModal: false });
  const [localCommunicationCenter, setLocalCommunicationCenter] = useState(communicationCenter || { showFeeModal: false });
  const [localParentPortal, setLocalParentPortal] = useState(parentPortal || { showFeeModal: false });
  
  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Add shimmer CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      .animate-shimmer {
        background: linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6, #3b82f6);
        background-size: 200% auto;
        animation: shimmer 3s linear infinite;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
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
      label: 'SMS',
      icon: '📱',
      onClick: () => sendStudentSMS(selectedStudent),
      variant: 'primary'
    },
    {
      label: 'ID Card',
      icon: '🆔',
      onClick: () => setShowIdCard(true),
      variant: 'primary'
    },
    {
      label: 'Print',
      icon: '🖨️',
      onClick: () => printStudentProfile(selectedStudent),
      variant: 'secondary'
    }
  ];

  if (canEditStudentRecord) {
    actionButtons.push({
      label: 'Edit',
      icon: '✏️',
      onClick: () => setEditingStudent(selectedStudent),
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999]"
            onClick={() => setSelectedStudent(null)}
          >
            {/* Animated Background with Mouse Tracking */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-purple-900/20">
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59,130,246,0.4) 0%, transparent 50%)`
                }}
              />
              {/* Floating Particles */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
                  animate={{
                    x: [0, Math.random() * 100 - 50],
                    y: [0, Math.random() * 100 - 50],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative w-full max-w-7xl h-[90vh] mx-4 overflow-hidden rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile Header */}
              <div className="relative px-6 py-4 backdrop-blur-sm bg-white/5 border-b border-white/10">
                {/* Close Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedStudent(null)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-2xl backdrop-blur-sm bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-300 flex items-center justify-center group"
                >
                  <svg 
                    className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>

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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="px-6 py-4 backdrop-blur-sm bg-white/5 border-b border-white/10"
              >
                <TabNavigation
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  theme={theme}
                />
              </motion.div>

              {/* Profile Content */}
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                <div className="p-6 space-y-6">
                  {/* Overview Tab */}
                  <AnimatePresence>
                    {activeTab === 'overview' && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
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
                    {activeTab === 'academics' && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                      >
                        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6">
                          <AcademicsTab
                            selectedStudent={selectedStudent}
                            theme={theme}
                            onViewDetailedAnalytics={() => setAcademicPerformance((prev: any) => ({ ...prev, showAcademicModal: true, selectedStudent }))}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Other Tabs (existing components) */}
                  <StudentProfileTabs
                    activeTab={activeTab}
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
                  {activeTab === 'analytics' && (
                    <StudentAnalytics
                      theme={theme}
                      students={selectedStudent ? [selectedStudent] : []}
                      onClose={() => setActiveTab('overview')}
                    />
                  )}

                  {/* Medical Tab */}
                  {activeTab === 'medical' && (
                    <StudentMedicalInfo
                      theme={theme}
                      student={selectedStudent}
                      onClose={() => setActiveTab('overview')}
                    />
                  )}

                  {/* Fines Tab */}
                  {activeTab === 'fines' && (
                    <StudentFines
                      student={selectedStudent}
                      theme={theme}
                      onClose={() => setActiveTab('overview')}
                    />
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
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ID Card Modal Header */}
              <div className={`px-6 py-4 border-b ${
                theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Student ID Card</h3>
                  <button
                    onClick={() => setShowIdCard(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ID Card Content */}
              <div className="p-6">
                <div ref={idCardContainerRef} className="flex justify-center items-center gap-8 mb-6 flex-wrap">
                  {/* Front Side */}
                  <div className="text-center">
                    <h4 className={`text-sm font-semibold mb-3 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Front Side</h4>
                    <div dangerouslySetInnerHTML={{ 
                      __html: idCardHtml 
                    }} />
                  </div>
                  
                  {/* Back Side */}
                  <div className="text-center">
                    <h4 className={`text-sm font-semibold mb-3 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>Back Side</h4>
                    <div dangerouslySetInnerHTML={{ 
                      __html: idCardBackHtml 
                    }} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={handlePrintIdCard}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold shadow bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-105 transition-transform`}
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={() => setShowIdCard(false)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                      theme === 'dark' 
                        ? 'border-gray-600 text-gray-200 hover:bg-gray-800' 
                        : 'border-gray-300 text-gray-700 hover:bg-white'
                    }`}
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
