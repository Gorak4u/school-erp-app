'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

// Enhanced TypeScript interfaces
interface AppConfig {
  // File Upload Settings
  max_file_upload_size: string;
  allowed_file_types: string;
  
  // Session & Display Settings
  session_timeout_mins: string;
  pagination_size: string;
  date_format: string;
  default_language: string;
  
  // Currency Settings
  currency: string;
  currency_symbol: string;
  
  // Notification Settings
  attendance_auto_absent: string;
  sms_notifications: string;
  email_notifications: string;
  push_notifications: string;
  
  // System Settings
  enable_notifications: string;
  maintenance_mode: string;
}

interface AppSettingsTabProps {
  isDark: boolean;
  canManageSettings: boolean;
  getSetting: (category: string, key: string, defaultValue: string) => string;
  saveBatchSettings: (category: string, settings: Record<string, string>) => Promise<void> | void;
  saving: boolean;
  card: string;
  heading: string;
  btnPrimary: string;
  input: string;
  label: string;
}

export const AppSettingsTab: React.FC<AppSettingsTabProps> = ({
  isDark,
  canManageSettings,
  getSetting,
  saveBatchSettings,
  saving,
  card,
  heading,
  btnPrimary,
  input,
  label,
}) => {
  // Optimized state initialization with proper typing
  const [appConfig, setAppConfig] = useState<AppConfig>(() => ({
    // File Upload Settings
    max_file_upload_size: getSetting('app_config', 'max_file_upload_size', '10'),
    allowed_file_types: getSetting('app_config', 'allowed_file_types', 'pdf,jpg,jpeg,png,doc,docx'),
    
    // Session & Display Settings
    session_timeout_mins: getSetting('app_config', 'session_timeout_mins', '60'),
    pagination_size: getSetting('app_config', 'pagination_size', '25'),
    date_format: getSetting('app_config', 'date_format', 'DD/MM/YYYY'),
    default_language: getSetting('app_config', 'default_language', 'en'),
    
    // Currency Settings
    currency: getSetting('app_config', 'currency', 'INR'),
    currency_symbol: getSetting('app_config', 'currency_symbol', '₹'),
    
    // Notification Settings
    attendance_auto_absent: getSetting('app_config', 'attendance_auto_absent', 'true'),
    sms_notifications: getSetting('app_config', 'sms_notifications', 'false'),
    email_notifications: getSetting('app_config', 'email_notifications', 'true'),
    push_notifications: getSetting('app_config', 'push_notifications', 'false'),
    
    // System Settings
    enable_notifications: getSetting('app_config', 'enable_notifications', 'true'),
    maintenance_mode: getSetting('app_config', 'maintenance_mode', 'false'),
  }));

  // Memoized configuration options to prevent recreation
  const configOptions = useMemo(() => ({
    dateFormats: [
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    ],
    languages: [
      { value: 'en', label: 'English' },
      { value: 'hi', label: 'हिंदी' },
      { value: 'gu', label: 'ગુજરાતી' },
    ],
    currencies: [
      { value: 'INR', label: 'INR' },
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
    ],
    booleanOptions: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
    systemOptions: [
      { value: 'true', label: 'On' },
      { value: 'false', label: 'Off' },
    ],
  }), []);

  // Optimized input change handler with useCallback
  const handleConfigChange = useCallback((key: keyof AppConfig, value: string) => {
    setAppConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // Optimized save handler with error handling
  const handleSave = useCallback(async () => {
    try {
      await saveBatchSettings('app_config', appConfig as unknown as Record<string, string>);
    } catch (error) {
      console.error('Failed to save app settings:', error);
    }
  }, [appConfig, saveBatchSettings]);

  // Enhanced CSS classes with world-class UI template
  const enhancedCard = `backdrop-blur-2xl bg-gradient-to-br ${isDark ? 'from-gray-800/90 to-gray-900/90 border-gray-700/50' : 'from-white/90 to-gray-50/90 border-gray-200/50'} rounded-3xl shadow-2xl p-6 border backdrop-blur-xl`;
  const enhancedInput = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const enhancedLabel = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const enhancedBtnPrimary = `px-6 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={enhancedCard}
    >
      {/* Enhanced Header with Animation */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-indigo-600/20 to-purple-600/20' : 'from-indigo-100 to-purple-100'} border ${isDark ? 'border-indigo-600/30' : 'border-indigo-200'}`}
          >
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.div>
          <div>
            <h3 className={`text-2xl font-bold bg-gradient-to-r ${isDark ? 'from-indigo-400 to-purple-400' : 'from-indigo-600 to-purple-600'} bg-clip-text text-transparent`}>
              Application Settings
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Configure your school ERP system preferences
            </p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={saving || !canManageSettings}
          onClick={handleSave}
          className={`${enhancedBtnPrimary} ${(!canManageSettings || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="flex items-center gap-2">
            {saving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </span>
        </motion.button>
      </motion.div>

      {/* Settings Grid with Enhanced Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* File Upload Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`rounded-2xl border p-6 ${isDark ? 'bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-blue-700/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}
        >
          <h4 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            File Upload Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className={enhancedLabel}>Max Upload Size (MB)</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                className={enhancedInput}
                value={appConfig.max_file_upload_size}
                onChange={e => handleConfigChange('max_file_upload_size', e.target.value)}
                placeholder="10"
              />
            </div>

            <div>
              <label className={enhancedLabel}>Allowed File Types</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.allowed_file_types}
                onChange={e => handleConfigChange('allowed_file_types', e.target.value)}
                placeholder="pdf,jpg,png"
              />
            </div>
          </div>
        </motion.div>

        {/* Session & Display Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={`rounded-2xl border p-6 ${isDark ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'}`}
        >
          <h4 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Session & Display
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className={enhancedLabel}>Session Timeout (minutes)</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                className={enhancedInput}
                value={appConfig.session_timeout_mins}
                onChange={e => handleConfigChange('session_timeout_mins', e.target.value)}
                placeholder="60"
              />
            </div>

            <div>
              <label className={enhancedLabel}>Pagination Size</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                className={enhancedInput}
                value={appConfig.pagination_size}
                onChange={e => handleConfigChange('pagination_size', e.target.value)}
                placeholder="25"
              />
            </div>

            <div>
              <label className={enhancedLabel}>Date Format</label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.date_format}
                onChange={e => handleConfigChange('date_format', e.target.value)}
              >
                {configOptions.dateFormats.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </motion.select>
            </div>

            <div>
              <label className={enhancedLabel}>Default Language</label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.default_language}
                onChange={e => handleConfigChange('default_language', e.target.value)}
              >
                {configOptions.languages.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </motion.select>
            </div>
          </div>
        </motion.div>

        {/* Currency Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className={`rounded-2xl border p-6 ${isDark ? 'bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-700/30' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'}`}
        >
          <h4 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Currency Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className={enhancedLabel}>Currency</label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.currency}
                onChange={e => handleConfigChange('currency', e.target.value)}
              >
                {configOptions.currencies.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </motion.select>
            </div>

            <div>
              <label className={enhancedLabel}>Currency Symbol</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.currency_symbol}
                onChange={e => handleConfigChange('currency_symbol', e.target.value)}
                placeholder="₹"
              />
            </div>
          </div>
        </motion.div>

        {/* Notification Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={`rounded-2xl border p-6 ${isDark ? 'bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-700/30' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}
        >
          <h4 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notification Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className={enhancedLabel}>Auto Absent Marking</label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.attendance_auto_absent}
                onChange={e => handleConfigChange('attendance_auto_absent', e.target.value)}
              >
                {configOptions.booleanOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </motion.select>
            </div>

            <div>
              <label className={enhancedLabel}>SMS Notifications</label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.sms_notifications}
                onChange={e => handleConfigChange('sms_notifications', e.target.value)}
              >
                {configOptions.booleanOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </motion.select>
            </div>

            <div>
              <label className={enhancedLabel}>Email Notifications</label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.email_notifications}
                onChange={e => handleConfigChange('email_notifications', e.target.value)}
              >
                {configOptions.booleanOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </motion.select>
            </div>

            <div>
              <label className={enhancedLabel}>Push Notifications</label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.push_notifications}
                onChange={e => handleConfigChange('push_notifications', e.target.value)}
              >
                {configOptions.booleanOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </motion.select>
            </div>
          </div>
        </motion.div>

        {/* System Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className={`rounded-2xl border p-6 ${isDark ? 'bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-700/30' : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'}`}
        >
          <h4 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            System Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className={enhancedLabel}>App Notifications</label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.enable_notifications}
                onChange={e => handleConfigChange('enable_notifications', e.target.value)}
              >
                {configOptions.systemOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </motion.select>
            </div>

            <div>
              <label className={enhancedLabel}>Maintenance Mode</label>
              <motion.select
                whileFocus={{ scale: 1.02 }}
                className={enhancedInput}
                value={appConfig.maintenance_mode}
                onChange={e => handleConfigChange('maintenance_mode', e.target.value)}
              >
                <option value="false">Off</option>
                <option value="true">On</option>
              </motion.select>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
