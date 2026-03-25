'use client';

import React, { useState } from 'react';

interface AppSettingsTabProps {
  isDark: boolean;
  canManageSettings: boolean;
  getSetting: (category: string, key: string, defaultValue: string) => string;
  saveBatchSettings: (category: string, settings: Record<string, string>) => void;
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
  const [appConfig, setAppConfig] = useState({
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
  });

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-3 shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-600/20' : 'bg-gray-100'}`}>
            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Application Settings</h3>
            <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>General configuration</p>
          </div>
        </div>
        <button 
          className={`px-2 py-1 rounded text-[10px] font-medium ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          disabled={saving || !canManageSettings}
          onClick={() => saveBatchSettings('app_config', appConfig)}
        >
          {saving ? '...' : 'Save'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {/* File Upload Settings */}
        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Max Upload (MB)</label>
          <input 
            type="number"
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.max_file_upload_size}
            onChange={e => setAppConfig({ ...appConfig, max_file_upload_size: e.target.value })}
          />
        </div>

        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>File Types</label>
          <input 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.allowed_file_types}
            onChange={e => setAppConfig({ ...appConfig, allowed_file_types: e.target.value })}
            placeholder="pdf,jpg,png"
          />
        </div>

        {/* Session & Display Settings */}
        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Session (min)</label>
          <input 
            type="number"
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.session_timeout_mins}
            onChange={e => setAppConfig({ ...appConfig, session_timeout_mins: e.target.value })}
          />
        </div>

        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Per Page</label>
          <input 
            type="number"
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.pagination_size}
            onChange={e => setAppConfig({ ...appConfig, pagination_size: e.target.value })}
          />
        </div>

        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date Format</label>
          <select 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.date_format}
            onChange={e => setAppConfig({ ...appConfig, date_format: e.target.value })}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Language</label>
          <select 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.default_language}
            onChange={e => setAppConfig({ ...appConfig, default_language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="gu">ગુજરાતી</option>
          </select>
        </div>

        {/* Currency Settings */}
        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Currency</label>
          <select 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.currency}
            onChange={e => setAppConfig({ ...appConfig, currency: e.target.value })}
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Currency Symbol</label>
          <input 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.currency_symbol}
            onChange={e => setAppConfig({ ...appConfig, currency_symbol: e.target.value })}
            placeholder="₹"
          />
        </div>

        {/* Notification Settings */}
        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Auto Absent</label>
          <select 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.attendance_auto_absent}
            onChange={e => setAppConfig({ ...appConfig, attendance_auto_absent: e.target.value })}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>SMS Notifications</label>
          <select 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.sms_notifications}
            onChange={e => setAppConfig({ ...appConfig, sms_notifications: e.target.value })}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email Notifications</label>
          <select 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.email_notifications}
            onChange={e => setAppConfig({ ...appConfig, email_notifications: e.target.value })}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Push Notifications</label>
          <select 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.push_notifications}
            onChange={e => setAppConfig({ ...appConfig, push_notifications: e.target.value })}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>

        {/* System Settings */}
        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>App Notifications</label>
          <select 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.enable_notifications}
            onChange={e => setAppConfig({ ...appConfig, enable_notifications: e.target.value })}
          >
            <option value="true">On</option>
            <option value="false">Off</option>
          </select>
        </div>

        <div className="space-y-0.5">
          <label className={`block text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Maintenance Mode</label>
          <select 
            className={`w-full px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            value={appConfig.maintenance_mode}
            onChange={e => setAppConfig({ ...appConfig, maintenance_mode: e.target.value })}
          >
            <option value="false">Off</option>
            <option value="true">On</option>
          </select>
        </div>
      </div>
    </div>
  );
};
