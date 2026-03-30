'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';

interface IncomingCallData {
  from: string;
  conversationId: string;
  callType: 'voice' | 'video';
  callerName?: string;
  offer?: any;
}

interface CallContextType {
  incomingCallData: IncomingCallData | null;
  showCallModal: boolean;
  isOnMessengerPage: boolean;
  setShowCallModal: (show: boolean) => void;
  setIsOnMessengerPage: (isMessenger: boolean) => void;
  acceptCall: (data: IncomingCallData) => Promise<void>;
  rejectCall: () => void;
  dismissCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children, socket }: { children: ReactNode; socket: any }) {
  const { user } = useAuth();
  const [incomingCallData, setIncomingCallData] = useState<IncomingCallData | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isOnMessengerPage, setIsOnMessengerPage] = useState(false);
  const listenerRegisteredRef = useRef(false);

  const { acceptCall: webrtcAccept, rejectCall: webrtcReject } = useWebRTCCall(
    incomingCallData?.conversationId,
    true,
    socket
  );

  useEffect(() => {
    if (!socket || !user?.id || listenerRegisteredRef.current) return;

    console.log('🎯 [CallProvider] Registering SINGLE global call-incoming listener');

    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('📞 [CallProvider] Incoming call received:', data);
      setIncomingCallData(data);
      setShowCallModal(true);
    };

    socket.on('call-incoming', handleIncomingCall);
    listenerRegisteredRef.current = true;

    return () => {
      console.log('🧹 [CallProvider] Cleaning up call-incoming listener');
      socket.off('call-incoming', handleIncomingCall);
      listenerRegisteredRef.current = false;
    };
  }, [socket, user?.id]);

  const acceptCall = async (data: IncomingCallData) => {
    try {
      await webrtcAccept(data);
      setShowCallModal(true);
    } catch (error) {
      console.error('[CallProvider] Failed to accept call:', error);
    }
  };

  const rejectCall = () => {
    if (incomingCallData) {
      webrtcReject(incomingCallData.from, incomingCallData.conversationId);
    }
    dismissCall();
  };

  const dismissCall = () => {
    setIncomingCallData(null);
    setShowCallModal(false);
  };

  return (
    <CallContext.Provider
      value={{
        incomingCallData,
        showCallModal,
        isOnMessengerPage,
        setShowCallModal,
        setIsOnMessengerPage,
        acceptCall,
        rejectCall,
        dismissCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within CallProvider');
  }
  return context;
}
