'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
  badge?: string;
}

interface DashboardQuickActionsProps {
  theme: 'dark' | 'light';
}

export default function DashboardQuickActions({ theme }: DashboardQuickActionsProps) {
  const [showAll, setShowAll] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'add-student',
      title: 'Add Student',
      description: 'Register a new student',
      icon: '👤',
      link: '/students?action=add',
      color: 'blue',
      badge: 'Quick'
    },
    {
      id: 'fee-collection',
      title: 'Collect Fee',
      description: 'Process fee payment',
      icon: '💳',
      link: '/fees?action=collect',
      color: 'green',
      badge: 'New'
    },
    {
      id: 'mark-attendance',
      title: 'Mark Attendance',
      description: 'Record class attendance',
      icon: '✅',
      link: '/attendance?action=mark',
      color: 'purple'
    },
    {
      id: 'add-assignment',
      title: 'Create Assignment',
      description: 'Assign homework or tests',
      icon: '📝',
      link: '/assignments?action=create',
      color: 'orange'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Create performance reports',
      icon: '📊',
      link: '/reports?action=generate',
      color: 'cyan'
    },
    {
      id: 'send-notice',
      title: 'Send Notice',
      description: 'Broadcast announcements',
      icon: '📢',
      link: '/notices?action=send',
      color: 'red'
    },
    {
      id: 'schedule-exam',
      title: 'Schedule Exam',
      description: 'Plan upcoming examinations',
      icon: '📅',
      link: '/exams?action=schedule',
      color: 'blue'
    },
    {
      id: 'update-grades',
      title: 'Update Grades',
      description: 'Enter student grades',
      icon: '🎯',
      link: '/grades?action=update',
      color: 'green'
    }
  ];

  const displayedActions = showAll ? quickActions : quickActions.slice(0, 6);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: theme === 'dark' 
        ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
        : 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      green: theme === 'dark' 
        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
        : 'bg-green-100 text-green-600 hover:bg-green-200',
      purple: theme === 'dark' 
        ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30' 
        : 'bg-purple-100 text-purple-600 hover:bg-purple-200',
      orange: theme === 'dark' 
        ? 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30' 
        : 'bg-orange-100 text-orange-600 hover:bg-orange-200',
      red: theme === 'dark' 
        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
        : 'bg-red-100 text-red-600 hover:bg-red-200',
      cyan: theme === 'dark' 
        ? 'bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30' 
        : 'bg-cyan-100 text-cyan-600 hover:bg-cyan-200'
    };
    return colors[color as keyof typeof colors];
  };

  const getBadgeColor = (color: string) => {
    const colors = {
      blue: theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white',
      green: theme === 'dark' ? 'bg-green-500 text-white' : 'bg-green-500 text-white',
      purple: theme === 'dark' ? 'bg-purple-500 text-white' : 'bg-purple-500 text-white',
      orange: theme === 'dark' ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white',
      red: theme === 'dark' ? 'bg-red-500 text-white' : 'bg-red-500 text-white',
      cyan: theme === 'dark' ? 'bg-cyan-500 text-white' : 'bg-cyan-500 text-white'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className={`p-6 rounded-xl border ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </h3>
        {quickActions.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className={`text-sm px-3 py-1 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {showAll ? 'Show Less' : 'Show All'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {displayedActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={action.link}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
                    getColorClasses(action.color)
                  } ${
                    theme === 'light' ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  {action.badge && (
                    <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium ${getBadgeColor(action.color)}`}>
                      {action.badge}
                    </span>
                  )}
                  
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {action.title}
                      </h4>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <div className={`mt-3 flex items-center text-xs font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <span>Proceed</span>
                    <svg 
                      className={`w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Additional Quick Stats */}
      <div className={`mt-6 pt-6 border-t ${
        theme === 'light' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`text-center p-3 rounded-lg ${
            theme === 'light' ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              24
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Pending Approvals
            </div>
          </div>
          <div className={`text-center p-3 rounded-lg ${
            theme === 'light' ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              8
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              New Messages
            </div>
          </div>
          <div className={`text-center p-3 rounded-lg ${
            theme === 'light' ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              3
            </div>
            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Upcoming Events
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
