'use client';

import { CallProvider } from '@/contexts/CallContext';
import { useGlobalSocket } from '@/contexts/SocketContext';
import { ReactNode } from 'react';

export function CallProviderWrapper({ children }: { children: ReactNode }) {
  const { socket } = useGlobalSocket();
  
  return (
    <CallProvider socket={socket}>
      {children}
    </CallProvider>
  );
}
