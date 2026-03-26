import React from 'react';
import { Student } from './types';

interface LockBannerProps {
  selectedStudent: Student;
  theme: 'dark' | 'light';
  canPromoteStudents: boolean;
  canRunLifecycleActions: boolean;
  onPromoteSingle: (studentId: string) => void;
  onMarkExit: (studentId: string) => void;
  onCloseModal: () => void;
}

const LockBanner: React.FC<LockBannerProps> = ({
  selectedStudent,
  theme,
  canPromoteStudents,
  canRunLifecycleActions,
  onPromoteSingle,
  onMarkExit,
  onCloseModal
}) => {
  const isLocked = selectedStudent?.needsPromotion || selectedStudent?.status === 'locked';
  
  if (!isLocked) return null;

  return (
    <div className="px-6 py-3 bg-orange-500/10 border-b border-orange-500/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-orange-500 text-lg">🔒</span>
          <div>
            <p className="text-sm font-semibold text-orange-600">
              Student record is locked — from AY {selectedStudent.academicYear}
            </p>
            <p className="text-xs text-orange-500">
              Editing and new fee assignments are blocked until you promote this student to the current academic year or mark them as exit.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canPromoteStudents && onPromoteSingle && canRunLifecycleActions && (
            <button
              onClick={() => { 
                onCloseModal(); 
                onPromoteSingle(selectedStudent.id); 
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            >
              🎓 Promote Now
            </button>
          )}
          {canPromoteStudents && onMarkExit && canRunLifecycleActions && (
            <button
              onClick={() => { 
                onMarkExit(selectedStudent.id); 
                onCloseModal(); 
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
            >
              🚪 Mark Exit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockBanner;
