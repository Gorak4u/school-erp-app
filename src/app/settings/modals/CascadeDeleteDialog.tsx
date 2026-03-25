'use client';

import React from 'react';

interface CascadeDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entity: string;
  name: string;
  classCount: number;
  sectionCount: number;
  feeStructureCount: number;
  onConfirm: () => void;
  isDark: boolean;
}

export const CascadeDeleteDialog: React.FC<CascadeDeleteDialogProps> = ({
  isOpen,
  onClose,
  entity,
  name,
  classCount,
  sectionCount,
  feeStructureCount,
  onConfirm,
  isDark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-red-900/50' : 'bg-red-100'}`}>
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete {entity}</h2>
        </div>

        <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Are you sure you want to delete <strong>&quot;{name}&quot;</strong>?
        </p>

        {(classCount > 0 || sectionCount > 0 || feeStructureCount > 0) && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
            ⚠️ This will also delete:
            <ul className="mt-2 ml-4 list-disc space-y-1">
              {classCount > 0 && <li>{classCount} class{classCount > 1 ? 'es' : ''}</li>}
              {sectionCount > 0 && <li>{sectionCount} section{sectionCount > 1 ? 's' : ''}</li>}
              {feeStructureCount > 0 && <li>{feeStructureCount} fee structure{feeStructureCount > 1 ? 's' : ''}</li>}
            </ul>
          </div>
        )}

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
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
              isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
