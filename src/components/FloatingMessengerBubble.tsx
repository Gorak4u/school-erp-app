'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Bell, X, GripVertical, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/contexts/SchoolConfigContext';
import { useGlobalSocket } from '@/contexts/SocketContext';
import { usePathname } from 'next/navigation';

// Module-level flag to persist across component remounts (AppLayout remounts on every page change)
let hasFetchedGlobally = false;

interface MessengerNotification {
  id: string;
  type: 'message' | 'conversation' | 'mention';
  title: string;
  message?: string;
  conversationId?: string;
  senderName?: string;
  createdAt: string;
  isRead?: boolean;
  entityId?: string;
  entityType?: string;
  metadata?: {
    module: string;
    conversationId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

// Chat functionality functions
const fetchConversationMessages = async (conversationId: string) => {
  try {
    const response = await fetch(`/api/messenger/conversations/${conversationId}/messages?page=1&pageSize=50`);
    
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    } else {
      // Return empty array for any error
      return [];
    }
  } catch (error) {
    return [];
  }
};

const sendMessage = async (conversationId: string, content: string) => {
  try {
    const response = await fetch(`/api/messenger/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    
    if (response.ok) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

// Message notification sound function
function playMessageSound() {
  if (typeof window === 'undefined') {
    return;
  }

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  try {
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 1.0;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.06, audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);
    oscillator.stop(audioContext.currentTime + 0.36);

    oscillator.onended = () => {
      audioContext.close().catch(() => {});
    };
  } catch (error) {
    // Error handled silently
  }
}

export function FloatingMessengerBubble() {
  const { user } = useAuth();
  const { messengerEnabled } = useAppConfig();
  const { subscribe, isConnected } = useGlobalSocket();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<MessengerNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chatView, setChatView] = useState<'notifications' | 'chat'>('notifications');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  
  // Default position - bottom right (24px from edges)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle opening chat from notification
  const openChat = async (notification: MessengerNotification) => {
    // Extract conversationId from multiple possible sources
    const conversationId = notification.conversationId || 
                          notification.entityId || 
                          notification.metadata?.conversationId;
    
    if (!conversationId) {
      return;
    }
    
    setChatView('chat');
    setSelectedConversation({
      id: conversationId,
      name: notification.title,
    });
    
    // Fetch messages
    const conversationMessages = await fetchConversationMessages(conversationId);
    setMessages(conversationMessages);
    
    markAsRead(notification.id);
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;
    
    setSendingMessage(true);
    const success = await sendMessage(selectedConversation.id, messageInput.trim());
    
    if (success) {
      setMessageInput('');
      // Refresh messages
      const conversationMessages = await fetchConversationMessages(selectedConversation.id);
      setMessages(conversationMessages);
    }
    
    setSendingMessage(false);
  };

  // Handle back to notifications
  const handleBackToNotifications = () => {
    setChatView('notifications');
    setSelectedConversation(null);
    setMessages([]);
    setMessageInput('');
  };
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

  // Subscribe to global socket events for messenger
  useEffect(() => {
    if (!messengerEnabled || !user?.id || !isConnected) {
      return;
    }

    // Subscribe to message events
    const unsubscribeMessageReceived = subscribe('message:received', (data: any) => {
      // Play sound and show toast for incoming messages
      if (user?.id && data.sender?.id !== user.id && window.location.pathname !== '/messenger') {
        playMessageSound();
        // Show toast notification with sender name and message preview
        if (typeof window !== 'undefined') {
          const senderName = data.sender?.name || data.senderName || 'Someone';
          const messageContent = data.content || data.message || '';
          const messagePreview = messageContent.length > 50 
            ? messageContent.substring(0, 50) + '...' 
            : messageContent;
          
          const toast = document.createElement('div');
          toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-pulse max-w-sm';
          toast.innerHTML = `
            <div class="font-semibold">${senderName}</div>
            <div class="text-sm opacity-90">${messagePreview || 'New message'}</div>
          `;
          document.body.appendChild(toast);
          setTimeout(() => {
            toast.remove();
          }, 5000);
        }
      }
    });

    const unsubscribeNewMessage = subscribe('new-message', (data: any) => {
      // Handle new-message events
    });

    const unsubscribeNotification = subscribe('notification', (data: any) => {
      // Handle notification events
    });

    const unsubscribeMessengerNotification = subscribe('messenger_notification', (notification: MessengerNotification) => {
      setNotifications((prev) => [notification, ...prev.filter((item) => item.id !== notification.id)]);
    });

    return () => {
      unsubscribeMessageReceived();
      unsubscribeNewMessage();
      unsubscribeNotification();
      unsubscribeMessengerNotification();
    };
  }, [messengerEnabled, user?.id, isConnected, subscribe]);

  // Public pages that should not trigger messenger fetch
  const PUBLIC_PAGES = ['/login', '/register', '/forgot-password', '/reset-password', '/pricing'];
  const isPublicPage = PUBLIC_PAGES.some(page => pathname?.startsWith(page));

  // Fetch conversations and notifications - only once per session
  useEffect(() => {
    if (!messengerEnabled || !user?.id || isPublicPage) return;
    if (hasFetchedGlobally) return; // Prevent re-fetch on remounts
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    hasFetchedGlobally = true; // Set global flag

    const fetchMessengerData = async () => {
      setLoading(true);
      try {
        // Fetch conversations like the main messenger does
        const conversationsResponse = await fetch('/api/messenger/conversations?page=1&pageSize=50');
        let messengerNotifications: MessengerNotification[] = [];
        
        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          // Convert conversations to notification format
          messengerNotifications = (conversationsData.data || []).map((conv: any) => ({
            id: conv.id,
            type: 'conversation' as const,
            title: conv.title || 'Unknown Conversation',
            message: conv.lastMessage?.body || 'No messages',
            conversationId: conv.id,
            senderName: conv.lastMessage?.sender?.name || 'Unknown',
            createdAt: conv.lastMessageAt || conv.createdAt,
            isRead: conv.unreadCount === 0,
            entityId: conv.id,
            entityType: 'MessengerConversation',
            metadata: {
              module: 'messenger',
              conversationId: conv.id,
              unreadCount: conv.unreadCount,
            },
          }));
        } else {
          // Fallback to notifications if conversations API fails
          const notificationsResponse = await fetch('/api/notifications?limit=50');
          if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json();
            const notificationItems = (notificationsData.notifications || []).filter(
              (notification: MessengerNotification) => notification?.metadata?.module === 'messenger'
            );
            messengerNotifications = notificationItems;
          }
        }
        
        setNotifications(messengerNotifications);
      } catch (error) {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    };

    fetchMessengerData();
  }, [messengerEnabled, user?.id, isPublicPage]);

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
            {isOpen && chatView === 'notifications' && (
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
                        onClick={() => openChat(notification)}
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

          {/* Chat Panel */}
          <AnimatePresence>
            {isOpen && chatView === 'chat' && selectedConversation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-full right-0 mb-4 w-96 h-[500px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 flex flex-col"
              >
                {/* Chat Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToNotifications}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{selectedConversation.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Active now</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {messages[0] === 'ACCESS_DENIED' 
                          ? "You don't have access to this conversation in the mini messenger."
                          : "No messages available. You may not have access to this conversation."
                        }
                      </p>
                      {messages[0] === 'ACCESS_DENIED' && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Try opening the full messenger to access this conversation.
                          </p>
                          <a 
                            href="/messenger" 
                            className="inline-block px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            Open Full Messenger
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      // Handle special ACCESS_DENIED case
                      if (message === 'ACCESS_DENIED') {
                        return null; // Don't render anything for ACCESS_DENIED marker
                      }
                      
                      return (
                        <div
                          key={message.id || `message-${index}`}
                          className={`flex ${message.sender?.id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-3 py-2 rounded-lg ${
                              message.sender?.id === user?.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                            }`}
                          >
                            <p className="text-sm">{message.body || message.content || ''}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender?.id === user?.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={
                        messages[0] === 'ACCESS_DENIED' 
                          ? "Access denied - use full messenger" 
                          : messages.length === 0 
                            ? "Cannot send messages" 
                            : "Type a message..."
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={sendingMessage || messages.length === 0 || messages[0] === 'ACCESS_DENIED'}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendingMessage || messages.length === 0 || messages[0] === 'ACCESS_DENIED'}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
