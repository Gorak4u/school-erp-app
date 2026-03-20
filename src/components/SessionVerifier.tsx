'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { smartLoginRedirect } from '@/lib/subdomain-redirect';

export default function SessionVerifier() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const lastVerificationRef = useRef<number>(Date.now());
  const pathnameRef = useRef<string>(pathname);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const verifySession = async () => {
      // Only check if we are authenticated, tab is visible, and not on an auth page
      if (status === 'authenticated' && session?.user && isVisibleRef.current && 
          !pathname?.startsWith('/login') && !pathname?.startsWith('/register')) {
        try {
          // Throttle verification to avoid excessive calls
          const now = Date.now();
          if (now - lastVerificationRef.current < 30000) { // 30 seconds throttle
            return;
          }
          lastVerificationRef.current = now;

          const res = await fetch('/api/auth/verify-session', {
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          if (res.ok) {
            const data = await res.json();
            // If user doesn't exist in DB anymore, log them out
            if (!data.valid) {
              console.log('Session invalid (user removed from DB), logging out...');
              smartLoginRedirect('SessionExpired');
            }
          }
        } catch (error) {
          // Don't log errors for timeout or network issues - these are normal
          if (error instanceof Error && error.name !== 'AbortError' && error.name !== 'TimeoutError') {
            console.error('Failed to verify session:', error);
          }
        }
      }
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    // Only verify if pathname actually changed (not just tab switching)
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      // Only verify on pathname change if it's been at least 30 seconds since last verification
      const now = Date.now();
      if (now - lastVerificationRef.current >= 30000) {
        verifySession();
      }
    }
    
    // Set up a less frequent periodic check (every 10 minutes instead of 5)
    const intervalId = setInterval(verifySession, 10 * 60 * 1000);
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, status, pathname]);

  return null;
}
