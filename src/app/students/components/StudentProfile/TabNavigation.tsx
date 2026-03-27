import React from 'react';
import { motion } from 'framer-motion';
import { useProfileTabs } from './hooks';
import {
  LayoutGrid,
  GraduationCap,
  DollarSign,
  Scale,
  CalendarCheck,
  BarChart3,
  HeartPulse,
  MessageSquare,
  Users
} from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
}

// Icon mapping for dynamic rendering
const iconComponents: { [key: string]: React.ComponentType<{ className?: string }> } = {
  LayoutGrid,
  GraduationCap,
  DollarSign,
  Scale,
  CalendarCheck,
  BarChart3,
  HeartPulse,
  MessageSquare,
  Users
};

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab, theme }) => {
  const profileTabs = useProfileTabs();

  return (
    <div className={`flex gap-1 p-2 border-b overflow-x-auto ${
      theme === 'dark' ? 'border-gray-700 bg-gray-900/40' : 'border-gray-100'
    }`}>
      {profileTabs.map((tab, index) => {
        const IconComponent = iconComponents[tab.icon];
        return (
          <motion.button
            key={tab.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {IconComponent && <IconComponent className="w-4 h-4" />}
            <span>{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
