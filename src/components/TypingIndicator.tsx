'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  userName?: string;
  avatar?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ userName, avatar }) => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -8 },
  };

  return (
    <div className="flex items-end gap-2 mb-4">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
        {avatar ? (
          <img src={avatar} alt={userName} className="w-full h-full rounded-full object-cover" />
        ) : (
          userName?.charAt(0).toUpperCase() || '?'
        )}
      </div>

      <div className="flex flex-col items-start">
        {userName && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-2">{userName}</span>
        )}
        
        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-gray-700 shadow-md">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                variants={dotVariants}
                initial="initial"
                animate="animate"
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'reverse' as const,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
