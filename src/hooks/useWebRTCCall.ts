'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import SimplePeer from 'simple-peer';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalSocket } from '@/contexts/SocketContext';
import { showToast } from '@/lib/toastUtils';

// GLOBAL GUARD: Module-level flag to prevent multiple simultaneous calls across ALL hook instances
let globalCallLock = false;
let globalCallLockTimeout: NodeJS.Timeout | null = null;

// EMISSION GUARD: Track last call-initiated emission to prevent duplicates from StrictMode remounts
let lastCallEmissionKey = '';
let lastCallEmissionTime = 0;
const CALL_EMISSION_WINDOW_MS = 5000; // 5 seconds

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
  connectionState: 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'failed';
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

export const useWebRTCCall = (conversationId?: string, enabled: boolean = false) => {
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
  // Guard to prevent redundant cleanup calls
  const isCleaningUpRef = useRef<boolean>(false);
  // Guard to prevent ping-pong hangup signals
  const hangupProcessedRef = useRef<boolean>(false);
  // Signal deduplication - track recently processed signals with timestamps
  const processedSignalsRef = useRef<Map<string, number>>(new Map());
  // Track if we're in an active call to ignore stale signals
  const isActiveCallRef = useRef<boolean>(false);
  // Guard to prevent multiple simultaneous startCall invocations
  const isStartingCallRef = useRef<boolean>(false);

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
      // Use global socket for calls - no fallback needed since global socket is always available
      if (globalSocket && globalSocketConnected) {
        socketRef.current = globalSocket;
        // Join user room so signals can be delivered
        globalSocket.emit('join', user.id, (ack: any) => {
          console.log('✅ WebRTC using global socket, joined user room:', ack);
        });
        socketReadyRef.current = true;
        setIsConnected(true);
      } else {
        console.warn('📞 WebRTC: Global socket not available yet');
        setIsConnected(false);
      }
    };

    init();

    return () => {
      // Don't disconnect - global socket is managed by SocketProvider
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, user?.id, globalSocket, globalSocketConnected]);

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

  // Clean up all media and peer - COMPLETE cleanup to prevent duplicate calls
  const cleanupCall = useCallback(() => {
    // Guard: prevent redundant cleanup
    if (isCleaningUpRef.current) {
      console.log('⏭️ Cleanup already in progress, skipping...');
      return;
    }
    
    isCleaningUpRef.current = true;
    console.log('🧹 Starting complete call cleanup...');
    
    // Destroy peer connection
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.warn('Peer destroy error:', e);
      }
      peerRef.current = null;
    }
    
    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    // Stop all local media tracks
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(t => {
        t.stop();
        console.log('🛑 Stopped track:', t.kind, t.label);
      });
    }
    
    // Stop screen share track if active
    if (screenTrackRef.current) {
      try {
        screenTrackRef.current.stop();
      } catch (e) {}
      screenTrackRef.current = null;
    }
    
    // Clear all refs
    localStreamRef.current = null;
    remoteUserIdRef.current = '';
    
    // Clear state
    setLocalStream(null);
    setRemoteStream(null);
    
    // Stop remote audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.pause();
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    console.log('✅ Call cleanup complete');
    
    // Release global lock to allow future calls
    globalCallLock = false;
    if (globalCallLockTimeout) {
      clearTimeout(globalCallLockTimeout);
      globalCallLockTimeout = null;
    }
    
    // Reset cleanup guard after a delay to allow new calls
    setTimeout(() => {
      isCleaningUpRef.current = false;
      // Also reset hangup processed flag after a longer delay
      setTimeout(() => {
        hangupProcessedRef.current = false;
        isActiveCallRef.current = false;
      }, 500);
    }, 300);
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

  // For initiator: the first signal is the SDP offer which is sent via call-initiated
  // ICE candidates come after and should be sent normally
  let offerSent = false; // Track if we've sent the offer
  
  // Deduplication: track which ICE candidates we've already sent
  const sentCandidates = new Set<string>();
  // Throttling: track last candidate send time to prevent flooding
  let lastCandidateTime = 0;
  const CANDIDATE_THROTTLE_MS = 50; // Min 50ms between candidates

  // Promise resolves with the first signal (the SDP offer for the initiator)
  const firstSignalPromise = new Promise<any>((resolve) => {
    peer.once('signal', (data: any) => resolve(data));
  });

  peer.on('signal', (data: any) => {
    // Only log important signals, not every ICE candidate
    if (data.type === 'offer' || data.type === 'answer') {
      console.log('📡 Signal generated:', data.type, 'for', isInitiator ? 'initiator' : 'receiver');
    }
    
    // For initiator: the first signal is the offer which is sent via call-initiated event
    // NOT via call-signal. So we skip emitting it here.
    if (isInitiator && !offerSent && data.type === 'offer') {
      offerSent = true;
      console.log('📡 Offer generated for initiator - will be sent via call-initiated, not call-signal');
      return; // Don't emit via call-signal, it's handled by caller
    }

    if (!socketRef.current || !user || !conversationIdRef.current) {
      console.warn('⚠️ Cannot send signal - missing socket/user/conversation');
      return;
    }

    // Derive signal type from the actual payload
    let sigType: CallSignal['type'];
    if (data.type === 'offer') sigType = 'call-offer';
    else if (data.type === 'answer') sigType = 'call-answer';
    else sigType = 'call-ice-candidate';

    // Throttle ICE candidates to prevent flooding
    if (sigType === 'call-ice-candidate') {
      const candidateKey = data.candidate?.candidate || JSON.stringify(data);
      if (sentCandidates.has(candidateKey)) {
        return; // Skip duplicate candidate
      }
      sentCandidates.add(candidateKey);
      
      const now = Date.now();
      if (now - lastCandidateTime < CANDIDATE_THROTTLE_MS) {
        return; // Skip throttled candidate
      }
      lastCandidateTime = now;
    }

    // Send the signal via socket
    const signal: CallSignal = {
      type: sigType,
      from: user.id,
      to: remoteUserIdRef.current,
      conversationId: conversationIdRef.current,
      callType: callType,
      payload: data,
    };
    
    socketRef.current.emit('call-signal', signal);
    
    if (sigType !== 'call-ice-candidate') {
      console.log('📤 Sent signal:', sigType, 'to', remoteUserIdRef.current);
    }
  });

    peer.on('connect', () => {
      setCallState(prev => ({ 
        ...prev, 
        isInCall: true,
        connectionState: 'connected' 
      }));
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
      // Ignore "User-Initiated Abort" errors - these are expected during hangup
      const isNormalClose = err.message?.includes('User-Initiated Abort') || 
                           err.message?.includes('Close called') ||
                           err.code === 'ERR_CONNECTION_FAILURE';
      
      if (isNormalClose) {
        console.log('ℹ️ Peer closed normally (user hangup)');
        return;
      }
      
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

  // End call - notify remote and clean up EVERYTHING
  const endCall = useCallback((options?: { skipHangupSignal?: boolean; triggeredByRemote?: boolean }) => {
    console.log('📞 Ending call...', options);
    
    // Prevent duplicate hangup processing
    if (hangupProcessedRef.current && options?.triggeredByRemote) {
      console.log('⏭️ Hangup already processed, skipping');
      return;
    }
    
    if (options?.triggeredByRemote) {
      hangupProcessedRef.current = true;
    }
    
    const remoteId = remoteUserIdRef.current;
    const convId = conversationIdRef.current;

    // FIXED: Always send hangup signal when ending call (unless remote already sent one)
    if (!options?.skipHangupSignal && !options?.triggeredByRemote && socketRef.current?.connected && user && remoteId && convId) {
      // Use call-signal with hangup type for all call endings
      console.log('📤 Sending hangup signal to:', remoteId);
      socketRef.current.emit('call-signal', {
        type: 'call-hangup',
        from: user.id,
        to: remoteId,
        conversationId: convId,
        callType: callStateRef.current?.callType || 'voice',
      } as CallSignal);
    }

    // Reset isStartingCallRef when ending call - FIXED Bug #6
    isStartingCallRef.current = false;
    
    // Complete cleanup
    cleanupCall();
    
    // Reset ALL state to fresh
    setCallState({
      isInCall: false,
      isOutgoingCall: false,
      isIncomingCall: false,
      callType: 'voice',
      remoteUserId: undefined,
      remoteUserName: undefined,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      callDuration: 0,
      connectionState: 'connecting',
    });
    
    console.log('✅ Call ended, state reset');
    
    // Release global lock to allow future calls
    globalCallLock = false;
    if (globalCallLockTimeout) {
      clearTimeout(globalCallLockTimeout);
      globalCallLockTimeout = null;
    }
  }, [user, callState.isOutgoingCall, callState.connectionState, cleanupCall]);

  // Start outgoing call
  const startCall = useCallback(async (targetUserId: string, targetUserName: string, callType: 'voice' | 'video') => {
    // EMISSION GUARD: Check if we already emitted a call-initiated for this exact call recently
    const emissionKey = `${user?.id}:${targetUserId}:${conversationId}`;
    const now = Date.now();
    if (emissionKey === lastCallEmissionKey && (now - lastCallEmissionTime) < CALL_EMISSION_WINDOW_MS) {
      console.log('⏭️ [EMISSION GUARD] Duplicate call emission blocked:', emissionKey);
      return;
    }
    
    if (!user || !conversationId) {
      showToast('error', 'Call Error', 'Missing conversation or user data');
      globalCallLock = false;
      return;
    }

    // GLOBAL GUARD: Check across ALL hook instances first
    if (globalCallLock) {
      console.log('⏭️ [GLOBAL GUARD] Call already in progress globally, ignoring duplicate');
      return;
    }
    
    // Set global lock immediately
    globalCallLock = true;
    // Auto-release lock after 30 seconds as safety net
    if (globalCallLockTimeout) clearTimeout(globalCallLockTimeout);
    globalCallLockTimeout = setTimeout(() => {
      console.log('🔓 [GLOBAL GUARD] Auto-releasing lock after timeout');
      globalCallLock = false;
    }, 30000);

    // CRITICAL GUARD: Check FIRST before any cleanup to prevent race conditions
    if (isStartingCallRef.current) {
      console.log('⏭️ [GUARD] startCall already in progress, ignoring duplicate call');
      globalCallLock = false;
      return;
    }
    isStartingCallRef.current = true;

    // GUARDRAIL: Clean up any existing connection before starting new call
    console.log('🛡️ [GUARDRAIL] Cleaning up before starting new call');
    cleanupCall();
    
    try {
      if (!socketRef.current?.connected) {
        const ready = await waitForSocketReady(5000);
        if (!ready) {
          showToast('error', 'Connection Error', 'Could not connect. Please try again.');
          globalCallLock = false;
          isStartingCallRef.current = false;
          return;
        }
      }

      remoteUserIdRef.current = targetUserId;

      setCallState({
        isInCall: false, isOutgoingCall: true, isIncomingCall: false,
        callType, remoteUserId: targetUserId, remoteUserName: targetUserName,
        isMuted: false, isCameraOff: false, isScreenSharing: false,
        callDuration: 0, connectionState: 'calling',
      });
      
      // Mark as active call for signal handling
      isActiveCallRef.current = true;

      const stream = await initializeLocalStream(callType);
      const { peer, firstSignalPromise } = createPeer(true, stream, targetUserId, callType);
      peerRef.current = peer;

      // Wait for SDP offer
      const offer = await Promise.race([
        firstSignalPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Offer timeout')), 10000)),
      ]);
      console.log('✅ SDP offer ready, type:', (offer as any).type);

      // Record emission BEFORE emitting to prevent duplicates from StrictMode remounts
      lastCallEmissionKey = emissionKey;
      lastCallEmissionTime = Date.now();
      
      // Update state to ringing after sending call-initiated
      setCallState(prev => ({
        ...prev,
        connectionState: 'ringing'
      }));
      
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
      
      // Reset guard ONLY after all async work completes successfully
      isStartingCallRef.current = false;
    } catch (error) {
      console.error('❌ startCall error:', error);
      cleanupCall();
      setCallState({
        isInCall: false, isOutgoingCall: false, isIncomingCall: false,
        callType: 'voice', isMuted: false, isCameraOff: false,
        isScreenSharing: false, callDuration: 0, connectionState: 'failed',
      });
      showToast('error', 'Call Failed', 'Could not start the call. Check mic/camera permissions.');
      // Reset guard on error too
      isStartingCallRef.current = false;
      // Release global lock on error
      globalCallLock = false;
    }
  }, [user, conversationId, initializeLocalStream, createPeer, waitForSocketReady, cleanupCall]);

  // Accept incoming call - takes IncomingCallData directly
  const acceptCall = useCallback(async (callData: IncomingCallData) => {
    if (!user) {
      globalCallLock = false;
      return;
    }

    // GLOBAL GUARD: Check across ALL hook instances first
    if (globalCallLock) {
      console.log('⏭️ [GLOBAL GUARD] Call already in progress globally, ignoring accept');
      return;
    }
    
    // Set global lock immediately
    globalCallLock = true;
    // Auto-release lock after 30 seconds as safety net
    if (globalCallLockTimeout) clearTimeout(globalCallLockTimeout);
    globalCallLockTimeout = setTimeout(() => {
      console.log('🔓 [GLOBAL GUARD] Auto-releasing lock after timeout');
      globalCallLock = false;
    }, 30000);

    // CRITICAL GUARD: Check FIRST before any cleanup to prevent race conditions
    if (isStartingCallRef.current) {
      console.log('⏭️ [GUARD] acceptCall already in progress, ignoring duplicate accept');
      globalCallLock = false;
      return;
    }
    isStartingCallRef.current = true;

    // GUARDRAIL: Clean up any existing connection before accepting new call
    console.log('🛡️ [GUARDRAIL] Cleaning up before accepting call');
    cleanupCall();
    
    try {
      if (!socketRef.current?.connected) {
        const ready = await waitForSocketReady(3000);
        if (!ready) {
          showToast('error', 'Connection Error', 'Could not connect to accept the call');
          globalCallLock = false;
          isStartingCallRef.current = false;
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
      
      // Mark as active call for signal handling
      isActiveCallRef.current = true;

      const stream = await initializeLocalStream(callData.callType);
      const { peer } = createPeer(false, stream, callData.from, callData.callType);
      peerRef.current = peer;

      // Apply the offer - this will trigger the peer to generate an answer
      const offer = callData.offer;
      console.log('🔍 Applying offer in acceptCall:', offer?.type || offer);

      if (offer && typeof offer === 'object' && offer.sdp) {
        console.log('📝 About to apply SDP offer. Socket ready:', socketRef.current?.connected);
        console.log('📝 Receiver context:', {
          userId: user.id,
          remoteUserId: callData.from,
          conversationId: callData.conversationId,
          socketConnected: socketRef.current?.connected,
        });
        
        peer.signal(offer);
        console.log('✅ Applied SDP offer to peer - answer should be generated and sent');
      } else {
        console.error('❌ No valid SDP offer in callData:', offer);
        showToast('error', 'Call Error', 'Invalid call data. Please ask caller to try again.');
        cleanupCall();
        return;
      }

      showToast('success', 'Call Accepted', 'Connecting...');
      
      // Reset guard ONLY after all async work completes successfully
      isStartingCallRef.current = false;
    } catch (error) {
      console.error('❌ acceptCall error:', error);
      cleanupCall();
      showToast('error', 'Call Error', 'Could not accept the call');
      // Reset guard on error too
      isStartingCallRef.current = false;
      // Release global lock on error
      globalCallLock = false;
    }
  }, [user, initializeLocalStream, createPeer, waitForSocketReady, cleanupCall]);

  // Reject incoming call
  const rejectCall = useCallback((fromUserId: string, convId?: string) => {
    const targetConvId = convId || conversationIdRef.current || conversationId;
    if (socketRef.current?.connected && user && targetConvId) {
      // FIXED: Use call-hangup instead of non-existent call-reject event
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

  // Toggle camera - affects ONLY local user's video, remote video unaffected
  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      const willBeOff = !videoTracks[0]?.enabled;
      videoTracks.forEach(t => {
        t.enabled = !t.enabled;
        console.log(`📹 Local video ${t.enabled ? 'enabled' : 'disabled'}`);
      });
      setCallState(prev => ({ ...prev, isCameraOff: !prev.isCameraOff }));
      showToast('info', willBeOff ? 'Camera Off' : 'Camera On', 
        willBeOff ? 'Your camera is now off' : 'Your camera is now on');
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

  // Listen for incoming call signals - FIXED: Only register once per enabled session
  // CRITICAL BUG FIX: Removed callState dependencies to prevent re-registration
  // This ensures signals aren't missed during call setup
  const endCallRef = useRef(endCall);
  endCallRef.current = endCall;
  const callStateRef = useRef(callState);
  callStateRef.current = callState;
  
  useEffect(() => {
    // FIXED: Listen for signals whenever socket is available and enabled
    // The handler itself will filter based on whether signal is relevant
    if (!enabled) {
      console.log('⏭️ [SignalListener] Not enabled, skipping registration');
      return;
    }
    
    const sock = socketRef.current;
    if (!sock || !user?.id) return;

    const handleCallSignal = (signal: CallSignal) => {
      // Signal deduplication: ignore duplicate signals within 500ms
      const now = Date.now();
      const signalKey = `${signal.type}-${signal.from}-${signal.to}`;
      
      // Clean up old entries (older than 2 seconds)
      for (const [key, timestamp] of processedSignalsRef.current.entries()) {
        if (now - timestamp > 2000) {
          processedSignalsRef.current.delete(key);
        }
      }
      
      // Check for duplicate
      if (processedSignalsRef.current.has(signalKey)) {
        console.log('⏭️ Ignoring duplicate signal:', signal.type);
        return;
      }
      processedSignalsRef.current.set(signalKey, now);

      console.log('📥 Received call-signal:', {
        type: signal.type,
        from: signal.from,
        to: signal.to,
        myId: user?.id,
        hasPeer: !!peerRef.current,
        hasPayload: !!signal.payload,
        payloadType: signal.payload?.type,
        isActiveCall: isActiveCallRef.current,
        currentCallState: callStateRef.current.connectionState,
      });

      if (signal.to !== user?.id) {
        console.log('⏭️ Ignoring signal - not for me');
        return;
      }

      if (signal.type === 'call-hangup') {
        console.log('☎️ Call hangup received');
        // Use ref to avoid dependency issues and mark as remote hangup
        endCallRef.current?.({ triggeredByRemote: true });
        showToast('info', 'Call Ended', 'The other party ended the call');
        return;
      }

      // FIXED: Process signals when we have a peer OR when call is being established
      // This allows caller to receive answer signals during outgoing call
      const hasActivePeer = !!peerRef.current;
      const isEstablishingCall = isActiveCallRef.current || 
                                  callStateRef.current.isOutgoingCall || 
                                  callStateRef.current.isIncomingCall ||
                                  callStateRef.current.isInCall;
      
      if (!hasActivePeer && !isEstablishingCall) {
        console.log('⏭️ Ignoring signal - no peer and not establishing call');
        return;
      }

      // For all other signal types (offer, answer, ice-candidate), forward to peer
      if (signal.payload && peerRef.current) {
        try {
          console.log('📡 Applying signal to peer:', signal.type, signal.payload?.type || signal.payload?.candidate?.type);
          
          // If this is an answer to our outgoing call, mark as connecting
          if (signal.type === 'call-answer' && callStateRef.current.isOutgoingCall && !callStateRef.current.isInCall) {
            console.log('🤝 Call answered - moving to connecting state');
            setCallState(prev => ({
              ...prev,
              connectionState: 'connecting'
            }));
          }
          
          peerRef.current.signal(signal.payload);
          console.log('✅ Signal applied successfully to peer');
        } catch (e) {
          console.error('❌ Error applying signal to peer:', signal.type, e);
        }
      } else if (!signal.payload) {
        console.warn('⚠️ Signal received without payload:', signal.type);
      }
    };

    console.log('🎯 [SignalListener] Registering signal listener');
    sock.on('call-signal', handleCallSignal);
    return () => { 
      console.log('🧹 [SignalListener] Cleaning up signal listener');
      sock.off('call-signal', handleCallSignal); 
    };
  // FIXED: Only re-register when user or enabled changes, NOT on every call state change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, enabled]);

  // Cleanup on disable/unmount
  useEffect(() => {
    return () => {
      if (!enabled) {
        cleanupCall();
        // Don't disconnect global socket - it's managed by SocketProvider
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, cleanupCall]);

  // Memoized ref setters to prevent infinite re-render loops in CallModal
  const setLocalVideoRef = useCallback((ref: HTMLVideoElement | null) => { localVideoRef.current = ref; }, []);
  const setRemoteVideoRef = useCallback((ref: HTMLVideoElement | null) => { remoteVideoRef.current = ref; }, []);
  const setRemoteAudioRef = useCallback((ref: HTMLAudioElement | null) => { remoteAudioRef.current = ref; }, []);

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
    setLocalVideoRef,
    setRemoteVideoRef,
    setRemoteAudioRef,
  };
};
