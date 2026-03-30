'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/lib/toastUtils';

type SocketType = ReturnType<typeof io>;

export interface CallState {
  isInCall: boolean;
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  callType: 'voice' | 'video' | 'screen';
  remoteUserId?: string;
  remoteUserName?: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  connectionState: 'connecting' | 'connected' | 'ended' | 'failed';
}

export interface CallSignal {
  type: 'call-offer' | 'call-answer' | 'call-ice-candidate' | 'call-hangup' | 'call-screen-share';
  from: string;
  to: string;
  conversationId: string;
  callType: 'voice' | 'video' | 'screen';
  payload?: any;
  offer?: any;
}

export interface IncomingCallData {
  from: string;
  conversationId: string;
  callType: 'voice' | 'video';
  callerName?: string;
  offer?: any;
}

export const useWebRTCCall = (conversationId?: string, enabled: boolean = false, signalingSocket?: SocketType | null) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<any>(null);
  const socketReadyRef = useRef<boolean>(false);

  // Use refs for values needed inside peer callbacks to avoid stale closures
  const remoteUserIdRef = useRef<string>('');
  const conversationIdRef = useRef<string>(conversationId || '');
  const localStreamRef = useRef<MediaStream | null>(null);

  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isIncomingCall: false,
    isOutgoingCall: false,
    callType: 'voice',
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    callDuration: 0,
    connectionState: 'connecting',
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Keep refs in sync
  useEffect(() => { conversationIdRef.current = conversationId || ''; }, [conversationId]);

  // Wait for socket to be connected
  const waitForSocketReady = useCallback(async (timeoutMs = 5000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (socketRef.current?.connected) {
        socketReadyRef.current = true;
        return true;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }, []);

  // Initialize socket
  useEffect(() => {
    if (!enabled || !user?.id) return;

    const init = async () => {
      // Prefer messenger socket
      if (signalingSocket?.connected) {
        socketRef.current = signalingSocket;
        socketReadyRef.current = true;
        setIsConnected(true);
        return;
      }

      // Wait briefly for messenger socket
      if (signalingSocket) {
        socketRef.current = signalingSocket;
        const ready = await waitForSocketReady(3000);
        if (ready) { setIsConnected(true); return; }
      }

      // Fallback: create own socket
      if (socketRef.current?.connected) { setIsConnected(true); return; }

      const serverUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const newSocket = io(serverUrl, {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        newSocket.emit('join', user.id, (ack: any) => {
          console.log('✅ Socket joined room:', ack);
        });
        socketReadyRef.current = true;
        setIsConnected(true);
      });

      newSocket.on('connect_error', (err: Error) => {
        console.error('❌ Socket connect error:', err.message);
      });

      newSocket.on('disconnect', () => {
        socketReadyRef.current = false;
        setIsConnected(false);
      });

      const ready = await waitForSocketReady(5000);
      if (!ready) showToast('error', 'Connection Error', 'Could not establish call connection');
    };

    init();

    return () => {
      if (socketRef.current && !signalingSocket) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [enabled, user?.id, signalingSocket, waitForSocketReady]);

  // Get local media stream
  const initializeLocalStream = useCallback(async (callType: 'voice' | 'video' | 'screen') => {
    try {
      let stream: MediaStream;
      if (callType === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video' ? { width: 1280, height: 720 } : false,
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      }
      setLocalStream(stream);
      localStreamRef.current = stream;
      if ((callType === 'video' || callType === 'screen') && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('❌ Media access error:', error);
      showToast('error', 'Media Access Denied', 'Please allow camera/microphone access and try again');
      throw error;
    }
  }, []);

  // Clean up all media and peer
  const cleanupCall = useCallback(() => {
    if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    const stream = localStreamRef.current;
    if (stream) { stream.getTracks().forEach(t => t.stop()); }
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    remoteUserIdRef.current = '';
  }, []);

  // Create WebRTC peer - IMPORTANT: remoteUserId and callType passed as params to avoid stale closures
  const createPeer = useCallback((
    isInitiator: boolean,
    stream: MediaStream,
    remoteUserId: string,
    callType: 'voice' | 'video' | 'screen'
  ): { peer: SimplePeer.Instance; firstSignalPromise: Promise<any> } => {
    const peer = new SimplePeer({
      initiator: isInitiator,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      }
    });

    // Promise resolves with the first signal (SDP offer/answer)
    let firstSignalResolved = false;
    const firstSignalPromise = new Promise<any>((resolve) => {
      peer.once('signal', (data: any) => {
        firstSignalResolved = true;
        resolve(data);
      });
    });

    peer.on('signal', (data: any) => {
      if (!socketRef.current || !user || !conversationIdRef.current) return;
      // Don't re-emit the first signal if it's already sent via call-initiated
      const type = isInitiator
        ? (firstSignalResolved ? 'call-offer' : 'call-offer')
        : 'call-answer';

      socketRef.current.emit('call-signal', {
        type,
        from: user.id,
        to: remoteUserId,       // use parameter, not stale state
        conversationId: conversationIdRef.current,
        callType,               // use parameter
        payload: data,
      } as CallSignal);
    });

    peer.on('connect', () => {
      console.log('✅ Peer connected!');
      setCallState(prev => ({ ...prev, connectionState: 'connected' }));
      // Start timer only when truly connected
      if (!callTimerRef.current) {
        callTimerRef.current = setInterval(() => {
          setCallState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }));
        }, 1000);
      }
    });

    peer.on('stream', (remote: MediaStream) => {
      setRemoteStream(remote);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
    });

    peer.on('close', () => {
      setCallState(prev => ({
        ...prev, isInCall: false, isOutgoingCall: false, isIncomingCall: false,
        connectionState: 'ended',
      }));
      cleanupCall();
    });

    peer.on('error', (err: any) => {
      console.error('❌ Peer error:', err);
      setCallState(prev => ({ ...prev, connectionState: 'failed' }));
      showToast('error', 'Call Failed', 'Connection failed. Please try again.');
      cleanupCall();
      setCallState({
        isInCall: false, isOutgoingCall: false, isIncomingCall: false,
        callType: 'voice', isMuted: false, isCameraOff: false,
        isScreenSharing: false, callDuration: 0, connectionState: 'failed',
      });
    });

    return { peer, firstSignalPromise };
  }, [user, cleanupCall]);

  // End call - notify remote and clean up
  const endCall = useCallback(() => {
    const remoteId = remoteUserIdRef.current;
    const convId = conversationIdRef.current;

    if (socketRef.current?.connected && user && remoteId && convId) {
      socketRef.current.emit('call-signal', {
        type: 'call-hangup',
        from: user.id,
        to: remoteId,
        conversationId: convId,
        callType: 'voice',
      } as CallSignal);
    }

    cleanupCall();
    setCallState({
      isInCall: false, isOutgoingCall: false, isIncomingCall: false,
      callType: 'voice', isMuted: false, isCameraOff: false,
      isScreenSharing: false, callDuration: 0, connectionState: 'connecting',
    });
  }, [user, cleanupCall]);

  // Start outgoing call
  const startCall = useCallback(async (targetUserId: string, targetUserName: string, callType: 'voice' | 'video') => {
    if (!user || !conversationId) {
      showToast('error', 'Call Error', 'Missing conversation or user data');
      return;
    }

    try {
      if (!socketRef.current?.connected) {
        const ready = await waitForSocketReady(5000);
        if (!ready) {
          showToast('error', 'Connection Error', 'Could not connect. Please try again.');
          return;
        }
      }

      remoteUserIdRef.current = targetUserId;

      setCallState({
        isInCall: true, isOutgoingCall: true, isIncomingCall: false,
        callType, remoteUserId: targetUserId, remoteUserName: targetUserName,
        isMuted: false, isCameraOff: false, isScreenSharing: false,
        callDuration: 0, connectionState: 'connecting',
      });

      const stream = await initializeLocalStream(callType);
      const { peer, firstSignalPromise } = createPeer(true, stream, targetUserId, callType);
      peerRef.current = peer;

      // Wait for SDP offer
      const offer = await Promise.race([
        firstSignalPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Offer timeout')), 10000)),
      ]);
      console.log('✅ SDP offer ready, type:', (offer as any).type);

      socketRef.current.emit('call-initiated', {
        from: user.id,
        to: targetUserId,
        conversationId,
        callType,
        callerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        offer,
      }, (ack: any) => {
        console.log('📨 call-initiated ack:', ack);
      });

      showToast('info', 'Calling...', `Calling ${targetUserName}`);
    } catch (error) {
      console.error('❌ startCall error:', error);
      cleanupCall();
      setCallState({
        isInCall: false, isOutgoingCall: false, isIncomingCall: false,
        callType: 'voice', isMuted: false, isCameraOff: false,
        isScreenSharing: false, callDuration: 0, connectionState: 'failed',
      });
      showToast('error', 'Call Failed', 'Could not start the call. Check mic/camera permissions.');
    }
  }, [user, conversationId, initializeLocalStream, createPeer, waitForSocketReady, cleanupCall]);

  // Accept incoming call - takes IncomingCallData directly
  const acceptCall = useCallback(async (callData: IncomingCallData) => {
    if (!user) return;

    try {
      if (!socketRef.current?.connected) {
        const ready = await waitForSocketReady(3000);
        if (!ready) {
          showToast('error', 'Connection Error', 'Could not connect to accept the call');
          return;
        }
      }

      remoteUserIdRef.current = callData.from;
      conversationIdRef.current = callData.conversationId;

      setCallState({
        isInCall: true, isOutgoingCall: false, isIncomingCall: false,
        callType: callData.callType, remoteUserId: callData.from,
        remoteUserName: callData.callerName || 'Unknown',
        isMuted: false, isCameraOff: false, isScreenSharing: false,
        callDuration: 0, connectionState: 'connecting',
      });

      const stream = await initializeLocalStream(callData.callType);
      const { peer } = createPeer(false, stream, callData.from, callData.callType);
      peerRef.current = peer;

      // Apply the offer
      const offer = callData.offer;
      console.log('🔍 Applying offer in acceptCall:', offer?.type || offer);

      if (offer && typeof offer === 'object' && offer.sdp) {
        peer.signal(offer);
        console.log('✅ Applied SDP offer to peer');
      } else {
        console.error('❌ No valid SDP offer in callData:', offer);
        showToast('error', 'Call Error', 'Invalid call data. Please ask caller to try again.');
        cleanupCall();
        return;
      }

      showToast('success', 'Call Accepted', 'Connecting...');
    } catch (error) {
      console.error('❌ acceptCall error:', error);
      cleanupCall();
      showToast('error', 'Call Error', 'Could not accept the call');
    }
  }, [user, initializeLocalStream, createPeer, waitForSocketReady, cleanupCall]);

  // Reject incoming call
  const rejectCall = useCallback((fromUserId: string, convId?: string) => {
    const targetConvId = convId || conversationIdRef.current || conversationId;
    if (socketRef.current?.connected && user && targetConvId) {
      socketRef.current.emit('call-signal', {
        type: 'call-hangup',
        from: user.id,
        to: fromUserId,
        conversationId: targetConvId,
        callType: 'voice',
      } as CallSignal);
    }
    showToast('info', 'Call Declined', 'You declined the incoming call');
  }, [user, conversationId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCallState(prev => ({ ...prev, isCameraOff: !prev.isCameraOff }));
    }
  }, []);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    const peer = peerRef.current;
    const stream = localStreamRef.current;

    if (callState.isScreenSharing) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (peer && stream) {
          const newTrack = camStream.getVideoTracks()[0];
          const oldTrack = stream.getVideoTracks()[0];
          if (newTrack && oldTrack) peer.replaceTrack(newTrack, oldTrack, stream);
          oldTrack?.stop();
        }
        setLocalStream(camStream);
        localStreamRef.current = camStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = camStream;
        setCallState(prev => ({ ...prev, isScreenSharing: false }));
        showToast('info', 'Screen Share Stopped', 'Switched back to camera');
      } catch (err) {
        console.error('❌ Stop screen share error:', err);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (peer && stream) {
          const newTrack = screenStream.getVideoTracks()[0];
          const oldTrack = stream.getVideoTracks()[0];
          if (newTrack && oldTrack) peer.replaceTrack(newTrack, oldTrack, stream);
          oldTrack?.stop();
        }
        setLocalStream(screenStream);
        localStreamRef.current = screenStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setCallState(prev => ({ ...prev, isScreenSharing: true }));
        showToast('info', 'Screen Sharing', 'You are now sharing your screen');

        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          setCallState(prev => ({ ...prev, isScreenSharing: true }));
          toggleScreenShare();
        });
      } catch (err) {
        console.error('❌ Start screen share error:', err);
        showToast('error', 'Screen Share Failed', 'Could not share screen');
      }
    }
  }, [callState.isScreenSharing]);

  // Listen for incoming call signals
  useEffect(() => {
    const sock = socketRef.current;
    if (!sock) return;

    const handleCallSignal = (signal: CallSignal) => {
      if (signal.to !== user?.id) return;

      switch (signal.type) {
        case 'call-answer':
          if (peerRef.current && signal.payload?.sdp) {
            try {
              peerRef.current.signal(signal.payload);
              console.log('✅ Applied call-answer');
            } catch (e) {
              console.error('❌ Error applying answer:', e);
            }
          }
          break;

        case 'call-offer':
        case 'call-ice-candidate':
          if (peerRef.current && signal.payload) {
            try {
              peerRef.current.signal(signal.payload);
            } catch (e) {
              console.error('❌ Error applying ICE/offer signal:', e);
            }
          }
          break;

        case 'call-hangup':
          endCall();
          showToast('info', 'Call Ended', 'The other party ended the call');
          break;
      }
    };

    sock.on('call-signal', handleCallSignal);
    return () => { sock.off('call-signal', handleCallSignal); };
  }, [user?.id, endCall]);

  // Cleanup on disable/unmount
  useEffect(() => {
    return () => {
      if (!enabled) {
        cleanupCall();
        if (socketRef.current && !signalingSocket) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setIsConnected(false);
      }
    };
  }, [enabled, signalingSocket, cleanupCall]);

  return {
    callState,
    localStream,
    remoteStream,
    isConnected,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    setLocalVideoRef: (ref: HTMLVideoElement | null) => { localVideoRef.current = ref; },
    setRemoteVideoRef: (ref: HTMLVideoElement | null) => { remoteVideoRef.current = ref; },
  };
};
