// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'reminder' | 'confirmation' | 'overdue' | 'update' | 'escalation';
  recipient: string;
  studentName: string;
  class: string;
  subject: string;
  message: string;
  sentDate: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'scheduled';
  channel: 'email' | 'sms' | 'push' | 'whatsapp';
  amount?: number;
}

interface FeeNotificationManagerProps {
  theme: 'dark' | 'light';
  onClose?: () => void;
}

export default function FeeNotificationManager({ theme, onClose }: FeeNotificationManagerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'reminders' | 'confirmations' | 'overdue'>('all');
  const [showCompose, setShowCompose] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const isDark = theme === 'dark';
  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  // Notifications are populated from user actions (compose/schedule); no hardcoded data
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const getTypeStyle = (type: Notification['type']) => {
    const map = {
      reminder: { bg: isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600', label: 'Reminder', icon: '🔔' },
      confirmation: { bg: isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600', label: 'Confirmation', icon: '✅' },
      overdue: { bg: isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600', label: 'Overdue', icon: '⚠️' },
      update: { bg: isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600', label: 'Update', icon: '📢' },
      escalation: { bg: isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600', label: 'Escalation', icon: '🚨' },
    };
    return map[type];
  };

  const getStatusStyle = (status: Notification['status']) => {
    const map = {
      sent: isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600',
      delivered: isDark ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600',
      read: isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600',
      failed: isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600',
      scheduled: isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600',
    };
    return map[status];
  };

  const getChannelIcon = (ch: Notification['channel']) => {
    return { email: '📧', sms: '📱', push: '🔔', whatsapp: '💬' }[ch];
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'reminders') return n.type === 'reminder';
    if (activeTab === 'confirmations') return n.type === 'confirmation';
    if (activeTab === 'overdue') return n.type === 'overdue' || n.type === 'escalation';
    return true;
  });

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length,
    read: notifications.filter(n => n.status === 'read').length,
    failed: notifications.filter(n => n.status === 'failed').length,
    scheduled: notifications.filter(n => n.status === 'scheduled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className={`text-xl font-bold ${textPrimary}`}>Notification Management</h2>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowSchedule(true)} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Schedule Reminders
          </button>
          <button onClick={() => setShowCompose(true)} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
            Compose Notification
          </button>
          {onClose && (
            <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Close
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Total Sent</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Delivered</p>
          <p className="text-2xl font-bold text-green-500">{stats.sent}</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Read</p>
          <p className="text-2xl font-bold text-purple-500">{stats.read}</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Failed</p>
          <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
        </div>
        <div className={`p-4 rounded-lg border ${cardCls}`}>
          <p className={`text-sm ${textSecondary}`}>Scheduled</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.scheduled}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'all', label: 'All Notifications' },
          { id: 'reminders', label: 'Payment Reminders' },
          { id: 'confirmations', label: 'Confirmations' },
          { id: 'overdue', label: 'Overdue Notices' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.map((notif, index) => {
          const typeStyle = getTypeStyle(notif.type);
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border ${cardCls} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${typeStyle.bg}`}>
                  {typeStyle.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-medium ${textPrimary}`}>{notif.subject}</h4>
                      <p className={`text-sm ${textSecondary} mt-1`}>{notif.message}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(notif.status)}`}>{notif.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4">
                      <span className={`text-xs ${textSecondary}`}>{getChannelIcon(notif.channel)} {notif.channel}</span>
                      <span className={`text-xs ${textSecondary}`}>{notif.studentName} ({notif.class})</span>
                      {notif.amount && <span className={`text-xs font-medium ${textPrimary}`}>Rs.{notif.amount.toLocaleString()}</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${textSecondary}`}>{notif.sentDate}</span>
                      <button className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        Resend
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className={`p-6 rounded-xl border ${cardCls}`}>
        <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>🔔</div>
              <div>
                <p className={`font-medium ${textPrimary}`}>Send Due Reminders</p>
                <p className={`text-xs ${textSecondary}`}>Send to all students with pending fees</p>
              </div>
            </div>
          </button>
          <button className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600'}`}>⚠️</div>
              <div>
                <p className={`font-medium ${textPrimary}`}>Overdue Notices</p>
                <p className={`text-xs ${textSecondary}`}>Send to all overdue accounts</p>
              </div>
            </div>
          </button>
          <button className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>📊</div>
              <div>
                <p className={`font-medium ${textPrimary}`}>Fee Statements</p>
                <p className={`text-xs ${textSecondary}`}>Send monthly statements to all parents</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCompose(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className={`w-full max-w-lg p-6 rounded-xl border ${cardCls}`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Compose Notification</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Recipients</label>
                  <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                    <option>All Parents</option>
                    <option>Students with Pending Fees</option>
                    <option>Students with Overdue Fees</option>
                    <option>Specific Class</option>
                    <option>Individual Student</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Channel</label>
                    <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                      <option>Email</option>
                      <option>SMS</option>
                      <option>WhatsApp</option>
                      <option>Push Notification</option>
                      <option>All Channels</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Type</label>
                    <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                      <option>Payment Reminder</option>
                      <option>Overdue Notice</option>
                      <option>Fee Update</option>
                      <option>General Notice</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Subject</label>
                  <input type="text" placeholder="Enter subject line" className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Message</label>
                  <textarea rows={4} placeholder="Enter notification message..." className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`} />
                </div>
                <div>
                  <label className={`flex items-center space-x-2`}>
                    <input type="checkbox" className="rounded" />
                    <span className={`text-sm ${textSecondary}`}>Schedule for later</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button onClick={() => setShowCompose(false)} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancel</button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Send Notification</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showSchedule && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSchedule(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className={`w-full max-w-md p-6 rounded-xl border ${cardCls}`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Schedule Auto-Reminders</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Reminder Type</label>
                  <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                    <option>Due Date Reminder (3 days before)</option>
                    <option>Due Date Reminder (7 days before)</option>
                    <option>Overdue Reminder (after 1 day)</option>
                    <option>Overdue Reminder (after 7 days)</option>
                    <option>Monthly Statement</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Channel</label>
                  <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                    <option>Email + SMS</option>
                    <option>Email Only</option>
                    <option>SMS Only</option>
                    <option>WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Frequency</label>
                  <select className={`w-full px-3 py-2 rounded-lg border text-sm ${inputCls}`}>
                    <option>One-time</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Before each due date</option>
                  </select>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Auto-reminders will be sent to all applicable parents/guardians based on their fee status.</p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-6">
                <button onClick={() => setShowSchedule(false)} className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Cancel</button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Schedule Reminders</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
