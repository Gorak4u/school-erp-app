'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';

interface DashboardStats {
  totalStudents: number;
  todayClasses: number;
  pendingAssignments: number;
  upcomingTests: number;
  attendanceRate: number;
  avgStudentPerformance: number;
}

interface RecentActivity {
  id: string;
  type: 'assignment' | 'attendance' | 'note' | 'lesson';
  title: string;
  description: string;
  timestamp: Date;
  class?: string;
}

interface TodaySchedule {
  id: string;
  subject: string;
  class: string;
  time: string;
  room: string;
  duration: string;
}

export default function TeacherDashboard() {
  const { theme } = useTheme();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    todayClasses: 0,
    pendingAssignments: 0,
    upcomingTests: 0,
    attendanceRate: 0,
    avgStudentPerformance: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch teacher dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Mock data for now - replace with actual API calls
        setStats({
          totalStudents: 156,
          todayClasses: 5,
          pendingAssignments: 12,
          upcomingTests: 3,
          attendanceRate: 92.5,
          avgStudentPerformance: 85.2,
        });

        setRecentActivities([
          {
            id: '1',
            type: 'assignment',
            title: 'Math Assignment Graded',
            description: 'Grade 10A - 32 submissions graded',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            class: '10A'
          },
          {
            id: '2',
            type: 'attendance',
            title: 'Attendance Marked',
            description: 'Physics class - 28/30 students present',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            class: '10B'
          },
          {
            id: '3',
            type: 'lesson',
            title: 'Lesson Plan Created',
            description: 'Chemistry Chapter 5 - Acids and Bases',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            class: '9C'
          },
          {
            id: '4',
            type: 'note',
            title: 'Student Note Added',
            description: 'Performance note for John Doe',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
            class: '10A'
          },
        ]);

        setTodaySchedule([
          {
            id: '1',
            subject: 'Mathematics',
            class: '10A',
            time: '08:00 AM',
            room: 'Room 201',
            duration: '45 min'
          },
          {
            id: '2',
            subject: 'Physics',
            class: '10B',
            time: '09:00 AM',
            room: 'Room 205',
            duration: '45 min'
          },
          {
            id: '3',
            subject: 'Chemistry',
            class: '9C',
            time: '10:30 AM',
            room: 'Lab 301',
            duration: '45 min'
          },
          {
            id: '4',
            subject: 'Mathematics',
            class: '10A',
            time: '11:30 AM',
            room: 'Room 201',
            duration: '45 min'
          },
          {
            id: '5',
            subject: 'Physics',
            class: '10B',
            time: '02:00 PM',
            room: 'Room 205',
            duration: '45 min'
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment': return '📚';
      case 'attendance': return '✅';
      case 'lesson': return '📖';
      case 'note': return '📝';
      default: return '📄';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'assignment': return 'blue';
      case 'attendance': return 'green';
      case 'lesson': return 'purple';
      case 'note': return 'orange';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <AppLayout currentPage="teacher-dashboard" title="Teacher Dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="teacher-dashboard" title="Teacher Dashboard">
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome back, {user?.name?.split(' ')[0] || 'Teacher'}! 👋
          </h1>
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Here's what's happening with your classes today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-xl border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">👥</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                theme === 'dark' ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
              }`}>
                Total
              </span>
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {stats.totalStudents}
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Students
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`p-6 rounded-xl border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📅</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                theme === 'dark' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
              }`}>
                Today
              </span>
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {stats.todayClasses}
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Classes
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`p-6 rounded-xl border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📚</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                theme === 'dark' ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-600'
              }`}>
                Pending
              </span>
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {stats.pendingAssignments}
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Assignments
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className={`p-6 rounded-xl border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📝</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                theme === 'dark' ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'
              }`}>
                Upcoming
              </span>
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {stats.upcomingTests}
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Tests
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className={`p-6 rounded-xl border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">✅</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                theme === 'dark' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
              }`}>
                Rate
              </span>
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {stats.attendanceRate}%
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Attendance
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className={`p-6 rounded-xl border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">📈</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                theme === 'dark' ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
              }`}>
                Average
              </span>
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {stats.avgStudentPerformance}%
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Performance
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className={`p-6 rounded-xl border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <h2 className={`text-xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              📅 Today's Schedule
            </h2>
            <div className="space-y-3">
              {todaySchedule.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.subject}
                      </h3>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Class {item.class} • {item.room} • {item.duration}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {item.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className={`p-6 rounded-xl border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <h2 className={`text-xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              📊 Recent Activities
            </h2>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`p-4 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {activity.title}
                      </h3>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {activity.description}
                      </p>
                      <p className={`text-xs mt-1 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {activity.timestamp.toLocaleDateString()} • {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className={`p-6 rounded-xl border ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
        >
          <h2 className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            ⚡ Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className={`p-4 rounded-lg border transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
            }`}>
              <span className="text-2xl mb-2 block">📝</span>
              <span className="text-sm font-medium">Take Attendance</span>
            </button>
            <button className={`p-4 rounded-lg border transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
            }`}>
              <span className="text-2xl mb-2 block">📚</span>
              <span className="text-sm font-medium">Create Assignment</span>
            </button>
            <button className={`p-4 rounded-lg border transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
            }`}>
              <span className="text-2xl mb-2 block">📖</span>
              <span className="text-sm font-medium">Add Lesson</span>
            </button>
            <button className={`p-4 rounded-lg border transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-white' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
            }`}>
              <span className="text-2xl mb-2 block">📊</span>
              <span className="text-sm font-medium">View Reports</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
