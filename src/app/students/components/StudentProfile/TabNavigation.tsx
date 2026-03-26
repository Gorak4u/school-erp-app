import React from 'react';
import { motion } from 'framer-motion';
import { useProfileTabs } from './hooks';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab, theme }) => {
  const profileTabs = useProfileTabs();

  return (
    <div className="flex space-x-2 overflow-x-auto">
      {profileTabs.map((tab, index) => (
        <motion.button
          key={tab.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab(tab.id)}
          className={`relative overflow-hidden px-3 py-2 rounded-xl font-medium text-xs transition-all duration-300 ${
            activeTab === tab.id
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transform scale-105'
              : 'backdrop-blur-sm bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 hover:text-white hover:border-white/30'
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </span>
          {/* Hover effect overlay */}
          {activeTab !== tab.id && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"
              initial={{ x: "-100%" }}
              whileHover={{ x: "0%" }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default TabNavigation;
