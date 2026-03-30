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
}

export const useWebRTCCall = (conversationId?: string, enabled: boolean = false, signalingSocket?: SocketType | null) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  
  // Use the existing socket from useMessenger instead of creating a new one
  // We'll get the socket from the messenger hook or create a minimal one for signaling
  const [socket, setSocket] = useState<any>(null);
  const socketRef = useRef<any>(null);
  const socketReadyRef = useRef<boolean>(false);
  
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

  // Helper to wait for socket to be ready (connected + joined to room)
  const waitForSocketReady = useCallback(async (timeoutMs: number = 5000): Promise<boolean> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      // Check current socketRef value (live reference)
      const currentSocket = socketRef.current;
      
      if (currentSocket && currentSocket.connected) {
        console.log('✅ Socket is connected and ready:', currentSocket.id);
        socketReadyRef.current = true;
        return true;
      }
      
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('⏰ Socket readiness timeout');
    return false;
  }, []);

  // Initialize socket for call signaling
  useEffect(() => {
    if (!enabled || !user?.id) return;

    let cleanup = () => {};

    const initializeSocket = async () => {
      // Try to use messenger socket first
      if (signalingSocket) {
        console.log('� Attempting to use messenger socket for WebRTC');
        
        const isReady = await waitForSocketReady(3000);
        
        if (isReady) {
          console.log('✅ Using messenger socket for WebRTC:', signalingSocket.id);
          setSocket(signalingSocket);
          socketRef.current = signalingSocket;
          setIsConnected(true);
          socketReadyRef.current = true;
          return;
        } else {
          console.log('⚠️ Messenger socket not ready, will create fallback');
        }
      }

      // Create fallback socket
      if (socketRef.current) {
        console.log('🔍 Fallback socket already exists, reusing');
        const isReady = await waitForSocketReady(2000);
        if (isReady) {
          setIsConnected(true);
          return;
        }
      }

      console.log('🔌 Creating new fallback socket for WebRTC');
      const serverUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      console.log('🔗 Fallback socket connecting to:', serverUrl);
      const newSocket = io(serverUrl, {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Set socketRef immediately so waitForSocketReady can find it
      socketRef.current = newSocket;
      let joinAcknowledged = false;

      newSocket.on('connect', () => {
        console.log('🔌 Fallback socket connected:', newSocket.id);
        console.log('🔗 Connected to server:', serverUrl, 'with path:', newSocket.io.opts.path);
        
        // Immediate test - emit right away
        console.log('📡 Testing immediate emit...');
        newSocket.emit('ping', { test: true }, (pong: any) => {
          console.log('🏓 Ping/pong successful:', pong);
        });
        
        // Then join with retry
        const tryJoin = () => {
          console.log('📡 Emitting join for user:', user.id);
          newSocket.emit('join', user.id, (ack: any) => {
            console.log('✅ Server acknowledged join:', ack);
            joinAcknowledged = true;
          });
        };
        
        // Try join immediately and after a short delay
        tryJoin();
        setTimeout(tryJoin, 500);
      });

      newSocket.on('connect_error', (err: Error) => {
        console.error('❌ Fallback socket connection error:', err.message);
      });

      newSocket.on('error', (err: Error) => {
        console.error('❌ Fallback socket error:', err);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Fallback socket disconnected');
        setIsConnected(false);
        socketReadyRef.current = false;
        joinAcknowledged = false;
      });

      // Wait for connection and room join
      const isReady = await waitForSocketReady(5000);
      
      if (isReady) {
        console.log('✅ Fallback socket ready for WebRTC');
        setSocket(newSocket);
        setIsConnected(true);
      } else {
        console.error('❌ Failed to initialize fallback socket');
        showToast('error', 'Connection Error', 'Could not establish call connection');
      }

      cleanup = () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    };

    initializeSocket();

    return () => {
      cleanup();
    };
  }, [enabled, user?.id, signalingSocket, waitForSocketReady]);

  // Initialize local media stream
  const initializeLocalStream = useCallback(async (callType: 'voice' | 'video' | 'screen') => {
    try {
      let stream: MediaStream;

      if (callType === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
      } else {
        const constraints = {
          video: callType === 'video',
          audio: true
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      setLocalStream(stream);
      
      // Set local video if video call
      if (callType === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('Failed to get media stream:', error);
      showToast('error', 'Media Access Denied', 'Please allow camera/microphone access');
      throw error;
    }
  }, []);

  // Create WebRTC peer connection
  const createPeer = useCallback((isInitiator: boolean, stream: MediaStream) => {
    const peer = new SimplePeer({
      initiator: isInitiator,
      trickle: true,
      stream: stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    });

    peer.on('signal', (data: any) => {
      if (socketRef.current && user && conversationId) {
        const signal: CallSignal = {
          type: isInitiator ? 'call-offer' : 'call-answer',
          from: user.id,
          to: callState.remoteUserId || '',
          conversationId,
          callType: callState.callType,
          payload: data
        };
        socketRef.current.emit('call-signal', signal);
      }
    });

    peer.on('connect', () => {
      setCallState(prev => ({ ...prev, connectionState: 'connected' }));
      showToast('success', 'Call Connected', 'You are now connected');
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    peer.on('close', () => {
      endCall();
    });

    peer.on('error', (error: any) => {
      console.error('Peer connection error:', error);
      setCallState(prev => ({ ...prev, connectionState: 'failed' }));
      showToast('error', 'Call Failed', 'Connection failed. Please try again.');
      endCall();
    });

    return peer;
  }, [user, conversationId, callState.remoteUserId, callState.callType]);

  // Start outgoing call
  const startCall = useCallback(async (targetUserId: string, targetUserName: string, callType: 'voice' | 'video') => {
    if (!user || !conversationId) return;

    try {
      // Ensure socket is ready before starting call
      if (!socketRef.current || !socketRef.current.connected) {
        console.log('⏳ Waiting for socket to be ready...');
        const isReady = await waitForSocketReady(5000);
        
        if (!isReady) {
          console.error('❌ Socket not ready for call');
          showToast('error', 'Connection Error', 'Could not establish connection. Please try again.');
          return;
        }
      }

      setCallState({
        isInCall: true,
        isOutgoingCall: true,
        isIncomingCall: false,
        callType,
        remoteUserId: targetUserId,
        remoteUserName: targetUserName,
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        callDuration: 0,
        connectionState: 'connecting',
      });

      const stream = await initializeLocalStream(callType);
      const peer = createPeer(true, stream);
      
      peerRef.current = peer;

      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }));
      }, 1000);

      // Notify server about outgoing call
      if (socketRef.current && socketRef.current.connected) {
        console.log('📤 Emitting call-initiated:', {
          from: user.id,
          to: targetUserId,
          conversationId,
          callType,
          callerName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        });
        console.log('🔍 Socket state:', {
          connected: socketRef.current.connected,
          id: socketRef.current.id,
          rooms: Array.from(socketRef.current.rooms || [])
        });
        
        socketRef.current.emit('call-initiated', {
          from: user.id,
          to: targetUserId,
          conversationId,
          callType,
          callerName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        }, (ack: any) => {
          console.log('📨 Server acknowledgment:', ack);
        });
        
        console.log('✅ call-initiated event emitted');
      } else {
        console.error('❌ Socket not connected for call initiation');
        showToast('error', 'Connection Error', 'Lost connection. Please try again.');
        return;
      }

      showToast('info', 'Calling...', `Calling ${targetUserName}`);
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallState({
        isInCall: false,
        isOutgoingCall: false,
        isIncomingCall: false,
        callType: 'voice',
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        callDuration: 0,
        connectionState: 'failed',
      });
      showToast('error', 'Call Failed', 'Could not start the call. Please check microphone/camera permissions.');
    }
  }, [user, conversationId, initializeLocalStream, createPeer, waitForSocketReady]);

  // Accept incoming call
  const acceptCall = useCallback(async (signal: CallSignal) => {
    if (!user) return;

    try {
      // Ensure socket is ready
      if (!socketRef.current || !socketRef.current.connected) {
        console.log('⏳ Waiting for socket before accepting call...');
        const isReady = await waitForSocketReady(3000);
        if (!isReady) {
          console.error('❌ Socket not ready to accept call');
          showToast('error', 'Connection Error', 'Could not establish connection');
          return;
        }
      }

      setCallState({
        isInCall: true,
        isOutgoingCall: false,
        isIncomingCall: false,
        callType: signal.callType,
        remoteUserId: signal.from,
        remoteUserName: signal.payload?.callerName || 'Unknown',
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        callDuration: 0,
        connectionState: 'connecting',
      });

      const stream = await initializeLocalStream(signal.callType);
      const peer = createPeer(false, stream);
      
      peerRef.current = peer;
      
      // Validate signal payload before applying
      console.log('🔍 Accepting call with signal payload:', signal.payload);
      if (signal.payload && typeof signal.payload === 'object' && (signal.payload.sdp || signal.payload.candidate)) {
        peer.signal(signal.payload);
        console.log('✅ Applied signal to peer in acceptCall');
      } else {
        console.warn('⚠️ Invalid signal payload in acceptCall:', signal.payload);
      }

      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }));
      }, 1000);

      showToast('success', 'Call Accepted', 'Connecting...');
    } catch (error) {
      console.error('Failed to accept call:', error);
      showToast('error', 'Call Error', 'Could not accept the call');
    }
  }, [user, initializeLocalStream, createPeer, waitForSocketReady]);

  // Reject incoming call
  const rejectCall = useCallback((fromUserId: string) => {
    if (socketRef.current && user && conversationId) {
      const signal: CallSignal = {
        type: 'call-hangup',
        from: user.id,
        to: fromUserId,
        conversationId,
        callType: 'voice', // Default type for hangup
      };
      socketRef.current.emit('call-signal', signal);
      showToast('info', 'Call Rejected', 'You rejected the incoming call');
    }
  }, [user, conversationId]);

  // End call
  const endCall = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);

    // Notify other party
    if (socketRef.current && user && callState.remoteUserId && conversationId) {
      const signal: CallSignal = {
        type: 'call-hangup',
        from: user.id,
        to: callState.remoteUserId,
        conversationId,
        callType: callState.callType,
      };
      socketRef.current.emit('call-signal', signal);
    }

    setCallState({
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

    showToast('info', 'Call Ended', 'The call has been ended');
  }, [user, callState.remoteUserId, callState.callType, conversationId, localStream]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !callState.isMuted;
      });
      setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [localStream, callState.isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStream && callState.callType === 'video') {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !callState.isCameraOff;
      });
      setCallState(prev => ({ ...prev, isCameraOff: !prev.isCameraOff }));
    }
  }, [localStream, callState.isCameraOff, callState.callType]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (callState.isScreenSharing) {
      // Stop screen sharing and switch back to camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callState.callType === 'video',
          audio: true
        });
        
        if (peerRef.current && localStream) {
          const videoTrack = stream.getVideoTracks()[0];
          const oldVideoTrack = localStream.getVideoTracks()[0];
          if (videoTrack && oldVideoTrack) {
            peerRef.current.replaceTrack(videoTrack, oldVideoTrack, localStream);
          }
        }
        
        if (localStream) {
          localStream.getVideoTracks().forEach(track => track.stop());
        }
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        setCallState(prev => ({ ...prev, isScreenSharing: false }));
        showToast('info', 'Screen Sharing Stopped', 'Switched back to camera');
      } catch (error) {
        console.error('Failed to stop screen sharing:', error);
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        if (peerRef.current && localStream) {
          const screenVideoTrack = screenStream.getVideoTracks()[0];
          const oldVideoTrack = localStream.getVideoTracks()[0];
          if (screenVideoTrack && oldVideoTrack) {
            peerRef.current.replaceTrack(screenVideoTrack, oldVideoTrack, localStream);
          }
        }
        
        if (localStream) {
          localStream.getVideoTracks().forEach(track => track.stop());
        }
        
        setLocalStream(screenStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setCallState(prev => ({ ...prev, isScreenSharing: true }));
        showToast('info', 'Screen Sharing Started', 'You are now sharing your screen');
        
        // Auto-stop when user ends screen sharing
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          toggleScreenShare();
        });
      } catch (error) {
        console.error('Failed to start screen sharing:', error);
        showToast('error', 'Screen Sharing Failed', 'Could not share screen');
      }
    }
  }, [callState.isScreenSharing, callState.callType, localStream]);

  // Handle incoming signals
  useEffect(() => {
    if (!socketRef.current) return;

    const handleCallSignal = (signal: CallSignal) => {
      if (signal.to !== user?.id || signal.conversationId !== conversationId) return;

      switch (signal.type) {
        case 'call-offer':
          setCallState(prev => ({
            ...prev,
            isIncomingCall: true,
            remoteUserId: signal.from,
            remoteUserName: signal.payload?.callerName || 'Unknown',
            callType: signal.callType,
          }));
          // Store the offer for later use when accepting
          break;

        case 'call-answer':
          if (peerRef.current && signal.payload) {
            try {
              // Validate signal data before applying
              if (typeof signal.payload === 'object' && (signal.payload.sdp || signal.payload.candidate)) {
                peerRef.current.signal(signal.payload);
                console.log('✅ Applied call-answer signal');
              } else {
                console.warn('⚠️ Invalid call-answer signal payload:', signal.payload);
              }
            } catch (error) {
              console.error('❌ Error applying call-answer signal:', error);
            }
          }
          break;

        case 'call-ice-candidate':
          if (peerRef.current && signal.payload) {
            try {
              // Validate ICE candidate before applying
              if (typeof signal.payload === 'object' && signal.payload.candidate) {
                peerRef.current.signal(signal.payload);
                console.log('✅ Applied ICE candidate');
              } else {
                console.warn('⚠️ Invalid ICE candidate payload:', signal.payload);
              }
            } catch (error) {
              console.error('❌ Error applying ICE candidate:', error);
            }
          }
          break;

        case 'call-hangup':
          endCall();
          showToast('info', 'Call Ended', 'The other party ended the call');
          break;

        case 'call-screen-share':
          // Handle screen sharing state changes
          break;
      }
    };

    socketRef.current.on('call-signal', handleCallSignal);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('call-signal', handleCallSignal);
      }
    };
  }, [user, conversationId, endCall]);

  // Cleanup on unmount or when disabled
  useEffect(() => {
    return () => {
      if (!enabled) {
        // Clean up everything when disabled
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
        if (callTimerRef.current) {
          clearInterval(callTimerRef.current);
          callTimerRef.current = null;
        }
        if (localStream) {
          localStream.getTracks().forEach(track => track.stop());
        }
        setLocalStream(null);
        setRemoteStream(null);
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [enabled, localStream]);

  return {
    callState,
    localStream,
    remoteStream,
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
