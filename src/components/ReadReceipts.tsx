'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadReceipt {
  userId: string;
  userName: string;
  avatar?: string;
  readAt: Date;
}

interface ReadReceiptsProps {
  receipts: ReadReceipt[];
  maxVisible?: number;
}

export const ReadReceipts: React.FC<ReadReceiptsProps> = ({ receipts, maxVisible = 3 }) => {
  if (receipts.length === 0) return null;

  const visibleReceipts = receipts.slice(0, maxVisible);
  const remainingCount = receipts.length - maxVisible;

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-[10px] text-gray-500 dark:text-gray-400">Seen by</span>
      
      <div className="flex -space-x-2">
        <AnimatePresence>
          {visibleReceipts.map((receipt, index) => (
            <motion.div
              key={receipt.userId}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
              style={{ zIndex: visibleReceipts.length - index }}
            >
              <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-medium">
                {receipt.avatar ? (
                  <img 
                    src={receipt.avatar} 
                    alt={receipt.userName} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  receipt.userName.charAt(0).toUpperCase()
                )}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {receipt.userName}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {remainingCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white text-[9px] font-medium"
          >
            +{remainingCount}
          </motion.div>
        )}
      </div>
    </div>
  );
};
