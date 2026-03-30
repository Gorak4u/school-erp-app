'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/lib/toastUtils';

type SocketType = ReturnType<typeof io>;

interface MessengerConversation {
  id: string;
  conversationType: string;
  title: string;
  description?: string;
  avatar?: string;
  participants: any[];
  lastMessage: any;
  unreadCount: number;
  lastMessageAt: string;
  isMuted: boolean;
  isArchived: boolean;
}

interface MessengerMessage {
  id: string;
  body: string;
  messageType: string;
  attachments?: any[];
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  replyTo?: any;
  reactions: any[];
  isRead: boolean;
  editedAt?: string;
  createdAt: string;
}

interface SendMessageOptions {
  replyToId?: string;
  attachments?: any[];
  messageType?: string;
}

function playIncomingMessageTone() {
  console.log('🎵 playIncomingMessageTone called');
  if (typeof window === 'undefined') {
    console.log('❌ Window not available');
    return;
  }

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    console.log('❌ AudioContext not available');
    return;
  }

  try {
    console.log('🔊 Creating audio context and oscillator');
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
    console.log('✅ Sound playing successfully');

    oscillator.onended = () => {
      console.log('🔇 Sound ended, closing audio context');
      audioContext.close().catch(() => {});
    };
  } catch (error) {
    console.error('❌ Error playing sound:', error);
  }
}

