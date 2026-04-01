'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  employeeId?: string;
}

interface ProfileContextType {
  profileData: ProfileData | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.user);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (data: Partial<ProfileData>) => {
    setProfileData(prev => prev ? { ...prev, ...data } : null);
  };

  useEffect(() => {
    if (user?.id) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  return (
    <ProfileContext.Provider value={{
      profileData,
      loading,
      refreshProfile,
      updateProfile
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
