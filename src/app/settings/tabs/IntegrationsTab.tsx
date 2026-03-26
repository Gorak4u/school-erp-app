'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced TypeScript interfaces
interface SMTPConfig {
  host: string;
  port: string;
  user: string;
  pass: string;
  from: string;
  secure: string;
}

interface PaymentConfig {
  razorpay_key_id: string;
  razorpay_key_secret: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  upi_id: string;
}

interface IntegrationsTabProps {
  isDark: boolean;
  canManageSettings: boolean;
  getSetting: (category: string, key: string, defaultValue: string) => string;
  saveBatchSettings: (category: string, settings: Record<string, string>) => Promise<void>;
  saving: boolean;
  card?: string;
  heading?: string;
  btnPrimary?: string;
  input?: string;
  label?: string;
}

// Payment gateway types
type PaymentGateway = 'razorpay' | 'stripe' | 'upi';

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({
  isDark,
  canManageSettings,
  getSetting,
  saveBatchSettings,
  saving,
}) => {
  // Enhanced state management with proper typing
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>(() => ({
    host: getSetting('smtp', 'host', ''),
    port: getSetting('smtp', 'port', '587'),
    user: getSetting('smtp', 'user', ''),
    pass: getSetting('smtp', 'pass', ''),
    from: getSetting('smtp', 'from', ''),
    secure: getSetting('smtp', 'secure', 'true'),
  }));

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(() => ({
    razorpay_key_id: getSetting('payment', 'razorpay_key_id', ''),
    razorpay_key_secret: getSetting('payment', 'razorpay_key_secret', ''),
    stripe_publishable_key: getSetting('payment', 'stripe_publishable_key', ''),
    stripe_secret_key: getSetting('payment', 'stripe_secret_key', ''),
    upi_id: getSetting('payment', 'upi_id', ''),
  }));

  const [savingSection, setSavingSection] = useState<'smtp' | 'payment' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoized CSS classes with world-class UI template
  const cardClasses = useMemo(() => 
    `backdrop-blur-2xl bg-gradient-to-br ${
      isDark 
        ? 'from-gray-800/90 to-gray-900/90 border-gray-700/50' 
        : 'from-white/90 to-gray-50/90 border-gray-200/50'
    } rounded-3xl shadow-2xl p-6 border backdrop-blur-xl`,
    [isDark]
  );

  const inputClasses = useMemo(() =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
      isDark 
        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
        : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-400'
    }`,
    [isDark]
  );

  const labelClasses = useMemo(() =>
    `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`,
    [isDark]
  );

  const btnPrimaryClasses = useMemo(() =>
    `px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${
      isDark 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
    }`,
    [isDark]
  );

  const gatewayCardClasses = useCallback((color: string) => 
    `p-4 rounded-2xl border backdrop-blur-sm transition-all ${
      isDark 
        ? `bg-${color}-900/20 border-${color}-700/50 hover:border-${color}-600/50` 
        : `bg-${color}-50/50 border-${color}-200/50 hover:border-${color}-300/50`
    }`,
    [isDark]
  );

  // Enhanced validation
  const validateSMTP = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!smtpConfig.host.trim()) {
      newErrors.smtp_host = 'SMTP host is required';
    }
    
    if (!smtpConfig.port.trim()) {
      newErrors.smtp_port = 'Port is required';
    } else if (isNaN(Number(smtpConfig.port)) || Number(smtpConfig.port) <= 0) {
      newErrors.smtp_port = 'Port must be a valid number';
    }
    
    if (!smtpConfig.user.trim()) {
      newErrors.smtp_user = 'Username is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpConfig.user)) {
      newErrors.smtp_user = 'Invalid email format';
    }
    
    if (!smtpConfig.from.trim()) {
      newErrors.smtp_from = 'From email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpConfig.from)) {
      newErrors.smtp_from = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [smtpConfig]);

  const validatePayment = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate Razorpay if any field is filled
    if (paymentConfig.razorpay_key_id || paymentConfig.razorpay_key_secret) {
      if (!paymentConfig.razorpay_key_id.trim()) {
        newErrors.razorpay_key_id = 'Razorpay Key ID is required';
      }
      if (!paymentConfig.razorpay_key_secret.trim()) {
        newErrors.razorpay_key_secret = 'Razorpay Key Secret is required';
      }
    }
    
    // Validate Stripe if any field is filled
    if (paymentConfig.stripe_publishable_key || paymentConfig.stripe_secret_key) {
      if (!paymentConfig.stripe_publishable_key.trim()) {
        newErrors.stripe_publishable_key = 'Stripe Publishable Key is required';
      }
      if (!paymentConfig.stripe_secret_key.trim()) {
        newErrors.stripe_secret_key = 'Stripe Secret Key is required';
      }
    }
    
    // Validate UPI if filled
    if (paymentConfig.upi_id && !paymentConfig.upi_id.trim()) {
      newErrors.upi_id = 'UPI ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [paymentConfig]);

  // Enhanced handlers with useCallback
  const handleSMTPChange = useCallback((field: keyof SMTPConfig, value: string) => {
    setSmtpConfig(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[`smtp_${field}`]) {
      setErrors(prev => ({ ...prev, [`smtp_${field}`]: '' }));
    }
  }, [errors]);

  const handlePaymentChange = useCallback((field: keyof PaymentConfig, value: string) => {
    setPaymentConfig(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleSaveSMTP = useCallback(async () => {
    if (!canManageSettings) return;
    if (!validateSMTP()) return;
    
    setSavingSection('smtp');
    try {
      await saveBatchSettings('smtp', smtpConfig as unknown as Record<string, string>);
    } catch (error) {
      console.error('Failed to save SMTP config:', error);
    } finally {
      setSavingSection(null);
    }
  }, [canManageSettings, validateSMTP, saveBatchSettings, smtpConfig]);

  const handleSavePayment = useCallback(async () => {
    if (!canManageSettings) return;
    if (!validatePayment()) return;
    
    setSavingSection('payment');
    try {
      await saveBatchSettings('payment', paymentConfig as unknown as Record<string, string>);
    } catch (error) {
      console.error('Failed to save payment config:', error);
    } finally {
      setSavingSection(null);
    }
  }, [canManageSettings, validatePayment, saveBatchSettings, paymentConfig]);

  // Enhanced input components
  const EnhancedInput = useCallback(({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    type = 'text', 
    errorKey,
    required = false 
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    errorKey?: string;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <label className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <motion.input
        whileFocus={{ scale: 1.02 }}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClasses} ${errors[errorKey || ''] ? 'border-red-500 focus:ring-red-500/20' : ''}`}
        placeholder={placeholder}
        required={required}
      />
      <AnimatePresence>
        {errors[errorKey || ''] && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-red-500"
          >
            {errors[errorKey || '']}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  ), [inputClasses, labelClasses, errors]);

  return (
    <div className="space-y-8">
      {/* Enhanced SMTP Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={cardClasses}
      >
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
                isDark ? 'bg-gradient-to-br from-orange-600/20 to-orange-700/20' : 'bg-gradient-to-br from-orange-100 to-orange-200'
              }`}
            >
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </motion.div>
            <div>
              <h3 className={`text-xl font-bold bg-gradient-to-r ${isDark ? 'from-orange-400 to-orange-300' : 'from-orange-600 to-orange-500'} bg-clip-text text-transparent`}>
                Email Configuration (SMTP)
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Configure email delivery settings for notifications
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={btnPrimaryClasses}
            disabled={savingSection === 'smtp' || !canManageSettings}
            onClick={handleSaveSMTP}
          >
            <AnimatePresence mode="wait">
              {savingSection === 'smtp' ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Saving...
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save SMTP
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <EnhancedInput
            label="SMTP Host"
            value={smtpConfig.host}
            onChange={(value) => handleSMTPChange('host', value)}
            placeholder="smtp.gmail.com"
            errorKey="smtp_host"
            required
          />
          
          <EnhancedInput
            label="Port"
            value={smtpConfig.port}
            onChange={(value) => handleSMTPChange('port', value)}
            placeholder="587"
            errorKey="smtp_port"
            required
          />
          
          <EnhancedInput
            label="Username"
            value={smtpConfig.user}
            onChange={(value) => handleSMTPChange('user', value)}
            placeholder="user@example.com"
            errorKey="smtp_user"
            required
          />
          
          <EnhancedInput
            label="Password"
            value={smtpConfig.pass}
            onChange={(value) => handleSMTPChange('pass', value)}
            placeholder="••••••••"
            type="password"
          />
          
          <EnhancedInput
            label="From Email"
            value={smtpConfig.from}
            onChange={(value) => handleSMTPChange('from', value)}
            placeholder="noreply@school.com"
            errorKey="smtp_from"
            required
          />
          
          <div className="space-y-2">
            <label className={labelClasses}>Security</label>
            <motion.select
              whileFocus={{ scale: 1.02 }}
              value={smtpConfig.secure}
              onChange={(e) => handleSMTPChange('secure', e.target.value)}
              className={inputClasses}
            >
              <option value="true">SSL/TLS</option>
              <option value="false">None</option>
            </motion.select>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Payment Gateway Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={cardClasses}
      >
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-gradient-to-br from-green-600/20 to-green-700/20' : 'bg-gradient-to-br from-green-100 to-green-200'
              }`}
            >
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </motion.div>
            <div>
              <h3 className={`text-xl font-bold bg-gradient-to-r ${isDark ? 'from-green-400 to-green-300' : 'from-green-600 to-green-500'} bg-clip-text text-transparent`}>
                Payment Gateways
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Configure payment processing for online fees
              </p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={btnPrimaryClasses}
            disabled={savingSection === 'payment' || !canManageSettings}
            onClick={handleSavePayment}
          >
            <AnimatePresence mode="wait">
              {savingSection === 'payment' ? (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Saving...
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Payment
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-6"
        >
          {/* Razorpay Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className={`p-6 rounded-2xl border backdrop-blur-sm ${
              isDark 
                ? 'bg-blue-900/20 border-blue-700/50' 
                : 'bg-blue-50/50 border-blue-200/50'
            }`}
          >
            <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              <span className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-blue-600/30' : 'bg-blue-200'
                }`}>
                  <span className="text-blue-600 font-bold">R</span>
                </div>
                Razorpay
              </span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedInput
                label="Key ID"
                value={paymentConfig.razorpay_key_id}
                onChange={(value) => handlePaymentChange('razorpay_key_id', value)}
                placeholder="rzp_test_..."
                errorKey="razorpay_key_id"
              />
              <EnhancedInput
                label="Key Secret"
                value={paymentConfig.razorpay_key_secret}
                onChange={(value) => handlePaymentChange('razorpay_key_secret', value)}
                placeholder="••••••••"
                type="password"
                errorKey="razorpay_key_secret"
              />
            </div>
          </motion.div>

          {/* Stripe Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className={`p-6 rounded-2xl border backdrop-blur-sm ${
              isDark 
                ? 'bg-purple-900/20 border-purple-700/50' 
                : 'bg-purple-50/50 border-purple-200/50'
            }`}
          >
            <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              <span className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-purple-600/30' : 'bg-purple-200'
                }`}>
                  <span className="text-purple-600 font-bold">S</span>
                </div>
                Stripe
              </span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EnhancedInput
                label="Publishable Key"
                value={paymentConfig.stripe_publishable_key}
                onChange={(value) => handlePaymentChange('stripe_publishable_key', value)}
                placeholder="pk_test_..."
                errorKey="stripe_publishable_key"
              />
              <EnhancedInput
                label="Secret Key"
                value={paymentConfig.stripe_secret_key}
                onChange={(value) => handlePaymentChange('stripe_secret_key', value)}
                placeholder="••••••••"
                type="password"
                errorKey="stripe_secret_key"
              />
            </div>
          </motion.div>

          {/* UPI Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className={`p-6 rounded-2xl border backdrop-blur-sm ${
              isDark 
                ? 'bg-orange-900/20 border-orange-700/50' 
                : 'bg-orange-50/50 border-orange-200/50'
            }`}
          >
            <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
              <span className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-orange-600/30' : 'bg-orange-200'
                }`}>
                  <span className="text-orange-600 font-bold">U</span>
                </div>
                UPI Configuration
              </span>
            </h4>
            <div className="space-y-4">
              <EnhancedInput
                label="UPI ID"
                value={paymentConfig.upi_id}
                onChange={(value) => handlePaymentChange('upi_id', value)}
                placeholder="school@upi"
                errorKey="upi_id"
              />
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter your UPI ID for direct bank payments. Students can pay directly to this UPI ID using any UPI app.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
