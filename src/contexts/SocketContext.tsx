'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
// socket.io-client v4 uses default export; @types/socket.io-client@1 is incompatible
// eslint-disable-next-line @typescript-eslint/no-require-imports
const io = require('socket.io-client').io || require('socket.io-client');
import { useSession } from 'next-auth/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketInstance = any;

interface SocketContextType {
  socket: SocketInstance | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<SocketInstance | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<SocketInstance | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const serverUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    const newSocket = io(serverUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      auth: {
        token: session.user.id,
        userId: session.user.id,
        schoolId: session.user.schoolId,
      },
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Global socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Global socket disconnected');
      setIsConnected(false);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [session?.user?.id, session?.user?.schoolId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useGlobalSocket = () => useContext(SocketContext);
