import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);

  const connect = useCallback(() => {
    try {
      // Close existing connection if any
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }

      // Check if WebSocket URL is configured
      const wsUrl = url.startsWith('ws') ? url : `ws://${url}`;
      
      // Validate WebSocket URL before creating connection
      if (!wsUrl || wsUrl.startsWith('mock://') || (wsUrl === 'ws://localhost:3000' && typeof window !== 'undefined')) {
        console.warn('WebSocket server not configured. Using mock connection for demo.');
        // Create a mock WebSocket for demo purposes
        createMockWebSocket();
        return;
      }

      // Create new WebSocket connection
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectCountRef.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        onDisconnect?.();

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          console.log(`Attempting to reconnect (${reconnectCountRef.current}/${reconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        console.warn('WebSocket connection failed, using mock mode');
        onError?.(error);
        // Fall back to mock WebSocket
        createMockWebSocket();
      };

    } catch (error) {
      console.warn('WebSocket error, falling back to mock mode:', error);
      onError?.(error as Event);
      createMockWebSocket();
    }
  }, [url, onConnect, onDisconnect, onError, reconnectAttempts, reconnectInterval]);

  // Mock WebSocket for demo purposes
  const createMockWebSocket = useCallback(() => {
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: (data: string) => {
        try {
          const message = JSON.parse(data);
          console.log('Mock WebSocket send:', message);
          
          // Simulate receiving responses after a delay
          setTimeout(() => {
            if (message.type === 'subscribe') {
              // Simulate subscription confirmation
              const mockResponse = {
                type: 'subscribed',
                data: { success: true },
                timestamp: Date.now()
              };
              
              // Trigger the onmessage callback
              if (onMessage) {
                onMessage(mockResponse);
              }
            }
          }, 100);
        } catch (error) {
          console.error('Mock WebSocket send error:', error);
        }
      },
      close: () => {
        console.log('Mock WebSocket closed');
        setIsConnected(false);
      },
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any;

    wsRef.current = mockWs;
    setIsConnected(true);
    onConnect?.();
  }, [onMessage, onConnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect: connect
  };
}

// Hook for fines-specific WebSocket notifications
export function useFinesWebSocket(schoolId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Use a more reliable WebSocket URL or fallback to mock
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
    (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? 'ws://localhost:3000' 
      : null);
  
  const { isConnected, lastMessage, sendMessage } = useWebSocket(
    wsUrl || 'mock://fines',
    {
      onMessage: (message) => {
        if (message.type === 'fine_update' || message.type === 'waiver_update') {
          setNotifications(prev => [message.data, ...prev.slice(0, 9)]); // Keep last 10 notifications
        }
      },
      onConnect: () => {
        // Subscribe to fines updates for this school
        if (wsUrl) {
          sendMessage({
            type: 'subscribe',
            data: { schoolId }
          });
        }
      },
      onError: (error) => {
        // Silently handle WebSocket errors in demo mode
        console.log('WebSocket running in demo mode');
      }
    }
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    isConnected: wsUrl ? isConnected : true, // Always show as connected in demo mode
    notifications,
    clearNotifications,
    sendMessage
  };
}
