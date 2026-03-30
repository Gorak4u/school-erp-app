'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CornerDownRight } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

interface ThreadMessage {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: Date;
  senderName?: string;
  senderAvatar?: string;
}

interface MessageThreadProps {
  parentMessage: ThreadMessage;
  replies: ThreadMessage[];
  isOpen: boolean;
  onClose: () => void;
  onSendReply?: (text: string) => void;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  parentMessage,
  replies,
  isOpen,
  onClose,
  onSendReply,
}) => {
  const [replyText, setReplyText] = React.useState('');

  const handleSend = () => {
    if (replyText.trim()) {
      onSendReply?.(replyText);
      setReplyText('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CornerDownRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Thread</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Parent Message */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <MessageBubble
              {...parentMessage}
              status="read"
            />
          </div>

          {/* Replies */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {replies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No replies yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Be the first to reply!</p>
              </div>
            ) : (
              replies.map((reply) => (
                <div key={reply.id} className="pl-4 border-l-2 border-blue-500">
                  <MessageBubble
                    {...reply}
                    status="read"
                  />
                </div>
              ))
            )}
          </div>

          {/* Reply Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Reply in thread..."
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={handleSend}
                disabled={!replyText.trim()}
                className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
