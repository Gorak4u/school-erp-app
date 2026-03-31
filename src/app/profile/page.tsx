'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from 'next-auth/react';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  MapPin, 
  Phone, 
  Settings, 
  Lock, 
  Eye, 
  EyeOff,
  Camera,
  Edit3,
  Save,
  X,
  Check,
  AlertCircle,
  Key,
  Smartphone,
  Globe,
  Clock,
  Award,
  BookOpen,
  Users,
  Target,
  TrendingUp
} from 'lucide-react';

export default function ProfilePage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { update } = useSession();
  
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      if (profileLoaded) return; // Prevent multiple calls
      
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfileData(data.user);
          setProfileLoaded(true);
        } else {
          console.error('Failed to load profile:', res.status);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user?.id, profileLoaded]);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: profileData?.firstName || (user as any)?.firstName || (user as any)?.name?.split(' ')[0] || '',
    lastName: profileData?.lastName || (user as any)?.lastName || (user as any)?.name?.split(' ').slice(1).join(' ') || '',
    email: profileData?.email || user?.email || ''
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || ''
      });
      setProfileImage(profileData.avatar || '');
    }
  }, [profileData]);

  // Change Password state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPwForm, setShowPwForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Stats and achievements
  const [userStats] = useState({
    loginCount: 156,
    lastLogin: new Date(),
    accountAge: '2 years',
    completedTasks: 89,
    achievements: 12,
    streak: 7
  });

  const isDark = theme === 'dark';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Password changed successfully!' });
        setPwForm({ current: '', newPw: '', confirm: '' });
        setShowPwForm(false);
      } else {
        setPwMsg({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPwLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user); // Update local state with new data
        
        // Update session to reflect changes in header
        await update({
          ...user,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          avatar: data.user.avatar,
        });
        
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setEditMode(false);
      } else {
        const data = await res.json();
        console.error('Failed to update profile:', data.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const [profileImage, setProfileImage] = useState(profileData?.avatar || (user as any)?.avatar || '');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        
        // Update profile with new image
        const profileRes = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileImage: uploadData.url }),
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfileImage(uploadData.url);
          setProfileData(profileData.user);
          
          // Update session to reflect new avatar in header
          await update({
            ...user,
            avatar: uploadData.url,
          });
          
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const firstName = profileData?.firstName || (user as any)?.firstName || (user as any)?.name?.split(' ')[0] || '';
  const lastName = profileData?.lastName || (user as any)?.lastName || (user as any)?.name?.split(' ').slice(1).join(' ') || '';
  const email = profileData?.email || user?.email || '';
  const role = profileData?.role || (user as any)?.role || 'user';
  const initials = (firstName[0] || 'U').toUpperCase();

  if (loading) {
    return (
      <AppLayout currentPage="profile" title="Profile">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      currentPage="profile" 
      title="Profile"
    >
      <div className="space-y-6">
        {/* Advanced Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Cover Image */}
          <div className={`h-32 rounded-2xl overflow-hidden ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900' 
              : 'bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400'
          }`}>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"
              animate={{
                background: [
                  'linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2), rgba(99, 102, 241, 0.2))',
                  'linear-gradient(45deg, rgba(99, 102, 241, 0.2), rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
                  'linear-gradient(45deg, rgba(147, 51, 234, 0.2), rgba(99, 102, 241, 0.2), rgba(59, 130, 246, 0.2))'
                ]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 -mt-16">
              {/* Avatar Section */}
              <div className="flex items-end gap-6">
                <motion.div
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Avatar */}
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-2xl relative overflow-hidden">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-20"
                          animate={{
                            opacity: [0.2, 0.4, 0.2],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <span className="text-white text-4xl font-bold relative z-10">{initials}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Camera Button */}
                  <motion.button
                    className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-white" />
                    )}
                  </motion.button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                </motion.div>

                {/* User Info */}
                <div>
                  <motion.h1
                    className={`text-3xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                    whileHover={{ x: 2 }}
                  >
                    {firstName} {lastName}
                  </motion.h1>
                  <div className="flex items-center gap-3 mt-2">
                    <motion.div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        theme === 'dark' 
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </motion.div>
                    {user?.employeeId && user.role === 'teacher' && (
                      <motion.div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          theme === 'dark' 
                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                            : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="font-mono">ID: {user.employeeId}</span>
                      </motion.div>
                    )}
                  </div>
                  <motion.p
                    className={`mt-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {email}
                  </motion.p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    editMode
                      ? theme === 'dark'
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-green-500 text-white hover:bg-green-600'
                      : theme === 'dark'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                  } shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ zIndex: 10 }}
                >
                  {editMode ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {editMode ? 'Save Changes' : 'Edit Profile'}
                </motion.button>
                <motion.button
                  onClick={() => setShowPwForm(!showPwForm)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ zIndex: 10 }}
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl border-l-4 ${
                theme === 'dark' 
                  ? 'bg-green-900/20 border-green-600 text-green-300' 
                  : 'bg-green-50 border-green-400 text-green-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5" />
                <span className="font-medium">Profile updated successfully!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Content */}
        <div className={`rounded-2xl border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } shadow-lg`}>
          <div className="p-6">
            <h2 className={`text-xl font-semibold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Personal Information
            </h2>
            
            <div className="space-y-6">
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    First Name
                  </label>
                  <motion.input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                    disabled={!editMode}
                    className={`w-full px-4 py-3 rounded-xl transition-all ${
                      editMode
                        ? theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-900'
                        : theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-gray-400'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    whileHover={editMode ? { scale: 1.02 } : {}}
                    whileTap={editMode ? { scale: 0.98 } : {}}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Last Name
                  </label>
                  <motion.input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                    disabled={!editMode}
                    className={`w-full px-4 py-3 rounded-xl transition-all ${
                      editMode
                        ? theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-900'
                        : theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-gray-400'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    whileHover={editMode ? { scale: 1.02 } : {}}
                    whileTap={editMode ? { scale: 0.98 } : {}}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-3.5 w-5 h-5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <motion.input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    disabled={!editMode}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all ${
                      editMode
                        ? theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-900'
                        : theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-gray-400'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    whileHover={editMode ? { scale: 1.02 } : {}}
                    whileTap={editMode ? { scale: 0.98 } : {}}
                  />
                </div>
              </div>
            </div>

            {editMode && (
              <motion.div
                className="flex gap-3 pt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.button
                  onClick={handleProfileSave}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  } shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </motion.button>
                <motion.button
                  onClick={() => setEditMode(false)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Change Password Form */}
        <AnimatePresence>
          {showPwForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-2xl border ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg p-6`}
            >
              <h3 className={`text-lg font-semibold mb-6 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Change Password
              </h3>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-3.5 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <motion.input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={pwForm.current}
                      onChange={(e) => setPwForm({...pwForm, current: e.target.value})}
                      className={`w-full pl-12 pr-12 py-3 rounded-xl transition-all ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-900'
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className={`absolute right-4 top-3.5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    New Password
                  </label>
                  <div className="relative">
                    <Key className={`absolute left-4 top-3.5 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <motion.input
                      type={showNewPassword ? 'text' : 'password'}
                      value={pwForm.newPw}
                      onChange={(e) => setPwForm({...pwForm, newPw: e.target.value})}
                      className={`w-full pl-12 pr-12 py-3 rounded-xl transition-all ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-900'
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-4 top-3.5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Key className={`absolute left-4 top-3.5 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <motion.input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm({...pwForm, confirm: e.target.value})}
                      className={`w-full pl-12 pr-12 py-3 rounded-xl transition-all ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-900'
                      } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-4 top-3.5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {pwMsg && (
                  <motion.div
                    className={`p-4 rounded-xl border-l-4 ${
                      pwMsg.type === 'success'
                        ? theme === 'dark'
                          ? 'bg-green-900/20 border-green-600 text-green-300'
                          : 'bg-green-50 border-green-400 text-green-800'
                        : theme === 'dark'
                          ? 'bg-red-900/20 border-red-600 text-red-300'
                          : 'bg-red-50 border-red-400 text-red-800'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-center gap-3">
                      {pwMsg.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <span>{pwMsg.text}</span>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <motion.button
                    type="submit"
                    disabled={pwLoading}
                    className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      pwLoading
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : theme === 'dark'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                    } shadow-lg`}
                    whileHover={pwLoading ? {} : { scale: 1.05 }}
                    whileTap={pwLoading ? {} : { scale: 0.95 }}
                  >
                    {pwLoading ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    {pwLoading ? 'Changing...' : 'Change Password'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setShowPwForm(false)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } shadow-lg`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
