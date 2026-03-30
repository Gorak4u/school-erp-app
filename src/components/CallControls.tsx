'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, Settings, MoreVertical,
  Users, Hand, Grid3x3, Maximize2, Volume2, Camera
} from 'lucide-react';

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  showChat?: boolean;
  chatUnread?: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat?: () => void;
  onEndCall: () => void;
  onSettings?: () => void;
  onRaiseHand?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isCameraOff,
  isScreenSharing,
  showChat = false,
  chatUnread = 0,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onEndCall,
  onSettings,
  onRaiseHand,
  autoHide = true,
  autoHideDelay = 3000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    if (!autoHide) return;

    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      setIsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsVisible(false), autoHideDelay);
    };

    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [autoHide, autoHideDelay]);

  const ControlButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    danger?: boolean;
    badge?: number;
    onClick: () => void;
    shortcut?: string;
  }> = ({ icon, label, active, danger, badge, onClick, shortcut }) => (
    <div className="flex flex-col items-center gap-1.5 group">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
          ${danger 
            ? 'bg-red-600 hover:bg-red-500 shadow-red-900/40' 
            : active 
              ? 'bg-white/25 hover:bg-white/35 ring-2 ring-white/40' 
              : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm'
          }`}
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          >
            {badge > 9 ? '9+' : badge}
          </motion.div>
        )}
      </motion.button>
      <div className="flex flex-col items-center">
        <span className="text-[11px] text-white/90 font-medium">{label}</span>
        {shortcut && (
          <span className="text-[9px] text-white/50 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            {shortcut}
          </span>
        )}
      </div>
    </div>
  );

  const controls = (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-2xl border border-white/10">
        <div className="flex items-center gap-4">
          {/* Mic */}
          <ControlButton
            icon={isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={!isMuted}
            onClick={onToggleMute}
            shortcut="M"
          />

          {/* Camera */}
          <ControlButton
            icon={isCameraOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
            label={isCameraOff ? 'Start Video' : 'Stop Video'}
            active={!isCameraOff}
            onClick={onToggleCamera}
            shortcut="V"
          />

          {/* Screen Share */}
          <ControlButton
            icon={isScreenSharing ? <MonitorOff className="w-6 h-6 text-white" /> : <Monitor className="w-6 h-6 text-white" />}
            label={isScreenSharing ? 'Stop Share' : 'Share'}
            active={isScreenSharing}
            onClick={onToggleScreenShare}
            shortcut="S"
          />

          {/* Divider */}
          <div className="w-px h-12 bg-white/20" />

          {/* Chat */}
          {onToggleChat && (
            <ControlButton
              icon={<MessageSquare className="w-6 h-6 text-white" />}
              label="Chat"
              active={showChat}
              badge={chatUnread}
              onClick={onToggleChat}
              shortcut="C"
            />
          )}

          {/* More Menu */}
          <div className="relative">
            <ControlButton
              icon={<MoreVertical className="w-6 h-6 text-white" />}
              label="More"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            />

            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full mb-2 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {onRaiseHand && (
                    <button
                      onClick={() => {
                        onRaiseHand();
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Hand className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      <span className="text-sm text-gray-900 dark:text-white">Raise Hand</span>
                    </button>
                  )}
                  {onSettings && (
                    <button
                      onClick={() => {
                        onSettings();
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                      <span className="text-sm text-gray-900 dark:text-white">Settings</span>
                    </button>
                  )}
                  <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Grid3x3 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm text-gray-900 dark:text-white">Change Layout</span>
                  </button>
                  <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Maximize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm text-gray-900 dark:text-white">Fullscreen</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-white/20" />

          {/* End Call */}
          <ControlButton
            icon={<PhoneOff className="w-6 h-6 text-white" />}
            label="End"
            danger
            onClick={onEndCall}
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isVisible && controls}
    </AnimatePresence>
  );
};
