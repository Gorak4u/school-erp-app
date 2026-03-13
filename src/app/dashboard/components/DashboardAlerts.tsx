'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  action?: {
    label: string;
    link: string;
  };
  dismissible?: boolean;
}

interface DashboardAlertsProps {
  theme: 'dark' | 'light';
}

export default function DashboardAlerts({ theme }: DashboardAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Low Attendance Alert',
      message: '15 students have below 75% attendance this month',
      time: '2 hours ago',
      action: {
        label: 'View Details',
        link: '/attendance?filter=low'
      },
      dismissible: true
    },
    {
      id: '2',
      type: 'error',
      title: 'Pending Fee Payments',
      message: '23 students have overdue fee payments',
      time: '4 hours ago',
      action: {
        label: 'Send Reminders',
        link: '/fees?action=reminders'
      },
      dismissible: true
    },
    {
      id: '3',
      type: 'info',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday 2:00 AM - 4:00 AM',
      time: '1 day ago',
      dismissible: false
    },
    {
      id: '4',
      type: 'success',
      title: 'Report Generated',
      message: 'Monthly performance report is ready for download',
      time: '2 days ago',
      action: {
        label: 'Download',
        link: '/reports/monthly-performance'
      },
      dismissible: true
    },
    {
      id: '5',
      type: 'warning',
      title: 'Teacher Absence',
      message: 'Ms. Johnson reported sick for tomorrow',
      time: '3 hours ago',
      action: {
        label: 'Arrange Substitute',
        link: '/teachers/substitute'
      },
      dismissible: true
    }
  ]);

  const [showAll, setShowAll] = useState(false);
  const displayedAlerts = showAll ? alerts : alerts.slice(0, 3);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const getAlertStyles = (type: Alert['type']) => {
    const styles = {
      warning: {
        bg: theme === 'dark' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200',
        icon: '⚠️',
        iconBg: theme === 'dark' ? 'bg-yellow-600/20' : 'bg-yellow-100',
        iconColor: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
        title: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-800',
        message: theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
      },
      error: {
        bg: theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200',
        icon: '🚨',
        iconBg: theme === 'dark' ? 'bg-red-600/20' : 'bg-red-100',
        iconColor: theme === 'dark' ? 'text-red-400' : 'text-red-600',
        title: theme === 'dark' ? 'text-red-400' : 'text-red-800',
        message: theme === 'dark' ? 'text-red-300' : 'text-red-700'
      },
      success: {
        bg: theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200',
        icon: '✅',
        iconBg: theme === 'dark' ? 'bg-green-600/20' : 'bg-green-100',
        iconColor: theme === 'dark' ? 'text-green-400' : 'text-green-600',
        title: theme === 'dark' ? 'text-green-400' : 'text-green-800',
        message: theme === 'dark' ? 'text-green-300' : 'text-green-700'
      },
      info: {
        bg: theme === 'dark' ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200',
        icon: 'ℹ️',
        iconBg: theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-100',
        iconColor: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
        title: theme === 'dark' ? 'text-blue-400' : 'text-blue-800',
        message: theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
      }
    };
    return styles[type];
  };

  const getAlertCount = (type: Alert['type']) => {
    return alerts.filter(alert => alert.type === type).length;
  };

  return (
    <div className={`p-6 rounded-xl border ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Alerts & Notifications
        </h3>
        <div className="flex items-center space-x-2">
          {/* Alert Counts */}
          <div className="flex items-center space-x-1">
            {getAlertCount('error') > 0 && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'
              }`}>
                {getAlertCount('error')} Critical
              </span>
            )}
            {getAlertCount('warning') > 0 && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                theme === 'dark' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {getAlertCount('warning')} Warning
              </span>
            )}
          </div>
          
          {alerts.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {showAll ? 'Show Less' : 'View All'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {displayedAlerts.map((alert) => {
            const styles = getAlertStyles(alert.type);
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-4 rounded-lg border ${styles.bg}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.iconBg} ${styles.iconColor}`}>
                    {styles.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium ${styles.title}`}>
                          {alert.title}
                        </h4>
                        <p className={`text-sm mt-1 ${styles.message}`}>
                          {alert.message}
                        </p>
                        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {alert.time}
                        </p>
                      </div>
                      
                      {alert.dismissible && (
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className={`ml-2 p-1 rounded-lg transition-colors ${
                            theme === 'dark' 
                              ? 'text-gray-500 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    {alert.action && (
                      <div className="mt-3">
                        <Link href={alert.action.link}>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                              alert.type === 'error' 
                                ? theme === 'dark' 
                                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                                : alert.type === 'warning'
                                ? theme === 'dark' 
                                  ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30' 
                                  : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                                : theme === 'dark' 
                                  ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            }`}
                          >
                            {alert.action.label}
                          </motion.button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* No Alerts State */}
      {alerts.length === 0 && (
        <div className={`text-center py-8 ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
            theme === 'light' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            🎉
          </div>
          <p className="text-sm font-medium">All caught up!</p>
          <p className="text-xs mt-1">No new alerts or notifications</p>
        </div>
      )}

      {/* Alert Settings */}
      <div className={`mt-6 pt-4 border-t ${
        theme === 'light' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage notification preferences
          </p>
          <Link href="/settings/notifications">
            <button className={`text-sm px-3 py-1 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}>
              Settings
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
