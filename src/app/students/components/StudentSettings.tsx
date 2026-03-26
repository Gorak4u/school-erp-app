'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Users,
  GraduationCap,
  Calendar,
  Bell,
  Shield,
  Database,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Sparkles,
  Save,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Globe,
  Monitor,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Info,
  HelpCircle,
  Sliders
} from 'lucide-react';

interface StudentSettingsProps {
  theme: 'dark' | 'light';
  onClose: () => void;
  getCardClass?: () => string;
  getBtnClass?: (type?: 'primary' | 'secondary' | 'danger' | 'success') => string;
  getTextClass?: (type?: 'primary' | 'secondary' | 'muted' | 'accent') => string;
  getInputClass?: () => string;
}

export default function StudentSettings({ 
  theme, 
  onClose,
  getCardClass,
  getBtnClass,
  getTextClass,
  getInputClass
}: StudentSettingsProps) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'academic' | 'notifications' | 'security' | 'data'>('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isDark = theme === 'dark';
  const cardClass = getCardClass?.() || (isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200');
  const primaryTextClass = getTextClass?.('primary') || (isDark ? 'text-white' : 'text-gray-900');
  const secondaryTextClass = getTextClass?.('secondary') || (isDark ? 'text-gray-400' : 'text-gray-600');
  const accentTextClass = getTextClass?.('accent') || (isDark ? 'text-blue-400' : 'text-blue-600');

  // Settings state
  const [settings, setSettings] = useState({
    // General Settings
    defaultClassSize: '30',
    autoPromotion: true,
    archiveInactive: false,
    defaultAcademicYear: '',
    
    // Academic Settings
    gradingScale: 'percentage',
    passingMarks: '40',
    maxSubjectsPerDay: '8',
    enableAttendanceAlerts: true,
    attendanceThreshold: '75',
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowAttendanceAlert: true,
    feePaymentReminder: true,
    examResultNotification: true,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    enableAuditLog: true,
    
    // Data Settings
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '5',
    enableAnalytics: true,
    gdprCompliance: true
  });

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      (newSettings as any)[category] = {
        ...(newSettings as any)[category],
        [key]: value
      };
      return newSettings;
    });
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    // Simulate saving settings
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasChanges(false);
  };

  const settingsCategories = [
    { id: 'general', name: 'General', icon: <Settings />, description: 'Basic configuration' },
    { id: 'academic', name: 'Academic', icon: <GraduationCap />, description: 'Academic policies' },
    { id: 'notifications', name: 'Notifications', icon: <Bell />, description: 'Alert preferences' },
    { id: 'security', name: 'Security', icon: <Shield />, description: 'Security policies' },
    { id: 'data', name: 'Data Management', icon: <Database />, description: 'Data handling' }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${primaryTextClass}`}>General Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${primaryTextClass} mb-2`}>
              Default Class Size
            </label>
            <input
              type="number"
              value={settings.defaultClassSize}
              onChange={(e) => handleSettingChange('general', 'defaultClassSize', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 ${getInputClass?.()}`}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${primaryTextClass}`}>Auto Promotion</div>
              <div className={`text-sm ${secondaryTextClass}`}>Automatically promote students to next class</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSettingChange('general', 'autoPromotion', !settings.autoPromotion)}
              className={`p-2 rounded-lg transition-colors ${
                settings.autoPromotion 
                  ? 'bg-blue-500 text-white' 
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.autoPromotion ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </motion.button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${primaryTextClass}`}>Archive Inactive Students</div>
              <div className={`text-sm ${secondaryTextClass}`}>Automatically archive inactive students</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSettingChange('general', 'archiveInactive', !settings.archiveInactive)}
              className={`p-2 rounded-lg transition-colors ${
                settings.archiveInactive 
                  ? 'bg-blue-500 text-white' 
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.archiveInactive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAcademicSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${primaryTextClass}`}>Academic Policies</h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${primaryTextClass} mb-2`}>
              Grading Scale
            </label>
            <select
              value={settings.gradingScale}
              onChange={(e) => handleSettingChange('academic', 'gradingScale', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 ${getInputClass?.()}`}
            >
              <option value="percentage">Percentage</option>
              <option value="gpa">GPA</option>
              <option value="grades">Letter Grades</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${primaryTextClass} mb-2`}>
              Passing Marks (%)
            </label>
            <input
              type="number"
              value={settings.passingMarks}
              onChange={(e) => handleSettingChange('academic', 'passingMarks', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 ${getInputClass?.()}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${primaryTextClass} mb-2`}>
              Maximum Subjects Per Day
            </label>
            <input
              type="number"
              value={settings.maxSubjectsPerDay}
              onChange={(e) => handleSettingChange('academic', 'maxSubjectsPerDay', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 ${getInputClass?.()}`}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${primaryTextClass}`}>Enable Attendance Alerts</div>
              <div className={`text-sm ${secondaryTextClass}`}>Send alerts for low attendance</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSettingChange('academic', 'enableAttendanceAlerts', !settings.enableAttendanceAlerts)}
              className={`p-2 rounded-lg transition-colors ${
                settings.enableAttendanceAlerts 
                  ? 'bg-blue-500 text-white' 
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.enableAttendanceAlerts ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </motion.button>
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${primaryTextClass} mb-2`}>
              Attendance Threshold (%)
            </label>
            <input
              type="number"
              value={settings.attendanceThreshold}
              onChange={(e) => handleSettingChange('academic', 'attendanceThreshold', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 ${getInputClass?.()}`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${primaryTextClass}`}>Notification Preferences</h3>
        
        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', icon: <Mail className="w-4 h-4" /> },
            { key: 'smsNotifications', label: 'SMS Notifications', icon: <Phone className="w-4 h-4" /> },
            { key: 'pushNotifications', label: 'Push Notifications', icon: <Smartphone className="w-4 h-4" /> },
            { key: 'lowAttendanceAlert', label: 'Low Attendance Alert', icon: <AlertTriangle className="w-4 h-4" /> },
            { key: 'feePaymentReminder', label: 'Fee Payment Reminder', icon: <Calendar className="w-4 h-4" /> },
            { key: 'examResultNotification', label: 'Exam Result Notification', icon: <GraduationCap className="w-4 h-4" /> }
          ].map(({ key, label, icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {icon}
                </div>
                <div>
                  <div className={`font-medium ${primaryTextClass}`}>{label}</div>
                  <div className={`text-sm ${secondaryTextClass}`}>Receive {label.toLowerCase()}</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSettingChange('notifications', key, !settings[key as keyof typeof settings])}
                className={`p-2 rounded-lg transition-colors ${
                  settings[key as keyof typeof settings] 
                    ? 'bg-blue-500 text-white' 
                    : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {settings[key as keyof typeof settings] ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </motion.button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${primaryTextClass}`}>Security Policies</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${primaryTextClass}`}>Two-Factor Authentication</div>
              <div className={`text-sm ${secondaryTextClass}`}>Require 2FA for sensitive operations</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSettingChange('security', 'twoFactorAuth', !settings.twoFactorAuth)}
              className={`p-2 rounded-lg transition-colors ${
                settings.twoFactorAuth 
                  ? 'bg-blue-500 text-white' 
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.twoFactorAuth ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </motion.button>
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${primaryTextClass} mb-2`}>
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 ${getInputClass?.()}`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${primaryTextClass} mb-2`}>
              Password Expiry (days)
            </label>
            <input
              type="number"
              value={settings.passwordExpiry}
              onChange={(e) => handleSettingChange('security', 'passwordExpiry', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 ${getInputClass?.()}`}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${primaryTextClass}`}>Enable Audit Log</div>
              <div className={`text-sm ${secondaryTextClass}`}>Track all system activities</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSettingChange('security', 'enableAuditLog', !settings.enableAuditLog)}
              className={`p-2 rounded-lg transition-colors ${
                settings.enableAuditLog 
                  ? 'bg-blue-500 text-white' 
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.enableAuditLog ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${primaryTextClass}`}>Data Management</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${primaryTextClass}`}>Auto Backup</div>
              <div className={`text-sm ${secondaryTextClass}`}>Automatically backup data</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSettingChange('data', 'autoBackup', !settings.autoBackup)}
              className={`p-2 rounded-lg transition-colors ${
                settings.autoBackup 
                  ? 'bg-blue-500 text-white' 
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.autoBackup ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </motion.button>
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${primaryTextClass} mb-2`}>
              Backup Frequency
            </label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => handleSettingChange('data', 'backupFrequency', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 ${getInputClass?.()}`}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${primaryTextClass} mb-2`}>
              Data Retention (years)
            </label>
            <input
              type="number"
              value={settings.dataRetention}
              onChange={(e) => handleSettingChange('data', 'dataRetention', e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 ${getInputClass?.()}`}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${primaryTextClass}`}>Enable Analytics</div>
              <div className={`text-sm ${secondaryTextClass}`}>Collect usage analytics</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSettingChange('data', 'enableAnalytics', !settings.enableAnalytics)}
              className={`p-2 rounded-lg transition-colors ${
                settings.enableAnalytics 
                  ? 'bg-blue-500 text-white' 
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.enableAnalytics ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </motion.button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${primaryTextClass}`}>GDPR Compliance</div>
              <div className={`text-sm ${secondaryTextClass}`}>Follow data protection regulations</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSettingChange('data', 'gdprCompliance', !settings.gdprCompliance)}
              className={`p-2 rounded-lg transition-colors ${
                settings.gdprCompliance 
                  ? 'bg-blue-500 text-white' 
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {settings.gdprCompliance ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Data Actions */}
      <div className={`p-6 rounded-xl border-2 ${isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-200 bg-red-50'}`}>
        <h4 className={`font-semibold ${primaryTextClass} mb-4 flex items-center gap-2`}>
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Data Actions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-3 rounded-lg border-2 transition-all ${getBtnClass?.('secondary')}`}
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-3 rounded-lg border-2 transition-all ${getBtnClass?.('secondary')}`}
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-3 rounded-lg border-2 transition-all ${getBtnClass?.('secondary')}`}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>Backup Now</span>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-3 rounded-lg border-2 transition-all ${getBtnClass?.('danger')}`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span>Clear Cache</span>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSettingsTab) {
      case 'general': return renderGeneralSettings();
      case 'academic': return renderAcademicSettings();
      case 'notifications': return renderNotificationSettings();
      case 'security': return renderSecuritySettings();
      case 'data': return renderDataSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl border-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30"
      >
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-blue-500" />
          <span className={`font-bold ${accentTextClass}`}>AI Recommendations</span>
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className={`text-sm ${primaryTextClass}`}>Enable two-factor authentication for enhanced security</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className={`text-sm ${primaryTextClass}`}>Set attendance threshold to 75% for better tracking</span>
          </div>
        </div>
      </motion.div>

      {/* Settings Categories */}
      <div className="flex flex-wrap gap-2">
        {settingsCategories.map((category) => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveSettingsTab(category.id as any)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeSettingsTab === category.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : isDark 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {React.cloneElement(category.icon, { className: "w-4 h-4" })}
              <span>{category.name}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Settings Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-6 rounded-xl border-2 ${cardClass}`}
      >
        {renderContent()}
      </motion.div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveSettings}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${getBtnClass?.('primary')}`}
          >
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </div>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
