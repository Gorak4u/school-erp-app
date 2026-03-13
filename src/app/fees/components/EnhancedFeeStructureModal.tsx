// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

interface EnhancedFeeStructureModalProps {
  feeStructureForm: any;
  handleCreateFeeStructure: any;
  setFeeStructureForm: any;
  setShowFeeStructureModal: any;
  showFeeStructureModal: any;
  theme: any;
  userRole?: string;
  editingStructure?: any;
}

export default function EnhancedFeeStructureModal({ 
  feeStructureForm, 
  handleCreateFeeStructure, 
  setFeeStructureForm, 
  setShowFeeStructureModal, 
  showFeeStructureModal, 
  theme,
  userRole = 'admin',
  editingStructure
}: EnhancedFeeStructureModalProps) {
  const { dropdowns } = useSchoolConfig();
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());

  // Check if user has permission to manage fee structures
  const canManageFees = ['super_admin', 'admin', 'principal'].includes(userRole);
  const canViewOnly = ['teacher', 'accountant'].includes(userRole);

  const handleClassGroupChange = (group: string, checked: boolean) => {
    const updated = new Set(selectedClassIds);
    if (checked) updated.add(group); else updated.delete(group);
    setSelectedClassIds(updated);
    setFeeStructureForm({ ...feeStructureForm, applicableClasses: Array.from(updated) });
  };

  const getPermissionBadge = () => {
    if (!canManageFees && !canViewOnly) {
      return (
        <div className={`mb-4 p-3 rounded-lg ${
          theme === 'dark' ? 'bg-red-500/20 border border-red-500/50' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm font-medium ${
            theme === 'dark' ? 'text-red-400' : 'text-red-700'
          }`}>
            🔒 Access Restricted
          </p>
          <p className={`text-xs mt-1 ${
            theme === 'dark' ? 'text-red-300' : 'text-red-600'
          }`}>
            You don't have permission to manage fee structures. Required roles: Super Admin, Admin, or Principal.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <AnimatePresence>
        {showFeeStructureModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowFeeStructureModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-xl ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {editingStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}
                </h3>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                  }`}>
                    Role: {userRole.replace('_', ' ').toUpperCase()}
                  </span>
                  <button
                    onClick={() => setShowFeeStructureModal(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {getPermissionBadge()}

              {/* Tabs */}
              <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                {['basic', 'applicability', 'settings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 px-1 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? theme === 'dark' 
                          ? 'text-blue-400 border-b-2 border-blue-400' 
                          : 'text-blue-600 border-b-2 border-blue-600'
                        : theme === 'dark' 
                          ? 'text-gray-400 hover:text-gray-300' 
                          : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {/* Basic Information Tab */}
                {activeTab === 'basic' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Fee Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Annual Tuition Fee"
                        value={feeStructureForm.name}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, name: e.target.value })}
                        disabled={!canManageFees}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          !canManageFees ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Category *
                      </label>
                      <select
                        value={feeStructureForm.category}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, category: e.target.value })}
                        disabled={!canManageFees}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          !canManageFees ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select Category</option>
                        <option value="tuition">Tuition Fee</option>
                        <option value="transport">Transport Fee</option>
                        <option value="hostel">Hostel Fee</option>
                        <option value="library">Library Fee</option>
                        <option value="lab">Laboratory Fee</option>
                        <option value="exam">Examination Fee</option>
                        <option value="sports">Sports Fee</option>
                        <option value="technology">Technology Fee</option>
                        <option value="development">Development Fee</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={feeStructureForm.amount}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, amount: parseFloat(e.target.value) || 0 })}
                        disabled={!canManageFees}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          !canManageFees ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Frequency *
                      </label>
                      <select
                        value={feeStructureForm.frequency}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, frequency: e.target.value })}
                        disabled={!canManageFees}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          !canManageFees ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half-yearly">Half-Yearly</option>
                        <option value="yearly">Yearly</option>
                        <option value="one-time">One-Time</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Due Date (Day of Month)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="15"
                        value={feeStructureForm.dueDate}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, dueDate: parseInt(e.target.value) || 1 })}
                        disabled={!canManageFees}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          !canManageFees ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Late Fee (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={feeStructureForm.lateFee}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, lateFee: parseFloat(e.target.value) || 0 })}
                        disabled={!canManageFees}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          !canManageFees ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Description
                      </label>
                      <textarea
                        placeholder="Enter fee description..."
                        value={feeStructureForm.description}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, description: e.target.value })}
                        disabled={!canManageFees}
                        rows={3}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          !canManageFees ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* Applicability Tab */}
                {activeTab === 'applicability' && (
                  <div className="space-y-6">
                    {/* Class Groups */}
                    <div>
                      <h4 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Applicable Classes
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {dropdowns.classes.map((cls) => (
                          <label key={cls.value} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedClassIds.has(cls.value)}
                              onChange={(e) => handleClassGroupChange(cls.value, e.target.checked)}
                              disabled={!canManageFees}
                              className={`rounded ${!canManageFees ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {cls.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    <div>
                      <h4 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Student Categories
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'].map((category) => (
                          <label key={category} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(feeStructureForm.applicableCategories || []).includes(category)}
                              onChange={(e) => {
                                const categories = feeStructureForm.applicableCategories || [];
                                if (e.target.checked) {
                                  setFeeStructureForm({ 
                                    ...feeStructureForm, 
                                    applicableCategories: [...categories, category] 
                                  });
                                } else {
                                  setFeeStructureForm({ 
                                    ...feeStructureForm, 
                                    applicableCategories: categories.filter(c => c !== category) 
                                  });
                                }
                              }}
                              disabled={!canManageFees}
                              className={`rounded ${!canManageFees ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {category}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Language Medium */}
                    <div>
                      <h4 className={`text-lg font-medium mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Language Medium
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam'].map((medium) => (
                          <label key={medium} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(feeStructureForm.applicableMediums || []).includes(medium)}
                              onChange={(e) => {
                                const mediums = feeStructureForm.applicableMediums || [];
                                if (e.target.checked) {
                                  setFeeStructureForm({ 
                                    ...feeStructureForm, 
                                    applicableMediums: [...mediums, medium] 
                                  });
                                } else {
                                  setFeeStructureForm({ 
                                    ...feeStructureForm, 
                                    applicableMediums: mediums.filter(m => m !== medium) 
                                  });
                                }
                              }}
                              disabled={!canManageFees}
                              className={`rounded ${!canManageFees ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {medium}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feeStructureForm.isActive}
                          onChange={(e) => setFeeStructureForm({ ...feeStructureForm, isActive: e.target.checked })}
                          disabled={!canManageFees}
                          className={`rounded ${!canManageFees ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Active
                        </span>
                      </label>
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Only active fee structures will be applied to new admissions
                      </p>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Academic Year
                      </label>
                      <input
                        type="text"
                        placeholder="2024-25"
                        value={feeStructureForm.academicYear}
                        onChange={(e) => setFeeStructureForm({ ...feeStructureForm, academicYear: e.target.value })}
                        disabled={!canManageFees}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          !canManageFees ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                {canManageFees ? (
                  <>
                    <button
                      onClick={handleCreateFeeStructure}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {editingStructure ? 'Update Structure' : 'Create Structure'}
                    </button>
                    <button
                      onClick={() => setShowFeeStructureModal(false)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-gray-600 hover:bg-gray-700 text-white'
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                      }`}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowFeeStructureModal(false)}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
