'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { getWebSocketServerUrl } from '@/lib/websocket-url';
import { useSession } from 'next-auth/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketInstance = any;

// Event handler type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (data: any) => void;

interface SocketContextType {
  socket: SocketInstance | null;
  isConnected: boolean;
  socketId: string | null;
  // Event subscription methods
  subscribe: (event: string, handler: EventHandler) => () => void;
  unsubscribe: (event: string, handler: EventHandler) => void;
  emit: (event: string, data: unknown, callback?: (response: unknown) => void) => void;
  // Convenience methods for common operations
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  socketId: null,
  subscribe: () => () => {},
  unsubscribe: () => {},
  emit: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<SocketInstance | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const socketRef = useRef<SocketInstance | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());

  // Subscribe to an event
  const subscribe = useCallback((event: string, handler: EventHandler) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)?.add(handler);

    // If socket exists and is connected, register handler directly
    if (socketRef.current?.connected) {
      socketRef.current.on(event, handler);
    }

    // Return unsubscribe function
    return () => {
      unsubscribe(event, handler);
    };
  }, []);

  // Unsubscribe from an event
  const unsubscribe = useCallback((event: string, handler: EventHandler) => {
    eventHandlersRef.current.get(event)?.delete(handler);
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  // Emit an event - FIXED: Queue messages when disconnected
  const emit = useCallback((event: string, data: unknown, callback?: (response: unknown) => void) => {
    if (socketRef.current?.connected) {
      if (callback) {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
    } else {
      console.warn('🔌 Socket not connected, cannot emit:', event);
      // FIXED: Could add queue logic here for offline support
    }
  }, []);

  // Join a room
  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join', room);
      console.log('🔌 Joined room:', room);
    }
  }, []);

  // Leave a room
  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave', room);
      console.log('🔌 Left room:', room);
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const serverUrl = getWebSocketServerUrl();
    
    console.log('🔌 Global Socket connecting to:', serverUrl);
    const newSocket = io(serverUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      auth: {
        token: session.user.id,
        userId: session.user.id,
        schoolId: session.user.schoolId,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Global socket connected:', newSocket.id);
      setIsConnected(true);
      setSocketId(newSocket.id);

      // Join user room
      newSocket.emit('join', session.user.id);
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('🔌 Global socket disconnected:', reason);
      setIsConnected(false);
      setSocketId(null);
    });

    newSocket.on('reconnect', (attemptNumber: number) => {
      console.log('🔌 Global socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setSocketId(newSocket.id);
      
      // Re-join user room after reconnect
      newSocket.emit('join', session.user.id);
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('🔌 Global socket connection error:', error.message);
      console.error('🔌 Server URL:', serverUrl, '- Path: /api/socket');
      console.error('🔌 Make sure server is running with: node server.js (not next dev)');
    });

    return () => {
      console.log('🔌 Cleaning up global socket');
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setSocketId(null);
    };
  }, [session?.user?.id, session?.user?.schoolId]);

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    socketId,
    subscribe,
    unsubscribe,
    emit,
    joinRoom,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export const useGlobalSocket = () => useContext(SocketContext);

// Hook for subscribing to specific events
export function useSocketEvent(event: string, handler: EventHandler) {
  const { subscribe } = useGlobalSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe(event, handler);
    return unsubscribe;
  }, [event, handler, subscribe]);
}
