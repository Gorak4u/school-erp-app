'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalSocket } from '@/contexts/SocketContext';
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

// SDP transform: cap audio bitrate for low-bandwidth connections
function sdpTransform(sdp: string): string {
  // Cap Opus audio bitrate to 32kbps (phone quality, very lightweight)
  sdp = sdp.replace(/(useinbandfec=1)/g, '$1;maxaveragebitrate=32000;stereo=0');
  // Cap video bitrate for each video section
  sdp = sdp.replace(/m=video (.*\r\n)/g, (m) => m + 'b=AS:256\r\n');
  return sdp;
}

export const useWebRTCCall = (conversationId?: string, enabled: boolean = false, signalingSocket?: SocketType | null) => {
  const { user } = useAuth();
  const { socket: globalSocket, isConnected: globalSocketConnected } = useGlobalSocket();
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
  // Dedicated audio element for remote stream — critical for audio to play in voice calls
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  // Track the active screen share track so we can stop it reliably
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

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
      // Use global socket for incoming calls
      if (globalSocket && globalSocketConnected) {
        socketRef.current = globalSocket;
        socketReadyRef.current = true;
        setIsConnected(true);
        return;
      }

      // Fallback: messenger socket if available
      if (signalingSocket?.connected) {
        socketRef.current = signalingSocket;
        socketReadyRef.current = true;
        setIsConnected(true);
        return;
      }

      // Last resort: create own socket
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
  }, [enabled, user?.id, globalSocket, globalSocketConnected, signalingSocket, waitForSocketReady]);

  // Get local media with lightweight constraints
  const initializeLocalStream = useCallback(async (callType: 'voice' | 'video' | 'screen') => {
    try {
      let stream: MediaStream;
      if (callType === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 10 } },
          audio: true,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video'
            ? { width: { ideal: 640, max: 1280 }, height: { ideal: 480, max: 720 }, frameRate: { ideal: 15, max: 30 } }
            : false,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
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
    // Stop remote audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
    }
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
      sdpTransform,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    });

    // For initiator: skip the very first signal because it's the SDP offer
    // already sent embedded in call-initiated. Subsequent signals are ICE candidates.
    let offerAlreadySent = isInitiator;

    // Promise resolves with the first signal (the SDP offer for the initiator)
    const firstSignalPromise = new Promise<any>((resolve) => {
      peer.once('signal', (data: any) => resolve(data));
    });

    peer.on('signal', (data: any) => {
      // Skip the first signal for the initiator — it's the offer, sent via call-initiated
      if (offerAlreadySent) {
        offerAlreadySent = false;
        return;
      }

      if (!socketRef.current || !user || !conversationIdRef.current) return;

      // Derive signal type from the actual payload so ICE candidates are routed correctly
      let sigType: CallSignal['type'];
      if (data.type === 'offer') sigType = 'call-offer';
      else if (data.type === 'answer') sigType = 'call-answer';
      else sigType = 'call-ice-candidate'; // candidate / renegotiation

      socketRef.current.emit('call-signal', {
        type: sigType,
        from: user.id,
        to: remoteUserId,
        conversationId: conversationIdRef.current,
        callType,
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
      console.log('📡 Remote stream received, tracks:', remote.getTracks().map(t => `${t.kind}(${t.enabled})`));
      setRemoteStream(remote);
      // Attach to video element for video calls
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote;
        remoteVideoRef.current.play().catch(() => {});
      }
      // CRITICAL: dedicated audio element ensures audio plays for BOTH voice and video calls
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remote;
        remoteAudioRef.current.play().catch((e) => console.warn('⚠️ Remote audio play blocked:', e));
      }
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

  // Internal: revert from screen share back to camera
  const revertToCamera = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer) return;
    const pc = (peer as any)._pc as RTCPeerConnection | undefined;
    try {
      // STOP the screen track so the browser removes the sharing indicator
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
        audio: false,
      });
      const newVideoTrack = camStream.getVideoTracks()[0];
      if (pc && newVideoTrack) {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(newVideoTrack);
      }
      const existing = localStreamRef.current;
      if (existing) {
        existing.getVideoTracks().forEach(t => { t.stop(); existing.removeTrack(t); });
        existing.addTrack(newVideoTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = existing;
      }
      setCallState(prev => ({ ...prev, isScreenSharing: false }));
      showToast('info', 'Screen Share Stopped', 'Switched back to camera');
    } catch (err) {
      console.error('❌ Stop screen share error:', err);
      setCallState(prev => ({ ...prev, isScreenSharing: false }));
    }
  }, []);

  // Toggle screen sharing — uses RTCPeerConnection.getSenders() to avoid SimplePeer replaceTrack bug
  const toggleScreenShare = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer) return;
    const pc = (peer as any)._pc as RTCPeerConnection | undefined;

    if (callState.isScreenSharing) {
      await revertToCamera();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 10 } },
          audio: false,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack; // store so we can stop it later

        if (pc) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(screenTrack);
          } else {
            pc.addTrack(screenTrack, screenStream);
          }
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setCallState(prev => ({ ...prev, isScreenSharing: true }));
        showToast('info', 'Screen Sharing', 'Sharing your screen');

        // User stops sharing via browser UI — revert automatically
        screenTrack.addEventListener('ended', () => {
          screenTrackRef.current = null;
          revertToCamera();
        }, { once: true });
      } catch (err) {
        console.error('❌ Start screen share error:', err);
        showToast('error', 'Screen Share Failed', 'Could not share screen');
      }
    }
  }, [callState.isScreenSharing, revertToCamera]);

  // Upgrade voice call to video
  const upgradeToVideo = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer || callState.callType === 'video') return;
    const pc = (peer as any)._pc as RTCPeerConnection | undefined;
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } }
      });
      const videoTrack = camStream.getVideoTracks()[0];
      const existing = localStreamRef.current;
      if (existing) {
        existing.addTrack(videoTrack);
        if (pc) pc.addTrack(videoTrack, existing);
        if (localVideoRef.current) localVideoRef.current.srcObject = existing;
      }
      setCallState(prev => ({ ...prev, callType: 'video', isCameraOff: false }));
      showToast('info', 'Video On', 'Camera started');
    } catch (err) {
      console.error('❌ Upgrade to video error:', err);
      showToast('error', 'Camera Failed', 'Could not start camera');
    }
  }, [callState.callType]);

  // Downgrade video call to voice only
  const downgradeToVoice = useCallback(() => {
    const peer = peerRef.current;
    if (!peer || callState.callType === 'voice') return;
    const pc = (peer as any)._pc as RTCPeerConnection | undefined;
    const existing = localStreamRef.current;
    if (existing) {
      existing.getVideoTracks().forEach(t => {
        t.stop();
        existing.removeTrack(t);
        if (pc) {
          const sender = pc.getSenders().find(s => s.track === t);
          if (sender) pc.removeTrack(sender);
        }
      });
    }
    setCallState(prev => ({ ...prev, callType: 'voice' }));
    showToast('info', 'Video Off', 'Switched to voice call');
  }, [callState.callType]);

  // Listen for incoming call signals
  useEffect(() => {
    const sock = socketRef.current;
    if (!sock) return;

    const handleCallSignal = (signal: CallSignal) => {
      if (signal.to !== user?.id) return;

      if (signal.type === 'call-hangup') {
        endCall();
        showToast('info', 'Call Ended', 'The other party ended the call');
        return;
      }

      // For all other signal types (offer, answer, ice-candidate), forward to peer
      if (peerRef.current && signal.payload) {
        try {
          console.log('📡 Applying signal to peer:', signal.type, signal.payload?.type || signal.payload?.candidate?.type);
          peerRef.current.signal(signal.payload);
        } catch (e) {
          console.error('❌ Error applying signal to peer:', signal.type, e);
        }
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
    upgradeToVideo,
    downgradeToVoice,
    setLocalVideoRef: (ref: HTMLVideoElement | null) => { localVideoRef.current = ref; },
    setRemoteVideoRef: (ref: HTMLVideoElement | null) => { remoteVideoRef.current = ref; },
    setRemoteAudioRef: (ref: HTMLAudioElement | null) => { remoteAudioRef.current = ref; },
  };
};
