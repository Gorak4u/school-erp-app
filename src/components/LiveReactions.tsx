'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
  timestamp: number;
}

interface LiveReactionsProps {
  onReact?: (emoji: string) => void;
  incomingReactions?: Reaction[];
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '👏', '🎉', '🔥'];

export const LiveReactions: React.FC<LiveReactionsProps> = ({
  onReact,
  incomingReactions = [],
}) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    // Merge incoming reactions
    const newReactions = incomingReactions.filter(
      r => !reactions.find(existing => existing.id === r.id)
    );
    
    if (newReactions.length > 0) {
      setReactions(prev => [...prev, ...newReactions]);
    }
  }, [incomingReactions]);

  useEffect(() => {
    // Remove old reactions after 3 seconds
    const timer = setInterval(() => {
      const now = Date.now();
      setReactions(prev => prev.filter(r => now - r.timestamp < 3000));
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleReaction = (emoji: string) => {
    const newReaction: Reaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      x: Math.random() * 80 + 10, // 10-90% from left
      y: 100, // Start from bottom
      timestamp: Date.now(),
    };

    setReactions(prev => [...prev, newReaction]);
    onReact?.(emoji);
    setShowPicker(false);
  };

  return (
    <>
      {/* Floating Reactions */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        <AnimatePresence>
          {reactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ 
                x: `${reaction.x}%`,
                y: '100%',
                opacity: 0,
                scale: 0.5,
              }}
              animate={{ 
                y: '-20%',
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.2, 1, 0.8],
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ 
                duration: 3,
                ease: 'easeOut',
              }}
              className="absolute text-6xl"
              style={{ left: 0 }}
            >
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction Picker Button */}
      <div className="fixed bottom-32 right-8 z-50">
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 flex gap-2"
            >
              {QUICK_REACTIONS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReaction(emoji)}
                  className="text-4xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl p-2 transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPicker(!showPicker)}
          className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-2xl hover:shadow-xl transition-all"
        >
          😊
        </motion.button>
      </div>
    </>
  );
};
