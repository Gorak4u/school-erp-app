'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FeeOverviewProps {
  pendingTransportFees: number;
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  btnPrimary: string;
}

export function FeeOverview({ pendingTransportFees, isDark, card, text, subtext, btnPrimary }: FeeOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className={`${card} p-6 rounded-xl border`}
    >
      <h3 className={`text-lg font-semibold ${text} mb-4 flex items-center gap-2`}>
        💰 Transport Fee Overview
      </h3>
      
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-orange-600/20 border border-orange-600/30' : 'bg-orange-100 border border-orange-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
              Pending Fees
            </span>
            <span className={`text-xs ${isDark ? 'text-orange-300' : 'text-orange-500'} bg-orange-600/20 px-2 py-1 rounded`}>
              {pendingTransportFees} students
            </span>
          </div>
          <div className={`text-3xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
            ₹{(pendingTransportFees * 500).toLocaleString()}
          </div>
          <div className={`text-sm ${subtext}`}>
            Estimated monthly collection
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className={`p-3 rounded-lg ${isDark ? 'bg-green-600/20 border border-green-600/30' : 'bg-green-100 border border-green-200'}`}
          >
            <div className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              85%
            </div>
            <div className={`text-xs ${subtext}`}>
              Collection Rate
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            className={`p-3 rounded-lg ${isDark ? 'bg-blue-600/20 border border-blue-600/30' : 'bg-blue-100 border border-blue-200'}`}
          >
            <div className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              12
            </div>
            <div className={`text-xs ${subtext}`}>
              Overdue
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          <button className={`w-full ${btnPrimary} text-sm`}>
            View Fee Details
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
