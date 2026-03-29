'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, 
  Maximize2, Minimize2, X, Users
} from 'lucide-react';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  targetUserId?: string;
  targetUserName?: string;
  initialCallType?: 'voice' | 'video';
  enabled?: boolean;
  isIncomingCall?: boolean;
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
  isIncomingCall = false,
  onAcceptCall,
  onRejectCall,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
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
  } = useWebRTCCall(conversationId, enabled ?? isOpen);

  // Set video refs
  useEffect(() => {
    setLocalVideoRef(localVideoRef.current);
    setRemoteVideoRef(remoteVideoRef.current);
  }, [setLocalVideoRef, setRemoteVideoRef]);

  // Handle incoming call
  useEffect(() => {
    if (isIncomingCall && callState.isIncomingCall && onAcceptCall) {
      onAcceptCall();
    }
  }, [isIncomingCall, callState.isIncomingCall, onAcceptCall]);

  // Start outgoing call when modal opens
  useEffect(() => {
    if (isOpen && !isIncomingCall && targetUserId && targetUserName && !callState.isInCall) {
      startCall(targetUserId, targetUserName, initialCallType);
    }
  }, [isOpen, isIncomingCall, targetUserId, targetUserName, initialCallType, startCall, callState.isInCall]);

  // Handle call end
  const handleEndCall = () => {
    endCall();
    onClose();
  };

  const handleAcceptCall = () => {
    if (callState.remoteUserId) {
      acceptCall({
        type: 'call-offer',
        from: callState.remoteUserId,
        to: '',
        conversationId: conversationId || '',
        callType: callState.callType,
        payload: { callerName: callState.remoteUserName }
      });
    }
  };

  const handleRejectCall = () => {
    if (callState.remoteUserId) {
      rejectCall(callState.remoteUserId);
    }
    onClose();
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen
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

  const isDark = true; // You can get this from theme context
  const isInitializingCall = !callState.isIncomingCall && !callState.isOutgoingCall && !callState.isInCall;
  const isFailedCall = callState.connectionState === 'failed' && !callState.isInCall;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`w-full h-full ${isFullscreen ? '' : 'max-w-6xl max-h-[90vh]'} rounded-2xl overflow-hidden bg-gray-900 border border-gray-800`}
        >
          {isInitializingCall && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-5 animate-pulse">
                {initialCallType === 'video' ? <Video className="w-10 h-10 text-blue-400" /> : <Phone className="w-10 h-10 text-green-400" />}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {targetUserName || 'Connecting'}
              </h2>
              <p className="text-gray-400 mb-6">
                Preparing {initialCallType === 'video' ? 'video' : 'voice'} call...
              </p>
              <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin border-blue-500" />
            </div>
          )}

          {isFailedCall && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-5 border border-red-500/30">
                <X className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Call failed
              </h2>
              <p className="text-gray-400 mb-6 max-w-md">
                We couldn’t start the call. Please check microphone and camera permissions, then try again.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Incoming Call Screen */}
          {callState.isIncomingCall && !callState.isInCall && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="mb-8">
                {callState.callType === 'video' ? (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Video className="w-16 h-16 text-white" />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                    <Phone className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                {callState.remoteUserName}
              </h2>
              <p className="text-gray-400 mb-8">
                {callState.callType === 'video' ? 'Video Call' : 'Voice Call'} Incoming...
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={handleRejectCall}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <button
                  onClick={handleAcceptCall}
                  className="p-4 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Active Call Screen */}
          {callState.isInCall && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    {callState.callType === 'video' ? (
                      <Video className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Phone className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {callState.remoteUserName || 'Unknown'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {callState.connectionState === 'connected' 
                        ? formatDuration(callState.callDuration)
                        : 'Connecting...'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowParticipants(!showParticipants)}
                    className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Video Area */}
              <div className="flex-1 relative bg-black">
                {/* Remote Video */}
                {callState.callType === 'video' && (
                  <>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Local Video (Picture-in-Picture) */}
                    <div className="absolute top-4 right-4 w-32 h-24 rounded-lg overflow-hidden bg-gray-800 border-2 border-gray-600">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </>
                )}

                {/* Voice Call UI */}
                {callState.callType === 'voice' && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center mb-8">
                      <Phone className="w-24 h-24 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {callState.remoteUserName || 'Unknown'}
                    </h2>
                    <p className="text-gray-400">
                      {callState.connectionState === 'connected' 
                        ? formatDuration(callState.callDuration)
                        : 'Connecting...'
                      }
                    </p>
                  </div>
                )}

                {/* Connection Status Overlay */}
                {callState.connectionState === 'connecting' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 border-blue-500" />
                      <p className="text-white">Connecting...</p>
                    </div>
                  </div>
                )}

                {callState.connectionState === 'failed' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <p className="text-white">Connection Failed</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 bg-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-4">
                  {/* Mute */}
                  <button
                    onClick={toggleMute}
                    className={`p-3 rounded-full transition-colors ${
                      callState.isMuted 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Camera (Video calls only) */}
                  {callState.callType === 'video' && (
                    <button
                      onClick={toggleCamera}
                      className={`p-3 rounded-full transition-colors ${
                        callState.isCameraOff 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {callState.isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>
                  )}

                  {/* Screen Share */}
                  <button
                    onClick={toggleScreenShare}
                    className={`p-3 rounded-full transition-colors ${
                      callState.isScreenSharing 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {callState.isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                  </button>

                  {/* End Call */}
                  <button
                    onClick={handleEndCall}
                    className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    <Phone className="w-5 h-5 transform rotate-135" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Outgoing Call Ringing */}
          {callState.isOutgoingCall && !callState.isInCall && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="mb-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                  {callState.callType === 'video' ? (
                    <Video className="w-16 h-16 text-white" />
                  ) : (
                    <Phone className="w-16 h-16 text-white" />
                  )}
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                {callState.remoteUserName}
              </h2>
              <p className="text-gray-400 mb-8">
                {callState.callType === 'video' ? 'Video Call' : 'Voice Call'} Ringing...
              </p>
              
              <button
                onClick={handleEndCall}
                className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
