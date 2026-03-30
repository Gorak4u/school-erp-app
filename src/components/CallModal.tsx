'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  Maximize2, Minimize2, PhoneOff, ScreenShare,
} from 'lucide-react';
import { useWebRTCCall, IncomingCallData } from '@/hooks/useWebRTCCall';
import { playIncomingRingtone, playRingbackTone, stopRingtone, unlockAudio } from '@/lib/ringtone';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  targetUserId?: string;
  targetUserName?: string;
  initialCallType?: 'voice' | 'video';
  enabled?: boolean;
  signalingSocket?: any;
  isIncomingCall?: boolean;
  incomingCallData?: IncomingCallData;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
}

// ── Reusable control button ──
const CtrlBtn: React.FC<{
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, active, danger, label, children }) => (
  <div className="flex flex-col items-center gap-1.5">
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 select-none
        ${danger ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/40'
          : active ? 'bg-white/25 hover:bg-white/35 ring-2 ring-white/40'
          : 'bg-white/10 hover:bg-white/20'}`}
    >
      {children}
    </button>
    <span className="text-[11px] text-gray-400 font-medium">{label}</span>
  </div>
);

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  targetUserId,
  targetUserName,
  initialCallType = 'voice',
  enabled,
  signalingSocket,
  isIncomingCall = false,
  incomingCallData,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // CRITICAL: dedicated audio element ensures remote audio plays for voice AND video
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  // Guard against double-starting a call
  const callStartedRef = useRef(false);

  const {
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
    setLocalVideoRef,
    setRemoteVideoRef,
    setRemoteAudioRef,
  } = useWebRTCCall(
    incomingCallData?.conversationId || conversationId,
    enabled ?? isOpen,
    signalingSocket
  );

  // Unlock audio on mount (required for Web Audio API autoplay policy)
  useEffect(() => {
    unlockAudio();
  }, []);

  // Register media element refs with the hook
  useEffect(() => {
    setLocalVideoRef(localVideoRef.current);
    setRemoteVideoRef(remoteVideoRef.current);
    setRemoteAudioRef(remoteAudioRef.current);
  }, [setLocalVideoRef, setRemoteVideoRef, setRemoteAudioRef]);

  // Ringtone: play on incoming / outgoing, stop when connected
  useEffect(() => {
    const incoming = (Boolean(incomingCallData) || isIncomingCall) && !callState.isInCall;
    const ringing  = callState.isOutgoingCall && !callState.isInCall;
    if (incoming)      { playIncomingRingtone(); }
    else if (ringing)  { playRingbackTone(); }
    else               { stopRingtone(); }
    return () => stopRingtone();
  }, [incomingCallData, isIncomingCall, callState.isInCall, callState.isOutgoingCall]);

  // Re-attach streams whenever they change (belt-and-suspenders)
  useEffect(() => {
    if (remoteStream) {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
      if (remoteVideoRef.current && callState.callType !== 'voice') {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream, callState.callType]);

  useEffect(() => {
    if (localStream && localVideoRef.current && callState.callType !== 'voice') {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState.callType]);

  // Auto-start outgoing call ONCE per modal open
  useEffect(() => {
    if (isOpen) {
      if (!callStartedRef.current && !isIncomingCall && !incomingCallData && targetUserId && targetUserName) {
        callStartedRef.current = true;
        startCall(targetUserId, targetUserName, initialCallType);
      }
    } else {
      callStartedRef.current = false; // reset when modal closes
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Auto-hide controls during video call
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (callState.isInCall && callState.callType === 'video') {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3500);
    }
  }, [callState.isInCall, callState.callType]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current); };
  }, [resetHideTimer]);

  const handleAcceptCall = () => {
    if (!incomingCallData) return;
    unlockAudio();
    stopRingtone();
    acceptCall(incomingCallData);
  };

  const handleRejectCall = () => {
    stopRingtone();
    const callerId = incomingCallData?.from || callState.remoteUserId;
    if (callerId) rejectCall(callerId, incomingCallData?.conversationId);
    onClose();
  };

  const handleEndCall = () => {
    stopRingtone();
    endCall();
    onClose();
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const toggleFs = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  if (!isOpen) return null;

  const showIncoming   = (Boolean(incomingCallData) || isIncomingCall) && !callState.isInCall;
  const showRinging    = callState.isOutgoingCall && !callState.isInCall;
  const showActive     = callState.isInCall;
  const showFailed     = callState.connectionState === 'failed' && !callState.isInCall && !showIncoming;
  const callType       = incomingCallData?.callType || callState.callType || initialCallType;
  const isVideo        = callType === 'video' || callState.isScreenSharing;
  const callerName     = incomingCallData?.callerName || callState.remoteUserName || targetUserName || 'Unknown';
  const isConnected    = callState.connectionState === 'connected';

  return (
    <AnimatePresence>
      {/* Hidden audio element — plays remote audio for ALL call types */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      <motion.div
        key="call-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center"
        onMouseMove={resetHideTimer}
        onClick={resetHideTimer}
      >
        {/* Blurred bg */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`relative z-10 flex flex-col overflow-hidden shadow-2xl
            ${isFullscreen
              ? 'w-screen h-screen rounded-none'
              : 'w-full max-w-4xl h-[90vh] max-h-[860px] rounded-3xl'
            }
            ${isVideo && showActive ? 'bg-black' : 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'}
            border border-white/10`}
        >

          {/* ══ INCOMING CALL ══ */}
          {showIncoming && (
            <div className={`flex flex-col items-center justify-center flex-1 gap-8 px-8 text-center
              bg-gradient-to-br ${callType === 'video'
                ? 'from-indigo-950 via-purple-950 to-gray-950'
                : 'from-emerald-950 via-teal-950 to-gray-950'}`}>

              {/* Pulsing rings */}
              <div className="relative flex items-center justify-center">
                {[1.6, 1.35, 1.1].map((scale, i) => (
                  <motion.div
                    key={i}
                    className={`absolute rounded-full ${callType === 'video' ? 'bg-purple-500/20' : 'bg-emerald-500/20'}`}
                    style={{ width: 144 * scale, height: 144 * scale }}
                    animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                  />
                ))}
                <div className={`relative w-36 h-36 rounded-full flex items-center justify-center
                  ${callType === 'video' ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-emerald-600 to-teal-700'}
                  shadow-2xl`}>
                  {callType === 'video' ? <Video className="w-16 h-16 text-white" /> : <Phone className="w-16 h-16 text-white" />}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-gray-400 mb-2">
                  Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
                </p>
                <h2 className="text-4xl font-bold text-white">{callerName}</h2>
              </div>

              <div className="flex items-end gap-16">
                <div className="flex flex-col items-center gap-3">
                  <button onClick={handleRejectCall}
                    className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 active:scale-90 text-white flex items-center justify-center transition-all shadow-xl shadow-red-900/50">
                    <PhoneOff className="w-8 h-8" />
                  </button>
                  <span className="text-gray-400 text-sm font-medium">Decline</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <motion.button onClick={handleAcceptCall}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white flex items-center justify-center transition-colors shadow-xl shadow-emerald-900/50">
                    <Phone className="w-8 h-8" />
                  </motion.button>
                  <span className="text-gray-400 text-sm font-medium">Accept</span>
                </div>
              </div>
            </div>
          )}

          {/* ══ OUTGOING RINGING ══ */}
          {showRinging && (
            <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8 text-center bg-gradient-to-br from-blue-950 via-indigo-950 to-gray-950">
              <div className="relative flex items-center justify-center">
                {[1.6, 1.35, 1.1].map((scale, i) => (
                  <motion.div key={i}
                    className="absolute rounded-full bg-blue-500/20"
                    style={{ width: 144 * scale, height: 144 * scale }}
                    animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.15, 0.5] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35 }}
                  />
                ))}
                <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl">
                  {callType === 'video' ? <Video className="w-16 h-16 text-white" /> : <Phone className="w-16 h-16 text-white" />}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-gray-400 mb-2">
                  {callType === 'video' ? 'Video' : 'Voice'} Call · Ringing
                </p>
                <h2 className="text-4xl font-bold text-white">{callerName}</h2>
              </div>
              <div className="flex flex-col items-center gap-3">
                <button onClick={handleEndCall}
                  className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 active:scale-90 text-white flex items-center justify-center transition-all shadow-xl shadow-red-900/50">
                  <PhoneOff className="w-8 h-8" />
                </button>
                <span className="text-gray-400 text-sm font-medium">Cancel</span>
              </div>
            </div>
          )}

          {/* ══ ACTIVE CALL ══ */}
          {showActive && (
            <div className="flex flex-col flex-1 h-full relative">

              {/* VIDEO: remote stream fullscreen */}
              {isVideo && (
                <video ref={remoteVideoRef} autoPlay playsInline muted={false}
                  className="absolute inset-0 w-full h-full object-cover" />
              )}

              {/* VOICE: avatar + waveform feel */}
              {!isVideo && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
                  <div className="relative">
                    {isConnected && [1.5, 1.25].map((s, i) => (
                      <motion.div key={i}
                        className="absolute inset-0 rounded-full bg-emerald-500/15"
                        style={{ margin: -(i+1)*20 }}
                        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                      />
                    ))}
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center shadow-2xl text-white text-5xl font-bold">
                      {callerName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-white">{callerName}</h2>
                    <p className={`text-xl mt-2 font-mono font-semibold ${isConnected ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {isConnected ? fmt(callState.callDuration) : '● Connecting...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Header overlay (video calls) */}
              {isVideo && (
                <motion.div
                  animate={{ opacity: showControls ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4
                    bg-gradient-to-b from-black/70 to-transparent pointer-events-none"
                >
                  <div className="flex items-center gap-3 pointer-events-auto">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'}`} />
                    <span className="text-white font-semibold text-lg">{callerName}</span>
                    <span className={`text-sm font-mono ${isConnected ? 'text-emerald-300' : 'text-yellow-300'}`}>
                      {isConnected ? fmt(callState.callDuration) : 'Connecting...'}
                    </span>
                  </div>
                  <button onClick={toggleFs} className="pointer-events-auto p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </motion.div>
              )}

              {/* Local PiP (video) */}
              {isVideo && (
                <motion.div
                  animate={{ opacity: showControls ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-20 right-4 w-40 h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900"
                >
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {callState.isCameraOff && (
                    <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center">
                      <VideoOff className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </motion.div>
              )}

              {/* Connecting overlay */}
              {!isConnected && isVideo && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
                  />
                  <p className="text-white text-lg font-medium">Connecting…</p>
                </div>
              )}

              {/* Controls bar */}
              <motion.div
                animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
                transition={{ duration: 0.3 }}
                className={`${isVideo ? 'absolute bottom-0 left-0 right-0' : 'relative'} 
                  flex items-center justify-center gap-5 px-6 py-5
                  bg-gradient-to-t from-black/80 via-black/40 to-transparent`}
              >
                <CtrlBtn onClick={toggleMute} active={!callState.isMuted} label={callState.isMuted ? 'Unmute' : 'Mute'}>
                  {callState.isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </CtrlBtn>

                {callType === 'video' && (
                  <CtrlBtn onClick={toggleCamera} active={!callState.isCameraOff} label={callState.isCameraOff ? 'Start Cam' : 'Stop Cam'}>
                    {callState.isCameraOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                  </CtrlBtn>
                )}

                <CtrlBtn onClick={toggleScreenShare} active={callState.isScreenSharing} label={callState.isScreenSharing ? 'Stop Share' : 'Share'}>
                  {callState.isScreenSharing ? <MonitorOff className="w-6 h-6 text-white" /> : <Monitor className="w-6 h-6 text-white" />}
                </CtrlBtn>

                {!isVideo && (
                  <CtrlBtn onClick={toggleFs} active={isFullscreen} label="Fullscreen">
                    {isFullscreen ? <Minimize2 className="w-6 h-6 text-white" /> : <Maximize2 className="w-6 h-6 text-white" />}
                  </CtrlBtn>
                )}

                <CtrlBtn onClick={handleEndCall} danger label="End Call">
                  <PhoneOff className="w-6 h-6 text-white" />
                </CtrlBtn>
              </motion.div>
            </div>
          )}

          {/* ══ FAILED ══ */}
          {showFailed && (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <PhoneOff className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Call Failed</h2>
                <p className="text-gray-400 mt-2 max-w-sm text-sm">
                  Could not establish a connection. Check camera/microphone permissions and try again.
                </p>
              </div>
              <button onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors">
                Close
              </button>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
