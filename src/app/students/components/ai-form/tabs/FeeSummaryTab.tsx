import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Sparkles, Calculator, Bus, Percent } from 'lucide-react';
import { FeesTabProps } from '../types';

const FeeSummaryTab: React.FC<FeesTabProps> = ({
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
  // Transport related
  transportInfo,
  transportFeeCalcs,
  // Discount related
  discountData,
  transportDiscount,
  // Combined total
  combinedAnnual,
  // Helpers
  fmtCurrency,
  activeAcademicYear,
}) => {
  console.log('FeeSummaryTab rendered with tuitionAnnual:', tuitionAnnual);
  console.log('FeeSummaryTab rendered with combinedAnnual:', combinedAnnual);
  
  const isDark = theme === 'dark';

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
        ) : (applicableFeeStructures || []).length === 0 ? (
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
            {(applicableFeeStructures || []).map((fee, index) => (
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
              transition={{ delay: (applicableFeeStructures || []).length * 0.05 }}
              className={`flex justify-between items-center p-2 rounded-lg ${
                isDark ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50' : 'bg-gradient-to-r from-blue-50 to-purple-50'
              }`}
            >
              <span className={`font-semibold text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Base Tuition:</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span className="text-blue-500 text-sm font-bold">{fmtCurrency(tuitionAnnual)}/year</span>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Complete Fee Summary */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-700/30' 
          : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-orange-400' : 'text-orange-600'
        }`}>
          <Calculator className="w-3 h-3" />
          Complete Fee Summary
        </h4>
        
        <div className="space-y-2">
          {/* Academic Fees */}
          <div className={`p-2 rounded-lg border ${
            isDark ? 'border-blue-600/50 bg-blue-900/20' : 'border-blue-200/50 bg-blue-50/50'
          }`}>
            <h5 className={`text-xs font-semibold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Academic Fees
            </h5>
            
            {/* Base Tuition */}
            <div className="flex justify-between items-center">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Base Tuition:</span>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {fmtCurrency(tuitionAnnual)}
              </span>
            </div>

            {/* Academic Discount */}
            {feeCalcs.discountAmount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center"
              >
                <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  Academic Discount:
                </span>
                <span className="text-green-500 text-xs font-bold">
                  -{fmtCurrency(feeCalcs.discountAmount)}
                </span>
              </motion.div>
            )}

            {/* Final Academic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex justify-between items-center p-1 rounded ${
                isDark ? 'bg-blue-800/50' : 'bg-blue-100/50'
              }`}
            >
              <span className={`text-xs font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Final Academic:</span>
              <span className="text-blue-500 text-xs font-bold">
                {fmtCurrency(feeCalcs.finalTotal)}
              </span>
            </motion.div>
          </div>

          {/* Transport Fees */}
          {formData.transport === 'Yes' && transportInfo.routeId && (
            <div className={`p-2 rounded-lg border ${
              isDark ? 'border-green-600/50 bg-green-900/20' : 'border-green-200/50 bg-green-50/50'
            }`}>
              <h5 className={`text-xs font-semibold mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                Transport Fees
              </h5>
              
              {/* Base Transport */}
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Base Transport:</span>
                <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {fmtCurrency(transportInfo.yearlyFee || transportInfo.monthlyFee * 12)}
                </span>
              </div>

              {/* Transport Discount */}
              {transportDiscount.hasDiscount && transportFeeCalcs.discountAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-between items-center"
                >
                  <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    Transport Discount:
                  </span>
                  <span className="text-green-500 text-xs font-bold">
                    -{fmtCurrency(transportFeeCalcs.discountAmount)}
                  </span>
                </motion.div>
              )}

              {/* Final Transport */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex justify-between items-center p-1 rounded ${
                  isDark ? 'bg-green-800/50' : 'bg-green-100/50'
                }`}
              >
                <span className={`text-xs font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>Final Transport:</span>
                <span className="text-green-500 text-xs font-bold">
                  {fmtCurrency(transportFeeCalcs.finalAnnual)}
                </span>
              </motion.div>
            </div>
          )}

          {/* Total Discount */}
          {(feeCalcs.discountAmount > 0 || transportFeeCalcs.discountAmount > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-2 rounded-lg border ${
                isDark ? 'border-purple-600/50 bg-purple-900/20' : 'border-purple-200/50 bg-purple-50/50'
              }`}
            >
              <h5 className={`text-xs font-semibold mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                Total Savings
              </h5>
              
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Total Discount:</span>
                <span className="text-purple-500 text-sm font-bold">
                  -{fmtCurrency(feeCalcs.discountAmount + transportFeeCalcs.discountAmount)}
                </span>
              </div>
            </motion.div>
          )}

          {/* Grand Total */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex justify-between items-center p-2 rounded-lg ${
              isDark ? 'bg-gradient-to-r from-orange-900/50 to-red-900/50' : 'bg-gradient-to-r from-orange-50 to-red-50'
            }`}
          >
            <span className={`text-sm font-bold ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>Grand Total:</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-orange-500" />
              <span className="text-orange-500 text-sm font-bold">
                {fmtCurrency(combinedAnnual)}/year
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/30' 
          : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-purple-400' : 'text-purple-600'
        }`}>
          <TrendingUp className="w-3 h-3" />
          Payment Schedule
        </h4>
        
        <div className="space-y-2">
          {/* Monthly Breakdown */}
          <div className={`p-2 rounded-lg border ${
            isDark ? 'border-purple-600/50 bg-purple-900/20' : 'border-purple-200/50 bg-purple-50/50'
          }`}>
            <h5 className={`text-xs font-semibold mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              Monthly Payment
            </h5>
            
            <div className="flex justify-between items-center">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Per Month:</span>
              <span className={`text-xs font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                {fmtCurrency(combinedAnnual / 12)}
              </span>
            </div>
            
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>For 12 Months:</span>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {fmtCurrency(combinedAnnual)}
              </span>
            </div>
          </div>

          {/* Quarter Breakdown */}
          <div className={`p-2 rounded-lg border ${
            isDark ? 'border-purple-600/50 bg-purple-900/20' : 'border-purple-200/50 bg-purple-50/50'
          }`}>
            <h5 className={`text-xs font-semibold mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              Quarterly Payment
            </h5>
            
            <div className="flex justify-between items-center">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Per Quarter:</span>
              <span className={`text-xs font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                {fmtCurrency(combinedAnnual / 4)}
              </span>
            </div>
            
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>For 4 Quarters:</span>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {fmtCurrency(combinedAnnual)}
              </span>
            </div>
          </div>

          {/* Key Information */}
          <div className={`p-2 rounded-lg border ${
            isDark ? 'border-blue-600/50 bg-blue-900/20' : 'border-blue-200/50 bg-blue-50/50'
          }`}>
            <h5 className={`text-xs font-semibold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Key Information
            </h5>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Academic Year: {activeAcademicYear?.name || activeAcademicYear?.year || 'N/A'}
                </span>
              </div>
              
              {formData.classId && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Class: {formData.class || 'Selected'}
                  </span>
                </div>
              )}
              
              {formData.transport === 'Yes' && transportInfo.routeId && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Transport: {transportInfo.routeNumber} {transportInfo.routeName}
                  </span>
                </div>
              )}
              
              {(discountData.hasDiscount || transportDiscount.hasDiscount) && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Discounts Applied
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeSummaryTab;
