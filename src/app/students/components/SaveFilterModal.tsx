// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface SaveFilterModalProps {
  filterName: any; saveCurrentFilter: any; setFilterName: any; setShowSaveFilterModal: any; showSaveFilterModal: any; theme: any;
}

export default function SaveFilterModal({ filterName, saveCurrentFilter, setFilterName, setShowSaveFilterModal, showSaveFilterModal, theme }: SaveFilterModalProps) {
  return (
    <>
      {/* Save Filter Modal */}
      <AnimatePresence>
        {showSaveFilterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowSaveFilterModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl border p-6 ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  💾 Save Current Filter
                </h3>
                <button
                  onClick={() => setShowSaveFilterModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Filter Name
                  </label>
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter filter name..."
                    autoFocus
                  />
                </div>

                <div className={`p-3 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'
                }`}>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    This will save your current filter settings for future use. You can apply saved filters quickly from the advanced filters section.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSaveFilterModal(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={saveCurrentFilter}
                  disabled={!filterName.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !filterName.trim()
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Save Filter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
