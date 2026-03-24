'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, XCircle, X, CreditCard, Ban, FileText } from 'lucide-react';

interface Notification {
  id: string;
  type: 'fine_created' | 'fine_updated' | 'fine_paid' | 'waiver_requested' | 'waiver_approved' | 'waiver_rejected';
  title: string;
  message: string;
  data: any;
  timestamp: number;
  read: boolean;
}

interface RealTimeNotificationsProps {
  notifications: Notification[];
  onClear: () => void;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  theme?: 'dark' | 'light';
}

export default function RealTimeNotifications({
  notifications,
  onClear,
  onMarkAsRead,
  onRemove,
  theme = 'light'
}: RealTimeNotificationsProps) {
  const isDark = theme === 'dark';
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'fine_created':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'fine_updated':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'fine_paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'waiver_requested':
        return <Ban className="w-5 h-5 text-orange-500" />;
      case 'waiver_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'waiver_rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'fine_created':
        return isDark ? 'border-blue-600/30 bg-blue-600/10' : 'border-blue-200 bg-blue-50';
      case 'fine_updated':
        return isDark ? 'border-yellow-600/30 bg-yellow-600/10' : 'border-yellow-200 bg-yellow-50';
      case 'fine_paid':
        return isDark ? 'border-green-600/30 bg-green-600/10' : 'border-green-200 bg-green-50';
      case 'waiver_requested':
        return isDark ? 'border-orange-600/30 bg-orange-600/10' : 'border-orange-200 bg-orange-50';
      case 'waiver_approved':
        return isDark ? 'border-green-600/30 bg-green-600/10' : 'border-green-200 bg-green-50';
      case 'waiver_rejected':
        return isDark ? 'border-red-600/30 bg-red-600/10' : 'border-red-200 bg-red-50';
      default:
        return isDark ? 'border-gray-600/30 bg-gray-600/10' : 'border-gray-200 bg-gray-50';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.slice(0, 5).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={`
              rounded-lg border p-4 shadow-lg backdrop-blur-sm
              ${getNotificationColor(notification.type)}
              ${!notification.read ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {notification.title}
                  </h4>
                  <button
                    onClick={() => onRemove(notification.id)}
                    className={`flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  {notification.message}
                </p>
                
                {notification.data && (
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
                    {notification.data.fineNumber && (
                      <div>Fine: {notification.data.fineNumber}</div>
                    )}
                    {notification.data.studentName && (
                      <div>Student: {notification.data.studentName}</div>
                    )}
                    {notification.data.amount && (
                      <div>Amount: ₹{notification.data.amount.toLocaleString()}</div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatTime(notification.timestamp)}
                  </span>
                  
                  {!notification.read && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className={`text-xs px-2 py-1 rounded-full ${
                        isDark 
                          ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      } transition-colors`}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {notifications.length > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-lg border p-3 text-center ${
            isDark ? 'border-gray-600/30 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            {notifications.length - 5} more notifications
          </p>
          <button
            onClick={onClear}
            className={`text-xs px-3 py-1 rounded-full ${
              isDark 
                ? 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            } transition-colors`}
          >
            Clear all
          </button>
        </motion.div>
      )}
    </div>
  );
}

// Hook to manage notification state
export function useNotifications() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const addNotification = React.useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = React.useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = React.useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    removeNotification,
    clearNotifications
  };
}
