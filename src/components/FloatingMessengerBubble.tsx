'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import io from 'socket.io-client';
import { MessageSquare, X, Bell, GripVertical } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/contexts/SchoolConfigContext';

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
    [key: string]: any;
  };
}

type SocketType = ReturnType<typeof io>;

export function FloatingMessengerBubble() {
  const { user } = useAuth();
  const { messengerEnabled } = useAppConfig();
  const [notifications, setNotifications] = useState<MessengerNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setSocket] = useState<SocketType | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Default position - bottom right (24px from edges)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  // Set initial position after mount (to get window dimensions)
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('messengerBubblePosition');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPosition(parsed);
      } catch {
        setPosition({ x: window.innerWidth - 88, y: window.innerHeight - 88 });
      }
    } else {
      setPosition({ x: window.innerWidth - 88, y: window.innerHeight - 88 });
    }
  }, []);

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 80),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Socket connection
  useEffect(() => {
    if (!messengerEnabled || !user?.id) return;

    const socketInstance = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketInstance.on('connect', () => {
      socketInstance.emit('join', user.id);
    });

    socketInstance.on('messenger_notification', (notification: MessengerNotification) => {
      if (notification.metadata?.module !== 'messenger') return;
      setNotifications((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [messengerEnabled, user?.id]);

  // Fetch notifications
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

  const handleDragEnd = (_: any, info: any) => {
    setIsDragging(false);
    const newPosition = { x: position.x + info.offset.x, y: position.y + info.offset.y };
    setPosition(newPosition);
    localStorage.setItem('messengerBubblePosition', JSON.stringify(newPosition));
  };

  // Don't render if not mounted, messenger disabled, or no user
  if (!mounted || !messengerEnabled || !user?.id) {
    return null;
  }

  return (
    <>
      {/* Drag constraints container */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9998 }} />

      {/* Floating Bubble */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={{ left: 0, right: window.innerWidth - 64, top: 0, bottom: window.innerHeight - 64 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className="pointer-events-auto"
      >
        <div className="relative">
          {/* Main Button */}
          <motion.button
            onClick={() => !isDragging && setIsOpen((prev) => !prev)}
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-2xl transition-all duration-300 flex items-center justify-center group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Messenger notifications (drag to move)"
          >
            <MessageSquare className="w-7 h-7" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-6 h-6 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full shadow-lg border-2 border-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
            
            {/* Drag handle indicator */}
            <div className="absolute -top-1 -left-1 p-1 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3" />
            </div>
          </motion.button>

          {/* Notifications Panel */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-full right-0 mb-4 w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
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
                    onClick={() => setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))}
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
      </motion.div>
    </>
  );
}
