import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, MapPin, Navigation, TrendingUp, AlertCircle, CheckCircle, Sparkles, Calculator, Award } from 'lucide-react';
import { FeesTabProps } from '../types';

const TransportTab: React.FC<FeesTabProps> = ({
  formData,
  onChange,
  errors,
  theme,
  getInputClass,
  getTextClass,
  // Transport related
  transportRoutes,
  transportInfo,
  setTransportInfo,
  transportDiscount,
  setTransportDiscount,
  selectedRoute,
  transportFeeCalcs,
  // Helpers
  fmtCurrency,
}) => {
  const isDark = theme === 'dark';
  const input = getInputClass();

  // Consistent input class for all tabs
  const consistentInputClass = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;

  // Handle transport route change
  const handleRouteChange = (routeId: string) => {
    const route = (transportRoutes || []).find(r => r.id === routeId);
    if (route) {
      const stops = route.stops ? 
        (typeof route.stops === 'string' ? JSON.parse(route.stops) : route.stops) : [];
      
      setTransportInfo({
        routeId,
        pickupStop: stops[0] || '',
        dropStop: stops[stops.length - 1] || '',
        monthlyFee: route.monthlyFee || 0,
        yearlyFee: route.yearlyFee || 0,
        routeName: route.routeName || route.name || '',
        routeNumber: route.routeNumber || '',
      });
    } else {
      setTransportInfo({
        routeId: '',
        pickupStop: '',
        dropStop: '',
        monthlyFee: 0,
        yearlyFee: 0,
        routeName: '',
        routeNumber: '',
      });
    }
  };

  // Handle transport toggle
  const handleTransportToggle = (enabled: boolean) => {
    onChange('transport', enabled ? 'Yes' : 'No');
    if (!enabled) {
      setTransportInfo({
        routeId: '',
        pickupStop: '',
        dropStop: '',
        monthlyFee: 0,
        yearlyFee: 0,
        routeName: '',
        routeNumber: '',
      });
    }
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
    const Icon = field.icon || Bus;

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
              className={`${consistentInputClass} pl-7 pr-6 transition-all duration-200 ${
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
              className={`${input} pl-7 pr-6 text-sm py-1.5 transition-all duration-200 resize-none ${
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
              className={`${consistentInputClass} pl-7 pr-6 transition-all duration-200 ${
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
      {/* Transport Service */}
      <div className={`p-2 rounded-lg border ${
        isDark 
          ? 'bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/30' 
          : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
          isDark ? 'text-green-400' : 'text-green-600'
        }`}>
          <Bus className="w-3 h-3" />
          Transport Service
        </h4>
        
        {/* Transport Toggle */}
        <motion.label
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 cursor-pointer select-none p-2 rounded-lg transition-all duration-300"
        >
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              className="sr-only"
              checked={formData.transport === 'Yes'}
              onChange={e => handleTransportToggle(e.target.checked)}
            />
            <motion.div
              animate={{ backgroundColor: formData.transport === 'Yes' ? '#10b981' : isDark ? '#4b5563' : '#d1d5db' }}
              className="w-8 h-4 rounded-full transition-colors"
            >
              <motion.div
                animate={{ x: formData.transport === 'Yes' ? 16 : 0 }}
                className="w-3 h-3 bg-white rounded-full shadow-md"
              />
            </motion.div>
          </div>
          <span className={`text-sm font-medium ${
            formData.transport === 'Yes' 
              ? isDark ? 'text-green-400' : 'text-green-600' 
              : isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {formData.transport === 'Yes' ? 'Transport Enabled' : 'No Transport'}
          </span>
          {formData.transport === 'Yes' && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-auto"
            >
              <Sparkles className="w-3 h-3 text-green-500" />
            </motion.div>
          )}
        </motion.label>

        {/* Transport Details */}
        <AnimatePresence>
          {formData.transport === 'Yes' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 mt-2"
            >
              {/* Route Selection */}
              {renderField({
                name: 'transportRoute',
                label: 'Route',
                type: 'select',
                placeholder: 'Select route',
                options: (transportRoutes || []).map(route => ({
                  value: route.id,
                  label: `${route.routeNumber || ''} ${route.routeName || route.name} - ${fmtCurrency(route.monthlyFee || 0)}/mo`
                })),
                value: transportInfo?.routeId || '',
                onChange: handleRouteChange,
                icon: Bus
              }, 0, 0)}

              {/* Pickup Stop */}
              {transportInfo.routeId && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  {renderField({
                    name: 'pickupStop',
                    label: 'Pickup Stop *',
                    type: 'select',
                    placeholder: 'Select pickup stop',
                    required: true,
                    options: (() => {
                      const route = transportRoutes?.find(r => r.id === transportInfo.routeId);
                      if (!route?.stops) return [];
                      const stops = typeof route.stops === 'string' ? JSON.parse(route.stops) : route.stops;
                      return stops.map((stop: string) => ({
                        value: stop,
                        label: stop
                      }));
                    })(),
                    value: transportInfo.pickupStop,
                    onChange: (value) => setTransportInfo({ ...transportInfo, pickupStop: value }),
                    icon: MapPin
                  }, 0, 1)}

                  {renderField({
                    name: 'dropStop',
                    label: 'Drop Stop (Optional)',
                    type: 'select',
                    placeholder: 'Select drop stop',
                    options: (() => {
                      const route = transportRoutes?.find(r => r.id === transportInfo.routeId);
                      if (!route?.stops) return [];
                      const stops = typeof route.stops === 'string' ? JSON.parse(route.stops) : route.stops;
                      return stops.map((stop: string) => ({
                        value: stop,
                        label: stop
                      }));
                    })(),
                    value: transportInfo.dropStop,
                    onChange: (value) => setTransportInfo({ ...transportInfo, dropStop: value }),
                    icon: Navigation
                  }, 0, 2)}
                </motion.div>
              )}

              {/* Transport Fee Summary */}
              {transportInfo.routeId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-2 rounded-lg border ${
                    isDark ? 'border-green-600/50 bg-green-900/20' : 'border-green-200/50 bg-green-50/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>Monthly:</span>
                      <span className="text-green-500 text-xs font-bold">
                        {fmtCurrency(transportInfo.monthlyFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>Yearly:</span>
                      <span className="text-green-500 text-xs font-bold">
                        {fmtCurrency(transportInfo.yearlyFee || transportInfo.monthlyFee * 12)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transport Discount */}
      {formData.transport === 'Yes' && transportInfo.routeId && (
        <div className={`p-2 rounded-lg border ${
          isDark 
            ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/30' 
            : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50'
        }`}>
          <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
            isDark ? 'text-purple-400' : 'text-purple-600'
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
                checked={transportDiscount.hasDiscount}
                onChange={e => setTransportDiscount({ ...transportDiscount, hasDiscount: e.target.checked })}
              />
              <motion.div
                animate={{ backgroundColor: transportDiscount.hasDiscount ? '#10b981' : isDark ? '#4b5563' : '#d1d5db' }}
                className="w-8 h-4 rounded-full transition-colors"
              >
                <motion.div
                  animate={{ x: transportDiscount.hasDiscount ? 16 : 0 }}
                  className="w-3 h-3 bg-white rounded-full shadow-md"
                />
              </motion.div>
            </div>
            <span className={`text-sm font-medium ${
              transportDiscount.hasDiscount 
                ? isDark ? 'text-green-400' : 'text-green-600' 
                : isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {transportDiscount.hasDiscount ? 'Transport Discount' : 'No Transport Discount'}
            </span>
          </motion.label>

          {/* Transport Discount Details */}
          <AnimatePresence>
            {transportDiscount.hasDiscount && transportInfo.routeId && (
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
                          ? 'bg-purple-500 text-white shadow-lg'
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

                {/* Transport Discount Summary */}
                {transportFeeCalcs.discountAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-2 rounded-lg border ${
                      isDark ? 'border-green-600/50 bg-green-900/20' : 'border-green-200/50 bg-green-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        Transport Discount:
                      </span>
                      <span className="text-green-500 text-xs font-bold">
                        -{fmtCurrency(transportFeeCalcs.discountAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Final Transport Fee:
                      </span>
                      <span className="text-green-500 text-sm font-bold">
                        {fmtCurrency(transportFeeCalcs.finalAnnual)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Transport Summary */}
      {formData.transport === 'Yes' && transportInfo.routeId && (
        <div className={`p-2 rounded-lg border ${
          isDark 
            ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/30' 
            : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'
        }`}>
          <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1 ${
            isDark ? 'text-blue-400' : 'text-blue-600'
          }`}>
            <TrendingUp className="w-3 h-3" />
            Transport Summary
          </h4>
          
          <div className="space-y-2">
            {/* Route Info */}
            <div className="flex justify-between items-center">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Route:</span>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {transportInfo.routeNumber} {transportInfo.routeName}
              </span>
            </div>

            {/* Pickup/Drop */}
            {transportInfo.pickupStop && (
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pickup:</span>
                <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {transportInfo.pickupStop}
                </span>
              </div>
            )}

            {transportInfo.dropStop && (
              <div className="flex justify-between items-center">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Drop:</span>
                <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {transportInfo.dropStop}
                </span>
              </div>
            )}

            {/* Base Transport Fee */}
            <div className="flex justify-between items-center">
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Base Fee:</span>
              <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {fmtCurrency(transportInfo.yearlyFee || transportInfo.monthlyFee * 12)}
              </span>
            </div>

            {/* Transport Discount */}
            {transportFeeCalcs.discountAmount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center"
              >
                <span className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>Discount:</span>
                <span className="text-green-500 text-xs font-bold">
                  -{fmtCurrency(transportFeeCalcs.discountAmount)}
                </span>
              </motion.div>
            )}

            {/* Final Transport Total */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex justify-between items-center p-2 rounded-lg ${
                isDark ? 'bg-gradient-to-r from-green-900/50 to-blue-900/50' : 'bg-gradient-to-r from-green-50 to-blue-50'
              }`}
            >
              <span className={`text-sm font-bold ${isDark ? 'text-green-300' : 'text-green-700'}`}>Final Transport:</span>
              <span className="text-green-500 text-sm font-bold">
                {fmtCurrency(transportFeeCalcs.finalAnnual)}/year
              </span>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportTab;
