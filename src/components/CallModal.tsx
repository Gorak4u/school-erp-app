'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  Maximize2, Minimize2, PhoneOff, MessageSquare, X, Send,
  Hand, Calendar, ChevronRight, SmilePlus,
} from 'lucide-react';
import { useWebRTCCall, IncomingCallData } from '@/hooks/useWebRTCCall';
import { useGlobalSocket } from '@/contexts/SocketContext';
import { playIncomingRingtone, playRingbackTone, stopRingtone, unlockAudio } from '@/lib/ringtone';
import { CallControls } from '@/components/CallControls';
import { LiveReactions } from '@/components/LiveReactions';

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  mine: boolean;
  time: string;
}

interface Reaction {
  id: string;
  emoji: string;
  x: number;
}

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  targetUserId?: string;
  targetUserName?: string;
  currentUserName?: string;
  initialCallType?: 'voice' | 'video';
  enabled?: boolean;
  isIncomingCall?: boolean;
  incomingCallData?: IncomingCallData;
  onScheduleMeeting?: () => void;
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
  currentUserName,
  initialCallType = 'voice',
  enabled,
  isIncomingCall,
  incomingCallData,
  onScheduleMeeting,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [handRaised, setHandRaised] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callStartedRef = useRef(false);
  const wasInCallRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeConvId = incomingCallData?.conversationId || conversationId;

  const { subscribe, emit, isConnected: socketConnected } = useGlobalSocket();

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
    upgradeToVideo,
    downgradeToVoice,
    setLocalVideoRef,
    setRemoteVideoRef,
    setRemoteAudioRef,
  } = useWebRTCCall(activeConvId, enabled ?? isOpen);

  // ── Effects ──────────────────────────────────────────

  useEffect(() => { unlockAudio(); }, []);

  useEffect(() => {
    setLocalVideoRef(localVideoRef.current);
    setRemoteVideoRef(remoteVideoRef.current);
    setRemoteAudioRef(remoteAudioRef.current);
  }, [setLocalVideoRef, setRemoteVideoRef, setRemoteAudioRef]);

  // Ringtone: Receiver hears incoming ringtone, Caller hears ringback
  useEffect(() => {
    const isReceivingCall = (Boolean(incomingCallData) || isIncomingCall) && !callState.isInCall && !callEnded;
    const isCallingOut = callState.isOutgoingCall && !callState.isInCall && !callEnded;
    
    if (isReceivingCall) {
      // Receiver: play incoming ringtone (someone is calling you)
      playIncomingRingtone();
    } else if (isCallingOut) {
      // Caller: play ringback tone (waiting for other party to answer)
      playRingbackTone();
    } else {
      stopRingtone();
    }
    
    return () => stopRingtone();
  }, [incomingCallData, isIncomingCall, callState.isInCall, callState.isOutgoingCall, callEnded]);

  // Re-attach streams (belt-and-suspenders)
  useEffect(() => {
    if (remoteStream) {
      if (remoteAudioRef.current) { remoteAudioRef.current.srcObject = remoteStream; remoteAudioRef.current.play().catch(() => {}); }
      if (remoteVideoRef.current && callState.callType !== 'voice') { remoteVideoRef.current.srcObject = remoteStream; remoteVideoRef.current.play().catch(() => {}); }
    }
  }, [remoteStream, callState.callType]);

  useEffect(() => {
    if (localStream && localVideoRef.current && callState.callType !== 'voice') localVideoRef.current.srcObject = localStream;
  }, [localStream, callState.callType]);

  // Auto-start outgoing call ONCE per modal open
  useEffect(() => {
    if (isOpen) {
      // Extra safety: don't auto-start if already in any call state
      if (callState.isInCall || callState.isOutgoingCall || callState.isIncomingCall) {
        return;
      }
      
      if (!callStartedRef.current && !isIncomingCall && !incomingCallData && targetUserId && targetUserName) {
        // Set ref IMMEDIATELY to prevent any race conditions
        callStartedRef.current = true;
        
        startCall(targetUserId, targetUserName, initialCallType);
      }
    } else {
      callStartedRef.current = false;
      setCallEnded(false);
      wasInCallRef.current = false;
    }
  }, [isOpen, targetUserId, targetUserName, initialCallType, isIncomingCall, incomingCallData, callState.isInCall, callState.isOutgoingCall, callState.isIncomingCall, startCall]);

  // Track when call goes active so we can detect when it ends
  useEffect(() => {
    if (callState.isInCall) {
      wasInCallRef.current = true;
      setCallEnded(false);
    }
  }, [callState.isInCall]);

  // AUTO-CLOSE FIX: detect call end and show ended state, RESET all refs for next call
  useEffect(() => {
    if (wasInCallRef.current && !callState.isInCall && callState.connectionState === 'ended') {
      setCallEnded(true);
      // Reset refs to ensure clean state for next call
      callStartedRef.current = false;
      wasInCallRef.current = false;
      setTimeout(() => { onClose(); }, 3000);
    }
    wasInCallRef.current = callState.isInCall;
  }, [callState.isInCall, callState.connectionState, onClose]);

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

  // In-call chat: receive messages from global socket
  useEffect(() => {
    if (!socketConnected || !activeConvId) return;
    const unsubscribe = subscribe('new-message', (msg: any) => {
      if (msg.conversationId === activeConvId || msg.conversationId === conversationId) {
        setChatMessages(prev => [...prev, {
          id: msg._id || msg.id || Date.now().toString(),
          from: msg.senderName || 'Them',
          text: msg.content || msg.text || '',
          mine: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        if (!showChat) { /* unread badge could go here */ }
      }
    });
    return () => unsubscribe();
  }, [socketConnected, activeConvId, conversationId, showChat, subscribe]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Handlers ──────────────────────────────────────────

  const handleAcceptCall = () => {
    if (!incomingCallData) return;
    unlockAudio(); stopRingtone();
    acceptCall(incomingCallData);
  };

  const handleRejectCall = () => {
    stopRingtone();
    const callerId = incomingCallData?.from || callState.remoteUserId;
    if (callerId) rejectCall(callerId, incomingCallData?.conversationId);
    onClose();
  };

  const handleEndCall = () => {
    stopRingtone(); endCall(); onClose();
  };

  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text || !socketConnected || !activeConvId) return;
    emit('send-message', { conversationId: activeConvId, content: text });
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(), from: targetUserName || 'You', text, mine: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setChatInput('');
  };

  const sendReaction = (emoji: string) => {
    const id = Date.now().toString();
    const x = 20 + Math.random() * 60;
    setReactions(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2500);
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const toggleFs = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  if (!isOpen) return null;

  const showIncoming = (Boolean(incomingCallData) || isIncomingCall) && !callState.isInCall && !callEnded;
  const showRinging  = callState.isOutgoingCall && !callState.isInCall && !callEnded;
  const showActive   = callState.isInCall || (callState.connectionState === 'connecting' && !showIncoming && !showRinging);
  const showFailed   = callState.connectionState === 'failed' && !callState.isInCall && !showIncoming && !callEnded;
  const callType     = incomingCallData?.callType || callState.callType || initialCallType;
  const isVideo      = callState.callType === 'video' || callState.isScreenSharing;
  const callerName   = incomingCallData?.callerName || callState.remoteUserName || targetUserName || 'Unknown';
  const isConnected  = callState.connectionState === 'connected';
  
  // Get status text based on connection state
  const getStatusText = () => {
    if (isConnected) return fmt(callState.callDuration);
    if (callState.connectionState === 'calling') return 'Calling...';
    if (callState.connectionState === 'ringing') return 'Ringing...';
    if (callState.connectionState === 'connecting') return 'Connecting...';
    return 'Connecting...';
  };
  
  const REACTIONS    = ['👍','👏','😂','❤️','🎉','🙌'];
  
  // Fallback: if no state is showing, show a blank with close button to prevent gray screen
  const showFallback = !showIncoming && !showRinging && !showActive && !showFailed && !callEnded;

  return (
    <AnimatePresence>
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      <motion.div key="call-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-center justify-center"
        onMouseMove={resetHideTimer} onClick={resetHideTimer}>

        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`relative z-10 flex overflow-hidden shadow-2xl
            ${isFullscreen ? 'w-screen h-screen rounded-none' : 'w-full max-w-5xl h-[90vh] max-h-[900px] rounded-3xl'}
            ${isVideo && showActive ? 'bg-black' : 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'}
            border border-white/10`}
        >
          {/* ── Main area ── */}
          <div className="flex flex-col flex-1 min-w-0 relative">

            {/* ══ INCOMING ══ */}
            {showIncoming && (
              <div className={`flex flex-col items-center justify-center flex-1 gap-8 px-8 text-center
                bg-gradient-to-br ${callType === 'video' ? 'from-indigo-950 via-purple-950 to-gray-950' : 'from-emerald-950 via-teal-950 to-gray-950'}`}>
                <button onClick={handleRejectCall} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <X className="w-5 h-5" />
                </button>
                <div className="relative flex items-center justify-center">
                  {[1.6,1.35,1.1].map((sc,i) => (
                    <motion.div key={i} className={`absolute rounded-full ${callType==='video'?'bg-purple-500/20':'bg-emerald-500/20'}`}
                      style={{ width: 144*sc, height: 144*sc }}
                      animate={{ scale:[1,1.05,1], opacity:[0.6,0.2,0.6] }} transition={{ duration:2, repeat:Infinity, delay:i*0.4 }} />
                  ))}
                  <div className={`relative w-36 h-36 rounded-full flex items-center justify-center shadow-2xl text-white text-6xl font-bold
                    ${callType==='video'?'bg-gradient-to-br from-purple-600 to-indigo-700':'bg-gradient-to-br from-emerald-600 to-teal-700'}`}>
                    {callerName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Incoming {callType==='video'?'Video':'Voice'} Call</p>
                  <h2 className="text-4xl font-bold text-white">{callerName}</h2>
                </div>
                <div className="flex items-end gap-16">
                  <div className="flex flex-col items-center gap-3">
                    <button onClick={handleRejectCall} className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 active:scale-90 text-white flex items-center justify-center transition-all shadow-xl">
                      <PhoneOff className="w-8 h-8" />
                    </button>
                    <span className="text-gray-400 text-sm">Decline</span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <motion.button onClick={handleAcceptCall} animate={{ scale:[1,1.08,1] }} transition={{ duration:1.2, repeat:Infinity }}
                      className="w-20 h-20 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white flex items-center justify-center transition-colors shadow-xl">
                      <Phone className="w-8 h-8" />
                    </motion.button>
                    <span className="text-gray-400 text-sm">Accept</span>
                  </div>
                </div>
              </div>
            )}

            {/* ══ RINGING ══ */}
            {showRinging && (
              <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8 text-center bg-gradient-to-br from-blue-950 via-indigo-950 to-gray-950">
                <button onClick={handleEndCall} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <X className="w-5 h-5" />
                </button>
                <div className="relative flex items-center justify-center">
                  {[1.6,1.35,1.1].map((sc,i) => (
                    <motion.div key={i} className="absolute rounded-full bg-blue-500/20"
                      style={{ width:144*sc, height:144*sc }}
                      animate={{ scale:[1,1.06,1], opacity:[0.5,0.15,0.5] }} transition={{ duration:1.8, repeat:Infinity, delay:i*0.35 }} />
                  ))}
                  <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl text-white text-6xl font-bold">
                    {callerName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{callType==='video'?'Video':'Voice'} Call · Ringing</p>
                  <h2 className="text-4xl font-bold text-white">{callerName}</h2>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <button onClick={handleEndCall} className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 active:scale-90 text-white flex items-center justify-center transition-all shadow-xl">
                    <PhoneOff className="w-8 h-8" />
                  </button>
                  <span className="text-gray-400 text-sm">Cancel</span>
                </div>
              </div>
            )}

            {/* ══ CALL ENDED ══ */}
            {callEnded && (
              <div className="flex flex-col items-center justify-center flex-1 gap-5 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
                <button onClick={onClose} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <X className="w-5 h-5" />
                </button>
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                  <PhoneOff className="w-9 h-9 text-gray-400" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">Call Ended</h2>
                  <p className="text-gray-400 mt-1 text-sm">Duration: {fmt(callState.callDuration)}</p>
                </div>
              </div>
            )}

            {/* ══ ACTIVE CALL ══ */}
            {showActive && (
              <div className="flex flex-col flex-1 h-full relative">

                {/* Live Reactions Component */}
                <LiveReactions
                  onReact={(emoji) => sendReaction(emoji)}
                  incomingReactions={reactions.map(r => ({ ...r, y: 90, timestamp: Date.now() }))}
                />

                {/* Raise hand indicator */}
                {handRaised && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-yellow-500 text-black font-semibold text-sm px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                    ✋ You raised your hand
                  </div>
                )}

                {/* VIDEO: remote fullscreen */}
                {isVideo && <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />}

                {/* VOICE: avatar */}
                {!isVideo && (
                  <div className="flex flex-col items-center justify-center flex-1 gap-6 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
                    <div className="relative">
                      {isConnected && [1,2].map(i => (
                        <motion.div key={i} className="absolute inset-0 rounded-full bg-emerald-500/10"
                          style={{ margin: -i*24 }}
                          animate={{ scale:[1,1.1,1], opacity:[0.4,0.05,0.4] }}
                          transition={{ duration:2.2, repeat:Infinity, delay:i*0.6 }} />
                      ))}
                      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center shadow-2xl text-white text-5xl font-bold">
                        {callerName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-white">{callerName}</h2>
                      <p className={`text-xl mt-2 font-mono font-semibold ${isConnected?'text-emerald-400':'text-yellow-400 animate-pulse'}`}>
                        {getStatusText()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Video header */}
                {isVideo && (
                  <motion.div animate={{ opacity: showControls?1:0 }} transition={{ duration:0.3 }}
                    className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
                    <div className="flex items-center gap-3 pointer-events-auto">
                      <div className={`w-2 h-2 rounded-full ${isConnected?'bg-emerald-400':'bg-yellow-400 animate-pulse'}`} />
                      <span className="text-white font-semibold">{callerName}</span>
                      <span className={`text-sm font-mono ${isConnected?'text-emerald-300':'text-yellow-300'}`}>
                        {getStatusText()}
                      </span>
                    </div>
                    <button onClick={toggleFs} className="pointer-events-auto p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </motion.div>
                )}

                {/* Local PiP */}
                {isVideo && (
                  <motion.div animate={{ opacity: showControls?1:0 }} transition={{ duration:0.3 }}
                    className="absolute top-16 right-4 w-40 h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {callState.isCameraOff && (
                      <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center"><VideoOff className="w-8 h-8 text-gray-400" /></div>
                    )}
                  </motion.div>
                )}

                {/* Connecting overlay */}
                {!isConnected && isVideo && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                    <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                      className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
                    <p className="text-white text-lg font-medium">
                      {callState.connectionState === 'calling' ? 'Calling...' : 
                       callState.connectionState === 'ringing' ? 'Ringing...' : 'Connecting...'}
                    </p>
                  </div>
                )}

                {/* Enhanced Call Controls */}
                <CallControls
                  isMuted={callState.isMuted}
                  isCameraOff={callState.isCameraOff}
                  isScreenSharing={callState.isScreenSharing}
                  showChat={showChat}
                  chatUnread={chatMessages.filter(m => !m.mine).length}
                  onToggleMute={toggleMute}
                  onToggleCamera={toggleCamera}
                  onToggleScreenShare={toggleScreenShare}
                  onToggleChat={() => setShowChat(v => !v)}
                  onEndCall={handleEndCall}
                  onRaiseHand={() => setHandRaised(v => !v)}
                  autoHide={isVideo}
                  autoHideDelay={3000}
                />
              </div>
            )}

            {/* ══ FAILED ══ */}
            {showFailed && (
              <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8 text-center">
                <button onClick={onClose} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <X className="w-5 h-5" />
                </button>
                <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <PhoneOff className="w-10 h-10 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Call Failed</h2>
                  <p className="text-gray-400 mt-2 max-w-sm text-sm">Could not connect. Check camera/microphone permissions.</p>
                </div>
                <button onClick={onClose} className="px-8 py-3 rounded-2xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors">Close</button>
              </div>
            )}

            {/* ══ FALLBACK (Prevents blank gray screen) ══ */}
            {showFallback && (
              <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8 text-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
                <button onClick={onClose} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <X className="w-5 h-5" />
                </button>
                <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                  <PhoneOff className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Call Disconnected</h2>
                  <p className="text-gray-400 mt-2 text-sm">The call has been cancelled or disconnected.</p>
                </div>
                <button onClick={onClose} className="px-8 py-3 rounded-2xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors">Close</button>
              </div>
            )}
          </div>

          {/* ── In-call chat panel ── */}
          <AnimatePresence>
            {showChat && showActive && (
              <motion.div
                initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                transition={{ type:'spring', stiffness:300, damping:30 }}
                className="flex flex-col border-l border-white/10 bg-gray-950 overflow-hidden"
                style={{ minWidth: 0 }}
              >
                {/* Chat header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-semibold text-sm">Meeting Chat</span>
                    <span className="text-xs text-gray-500 font-medium">{chatMessages.length > 0 ? `${chatMessages.length} messages` : 'No messages yet'}</span>
                  </div>
                  <button onClick={() => setShowChat(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-600 text-xs py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No messages yet. Start the conversation!
                    </div>
                  )}
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.mine?'items-end':'items-start'}`}>
                      <span className="text-[10px] text-gray-500 mb-0.5 px-1">{msg.mine ? 'You' : msg.from} · {msg.time}</span>
                      <div className={`max-w-[90%] px-3 py-2 rounded-2xl text-sm leading-snug
                        ${msg.mine ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/10 text-gray-100 rounded-tl-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <div className="px-3 py-3 border-t border-white/10">
                  <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-2">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                      placeholder="Send a message…"
                      className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
                    />
                    <button onClick={sendChatMessage} disabled={!chatInput.trim()}
                      className="p-1 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
