// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface ImportModalProps {
  bulkOperations: any; downloadTemplate: any; handleFileImport: any; setBulkOperations: any; theme: any;
}

export default function ImportModal({ bulkOperations, downloadTemplate, handleFileImport, setBulkOperations, theme }: ImportModalProps) {
  return (
    <>
      {/* Import Modal */}
      <AnimatePresence>
        {bulkOperations.showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]"
            onClick={() => setBulkOperations(prev => ({ ...prev, showImportModal: false }))}
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
                📥 Import Students
              </h3>

              {/* File Upload */}
              <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
                theme === 'dark' 
                  ? 'border-gray-700 bg-gray-800/50' 
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileImport(file);
                  }}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file" className="cursor-pointer">
                  <div className="text-4xl mb-4">📁</div>
                  <p className={`text-lg font-medium mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Drop file here or click to browse
                  </p>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Supports CSV and Excel files (.csv, .xlsx, .xls)
                  </p>
                </label>
              </div>

              {/* Download Templates */}
              <div className={`mt-6 p-4 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <p className={`text-sm font-medium mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  📋 Download Template:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    📄 CSV Template
                  </button>
                  <button
                    onClick={() => downloadTemplate('excel')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    📊 Excel Template
                  </button>
                </div>
              </div>

              {/* Import Progress */}
              {bulkOperations.importStatus === 'processing' && (
                <div className="mt-6">
                  <div className={`flex items-center justify-between mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <span className="text-sm">Importing...</span>
                    <span className="text-sm">{bulkOperations.importProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${bulkOperations.importProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Import Results */}
              {bulkOperations.importStatus !== 'idle' && (
                <div className={`mt-6 p-4 rounded-lg ${
                  bulkOperations.importStatus === 'success'
                    ? theme === 'dark' ? 'bg-green-900/50 border-green-800' : 'bg-green-50 border-green-200'
                    : theme === 'dark' ? 'bg-red-900/50 border-red-800' : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {bulkOperations.importStatus === 'success' ? '✅ Import Completed' : '❌ Import Failed'}
                  </h4>
                  
                  {bulkOperations.importStatus === 'success' && (
                    <div className={`text-sm space-y-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div>📊 Total: {bulkOperations.importResults.total}</div>
                      <div>✅ Successful: {bulkOperations.importResults.successful}</div>
                      <div>❌ Failed: {bulkOperations.importResults.failed}</div>
                      <div>🔄 Duplicates: {bulkOperations.importResults.duplicates}</div>
                    </div>
                  )}

                  {bulkOperations.importErrors.length > 0 && (
                    <div className={`mt-3 text-sm ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>
                      <div className="font-medium mb-1">Errors:</div>
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {bulkOperations.importErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setBulkOperations(prev => ({ 
                    ...prev, 
                    showImportModal: false,
                    importStatus: 'idle',
                    importErrors: [],
                    importProgress: 0
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
