'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import PromoCodeManagement from '../plans/components/PromoCodeManagement';

export default function PromoCodesPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}>
          🎁 Promo Codes Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create and manage subscription discount codes for your School ERP platform
        </p>
      </div>

      {/* Promo Code Management Component */}
      <PromoCodeManagement theme={theme} />
    </div>
  );
}
