// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface ExportModalProps {
  bulkOperations: any; performBulkAction: any; selectedStudents: any; setBulkOperations: any; students: any; theme: any;
}

export default function ExportModal({ bulkOperations, performBulkAction, selectedStudents, setBulkOperations, students, theme }: ExportModalProps) {
  return (
    <>
      {/* Export Modal */}
      <AnimatePresence>
        {bulkOperations.showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]"
            onClick={() => setBulkOperations(prev => ({ ...prev, showExportModal: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-2xl mx-4 p-6 rounded-2xl border ${
                theme === 'dark' 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-xl font-bold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                📊 Export Students
              </h3>

              {/* Export Format */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Export Format:
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setBulkOperations(prev => ({ ...prev, exportFormat: 'csv' }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      bulkOperations.exportFormat === 'csv'
                        ? 'bg-blue-600 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    📄 CSV
                  </button>
                  <button
                    onClick={() => setBulkOperations(prev => ({ ...prev, exportFormat: 'excel' }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      bulkOperations.exportFormat === 'excel'
                        ? 'bg-green-600 text-white'
                        : theme === 'dark'
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    📊 Excel
                  </button>
                </div>
              </div>

              {/* Export Options */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Export Scope:
                </label>
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {selectedStudents.length > 0 
                      ? `📋 ${selectedStudents.length} selected students`
                      : `📋 All ${filteredStudents.length} filtered students`
                    }
                  </div>
                </div>
              </div>

              {/* Field Selection */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Export Fields:
                </label>
                <div className={`max-h-48 overflow-y-auto p-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="grid grid-cols-2 gap-2">
                    {bulkOperations.exportFields.map((field) => (
                      <label key={field} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={true}
                          className="rounded border-gray-300 text-blue-600"
                          readOnly
                        />
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          {field.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className={`mb-6 p-4 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-sm font-medium mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  ⚡ Quick Actions:
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => performBulkAction('export')}
                    disabled={bulkOperations.bulkActionStatus === 'processing'}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      bulkOperations.bulkActionStatus === 'processing'
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    📤 Export Now
                  </button>
                  <button
                    onClick={() => performBulkAction('update')}
                    disabled={bulkOperations.bulkActionStatus === 'processing'}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      bulkOperations.bulkActionStatus === 'processing'
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    ✏️ Update Status
                  </button>
                  <button
                    onClick={() => performBulkAction('delete')}
                    disabled={bulkOperations.bulkActionStatus === 'processing'}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      bulkOperations.bulkActionStatus === 'processing'
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    🗑️ Delete Selected
                  </button>
                </div>

                {/* Bulk Action Progress */}
                {bulkOperations.bulkActionStatus === 'processing' && (
                  <div className="mt-3">
                    <div className={`flex items-center justify-between mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      <span className="text-xs">
                        {bulkOperations.bulkAction === 'export' && 'Exporting...'}
                        {bulkOperations.bulkAction === 'update' && 'Updating...'}
                        {bulkOperations.bulkAction === 'delete' && 'Deleting...'}
                      </span>
                      <span className="text-xs">{bulkOperations.bulkActionProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${bulkOperations.bulkActionProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {bulkOperations.bulkActionStatus === 'success' && (
                  <div className={`mt-3 text-sm text-green-600 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`}>
                    ✅ Action completed successfully!
                  </div>
                )}

                {bulkOperations.bulkActionStatus === 'error' && (
                  <div className={`mt-3 text-sm text-red-600 ${
                    theme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`}>
                    ❌ Action failed. Please try again.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setBulkOperations(prev => ({ 
                    ...prev, 
                    showExportModal: false,
                    bulkActionStatus: 'idle',
                    bulkActionProgress: 0
                  }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
