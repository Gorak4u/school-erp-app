'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, X } from 'lucide-react';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';

interface GlobalCallNotificationProps {
  incomingCallData: {
    from: string;
    conversationId: string;
    callType: 'voice' | 'video';
    callerName?: string;
    offer?: any;
  } | null;
  onAccept: () => void;
  onReject: () => void;
  socket: any;
}

export function GlobalCallNotification({ 
  incomingCallData, 
  onAccept, 
  onReject,
  socket 
}: GlobalCallNotificationProps) {
  const { acceptCall, rejectCall } = useWebRTCCall(
    incomingCallData?.conversationId,
    true,
    socket
  );

  if (!incomingCallData) return null;

  const handleAccept = async () => {
    try {
      await acceptCall({
        from: incomingCallData.from,
        conversationId: incomingCallData.conversationId,
        callType: incomingCallData.callType,
        callerName: incomingCallData.callerName,
        offer: incomingCallData.offer,
      });
      onAccept();
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleReject = () => {
    rejectCall(incomingCallData.from, incomingCallData.conversationId);
    onReject();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-20 right-6 z-[9999] w-80"
      >
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden backdrop-blur-xl">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
          
          <div className="relative p-6">
            {/* Close button */}
            <button
              onClick={handleReject}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            {/* Pulsing call icon */}
            <div className="flex items-center space-x-4 mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
              >
                {incomingCallData.callType === 'video' ? (
                  <Video className="w-8 h-8 text-white" />
                ) : (
                  <Phone className="w-8 h-8 text-white" />
                )}
              </motion.div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-400 uppercase tracking-wider font-medium mb-1">
                  Incoming {incomingCallData.callType} call
                </p>
                <p className="text-xl font-bold text-white truncate">
                  {incomingCallData.callerName || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Call action buttons */}
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReject}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-red-500/50 transition-all"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Reject</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAccept}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium flex items-center justify-center space-x-2 shadow-lg hover:shadow-green-500/50 transition-all"
              >
                <Phone className="w-5 h-5" />
                <span>Answer</span>
              </motion.button>
            </div>

            {/* Tip text */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Call will open in messenger after accepting
            </p>
          </div>

          {/* Animated border gradient */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.3), transparent)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 0%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
