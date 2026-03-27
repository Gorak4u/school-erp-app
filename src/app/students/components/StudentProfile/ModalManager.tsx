import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Student, ModalState } from './types';
import EnhancedFeeCollection from '../../../fees/components/fee-collection';
import StudentFines from '../StudentFines';
import StudentAnalytics from '../StudentAnalytics';
import StudentMedicalInfo from '../StudentMedicalInfo';
import AttendanceCalendar from '../../../../components/attendance/AttendanceCalendar';

interface ModalManagerProps {
  feeManagement: ModalState;
  attendanceTracking: ModalState;
  communicationCenter: ModalState;
  parentPortal: ModalState;
  showCalendarModal: boolean;
  calendarStudent: Student | null;
  feeData: any;
  loadingFeeData: boolean;
  theme: 'dark' | 'light';
  onFeeManagementClose: () => void;
  onAttendanceTrackingClose: () => void;
  onCommunicationCenterClose: () => void;
  onParentPortalClose: () => void;
  onCalendarModalClose: () => void;
  onRefreshFeeData: () => void;
}

const ModalManager: React.FC<ModalManagerProps> = ({
  feeManagement,
  attendanceTracking,
  communicationCenter,
  parentPortal,
  showCalendarModal,
  calendarStudent,
  feeData,
  loadingFeeData,
  theme,
  onFeeManagementClose,
  onAttendanceTrackingClose,
  onCommunicationCenterClose,
  onParentPortalClose,
  onCalendarModalClose,
  onRefreshFeeData
}) => {
  const modalStyles = `fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[10000]`;
  const modalContentStyles = `relative w-full max-w-6xl mx-4 overflow-hidden rounded-2xl border shadow-xl ${
    theme === 'dark' 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200'
  }`;

  const renderModalHeader = (title: string, onClose: () => void, subtitle?: string) => (
    <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  const renderSimpleModal = (title: string, selectedStudent: Student, onClose: () => void, message: string) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={modalStyles}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className={`relative w-full max-w-4xl mx-4 overflow-hidden rounded-2xl border ${
          theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {renderModalHeader(title, onClose, selectedStudent.name)}
        <div className="p-6">
          <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {message}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      {/* Fee Management Modal */}
      <AnimatePresence>
        {feeManagement?.showFeeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={modalStyles}
            onClick={onFeeManagementClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={modalContentStyles}
              onClick={(e) => e.stopPropagation()}
            >
              {renderModalHeader(
                'Fee Management',
                onFeeManagementClose,
                feeManagement.selectedStudent?.name
              )}
              <div className="max-h-[70vh] overflow-y-auto">
                {loadingFeeData ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loading fee data...
                      </p>
                    </div>
                  </div>
                ) : feeData ? (
                  <EnhancedFeeCollection
                    theme={theme}
                    studentId={feeManagement.selectedStudent?.id || ''}
                    studentData={feeData}
                    onClose={onFeeManagementClose}
                    onPaymentSuccess={onRefreshFeeData}
                  />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Failed to load fee data. Please try again.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Tracking Modal */}
      <AnimatePresence>
        {attendanceTracking?.showFeeModal && renderSimpleModal(
          'Attendance Tracking',
          attendanceTracking.selectedStudent!,
          onAttendanceTrackingClose,
          'Attendance tracking functionality would be implemented here. This modal is triggered from the profile view.'
        )}
      </AnimatePresence>

      {/* Communication Center Modal */}
      <AnimatePresence>
        {communicationCenter?.showFeeModal && renderSimpleModal(
          'Communication Center',
          communicationCenter.selectedStudent!,
          onCommunicationCenterClose,
          'Communication center functionality would be implemented here. This modal is triggered from the profile view.'
        )}
      </AnimatePresence>

      {/* Parent Portal Modal */}
      <AnimatePresence>
        {parentPortal?.showFeeModal && renderSimpleModal(
          'Parent Portal',
          parentPortal.selectedStudent!,
          onParentPortalClose,
          'Parent portal functionality would be implemented here. This modal is triggered from the profile view.'
        )}
      </AnimatePresence>

      {/* Attendance Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={onCalendarModalClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-6xl mx-4 rounded-2xl border shadow-2xl ${
                theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  📅 Attendance Calendar - {calendarStudent?.name}
                </h3>
                <button
                  onClick={onCalendarModalClose}
                  className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  ✖️ Close
                </button>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                <AttendanceCalendar 
                  type="student"
                  personId={calendarStudent?.id || ''}
                  isDark={theme === 'dark'}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ModalManager;
