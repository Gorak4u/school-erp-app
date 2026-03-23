'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface StaffSelfAttendanceProps {
  theme: 'dark' | 'light';
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffSelfAttendance({ theme, onClose, onSuccess }: StaffSelfAttendanceProps) {
  const { data: session } = useSession();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('present');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [findingTeacher, setFindingTeacher] = useState(true);

  const isDark = theme === 'dark';
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  // Set current time on mount and fetch teacher record
  useEffect(() => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    setCheckInTime(currentTime);
    
    // Fetch teacher record for current user
    const fetchTeacherRecord = async () => {
      if (!session?.user?.email) return;
      
      try {
        setFindingTeacher(true);
        const response = await fetch(`/api/teachers?pageSize=1000`, {
          credentials: 'include',
        });
        const data = await response.json();
        
        if (response.ok && data.teachers) {
          const matchingTeacher = data.teachers.find(
            (t: any) => t.email?.toLowerCase() === session.user?.email?.toLowerCase()
          );
          if (matchingTeacher) {
            setTeacherId(matchingTeacher.id);
          } else {
            setError('Could not find your staff profile. Please contact administrator.');
          }
        }
      } catch (e) {
        setError('Failed to load staff profile');
      } finally {
        setFindingTeacher(false);
      }
    };
    
    fetchTeacherRecord();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !status) {
      setError('Date and status are required');
      return;
    }
    
    if (!teacherId) {
      setError('Staff profile not loaded. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/staff-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{
            teacherId: teacherId,
            date,
            status,
            remarks,
            checkInAt: checkInTime ? `${date}T${checkInTime}:00` : null,
            checkOutAt: checkOutTime ? `${date}T${checkOutTime}:00` : null,
          }],
          selfSubmit: true,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.failures && data.failures.length > 0) {
          setError(data.failures[0].error);
        } else {
          setError(data.error || 'Failed to submit attendance');
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-md ${card}`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            📝 Submit My Attendance
          </h3>
          <button
            onClick={onClose}
            className={`absolute top-6 right-6 p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            ✖️
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Attendance Submitted Successfully!
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Your attendance has been locked and cannot be modified.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}

              <div>
                <label className={label}>Date</label>
                <input
                  type="date"
                  className={input}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className={label}>Status</label>
                <select
                  className={input}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="present">✅ Present</option>
                  <option value="absent">❌ Absent</option>
                  <option value="late">⏰ Late</option>
                  <option value="half_day">🕐 Half Day</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Check In Time</label>
                  <input
                    type="time"
                    className={input}
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className={label}>Check Out Time</label>
                  <input
                    type="time"
                    className={input}
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={label}>Remarks (Optional)</label>
                <textarea
                  className={`${input} resize-none`}
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any notes about your attendance..."
                />
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔒</span>
                  <span className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                    Important Notice
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                  Once submitted, your attendance will be locked and cannot be modified. Only super admins can edit locked attendance records.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={btnSecondary}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={btnPrimary}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Attendance'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
