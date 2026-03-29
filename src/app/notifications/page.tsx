'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, AlertCircle, CreditCard, FileText, MessageSquare } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/lib/toastUtils';

// UI helper functions (matching settings page pattern from utils.ts)
const getCardClass = (isDark: boolean) =>
  `rounded-2xl border p-6 shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;

const getRowClass = (isDark: boolean) =>
  `p-4 rounded-xl border ${isDark ? 'border-gray-600/50 bg-gray-700/30' : 'border-gray-200 bg-gray-50/50'}`;

const getBtnPrimaryClass = (isDark: boolean) =>
  `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;

const getHeadingClass = (isDark: boolean) =>
  `text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`;

const getSubtextClass = (isDark: boolean) =>
  `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

interface Notification {
  id: string;
  type: 'approval_request' | 'approval_status' | 'payment' | 'general' | 'fine' | 'refund' | 'message' | 'conversation' | 'mention';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    actionUrl?: string;
    requestId?: string;
    entityType?: string;
  };
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

export default function NotificationsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=100');
      if (response.ok) {
        const { notifications: data } = await response.json();
        setNotifications(data);
      } else {
        showToast('error', 'Failed to fetch notifications');
      }
    } catch (error) {
      showToast('error', 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (response.ok) {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
        showToast('success', 'Marked as read');
      } else {
        showToast('error', 'Failed to mark as read');
      }
    } catch (error) {
      showToast('error', 'Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'PUT' });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        showToast('success', 'All notifications marked as read');
      } else {
        showToast('error', 'Failed to mark all as read');
      }
    } catch (error) {
      showToast('error', 'Failed to mark all as read');
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

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppLayout currentPage="notifications" title="Notifications">
      <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={getCardClass(isDark)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Bell className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h1 className={getHeadingClass(isDark)}>
                    Notifications
                  </h1>
                  <p className={getSubtextClass(isDark)}>
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className={`${getBtnPrimaryClass(isDark)} ${unreadCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Mark all read
              </motion.button>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={getRowClass(isDark)}
          >
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all'
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  filter === 'unread'
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </motion.div>

          {/* Notifications List */}
          <div className="space-y-4">
            {loading ? (
              <div className={getRowClass(isDark)}>
                <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto ${isDark ? 'border-blue-400' : 'border-blue-600'}`} />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${getRowClass(isDark)} text-center py-12`}
              >
                <Bell className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={getSubtextClass(isDark)}>
                  No notifications
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map((notification, index) => {
                const Icon = iconMap[notification.type] || Bell;
                const colors = colorMap[notification.type] || colorMap.general;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`${getRowClass(isDark)} ${!notification.isRead ? (isDark ? 'border-blue-600/30 bg-blue-900/10' : 'border-blue-300 bg-blue-50') : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${colors}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'} ${!notification.isRead ? 'font-bold' : ''}`}>
                            {notification.title}
                          </h3>
                          <span className={`text-xs whitespace-nowrap ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {getTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                            >
                              <Check className="w-3 h-3" />
                              Mark as read
                            </button>
                          )}
                          {notification.metadata?.actionUrl && (
                            <a
                              href={notification.metadata.actionUrl}
                              className={`text-xs font-medium ${isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}
                            >
                              View details →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
