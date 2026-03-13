// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface BulkOperationsModalProps {
  bulkOperationData: any; bulkOperationProgress: any; bulkOperationType: any; executeBulkOperation: any; selectedStudents: any; setBulkOperationData: any; setBulkOperationType: any; setShowBulkOperationModal: any; showBulkOperationModal: any; students: any; theme: any;
}

export default function BulkOperationsModal({ bulkOperationData, bulkOperationProgress, bulkOperationType, executeBulkOperation, selectedStudents, setBulkOperationData, setBulkOperationType, setShowBulkOperationModal, showBulkOperationModal, students, theme }: BulkOperationsModalProps) {
  return (
    <>
      {/* Bulk Operations Modal */}
      <AnimatePresence>
        {showBulkOperationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowBulkOperationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-2xl rounded-2xl border p-6 ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  ⚙️ Bulk Operations ({selectedStudents.length} students selected)
                </h3>
                <button
                  onClick={() => setShowBulkOperationModal(false)}
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
                    Operation Type
                  </label>
                  <select
                    value={bulkOperationType}
                    onChange={(e) => setBulkOperationType(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="promote">Promote to Next Class</option>
                    <option value="update_status">Update Status</option>
                    <option value="assign_fees">Assign Fees</option>
                    <option value="send_message">Send Message</option>
                    <option value="export">Export Data</option>
                    <option value="delete">Delete Students</option>
                  </select>
                </div>

                {bulkOperationType === 'update_status' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      New Status
                    </label>
                    <select
                      value={bulkOperationData.targetStatus}
                      onChange={(e) => setBulkOperationData(prev => ({ ...prev, targetStatus: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="graduated">Graduated</option>
                      <option value="transferred">Transferred</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}

                {bulkOperationType === 'assign_fees' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Fee Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={bulkOperationData.feeAmount}
                      onChange={(e) => setBulkOperationData(prev => ({ ...prev, feeAmount: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter fee amount"
                    />
                  </div>
                )}

                {bulkOperationType === 'send_message' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      Message
                    </label>
                    <textarea
                      value={bulkOperationData.message}
                      onChange={(e) => setBulkOperationData(prev => ({ ...prev, message: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      rows={4}
                      placeholder="Enter message to send to parents"
                    />
                  </div>
                )}

                {bulkOperationProgress.status !== 'idle' && (
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {bulkOperationProgress.status === 'processing' ? 'Processing...' : 
                         bulkOperationProgress.status === 'completed' ? 'Completed!' : 'Error'}
                      </span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {bulkOperationProgress.current} / {bulkOperationProgress.total}
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                    }`}>
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          bulkOperationProgress.status === 'completed' ? 'bg-green-500' :
                          bulkOperationProgress.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(bulkOperationProgress.current / bulkOperationProgress.total) * 100}%` }}
                      />
                    </div>
                    {bulkOperationProgress.errors.length > 0 && (
                      <div className="mt-2 text-sm text-red-500">
                        {bulkOperationProgress.errors.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBulkOperationModal(false)}
                  disabled={bulkOperationProgress.status === 'processing'}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    bulkOperationProgress.status === 'processing'
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={executeBulkOperation}
                  disabled={bulkOperationProgress.status === 'processing' || 
                           (bulkOperationType === 'update_status' && !bulkOperationData.targetStatus) ||
                           (bulkOperationType === 'assign_fees' && !bulkOperationData.feeAmount) ||
                           (bulkOperationType === 'send_message' && !bulkOperationData.message)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    bulkOperationProgress.status === 'processing' ||
                    (bulkOperationType === 'update_status' && !bulkOperationData.targetStatus) ||
                    (bulkOperationType === 'assign_fees' && !bulkOperationData.feeAmount) ||
                    (bulkOperationType === 'send_message' && !bulkOperationData.message)
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {bulkOperationProgress.status === 'processing' ? 'Processing...' : 'Execute'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
