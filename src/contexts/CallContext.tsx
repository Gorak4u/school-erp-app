'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/lib/toastUtils';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [incomingCallData, setIncomingCallData] = useState<IncomingCallData | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isOnMessengerPage, setIsOnMessengerPage] = useState(false);
  const listenerRegisteredRef = useRef(false);

  // NOTE: CallProvider doesn't need useWebRTCCall - it only manages incoming call state
  // The actual WebRTC logic is handled by CallModal when it opens

  useEffect(() => {
    if (!socket || !user?.id || listenerRegisteredRef.current) return;

    console.log('🎯 [CallProvider] Registering SINGLE global call-incoming listener');

    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('📞 [CallProvider] Incoming call received:', data);
      
      // GUARD: Don't process if we already have an active incoming call
      if (incomingCallData) {
        console.log('⏭️ [CallProvider] Already have active incoming call, ignoring duplicate');
        return;
      }
      
      // Show toast notification
      showToast(
        'info',
        'Incoming Call',
        `${data.callerName} is calling you (${data.callType})`,
        10000
      );
      
      setIncomingCallData(data);
      setShowCallModal(true);
      
      // Auto-redirect to messenger after short delay if not already there
      // FIXED: Reduced from 3000ms to 500ms for better UX
      if (window.location.pathname !== '/messenger') {
        setTimeout(() => {
          router.push('/messenger');
        }, 500);
      }
    };

    const handleCallCancelled = (data: { from: string; conversationId: string }) => {
      console.log('📞 [CallProvider] Call cancelled by caller:', data);
      
      // Only process if this matches our current incoming call
      if (incomingCallData && incomingCallData.from === data.from && incomingCallData.conversationId === data.conversationId) {
        showToast('info', 'Call Cancelled', 'The caller cancelled the call');
        dismissCall();
      }
    };

    socket.on('call-incoming', handleIncomingCall);
    socket.on('call-cancelled', handleCallCancelled);
    listenerRegisteredRef.current = true;

    return () => {
      console.log('🧹 [CallProvider] Cleaning up call-incoming listener');
      socket.off('call-incoming', handleIncomingCall);
      socket.off('call-cancelled', handleCallCancelled);
      listenerRegisteredRef.current = false;
    };
  // CRITICAL: Only re-register when socket or user changes, NOT when incomingCallData changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user?.id, router]);

  const acceptCall = async (data: IncomingCallData) => {
    // Just set state - CallModal will handle the actual WebRTC connection
    setIncomingCallData(data);
    setShowCallModal(true);
  };

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (incomingCallData && socket) {
      // FIXED: Use call-hangup instead of call-reject (server doesn't have call-reject handler)
      socket.emit('call-signal', { 
        type: 'call-hangup',
        conversationId: incomingCallData.conversationId,
        from: user?.id,
        to: incomingCallData.from 
      });
    }
    dismissCall();
  }, [incomingCallData, socket, user?.id]);

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
  
  // During SSR/build, provide safe defaults instead of throwing
  if (!context) {
    if (typeof window === 'undefined') {
      // Server-side: return safe defaults
      return {
        incomingCallData: null,
        showCallModal: false,
        isOnMessengerPage: false,
        setShowCallModal: () => {},
        setIsOnMessengerPage: () => {},
        acceptCall: async () => {},
        rejectCall: () => {},
        dismissCall: () => {},
      };
    }
    throw new Error('useCallContext must be used within CallProvider');
  }
  return context;
}
