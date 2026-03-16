'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface Approval {
  id: string;
  type: string;
  title: string;
  description: string;
  reason?: string;
  createdAt: Date;
  link: string;
}

interface NotificationContextType {
  pendingCount: number;
  approvals: Approval[];
  loading: boolean;
  refresh: () => Promise<void>;
  showToast: boolean;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);

  const { status } = useSession();
  
  const refresh = useCallback(async () => {
    // Only fetch if authenticated
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/pending-approvals');
      if (response.ok) {
        const data = await response.json();
        const newCount = data.pendingCount || 0;
        
        // Show toast if count increased (new approvals)
        if (newCount > previousCount && previousCount > 0) {
          setShowToast(true);
        }
        
        setPendingCount(newCount);
        setApprovals(data.approvals || []);
        setPreviousCount(newCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [previousCount]);

  const dismissToast = useCallback(() => {
    setShowToast(false);
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  // Poll every 60 seconds for updates
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{
        pendingCount,
        approvals,
        loading,
        refresh,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
