// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeeColumnSettingsModalProps {
  columnSettings: any; 
  resetColumns: any; 
  setShowColumnSettings: any; 
  showColumnSettings: any; 
  theme: any; 
  toggleColumn: any; 
  visibleColumns: any;
}

export default function FeeColumnSettingsModal({ 
  columnSettings, 
  resetColumns, 
  setShowColumnSettings, 
  showColumnSettings, 
  theme, 
  toggleColumn, 
  visibleColumns 
}: FeeColumnSettingsModalProps) {
  return (
    <>
      {/* Column Settings Modal */}
      <AnimatePresence>
        {showColumnSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowColumnSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg rounded-2xl border p-6 max-h-[80vh] flex flex-col ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ⚙️ Column Settings
                </h3>
                <button
                  onClick={() => setShowColumnSettings(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-2 pr-1 my-2">
                {columnSettings.availableColumns.map(column => (
                  <div key={column.key} className="flex items-center justify-between">
                    <label className={`flex items-center gap-3 cursor-pointer ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(column.key)}
                        onChange={() => toggleColumn(column.key)}
                        disabled={column.fixed}
                        className={`w-4 h-4 rounded border-gray-300 ${
                          column.fixed ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                      <span className={column.fixed ? 'font-medium' : ''}>
                        {column.label}
                        {column.fixed && ' (Required)'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-3 mt-6">
                <button
                  onClick={resetColumns}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Reset to Default
                </button>
                <button
                  onClick={() => setShowColumnSettings(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Apply Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
