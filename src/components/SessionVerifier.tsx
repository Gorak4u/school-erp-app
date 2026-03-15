'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function SessionVerifier() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const verifySession = async () => {
      // Only check if we are authenticated and not on an auth page
      if (status === 'authenticated' && session?.user && !pathname?.startsWith('/login') && !pathname?.startsWith('/register')) {
        try {
          const res = await fetch('/api/auth/verify-session');
          if (res.ok) {
            const data = await res.json();
            // If user doesn't exist in DB anymore, log them out
            if (!data.valid) {
              console.log('Session invalid (user removed from DB), logging out...');
              await signOut({ callbackUrl: '/login?error=SessionExpired' });
            }
          }
        } catch (error) {
          console.error('Failed to verify session:', error);
        }
      }
    };

    // Check on mount and path change
    verifySession();
    
    // Also set up a periodic check (every 5 minutes)
    const intervalId = setInterval(verifySession, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [session, status, pathname]);

  return null;
}
