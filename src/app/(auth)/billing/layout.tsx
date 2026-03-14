'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProviderWrapper>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProviderWrapper>
  );
}
