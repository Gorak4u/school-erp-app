'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, 
  Maximize2, Minimize2, X, PhoneOff
} from 'lucide-react';
import { useWebRTCCall, IncomingCallData } from '@/hooks/useWebRTCCall';

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
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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
  } = useWebRTCCall(
    incomingCallData?.conversationId || conversationId,
    enabled ?? isOpen,
    signalingSocket
  );

  // Set video element refs
  useEffect(() => {
    setLocalVideoRef(localVideoRef.current);
    setRemoteVideoRef(remoteVideoRef.current);
  }, [setLocalVideoRef, setRemoteVideoRef]);

  // Attach remote stream to video element when available
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Attach local stream to video element when available
  useEffect(() => {
    if (localStream && localVideoRef.current && callState.callType !== 'voice') {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState.callType]);

  // Auto-start outgoing call when modal opens
  useEffect(() => {
    if (isOpen && !isIncomingCall && !incomingCallData && targetUserId && targetUserName && !callState.isInCall && !callState.isOutgoingCall) {
      startCall(targetUserId, targetUserName, initialCallType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  const handleAcceptCall = () => {
    if (!incomingCallData) return;
    acceptCall(incomingCallData);
  };

  const handleRejectCall = () => {
    const callerId = incomingCallData?.from || callState.remoteUserId;
    if (callerId) {
      rejectCall(callerId, incomingCallData?.conversationId);
    }
    onClose();
  };

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  const showIncomingAlert = (Boolean(incomingCallData) || isIncomingCall) && !callState.isInCall;
  const showOutgoingRinging = callState.isOutgoingCall && !callState.isInCall;
  const showActiveCall = callState.isInCall;
  const showFailed = callState.connectionState === 'failed' && !callState.isInCall && !showIncomingAlert;
  const activeCallType = incomingCallData?.callType || callState.callType || initialCallType;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className={`${isFullscreen ? 'w-full h-full rounded-none' : 'w-full h-full max-w-5xl max-h-[92vh] rounded-2xl'} overflow-hidden bg-gray-950 border border-white/10 flex flex-col`}
        >
          {/* ── INCOMING CALL ── */}
          {showIncomingAlert && (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-6">
              <div className="relative">
                <div className={`w-36 h-36 rounded-full flex items-center justify-center ${
                  activeCallType === 'video'
                    ? 'bg-gradient-to-br from-blue-600 to-purple-700'
                    : 'bg-gradient-to-br from-green-600 to-teal-700'
                }`}>
                  {activeCallType === 'video'
                    ? <Video className="w-16 h-16 text-white" />
                    : <Phone className="w-16 h-16 text-white" />}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500" />
                </span>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white">
                  {incomingCallData?.callerName || 'Unknown Caller'}
                </h2>
                <p className="text-gray-400 mt-1">
                  Incoming {activeCallType === 'video' ? 'Video' : 'Voice'} Call
                </p>
              </div>

              <div className="flex items-center gap-8 mt-4">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleRejectCall}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/40"
                  >
                    <PhoneOff className="w-7 h-7" />
                  </button>
                  <span className="text-gray-400 text-sm">Decline</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleAcceptCall}
                    className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-green-900/40 animate-bounce"
                  >
                    <Phone className="w-7 h-7" />
                  </button>
                  <span className="text-gray-400 text-sm">Accept</span>
                </div>
              </div>
            </div>
          )}

          {/* ── OUTGOING RINGING ── */}
          {showOutgoingRinging && (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-6">
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center animate-pulse">
                {callState.callType === 'video'
                  ? <Video className="w-16 h-16 text-white" />
                  : <Phone className="w-16 h-16 text-white" />}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{callState.remoteUserName}</h2>
                <p className="text-gray-400 mt-1">
                  {callState.callType === 'video' ? 'Video' : 'Voice'} Call · Ringing...
                </p>
              </div>
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/40"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </div>
          )}

          {/* ── ACTIVE CALL ── */}
          {showActiveCall && (
            <div className="flex flex-col flex-1 h-full">
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-black/40 backdrop-blur-sm border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${callState.connectionState === 'connected' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
                  <span className="text-white font-semibold">{callState.remoteUserName || 'Unknown'}</span>
                  <span className="text-gray-400 text-sm">
                    {callState.connectionState === 'connected'
                      ? formatDuration(callState.callDuration)
                      : 'Connecting...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Media area */}
              <div className="flex-1 relative bg-black overflow-hidden">
                {/* Remote video (fullscreen) */}
                {(callState.callType === 'video' || callState.isScreenSharing) ? (
                  <>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {/* Local PiP */}
                    <div className="absolute top-4 right-4 w-36 h-24 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {callState.isCameraOff && (
                        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                          <VideoOff className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Voice call */
                  <div className="flex flex-col items-center justify-center h-full gap-5">
                    <div className="w-44 h-44 rounded-full bg-gradient-to-br from-green-700 to-teal-800 flex items-center justify-center shadow-2xl">
                      <Phone className="w-20 h-20 text-white" />
                    </div>
                    <div className="text-center">
                      <h2 className="text-4xl font-bold text-white">{callState.remoteUserName}</h2>
                      <p className="text-2xl text-green-400 mt-2 font-mono">
                        {callState.connectionState === 'connected'
                          ? formatDuration(callState.callDuration)
                          : <span className="text-yellow-400 text-base animate-pulse">Connecting...</span>}
                      </p>
                    </div>
                  </div>
                )}

                {/* Connecting overlay */}
                {callState.connectionState === 'connecting' && callState.callType === 'video' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4">
                    <div className="w-14 h-14 border-4 border-t-blue-500 border-white/20 rounded-full animate-spin" />
                    <p className="text-white text-lg">Connecting...</p>
                  </div>
                )}
              </div>

              {/* Controls bar */}
              <div className="flex items-center justify-center gap-4 px-6 py-5 bg-black/50 backdrop-blur-sm border-t border-white/5">
                {/* Mute */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      callState.isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-white/15 hover:bg-white/25'
                    }`}
                  >
                    {callState.isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                  </button>
                  <span className="text-xs text-gray-400">{callState.isMuted ? 'Unmute' : 'Mute'}</span>
                </div>

                {/* Camera (video only) */}
                {callState.callType === 'video' && (
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={toggleCamera}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                        callState.isCameraOff ? 'bg-red-600 hover:bg-red-500' : 'bg-white/15 hover:bg-white/25'
                      }`}
                    >
                      {callState.isCameraOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                    </button>
                    <span className="text-xs text-gray-400">{callState.isCameraOff ? 'Start Video' : 'Stop Video'}</span>
                  </div>
                )}

                {/* Screen share */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={toggleScreenShare}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      callState.isScreenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-white/15 hover:bg-white/25'
                    }`}
                  >
                    {callState.isScreenSharing ? <MonitorOff className="w-6 h-6 text-white" /> : <Monitor className="w-6 h-6 text-white" />}
                  </button>
                  <span className="text-xs text-gray-400">{callState.isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
                </div>

                {/* End Call */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={handleEndCall}
                    className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/40"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <span className="text-xs text-gray-400">End</span>
                </div>
              </div>
            </div>
          )}

          {/* ── FAILED ── */}
          {showFailed && (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-5">
              <div className="w-24 h-24 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <PhoneOff className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Call Failed</h2>
                <p className="text-gray-400 mt-1 max-w-sm">
                  Could not connect. Check mic/camera permissions and try again.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
