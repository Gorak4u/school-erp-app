'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface SubscriptionData {
  plan: string;
  status: string;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  trialDaysLeft: number | null;
  maxStudents: number;
  maxTeachers: number;
  studentsUsed: number;
  teachersUsed: number;
}

export default function TrialBanner() {
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/subscription')
      .then(res => res.json())
      .then(data => {
        if (data.subscription) setSub(data.subscription);
      })
      .catch(() => {});
  }, []);

  if (!sub || dismissed) return null;

  // Trial banner
  if (sub.isTrial && !sub.isExpired && sub.trialDaysLeft !== null) {
    const urgent = sub.trialDaysLeft <= 7;
    return (
      <div className={`relative flex items-center justify-between px-4 py-2.5 text-sm ${
        urgent
          ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-red-500/30'
          : 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-blue-500/30'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            urgent ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            TRIAL
          </span>
          <span className={urgent ? 'text-red-300' : 'text-blue-300'}>
            {sub.trialDaysLeft === 0
              ? 'Your trial expires today!'
              : sub.trialDaysLeft === 1
                ? '1 day left in your trial'
                : `${sub.trialDaysLeft} days left in your free trial`}
          </span>
          <span className="text-gray-500 text-xs hidden sm:inline">
            ({sub.studentsUsed}/{sub.maxStudents} students, {sub.teachersUsed}/{sub.maxTeachers} teachers)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pricing"
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              urgent
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}>
            Upgrade Now
          </Link>
          <button onClick={() => setDismissed(true)} className="text-gray-500 hover:text-gray-300 p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Expired trial
  if (sub.isExpired && sub.isTrial) {
    return (
      <div className="flex items-center justify-between px-4 py-2.5 text-sm bg-gradient-to-r from-red-600/30 to-red-800/30 border-b border-red-500/50">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/30 text-red-400">
            EXPIRED
          </span>
          <span className="text-red-300">Your free trial has expired. Upgrade to continue using the platform.</span>
        </div>
        <Link href="/pricing"
          className="px-4 py-1.5 rounded-md text-xs font-medium bg-red-600 hover:bg-red-500 text-white transition-all">
          Choose a Plan
        </Link>
      </div>
    );
  }

  // Active paid plan - show subtle badge (no banner)
  return null;
}
