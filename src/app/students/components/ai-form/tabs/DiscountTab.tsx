import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Percent, Calculator, Target, Shield, Award, TrendingUp, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { FeesTabProps } from '../types';

const DiscountTab: React.FC<FeesTabProps> = ({
  formData,
  onChange,
  errors,
  theme,
  getInputClass,
  getTextClass,
  // Discount related
  discountData,
  setDiscountData,
  selectedDiscountFeeIds,
  setSelectedDiscountFeeIds,
  // Transport related (for transport discount)
  transportInfo,
  transportDiscount,
  setTransportDiscount,
  transportFeeCalcs,
  // Fee related
  feeCategories,
  feeCalcs,
  applicableFeeStructures,
  // Helpers
  fmtCurrency,
}) => {
  const isDark = theme === 'dark';
  const input = getInputClass();
  
  // Create wider input class for discount fields (slightly wider than original)
  const wideInputClass = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;

  // Handle discount toggle
  const handleDiscountToggle = (hasDiscount: boolean) => {
    setDiscountData({ ...discountData, hasDiscount });
  };

  // Handle transport discount toggle
  const handleTransportDiscountToggle = (hasDiscount: boolean) => {
    setTransportDiscount({ ...transportDiscount, hasDiscount });
  };

  // Field renderer
  const renderField = (field: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea';
    placeholder?: string;
    required?: boolean;
    icon?: React.ComponentType<any>;
    options?: Array<{ value: string; label: string }>;
    rows?: number;
    min?: string | number;
    max?: string | number;
    value?: string | number;
    onChange: (value: any) => void;
  }, sectionIndex: number, fieldIndex: number) => {
    const hasError = errors[field.name];
    const isFilled = field.value;
    const Icon = field.icon || Percent;

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: fieldIndex * 0.03 }}
        className="relative"
      >
        <div className="relative group">
          <div className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-10`}>
            <Icon className={`w-3 h-3 transition-colors duration-200 ${
              hasError ? 'text-red-500' : 
              isFilled ? 'text-green-500' : 
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>

          {field.type === 'select' ? (
            <select
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value)}
              className={`${wideInputClass} pl-7 pr-6 transition-all duration-200 ${
                hasError ? 'border-red-500 focus:border-red-500' :
                isFilled ? 'border-green-500 focus:border-green-500' :
                'border-gray-300 focus:border-blue-500'
              }`}
            >
              <option value="">{field.placeholder}</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              className={`${wideInputClass} pl-7 pr-6 transition-all duration-200 resize-none ${
                hasError ? 'border-red-500 focus:border-red-500' :
                isFilled ? 'border-green-500 focus:border-green-500' :
                'border-gray-300 focus:border-blue-500'
              }`}
            />
          ) : (
            <input
              type={field.type}
              value={field.value || ''}
              onChange={(e) => field.onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              className={`${wideInputClass} pl-7 pr-6 transition-all duration-200 ${
                hasError ? 'border-red-500 focus:border-red-500' :
                isFilled ? 'border-green-500 focus:border-green-500' :
                'border-gray-300 focus:border-blue-500'
              }`}
            />
          )}

          <AnimatePresence>
            {isFilled && !hasError && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute right-1.5 top-1/2 transform -translate-y-1/2"
              >
                <CheckCircle className="w-3 h-3 text-green-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {field.required && !isFilled && (
            <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2">
              <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 mt-0.5 mb-0.5">
          <label className={`text-sm font-medium transition-colors duration-200 ${
            hasError ? 'text-red-500' : 
            isFilled ? 'text-green-500' : 
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {isFilled && !hasError && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-0.5"
            >
              <Sparkles className="w-2 h-2 text-green-500" />
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {hasError && (
            <motion.div
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="flex items-center gap-0.5 mt-0.5"
            >
              <AlertCircle className="w-2.5 h-2.5 text-red-500" />
              <span className="text-xs text-red-500">{errors[field.name]}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {/* Academic Discount */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/30' 
          : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-purple-400' : 'text-purple-600'
        }`}>
          <Percent className="w-3 h-3" />
          Academic Discount
        </h4>
        
        {/* Academic Discount Toggle */}
        <motion.label
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 cursor-pointer select-none p-2 rounded-lg transition-all duration-300"
        >
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              className="sr-only"
              checked={discountData?.hasDiscount || false}
              onChange={e => handleDiscountToggle(e.target.checked)}
            />
            <motion.div
              animate={{ backgroundColor: discountData?.hasDiscount ? '#10b981' : isDark ? '#4b5563' : '#d1d5db' }}
              className="w-8 h-4 rounded-full transition-colors"
            >
              <motion.div
                animate={{ x: discountData?.hasDiscount ? 16 : 0 }}
                className="w-3 h-3 bg-white rounded-full shadow-md"
              />
            </motion.div>
          </div>
          <span className={`text-sm font-medium ${
            discountData?.hasDiscount 
              ? isDark ? 'text-green-400' : 'text-green-600' 
              : isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {discountData?.hasDiscount ? 'Academic Discount Enabled' : 'No Academic Discount'}
          </span>
          {discountData?.hasDiscount && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-auto"
            >
              <Sparkles className="w-3 h-3 text-green-500" />
            </motion.div>
          )}
        </motion.label>

        {/* Academic Discount Details */}
        <AnimatePresence>
          {(discountData?.hasDiscount || false) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 mt-2"
            >
              {/* Category Selection */}
              {renderField({
                name: 'discountCategory',
                label: 'Category',
                type: 'select',
                placeholder: 'Select category',
                options: feeCategories.map(cat => ({ value: cat, label: cat })),
                value: discountData?.discountCategory || '',
                onChange: (value) => setDiscountData({ ...discountData, discountCategory: value }),
                icon: Target
              }, 0, 0)}

              {/* Discount Type */}
              <div className="flex gap-1">
                {[
                  { value: 'percentage', label: '%' },
                  { value: 'fixed', label: '₹' },
                  { value: 'full_waiver', label: '🎓' },
                ].map(opt => (
                  <motion.button
                    key={opt.value}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDiscountData({ 
                      ...discountData, 
                      discountType: opt.value as any, 
                      discountValue: 0 
                    })}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      discountData?.discountType === opt.value
                        ? 'bg-purple-500 text-white shadow-lg'
                        : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>

              {/* Discount Amount */}
              {(discountData?.discountType || 'percentage') !== 'full_waiver' && renderField({
                name: 'discountValue',
                label: (discountData?.discountType || 'percentage') === 'percentage' ? 'Discount %' : 'Discount Amount',
                type: 'number',
                placeholder: (discountData?.discountType || 'percentage') === 'percentage' ? 'Enter %' : 'Enter amount',
                min: 0,
                max: (discountData?.discountType || 'percentage') === 'percentage' ? 100 : feeCalcs.baseTotal,
                value: discountData?.discountValue || 0,
                onChange: (value) => setDiscountData({ ...discountData, discountValue: Number(value) }),
                icon: Calculator
              }, 0, 1)}

              {/* Max Cap (for percentage) */}
              {(discountData?.discountType || 'percentage') === 'percentage' && renderField({
                name: 'maxCapAmount',
                label: 'Max Cap (Optional)',
                type: 'number',
                placeholder: 'Maximum discount amount',
                value: discountData?.maxCapAmount || 0,
                onChange: (value) => setDiscountData({ ...discountData, maxCapAmount: value }),
                icon: Shield
              }, 0, 2)}

              {/* Reason */}
              {renderField({
                name: 'discountReason',
                label: 'Reason',
                type: 'textarea',
                placeholder: 'Reason for academic discount',
                required: true,
                rows: 2,
                value: discountData?.reason || '',
                onChange: (value) => setDiscountData({ ...discountData, reason: value }),
                icon: Award
              }, 0, 3)}

              {/* Selected Fees Count */}
              {selectedDiscountFeeIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-2 rounded-lg border ${
                    isDark ? 'border-blue-600/50 bg-blue-900/20' : 'border-blue-200/50 bg-blue-50/50'
                  }`}
                >
                  <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {selectedDiscountFeeIds.length} fee(s) selected for discount
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transport Discount */}
      {formData.transport === 'Yes' && transportInfo?.routeId && (
        <div className={`p-2 rounded-lg border ${
          isDark 
            ? 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/30' 
            : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50'
        }`}>
          <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
            isDark ? 'text-green-400' : 'text-green-600'
          }`}>
            <Calculator className="w-3 h-3" />
            Transport Discount
          </h4>
          
          {/* Transport Discount Toggle */}
          <motion.label
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 cursor-pointer select-none p-2 rounded-lg transition-all duration-300"
          >
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={transportDiscount?.hasDiscount || false}
                onChange={e => handleTransportDiscountToggle(e.target.checked)}
              />
              <motion.div
                animate={{ backgroundColor: transportDiscount?.hasDiscount ? '#10b981' : isDark ? '#4b5563' : '#d1d5db' }}
                className="w-8 h-4 rounded-full transition-colors"
              >
                <motion.div
                  animate={{ x: transportDiscount?.hasDiscount ? 16 : 0 }}
                  className="w-3 h-3 bg-white rounded-full shadow-md"
                />
              </motion.div>
            </div>
            <span className={`text-sm font-medium ${
              transportDiscount?.hasDiscount 
                ? isDark ? 'text-green-400' : 'text-green-600' 
                : isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {transportDiscount?.hasDiscount ? 'Transport Discount Enabled' : 'No Transport Discount'}
            </span>
          </motion.label>

          {/* Transport Discount Details */}
          <AnimatePresence>
            {(transportDiscount?.hasDiscount || false) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {/* Discount Type */}
                <div className="flex gap-1">
                  {[
                    { value: 'percentage', label: '%' },
                    { value: 'fixed', label: '₹' },
                    { value: 'full_waiver', label: '🎓' },
                  ].map(opt => (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTransportDiscount({ 
                        ...transportDiscount, 
                        discountType: opt.value as any, 
                        discountValue: 0 
                      })}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        transportDiscount.discountType === opt.value
                          ? 'bg-green-500 text-white shadow-lg'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>

                {/* Discount Amount */}
                {transportDiscount.discountType !== 'full_waiver' && renderField({
                  name: 'transportDiscountValue',
                  label: transportDiscount.discountType === 'percentage' ? 'Discount %' : 'Discount Amount',
                  type: 'number',
                  placeholder: transportDiscount.discountType === 'percentage' ? 'Enter %' : 'Enter amount',
                  min: 0,
                  max: transportDiscount.discountType === 'percentage' ? 100 : transportFeeCalcs.baseAnnual,
                  value: transportDiscount.discountValue,
                  onChange: (value) => setTransportDiscount({ ...transportDiscount, discountValue: Number(value) }),
                  icon: Calculator
                }, 0, 0)}

                {/* Reason */}
                {renderField({
                  name: 'transportDiscountReason',
                  label: 'Reason',
                  type: 'textarea',
                  placeholder: 'Reason for transport discount',
                  required: true,
                  rows: 2,
                  value: transportDiscount.reason,
                  onChange: (value) => setTransportDiscount({ ...transportDiscount, reason: value }),
                  icon: Award
                }, 0, 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Discount Summary */}
      {(discountData?.hasDiscount || transportDiscount?.hasDiscount) && (
        <div className={`p-2 rounded-lg border ${
          isDark 
            ? 'bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-700/30' 
            : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50'
        }`}>
          <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
            isDark ? 'text-orange-400' : 'text-orange-600'
          }`}>
            <TrendingUp className="w-3 h-3" />
            Discount Summary
          </h4>
          
          <div className="space-y-2">
            {/* Academic Discount */}
            {(discountData?.hasDiscount || false) && feeCalcs.discountAmount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center"
              >
                <span className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Academic Discount:</span>
                <span className="text-purple-500 text-xs font-bold">
                  -{fmtCurrency(feeCalcs.discountAmount)}
                </span>
              </motion.div>
            )}

            {/* Transport Discount */}
            {transportDiscount.hasDiscount && transportFeeCalcs.discountAmount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center"
              >
                <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>Transport Discount:</span>
                <span className="text-green-500 text-xs font-bold">
                  -{fmtCurrency(transportFeeCalcs.discountAmount)}
                </span>
              </motion.div>
            )}

            {/* Total Discount */}
            {(feeCalcs.discountAmount > 0 || transportFeeCalcs.discountAmount > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex justify-between items-center p-2 rounded-lg ${
                  isDark ? 'bg-gradient-to-r from-orange-900/50 to-red-900/50' : 'bg-gradient-to-r from-orange-50 to-red-50'
                }`}
              >
                <span className={`text-sm font-bold ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>Total Discount:</span>
                <span className="text-orange-500 text-sm font-bold">
                  -{fmtCurrency(feeCalcs.discountAmount + transportFeeCalcs.discountAmount)}
                </span>
              </motion.div>
            )}

            {/* Final Amounts */}
            {feeCalcs.discountAmount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center"
              >
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Final Tuition:</span>
                <span className="text-purple-500 text-xs font-bold">
                  {fmtCurrency(feeCalcs.finalTotal)}
                </span>
              </motion.div>
            )}

            {transportDiscount.hasDiscount && transportInfo.routeId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center"
              >
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Final Transport:</span>
                <span className="text-green-500 text-xs font-bold">
                  {fmtCurrency(transportFeeCalcs.finalAnnual)}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountTab;