export function useMessenger(conversationId?: string, enabled: boolean = true) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<MessengerConversation[]>([]);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<SocketType | null>(null);

  useEffect(() => {
    if (!enabled || !user?.id) return;

    const newSocket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Messenger socket connected:', newSocket.id);
      console.log('👤 User joining room:', user.id);
      setIsConnected(true);
      newSocket.emit('join', user.id);
      
      // Join conversation room if viewing a conversation
      if (conversationId) {
        console.log('🏠 Joining conversation room:', conversationId);
        newSocket.emit('conversation:join', { conversationId });
      }
      
      console.log('✅ Messenger socket setup complete');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('reconnect', (_attemptNumber: number) => {
      setIsConnected(true);
      newSocket.emit('join', user.id);
      if (conversationId) {
        newSocket.emit('conversation:join', { conversationId });
      }
    });

    newSocket.on('message:received', (data: any) => {
      console.log('🔔 Message received:', data);
      console.log('📍 Current page:', window.location.pathname);
      console.log('👤 User ID:', user?.id, 'Sender ID:', data.sender?.id);
      
      // Only play notification sound if NOT on messenger page
      if (user?.id && data.sender?.id !== user.id && window.location.pathname !== '/messenger') {
        console.log('🎵 Playing notification sound');
        playIncomingMessageTone();
      } else {
        console.log('🔇 Not playing sound:', {
          hasUser: !!user?.id,
          isOwnMessage: user?.id === data.sender?.id,
          onMessengerPage: window.location.pathname === '/messenger'
        });
      }
      
      // Add message to current conversation if viewing it
      if (conversationId && data.conversationId === conversationId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
      
      // Update conversations list and sort by latest message
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === data.conversationId
            ? {
                ...c,
                lastMessage: data,
                lastMessageAt: data.createdAt,
                unreadCount: data.sender.id !== user.id ? c.unreadCount + 1 : c.unreadCount,
              }
            : c
        );
        
        // Sort by most recent message
        return updated.sort((a, b) => 
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });
    });

    newSocket.on('message:updated', (data: any) => {
      setMessages((prev) => prev.map((message) => (message.id === data.id ? { ...message, ...data } : message)));
      void fetchConversations().catch(() => {});
    });

    newSocket.on('message:deleted', (data: any) => {
      setMessages((prev) => prev.filter((message) => message.id !== data.id));
      void fetchConversations().catch(() => {});
    });

    // Handle new conversations
    newSocket.on('conversation:created', (data: any) => {
      setConversations((prev) => [data, ...prev]);
    });

    newSocket.on('message:readReceipt', (data: any) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, isRead: true } : m))
      );
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      if (conversationId) {
        newSocket.emit('conversation:leave', { conversationId });
      }
      newSocket.disconnect();
    };
  }, [enabled, user?.id, conversationId]);

  const fetchConversations = useCallback(async (page: number = 1, archived?: string) => {
    if (!enabled) return { data: [], pagination: { page, pageSize: 25, total: 0, totalPages: 0, hasMore: false } };
    try {
      setLoading(true);
      const archivedParam = archived ? `&archived=${archived}` : '';
      const response = await fetch(`/api/messenger/conversations?page=${page}&pageSize=25${archivedParam}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Failed to fetch conversations';
        const errorDetails = errorData.error?.details;

        if (errorData.error?.code === 'DATABASE_SCHEMA_ERROR') {
          showToast('error', 'Database Setup Required', errorDetails || 'Please run database migration');
        } else {
          showToast('error', 'Error', errorMessage);
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setConversations(data.data);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const fetchMessages = useCallback(
    async (page: number = 1) => {
      if (!enabled || !conversationId) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/messenger/conversations/${conversationId}/messages?page=${page}&pageSize=50`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data.data);
        return data;
      } catch (error) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [enabled, conversationId]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!enabled || !conversationId || !messageId || !content.trim()) return;

      try {
        setSending(true);
        const response = await fetch(`/api/messenger/messages/${messageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        });
        if (!response.ok) throw new Error('Failed to edit message');
        const data = await response.json();
        const updatedMessage = data.data;

        setMessages((prev) => prev.map((message) => (message.id === messageId ? { ...message, ...updatedMessage } : message)));
        void fetchConversations().catch(() => {});
        return updatedMessage;
      } catch (error) {
        throw error;
      } finally {
        setSending(false);
      }
    },
    [enabled, conversationId, fetchConversations]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!enabled || !conversationId || !messageId) return;

      try {
        setSending(true);
        const response = await fetch(`/api/messenger/messages/${messageId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete message');

        setMessages((prev) => prev.filter((message) => message.id !== messageId));
        void fetchConversations().catch(() => {});
        return true;
      } catch (error) {
        throw error;
      } finally {
        setSending(false);
      }
    },
    [enabled, conversationId, fetchConversations]
  );

  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions) => {
      if (!enabled || !conversationId) return;

      const trimmedContent = content.trim();
      const attachments = options?.attachments || [];
      if (!trimmedContent && attachments.length === 0) return;

      try {
        setSending(true);
        const response = await fetch(`/api/messenger/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: trimmedContent,
            messageType: options?.messageType || (attachments.length > 0 ? 'file' : 'text'),
            replyToId: options?.replyToId,
            attachments,
          }),
        });
        if (!response.ok) throw new Error('Failed to send message');
        const data = await response.json();
        return data.data;
      } catch (error) {
        throw error;
      } finally {
        setSending(false);
      }
    },
    [enabled, conversationId]
  );

  const markAsRead = useCallback(
    async (messageId?: string) => {
      if (!enabled || !conversationId) return;
      try {
        const response = await fetch(`/api/messenger/conversations/${conversationId}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId }),
        });
        if (!response.ok) throw new Error('Failed to mark as read');
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      } catch {
        // Ignore read receipt errors to avoid disrupting the chat UI.
      }
    },
    [enabled, conversationId]
  );

  const archiveConversation = useCallback(
    async (targetConversationId: string, archived: boolean) => {
      if (!enabled) return;
      try {
        const response = await fetch(`/api/messenger/conversations/${targetConversationId}/archive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived }),
        });
        if (!response.ok) throw new Error('Failed to archive conversation');
        
        // Update local state to remove archived conversation or update isArchived status
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConversationId ? { ...c, isArchived: archived } : c
          )
        );
        return true;
      } catch (error) {
        console.error('Failed to archive conversation:', error);
        throw error;
      }
    },
    [enabled]
  );

  const createConversation = useCallback(async (
    participantIds: string[],
    options?: {
      title?: string;
      conversationType?: 'direct' | 'group' | 'broadcast';
    }
  ) => {
    if (!enabled) throw new Error('Messenger is disabled for this school');
    try {
      setLoading(true);
      const response = await fetch('/api/messenger/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationType: options?.conversationType || (participantIds.length === 1 ? 'direct' : 'group'),
          participantIds,
          title: options?.title,
        }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  return {
    socket,
    isConnected,
    conversations,
    messages,
    loading,
    sending,
    fetchConversations,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    archiveConversation,
    createConversation,
  };
}
