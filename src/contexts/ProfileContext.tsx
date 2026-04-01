'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';

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

// Public pages that should not trigger profile fetch
const PUBLIC_PAGES = ['/login', '/register', '/forgot-password', '/reset-password', '/pricing', '/'];

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    // Skip if on public page
    if (PUBLIC_PAGES.some(page => pathname?.startsWith(page))) return;
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
    // Skip if on public page
    if (PUBLIC_PAGES.some(page => pathname?.startsWith(page))) {
      setLoading(false);
      return;
    }
    if (user?.id) {
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [user?.id, pathname]);

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
