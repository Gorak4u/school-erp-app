'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { showSuccessToast, showErrorToast } from '@/lib/toastUtils';
import { ReminderSchedule, DEFAULT_REMINDER_CONFIG, getReminderConfigClient, updateReminderConfigClient } from '@/lib/reminder-config-client';

export default function ReminderSettingsPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ReminderSchedule>(DEFAULT_REMINDER_CONFIG);

  const isDark = theme === 'dark';
  const card = `rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`;
  const input = `w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`;
  const btnPrimary = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all';
  const btnSecondary = 'px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all';

  useEffect(() => {
    fetchReminderConfig();
  }, []);

  const fetchReminderConfig = async () => {
    try {
      const config = await getReminderConfigClient();
      setConfig(config);
    } catch (error) {
      console.error('Failed to fetch reminder config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      await updateReminderConfigClient(config);
      showSuccessToast('Success', 'Reminder settings saved successfully!');
    } catch (error) {
      showErrorToast('Error', 'Failed to save reminder settings');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (type: keyof ReminderSchedule, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const addDayBefore = (type: keyof ReminderSchedule) => {
    const currentDays = [...config[type].daysBefore];
    if (!currentDays.includes(0)) {
      currentDays.push(0);
      currentDays.sort((a, b) => b - a); // Sort descending
      updateConfig(type, 'daysBefore', currentDays);
    }
  };

  const removeDayBefore = (type: keyof ReminderSchedule, dayToRemove: number) => {
    const currentDays = config[type].daysBefore.filter(day => day !== dayToRemove);
    updateConfig(type, 'daysBefore', currentDays);
  };

  const ReminderConfigCard = ({ type, title, description, color }: {
    type: keyof ReminderSchedule;
    title: string;
    description: string;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={card}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <div className={`w-3 h-3 rounded-full ${color}`} />
        </div>
        
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
          {description}
        </p>

        {/* Enable/Disable */}
        <div className="mb-4">
          <label className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <input
              type="checkbox"
              checked={config[type].enabled}
              onChange={(e) => updateConfig(type, 'enabled', e.target.checked)}
              className="mr-2"
            />
            Enable reminders
          </label>
        </div>

        {/* Days Before */}
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {type === 'paymentFailed' || type === 'serviceSuspension' ? 'Days After Event' : 'Days Before Event'}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {config[type].daysBefore.map((day) => (
              <span
                key={day}
                className={`px-2 py-1 rounded-lg text-sm ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {day === 0 ? (type === 'paymentFailed' || type === 'serviceSuspension' ? 'Immediately' : 'Today') : `${day} day${day !== 1 ? 's' : ''}`}
                <button
                  onClick={() => removeDayBefore(type, day)}
                  className="ml-2 text-red-500 hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={() => addDayBefore(type)}
            className="text-sm text-blue-500 hover:text-blue-400"
          >
            + Add day
          </button>
        </div>

        {/* Time of Day */}
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Time of Day
          </label>
          <input
            type="time"
            value={config[type].timeOfDay}
            onChange={(e) => updateConfig(type, 'timeOfDay', e.target.value)}
            className={input}
          />
        </div>

        {/* Timezone */}
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Timezone
          </label>
          <select
            value={config[type].timezone}
            onChange={(e) => updateConfig(type, 'timezone', e.target.value)}
            className={input}
          >
            <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
            <option value="UTC">UTC (UTC+0)</option>
            <option value="America/New_York">America/New_York (UTC-5)</option>
            <option value="Europe/London">Europe/London (UTC+0)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
          </select>
        </div>

        {/* Subject Template */}
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Email Subject
          </label>
          <input
            type="text"
            value={config[type].subject}
            onChange={(e) => updateConfig(type, 'subject', e.target.value)}
            className={input}
            placeholder="Email subject with {{schoolName}} placeholder"
          />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AppLayout currentPage="admin" theme={theme}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Reminder Settings
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Configure automated email and SMS reminders for pending fees and trial expirations.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm text-sm disabled:opacity-50 flex items-center gap-2`}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReminderConfigCard
              type="trialExpiry"
              title="Trial Expiry Reminders"
              description="Notifies users before their trial period ends"
              color="bg-yellow-500"
            />
            
            <ReminderConfigCard
              type="subscriptionRenewal"
              title="Subscription Renewal"
              description="Reminds users before subscription renewal"
              color="bg-blue-500"
            />
            
            <ReminderConfigCard
              type="paymentFailed"
              title="Payment Failed"
              description="Notifies when automatic payment fails"
              color="bg-red-500"
            />
            
            <ReminderConfigCard
              type="serviceSuspension"
              title="Service Suspension"
              description="Notifies users before service suspension"
              color="bg-orange-500"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
