'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const isFetchingRef = useRef(false);
  
  // Public pages that should not trigger notifications fetch
  const PUBLIC_PAGES = ['/login', '/register', '/forgot-password', '/reset-password', '/pricing'];
  const isPublicPage = PUBLIC_PAGES.some(page => pathname?.startsWith(page));
  
  const refresh = useCallback(async () => {
    // Only fetch if authenticated and not on public page
    if (status !== 'authenticated' || isPublicPage) {
      setLoading(false);
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
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
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, [previousCount, isPublicPage, status]);

  const dismissToast = useCallback(() => {
    setShowToast(false);
  }, []);

  // Initial load only - socket handles real-time updates
  useEffect(() => {
    if (!isPublicPage) {
      refresh();
    }
  }, [refresh, isPublicPage]);

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
