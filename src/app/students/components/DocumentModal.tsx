// @ts-nocheck
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student } from '../types';

interface DocumentModalProps {
  deleteDocument: any; documentManagement: any; downloadDocument: any; formatFileSize: any; getFilteredDocuments: any; getStoragePercentage: any; handleFileUpload: any; setDocumentManagement: any; shareDocument: any; theme: any;
}

export default function DocumentModal({ deleteDocument, documentManagement, downloadDocument, formatFileSize, getFilteredDocuments, getStoragePercentage, handleFileUpload, setDocumentManagement, shareDocument, theme }: DocumentModalProps) {
  return (
    <>
      {/* Document Management Modal */}
      <AnimatePresence>
        {documentManagement.showDocumentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={() => setDocumentManagement(prev => ({ ...prev, showDocumentModal: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`relative w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl border ${
                theme === 'dark' 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      📁 Document Management
                    </h3>
                    <button
                      onClick={() => setDocumentManagement(prev => ({ ...prev, showDocumentModal: false }))}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {/* Storage Stats */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <div className={`text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Storage Used
                      </div>
                      <div className={`text-lg font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatFileSize(documentManagement.storageStats.usedStorage)} / {formatFileSize(documentManagement.storageStats.totalStorage)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getStoragePercentage()}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <div className={`text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Total Files
                      </div>
                      <div className={`text-lg font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {documentManagement.storageStats.totalFiles}
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}>
                      <div className={`text-sm font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        File Types
                      </div>
                      <div className="flex gap-2">
                        {Object.entries(documentManagement.storageStats.fileTypes).slice(0, 3).map(([type, count]) => (
                          <span key={type} className={`text-xs px-2 py-1 rounded ${
                            theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {type.toUpperCase()}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className={`px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <div className="flex flex-wrap gap-4 items-center">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Search documents..."
                        value={documentManagement.searchQuery}
                        onChange={(e) => setDocumentManagement(prev => ({ ...prev, searchQuery: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>

                    {/* Category Filter */}
                    <select
                      value={documentManagement.filterCategory}
                      onChange={(e) => setDocumentManagement(prev => ({ ...prev, filterCategory: e.target.value }))}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="all">All Categories</option>
                      {documentManagement.documentCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>

                    {/* Sort */}
                    <select
                      value={`${documentManagement.sortBy}-${documentManagement.sortOrder}`}
                      onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        setDocumentManagement(prev => ({ 
                          ...prev, 
                          sortBy: sortBy as any,
                          sortOrder: sortOrder as 'asc' | 'desc'
                        }));
                      }}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="uploadedAt-desc">Newest First</option>
                      <option value="uploadedAt-asc">Oldest First</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                      <option value="size-desc">Largest First</option>
                      <option value="size-asc">Smallest First</option>
                    </select>

                    {/* Upload Button */}
                    <label className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}>
                      📤 Upload Files
                      <input
                        type="file"
                        multiple
                        accept={documentManagement.allowedFileTypes.flatMap(type => type.extensions).join(',')}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && documentManagement.selectedStudent) {
                            handleFileUpload(files, documentManagement.selectedStudent.id, 'other', '');
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto px-6 py-4">
                    {/* Upload Progress */}
                    {documentManagement.uploadStatus === 'uploading' && (
                      <div className={`mb-4 p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-blue-900/50 border-blue-800' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className={`flex items-center justify-between mb-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          <span className="text-sm">Uploading files...</span>
                          <span className="text-sm">{documentManagement.uploadProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${documentManagement.uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Upload Results */}
                    {documentManagement.uploadStatus !== 'idle' && (
                      <div className={`mb-4 p-4 rounded-lg ${
                        documentManagement.uploadStatus === 'success'
                          ? theme === 'dark' ? 'bg-green-900/50 border-green-800' : 'bg-green-50 border-green-200'
                          : theme === 'dark' ? 'bg-red-900/50 border-red-800' : 'bg-red-50 border-red-200'
                      }`}>
                        <h4 className={`font-medium mb-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {documentManagement.uploadStatus === 'success' ? '✅ Upload Completed' : '❌ Upload Failed'}
                        </h4>
                        
                        {documentManagement.uploadErrors.length > 0 && (
                          <div className={`text-sm ${
                            theme === 'dark' ? 'text-red-400' : 'text-red-600'
                          }`}>
                            <div className="font-medium mb-1">Errors:</div>
                            <ul className="space-y-1">
                              {documentManagement.uploadErrors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getFilteredDocuments().map((document) => {
                        const category = documentManagement.documentCategories.find(c => c.id === document.category);
                        const fileType = documentManagement.allowedFileTypes.find(type => 
                          type.extensions.some(ext => document.name.toLowerCase().endsWith(ext))
                        );

                        return (
                          <div
                            key={document.id}
                            className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                              theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{fileType?.icon || '📄'}</span>
                                <div>
                                  <h4 className={`font-medium text-sm truncate ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {document.name}
                                  </h4>
                                  <div className={`text-xs ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {formatFileSize(document.size)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {category?.icon} {category?.name}
                                </span>
                                {document.isPublic && (
                                  <span className="text-xs">🌐</span>
                                )}
                              </div>
                            </div>

                            <div className={`text-xs mb-3 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <div>Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</div>
                              <div>By: {document.uploadedBy}</div>
                              {document.expiryDate && (
                                <div>Expires: {new Date(document.expiryDate).toLocaleDateString()}</div>
                              )}
                            </div>

                            {document.description && (
                              <div className={`text-xs mb-3 ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {document.description}
                              </div>
                            )}

                            {document.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {document.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className={`text-xs px-2 py-1 rounded ${
                                      theme === 'dark'
                                        ? 'bg-gray-700 text-gray-300'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={() => downloadDocument(document)}
                                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                                  theme === 'dark'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                📥 Download
                              </button>
                              <button
                                onClick={() => shareDocument(document.id, !document.isPublic)}
                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                  document.isPublic
                                    ? theme === 'dark'
                                      ? 'bg-green-600 hover:bg-green-700 text-white'
                                      : 'bg-green-500 hover:bg-green-600 text-white'
                                    : theme === 'dark'
                                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                                }`}
                              >
                                {document.isPublic ? '🔓' : '🔒'}
                              </button>
                              <button
                                onClick={() => deleteDocument(document.id)}
                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                  theme === 'dark'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {getFilteredDocuments().length === 0 && (
                      <div className={`text-center py-12 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <div className="text-4xl mb-4">📁</div>
                        <p>No documents found</p>
                        <p className="text-sm mt-2">Upload files to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
