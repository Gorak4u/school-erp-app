import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { AIInsights } from '../types';

interface AIInsightsPanelProps {
  show: boolean;
  insights: AIInsights;
  isProcessing: boolean;
  isDark: boolean;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  show,
  insights,
  isProcessing,
  isDark
}) => {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: show ? 'auto' : 0, opacity: show ? 1 : 0 }}
      exit={{ height: 0, opacity: 0 }}
      className="mt-4 overflow-hidden"
    >
      <div className={`p-3 rounded-xl ${
        isDark ? 'bg-blue-600/20 border-blue-600/30' : 'bg-blue-50 border-blue-200'
      } border`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <span className={`text-sm font-semibold ${
              isDark ? 'text-blue-300' : 'text-blue-700'
            }`}>
              AI Insights
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Confidence: {insights.confidence.toFixed(1)}%
            </div>
            <div className={`w-16 h-2 rounded-full overflow-hidden ${
              isDark ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                style={{ width: `${insights.confidence}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          {insights.suggestions.map((suggestion, index) => (
            <div key={index} className={`text-xs ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              💡 {suggestion}
            </div>
          ))}
          {insights.warnings.map((warning, index) => (
            <div key={index} className={`text-xs ${
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              ⚠️ {warning}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AIInsightsPanel;
