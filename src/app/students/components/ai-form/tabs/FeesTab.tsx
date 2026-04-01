import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { FeesTabProps } from '../types';

const FeesTab: React.FC<FeesTabProps> = ({
  formData,
  onChange,
  errors,
  theme,
  getInputClass,
  getTextClass,
  // Fee related
  feeStructures,
  feesLoading,
  applicableFeeStructures,
  feeCategories,
  feeCalcs,
  tuitionAnnual,
  tuitionFinalTotal,
  // Helpers
  fmtCurrency,
  activeAcademicYear,
}) => {
  const isDark = theme === 'dark';
  
  // Error boundary check
  if (!tuitionAnnual && tuitionAnnual !== 0) {
    // Handle missing tuition data
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {/* Fee Structures */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30' 
          : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-blue-400' : 'text-blue-600'
        }`}>
          <DollarSign className="w-3 h-3" />
          Fee Structures
          {activeAcademicYear && (
            <span className={`text-xs ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              ({activeAcademicYear.name || activeAcademicYear.year})
            </span>
          )}
        </h4>
        
        {feesLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"
            />
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading fee structures...
            </p>
          </motion.div>
        ) : applicableFeeStructures.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-3 rounded-lg border ${
              isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-yellow-500" />
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {!formData.classId 
                  ? 'Please select a class to view fee structures'
                  : 'No fee structures available for this class'
                }
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-1.5">
            {applicableFeeStructures.map((fee, index) => (
              <motion.div
                key={fee.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex justify-between items-center p-2 rounded-lg border transition-all duration-300 ${
                  isDark ? 'border-gray-600/50 bg-gray-800/50' : 'border-gray-200/50 bg-gray-50/50'
                } hover:shadow-md`}
              >
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{fee.name}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {fee.category || 'General'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {fmtCurrency(Number(fee.amount || 0))}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>per year</p>
                </div>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: applicableFeeStructures.length * 0.05 }}
              className={`flex justify-between items-center p-2 rounded-lg ${
                isDark ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50' : 'bg-gradient-to-r from-blue-50 to-purple-50'
              }`}
            >
              <span className={`font-semibold text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Tuition Total:</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span className="text-blue-500 text-sm font-bold">{fmtCurrency(tuitionAnnual)}/year</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Fee Summary */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-700/30' 
          : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-orange-400' : 'text-orange-600'
        }`}>
          <TrendingUp className="w-3 h-3" />
          Fee Summary
        </h4>
        
        <div className="space-y-2">
          {/* Base Tuition */}
          <div className="flex justify-between items-center">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Base Tuition:</span>
            <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {fmtCurrency(tuitionAnnual)}
            </span>
          </div>

          {/* Tuition Discount */}
          {feeCalcs.discountAmount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-between items-center"
            >
              <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>Tuition Discount:</span>
              <span className="text-green-500 text-xs font-bold">
                -{fmtCurrency(feeCalcs.discountAmount)}
              </span>
            </motion.div>
          )}

          {/* Final Tuition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex justify-between items-center p-2 rounded-lg ${
              isDark ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50' : 'bg-gradient-to-r from-blue-50 to-purple-50'
            }`}
          >
            <span className={`text-sm font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Final Tuition:</span>
            <span className="text-blue-500 text-sm font-bold">
              {fmtCurrency(feeCalcs.finalTotal)}/year
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FeesTab;
