'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Reply, MoreVertical, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  id: string;
  text: string;
  isMine: boolean;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  senderName?: string;
  senderAvatar?: string;
  attachments?: any[];
  reactions?: { emoji: string; users: string[] }[];
  onReply?: () => void;
  onReact?: (emoji: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  text,
  isMine,
  timestamp,
  status = 'sent',
  senderName,
  senderAvatar,
  attachments = [],
  reactions = [],
  onReply,
  onReact,
  onEdit,
  onDelete,
}) => {
  const [showActions, setShowActions] = React.useState(false);
  const [showReactions, setShowReactions] = React.useState(false);

  const bubbleVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 500, damping: 30 }
    },
  };

  const getStatusIcon = () => {
    if (!isMine) return null;
    switch (status) {
      case 'sending':
        return <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />;
      case 'sent':
        return <Check className="w-4 h-4 text-white/70" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-white/70" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      className={`flex items-end gap-2 mb-4 ${isMine ? 'flex-row-reverse' : 'flex-row'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* Avatar */}
      {!isMine && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {senderAvatar ? (
            <img src={senderAvatar} alt={senderName} className="w-full h-full rounded-full object-cover" />
          ) : (
            senderName?.charAt(0).toUpperCase()
          )}
        </div>
      )}

      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Sender name for received messages */}
        {!isMine && senderName && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">{senderName}</span>
        )}

        {/* Message bubble */}
        <div className="relative">
          {/* Tail */}
          <div
            className={`absolute top-0 ${
              isMine ? 'right-0 -mr-2' : 'left-0 -ml-2'
            } w-4 h-4 transform ${isMine ? 'scale-x-[-1]' : ''}`}
          >
            <svg viewBox="0 0 8 13" className={isMine ? 'text-blue-500' : 'text-white dark:text-gray-700'}>
              <path
                d="M1.533,3.568L8.553,0.551C9.044,0.345,9.6,0.715,9.6,1.249v11.502c0,0.534-0.556,0.904-1.047,0.698L1.533,10.432c-0.291-0.122-0.481-0.405-0.481-0.716V4.284C1.052,3.973,1.242,3.69,1.533,3.568z"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Bubble content */}
          <div
            className={`relative px-4 py-2.5 rounded-2xl ${
              isMine
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
            } ${isMine ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
          >
            {/* Message text */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((attachment, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg overflow-hidden ${
                      isMine ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-600'
                    }`}
                  >
                    {attachment.type === 'image' && (
                      <img src={attachment.url} alt="attachment" className="w-full max-h-64 object-cover" />
                    )}
                    {attachment.type === 'file' && (
                      <div className="p-3 flex items-center gap-2">
                        <div className="w-10 h-10 rounded bg-blue-500 flex items-center justify-center text-white text-xs">
                          {attachment.extension?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs opacity-70">{attachment.size}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Timestamp and status */}
            <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
              <span className={`text-[10px] ${isMine ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                {formatDistanceToNow(timestamp, { addSuffix: true })}
              </span>
              {getStatusIcon()}
            </div>
          </div>

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="absolute -bottom-3 left-4 flex gap-1">
              {reactions.map((reaction, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 flex items-center gap-1"
                >
                  <span className="text-sm">{reaction.emoji}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{reaction.users.length}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions (shown on hover) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: showActions ? 1 : 0, y: showActions ? 0 : -10 }}
          className={`flex items-center gap-1 mt-1 ${!showActions && 'pointer-events-none'}`}
        >
          <button
            onClick={onReply}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Reply"
          >
            <Reply className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="React"
          >
            <Smile className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          {isMine && (
            <button
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="More"
            >
              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </motion.div>

        {/* Quick reactions picker */}
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mt-2 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 flex gap-2"
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact?.(emoji);
                  setShowReactions(false);
                }}
                className="text-2xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
