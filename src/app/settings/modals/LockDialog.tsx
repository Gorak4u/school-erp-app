'use client';

import React from 'react';

interface LockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onConfirm: (doLock: boolean) => void;
  lockingSaving: boolean;
  isDark: boolean;
}

export const LockDialog: React.FC<LockDialogProps> = ({
  isOpen,
  onClose,
  data,
  onConfirm,
  lockingSaving,
  isDark,
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Lock Students?</h2>
        </div>

        <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          <strong>{data.ay?.name}</strong> is now the active academic year.
        </p>

        {data.count > 0 && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
            ⚠️ {data.count} student{data.count > 1 ? 's' : ''} from previous academic year(s) need promotion.
          </div>
        )}

        <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Would you like to lock these students now? Locked students cannot be edited until they are promoted.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(false)}
            disabled={lockingSaving}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Skip
          </button>
          <button
            onClick={() => onConfirm(true)}
            disabled={lockingSaving}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 ${
              isDark ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            {lockingSaving ? 'Locking...' : 'Lock Students'}
          </button>
        </div>
      </div>
    </div>
  );
};
