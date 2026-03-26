'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AcademicYear } from '../types';

// Enhanced TypeScript interfaces
interface AcademicYearsTabProps {
  isDark: boolean;
  academicYears: AcademicYear[];
  canManageSettings: boolean;
  openCreate: (type: string, initialData: any) => void;
  openEdit: (type: string, data: any) => void;
  handleDelete: (entity: string, id: string, name: string) => void;
  handleActivateAcademicYear: (ay: AcademicYear) => void;
}

// Enhanced academic year status types
type AcademicYearStatus = 'active' | 'inactive';

export const AcademicYearsTab: React.FC<AcademicYearsTabProps> = ({
  isDark,
  academicYears,
  canManageSettings,
  openCreate,
  openEdit,
  handleDelete,
  handleActivateAcademicYear,
}) => {
  // Enhanced state management
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Memoized CSS classes with world-class UI template
  const cardClasses = useMemo(() => 
    `backdrop-blur-2xl bg-gradient-to-br ${
      isDark 
        ? 'from-gray-800/90 to-gray-900/90 border-gray-700/50' 
        : 'from-white/90 to-gray-50/90 border-gray-200/50'
    } rounded-3xl shadow-2xl p-6 border backdrop-blur-xl`,
    [isDark]
  );

  const btnPrimaryClasses = useMemo(() =>
    `px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${
      isDark 
        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white' 
        : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
    }`,
    [isDark]
  );

  const btnSecondaryClasses = useMemo(() =>
    `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${
      isDark 
        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
    }`,
    [isDark]
  );

  const btnSuccessClasses = useMemo(() =>
    `px-4 py-2 rounded-lg text-xs font-medium transition-all transform hover:scale-105 shadow-md ${
      isDark 
        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white' 
        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
    }`,
    [isDark]
  );

  // Enhanced handlers with useCallback
  const handleCreate = useCallback(() => {
    openCreate('academicYear', { 
      year: '', 
      name: '', 
      startDate: '', 
      endDate: '', 
      isActive: false 
    });
  }, [openCreate]);

  const handleEdit = useCallback((ay: AcademicYear) => {
    openEdit('academicYear', ay);
  }, [openEdit]);

  const handleActivate = useCallback(async (ay: AcademicYear) => {
    if (!canManageSettings) return;
    
    setActivatingId(ay.id);
    try {
      await handleActivateAcademicYear(ay);
    } catch (error) {
      console.error('Failed to activate academic year:', error);
    } finally {
      setActivatingId(null);
    }
  }, [canManageSettings, handleActivateAcademicYear]);

  const handleDeleteClick = useCallback((ay: AcademicYear) => {
    if (!canManageSettings) return;
    
    setDeletingId(ay.id);
    handleDelete('academicYear', ay.id, ay.name);
    // Reset deleting state after a short delay
    setTimeout(() => setDeletingId(null), 1000);
  }, [canManageSettings, handleDelete]);

  // Memoized academic year statistics
  const statistics = useMemo(() => {
    const active = academicYears.filter(ay => ay.isActive).length;
    const inactive = academicYears.length - active;
    return { active, inactive, total: academicYears.length };
  }, [academicYears]);

  // Memoized sorted academic years
  const sortedAcademicYears = useMemo(() => {
    return [...academicYears].sort((a, b) => {
      // Active years first, then by name descending
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return b.name.localeCompare(a.name);
    });
  }, [academicYears]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cardClasses}
    >
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-gradient-to-br from-purple-600/20 to-purple-700/20' : 'bg-gradient-to-br from-purple-100 to-purple-200'
            }`}
          >
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </motion.div>
          <div>
            <h3 className={`text-xl font-bold bg-gradient-to-r ${isDark ? 'from-purple-400 to-purple-300' : 'from-purple-600 to-purple-500'} bg-clip-text text-transparent`}>
              Academic Calendar
            </h3>
            <div className="flex items-center gap-4 mt-1">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {statistics.total} configured
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statistics.active > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {statistics.active} active
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={btnPrimaryClasses}
          disabled={!canManageSettings}
          onClick={handleCreate}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Academic Year
          </span>
        </motion.button>
      </motion.div>

      {/* Enhanced Empty State */}
      {academicYears.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`text-center py-16 rounded-2xl border-2 border-dashed ${
            isDark 
              ? 'border-purple-600/30 bg-gradient-to-br from-purple-900/20 to-purple-800/20' 
              : 'border-purple-300/50 bg-gradient-to-br from-purple-50/50 to-white/50'
          }`}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-purple-600/20' : 'bg-purple-100'
            }`}
          >
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </motion.div>
          <h4 className={`mt-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            No Academic Years
          </h4>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Get started by creating your first academic calendar year
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`mt-4 ${btnPrimaryClasses}`}
            onClick={handleCreate}
          >
            Create First Academic Year
          </motion.button>
        </motion.div>
      ) : (
        /* Enhanced Academic Years List */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-4"
        >
          <AnimatePresence mode="wait">
            {sortedAcademicYears.map((ay, index) => (
              <motion.div
                key={ay.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className={`p-6 rounded-2xl border backdrop-blur-sm transition-all ${
                  ay.isActive 
                    ? isDark 
                      ? 'bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-600/50 shadow-lg shadow-green-500/20' 
                      : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-300/50 shadow-lg shadow-green-200/50'
                    : isDark 
                      ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-600/50' 
                      : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/50 hover:border-gray-300/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        ay.isActive 
                          ? isDark ? 'bg-gradient-to-br from-green-600/30 to-green-700/30' : 'bg-gradient-to-br from-green-100 to-green-200' 
                          : isDark ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                      }`}
                    >
                      <svg className={`w-6 h-6 ${ay.isActive ? 'text-green-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className={`text-lg font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {ay.name}
                        </h4>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                            ay.isActive 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                              : isDark ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300' : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                          }`}
                        >
                          {ay.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </motion.div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {ay.startDate?.slice(0, 10)} to {ay.endDate?.slice(0, 10)}
                        </p>
                        <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          Created {new Date(ay.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!ay.isActive && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={btnSuccessClasses}
                        disabled={!canManageSettings || activatingId === ay.id}
                        onClick={() => handleActivate(ay)}
                        title="Activate"
                      >
                        <AnimatePresence mode="wait">
                          {activatingId === ay.id ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="w-4 h-4"
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                            </motion.div>
                          ) : (
                            <motion.span
                              key="activate"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Activate
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2.5 rounded-xl transition-all ${
                        isDark 
                          ? 'hover:bg-gray-700 text-gray-400' 
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      onClick={() => handleEdit(ay)}
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2.5 rounded-xl transition-all ${
                        isDark 
                          ? 'hover:bg-red-900/30 text-red-400' 
                          : 'hover:bg-red-50 text-red-500'
                      }`}
                      onClick={() => handleDeleteClick(ay)}
                      title="Delete"
                    >
                      <AnimatePresence mode="wait">
                        {deletingId === ay.id ? (
                          <motion.div
                            key="deleting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-4 h-4"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full"
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="delete"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-4 h-4"
                          >
                            <svg 
                              className="w-4 h-4" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};
