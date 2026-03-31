'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, AlertCircle, CreditCard, FileText, Clock, MessageSquare } from 'lucide-react';
import { useGlobalSocket } from '@/contexts/SocketContext';

interface Notification {
  id: string;
  type: 'approval_request' | 'approval_status' | 'payment' | 'general' | 'fine' | 'refund' | 'message' | 'conversation' | 'mention';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    module?: string;
    actionUrl?: string;
    requestId?: string;
    entityType?: string;
  };
}

interface NotificationBellProps {
  isDark: boolean;
  userId?: string;
}

const iconMap: Record<string, React.ElementType> = {
  approval_request: AlertCircle,
  approval_status: Check,
  payment: CreditCard,
  fine: FileText,
  refund: CreditCard,
  message: MessageSquare,
  conversation: MessageSquare,
  mention: MessageSquare,
  general: Bell,
};

const colorMap: Record<string, string> = {
  approval_request: 'text-amber-500 bg-amber-100',
  approval_status: 'text-green-500 bg-green-100',
  payment: 'text-blue-500 bg-blue-100',
  fine: 'text-red-500 bg-red-100',
  refund: 'text-purple-500 bg-purple-100',
  message: 'text-purple-500 bg-purple-100',
  conversation: 'text-indigo-500 bg-indigo-100',
  mention: 'text-orange-500 bg-orange-100',
  general: 'text-gray-500 bg-gray-100',
};

export const NotificationBell: React.FC<NotificationBellProps> = ({ isDark, userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { subscribe, isConnected } = useGlobalSocket();

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to notification events via global socket
  useEffect(() => {
    if (!userId || !isConnected) return;

    console.log('🔔 NotificationBell subscribing to global socket');

    // Subscribe to notification events
    const unsubscribe = subscribe('notification', (newNotification: Notification) => {
      if (newNotification.metadata?.module === 'messenger') return;
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, isConnected, subscribe]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const { notifications: data } = await response.json();
        const filtered = data.filter((notification: Notification) => notification.metadata?.module !== 'messenger');
        setNotifications(filtered);
        setUnreadCount(filtered.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (response.ok) {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'PUT' });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) markAsRead(notification.id);
    if (notification.metadata?.actionUrl) {
      window.location.href = notification.metadata.actionUrl;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className={`relative p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
      >
        <Bell className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 mt-2 w-96 rounded-xl shadow-2xl z-50 ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
          >
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead}
                  className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto ${isDark ? 'border-blue-400' : 'border-blue-600'}`} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => {
                  const Icon = iconMap[notification.type] || Bell;
                  const colors = colorMap[notification.type] || colorMap.general;
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 border-b last:border-0 transition-colors ${
                        isDark ? notification.isRead ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-700 bg-gray-700/30 hover:bg-gray-700/50'
                          : notification.isRead ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-100 bg-blue-50/30 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'} ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm mt-0.5 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {getTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className={`px-4 py-2 border-t text-center ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={() => window.location.href = '/notifications'}
                className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
