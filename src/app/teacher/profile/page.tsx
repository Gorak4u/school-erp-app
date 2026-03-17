'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';

interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  employeeId: string;
  department?: string;
  subject?: string;
  qualification?: string;
  experience?: number;
  joiningDate?: string;
  status: string;
}

export default function TeacherProfile() {
  const { theme } = useTheme();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<TeacherProfile>>({});

  useEffect(() => {
    // Fetch teacher profile data
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Mock data for now - replace with actual API call
        const mockProfile: TeacherProfile = {
          id: 'teacher_1',
          name: user?.name || 'John Doe',
          email: user?.email || 'teacher@school.com',
          phone: '+91 98765 43210',
          employeeId: 'TCH001',
          department: 'Science',
          subject: 'Physics, Chemistry',
          qualification: 'M.Sc. Physics',
          experience: 5,
          joiningDate: '2020-06-15',
          status: 'active'
        };
        
        setProfile(mockProfile);
        setFormData(mockProfile);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      // Mock save - replace with actual API call
      console.log('Saving profile:', formData);
      setProfile({ ...profile!, ...formData } as TeacherProfile);
      setEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
  };

  if (loading) {
    return (
      <AppLayout currentPage="teacher-profile" title="My Profile">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout currentPage="teacher-profile" title="My Profile">
        <div className="flex items-center justify-center min-h-screen">
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            Profile not found
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="teacher-profile" title="My Profile">
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-3xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            My Profile
          </h1>
          <p className={`text-lg ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Manage your personal information and professional details
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
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
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {profile.name}
              </h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {profile.subject}
              </p>
              <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                profile.status === 'active' 
                  ? theme === 'dark' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
                  : theme === 'dark' ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'
              }`}>
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </div>
            </div>
          </motion.div>

          {/* Details Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-6 rounded-xl border lg:col-span-2 ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Professional Information
              </h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Edit Profile
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div>
                <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Personal Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    ) : (
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {profile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email
                    </label>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {profile.email}
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Phone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    ) : (
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {profile.phone || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h4 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Professional Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Employee ID
                    </label>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {profile.employeeId}
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Department
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.department || ''}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    ) : (
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {profile.department || 'Not assigned'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Subjects
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.subject || ''}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    ) : (
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {profile.subject || 'Not assigned'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Qualification
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.qualification || ''}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    ) : (
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {profile.qualification || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Experience (years)
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        value={formData.experience || ''}
                        onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    ) : (
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {profile.experience || 0} years
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Joining Date
                    </label>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={handleCancel}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  Save Changes
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
