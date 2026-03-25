'use client';

import React from 'react';

interface CopyAcademicYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopyWithData: () => void;
  onCreateFresh: () => void;
  previousYear: any;
  pendingYear: any;
  isDark: boolean;
}

export const CopyAcademicYearModal: React.FC<CopyAcademicYearModalProps> = ({
  isOpen,
  onClose,
  onCopyWithData,
  onCreateFresh,
  previousYear,
  pendingYear,
  isDark,
}) => {
  if (!isOpen || !previousYear || !pendingYear) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Academic Year</h2>
        </div>

        <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Previous academic year found: <strong>{previousYear.name}</strong>
        </p>

        <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Would you like to copy all structure data (mediums, classes, sections, fee structures) from the previous year, or create a fresh academic year?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onCreateFresh}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
              isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Create Fresh
          </button>
          <button
            onClick={onCopyWithData}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
              isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Copy with Data
          </button>
        </div>
      </div>
    </div>
  );
};
