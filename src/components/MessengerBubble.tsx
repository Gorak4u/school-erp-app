'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/contexts/SchoolConfigContext';
import { useGlobalSocket } from '@/contexts/SocketContext';

interface MessengerNotification {
  id: string;
  type: 'message' | 'conversation' | 'mention';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: {
    module?: string;
    conversationId?: string;
    messageId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export function MessengerBubble() {
  const { user } = useAuth();
  const { messengerEnabled } = useAppConfig();
  const { subscribe, isConnected } = useGlobalSocket();
  const [notifications, setNotifications] = useState<MessengerNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  // Subscribe to messenger notifications via global socket
  useEffect(() => {
    if (!messengerEnabled || !user?.id || !isConnected) return;

    console.log('💬 MessengerBubble subscribing to global socket');

    const unsubscribe = subscribe('messenger_notification', (notification: MessengerNotification) => {
      setNotifications((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)]);
    });

    return () => {
      unsubscribe();
    };
  }, [messengerEnabled, user?.id, isConnected, subscribe]);

  useEffect(() => {
    if (!messengerEnabled || !user?.id) return;

    const fetchMessengerNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/notifications?limit=50');
        if (!response.ok) return;
        const data = await response.json();
        const messengerItems = (data.notifications || []).filter(
          (notification: MessengerNotification) => notification?.metadata?.module === 'messenger'
        );
        setNotifications(messengerItems);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchMessengerNotifications();
    const interval = setInterval(fetchMessengerNotifications, 30000);
    return () => clearInterval(interval);
  }, [messengerEnabled, user?.id]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (!response.ok) return;
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    } catch {
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'PUT' });
      if (!response.ok) return;
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch {
    }
  };

  if (!messengerEnabled || !user?.id) {
    return null;
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-3 rounded-xl transition-all duration-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Messenger notifications"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border z-50 overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Messenger
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Conversation alerts and updates</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No messenger notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => {
                      markAsRead(notification.id);
                      setIsOpen(false);
                      window.location.href = '/messenger';
                    }}
                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors ${
                      notification.isRead
                        ? 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/40'
                        : 'bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notification.isRead ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{notification.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{notification.message}</p>
                        <p className="mt-1 text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all read
              </button>
              <Link href="/messenger" className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white">
                Open Messenger
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
