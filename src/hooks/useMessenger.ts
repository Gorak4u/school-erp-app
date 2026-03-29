'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/lib/toastUtils';

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

export function useMessenger(conversationId?: string) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<MessengerConversation[]>([]);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<typeof Socket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const newSocket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join', user.id);
      if (conversationId) {
        newSocket.emit('conversation:join', { conversationId });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('message:received', (data: any) => {
      if (conversationId && data.conversationId === conversationId) {
        setMessages((prev) => [...prev, data]);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === data.conversationId
            ? {
                ...c,
                lastMessage: data,
                lastMessageAt: data.createdAt,
                unreadCount: data.sender.id !== user.id ? c.unreadCount + 1 : c.unreadCount,
              }
            : c
        )
      );
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
  }, [user?.id, conversationId]);

  const fetchConversations = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messenger/conversations?page=${page}&pageSize=25`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Failed to fetch conversations';
        const errorDetails = errorData.error?.details;
        
        console.error('Fetch conversations error:', errorData);
        
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
      console.error('Error fetching conversations:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(
    async (page: number = 1) => {
      if (!conversationId) return;
      try {
        setLoading(true);
        const response = await fetch(`/api/messenger/conversations/${conversationId}/messages?page=${page}&pageSize=50`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data.data);
        return data;
      } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!conversationId || !content.trim()) return;
      try {
        setSending(true);
        const response = await fetch(`/api/messenger/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: content.trim(),
            messageType: 'text',
            replyToId,
          }),
        });
        if (!response.ok) throw new Error('Failed to send message');
        const data = await response.json();
        return data.data;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      } finally {
        setSending(false);
      }
    },
    [conversationId]
  );

  const markAsRead = useCallback(
    async (messageId?: string) => {
      if (!conversationId) return;
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
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    },
    [conversationId]
  );

  const createConversation = useCallback(async (participantIds: string[], title?: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/messenger/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationType: participantIds.length === 1 ? 'direct' : 'group',
          participantIds,
          title,
        }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

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
    markAsRead,
    createConversation,
  };
}
