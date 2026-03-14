'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

interface SubscriptionData {
  plan: string;
  status: string;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  trialDaysLeft: number | null;
  trialEndsAt: string | null;
  maxStudents: number;
  maxTeachers: number;
  studentsUsed: number;
  teachersUsed: number;
  features: string[];
  currentPeriodEnd: string | null;
  billingCycle?: 'monthly' | 'yearly';
  nextBillingDate?: string;
  amount?: number;
}

interface PlanFromDB {
  id: string;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxStudents: number;
  maxTeachers: number;
  features: string;
  trialDays: number;
  isActive: boolean;
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const { theme } = useTheme();

  // Admin-only access check
  if (!session || session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Only administrators can access subscription management.</p>
        </div>
      </div>
    );
  }
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<PlanFromDB[]>([]);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const isDark = theme === 'dark';
  const card = 'bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl';
  const heading = 'text-2xl font-bold text-white';
  const subtext = 'text-sm text-gray-400';
  const btnPrimary = 'w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all';
  const btnSecondary = 'w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all';

  useEffect(() => {
    fetchSubscriptionData();
    fetchPlans();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription');
      const data = await response.json();
      if (data.subscription) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Failed to fetch subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans');
      const data = await response.json();
      if (data.plans) {
        setPlans(data.plans.filter((p: PlanFromDB) => p.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'trial': return 'text-blue-400 bg-blue-400/20';
      case 'expired': return 'text-red-400 bg-red-400/20';
      case 'cancelled': return 'text-gray-400 bg-gray-400/20';
      case 'pending_payment': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trial': return 'Trial';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      case 'pending_payment': return 'Payment Pending';
      default: return 'Unknown';
    }
  };

  const calculateUsagePercentage = (used: number, max: number) => {
    return Math.min((used / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className={`${card} p-8 max-w-md w-full text-center`}>
          <h1 className={`${heading} mb-4`}>No Subscription Found</h1>
          <p className={`${subtext} mb-6`}>Unable to load your subscription details.</p>
          <Link href="/billing" className={btnPrimary}>
            Go to Billing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className={`${heading} mb-2`}>Subscription Management</h1>
          <p className={`${subtext}`}>Manage your school's subscription, billing, and plan details</p>
        </motion.div>

        {/* Subscription Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`${card} p-6 mb-6`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                subscription.status === 'active' ? 'bg-gradient-to-br from-green-600 to-emerald-600' :
                subscription.status === 'trial' ? 'bg-gradient-to-br from-blue-600 to-cyan-600' :
                subscription.status === 'expired' ? 'bg-gradient-to-br from-red-600 to-orange-600' :
                'bg-gradient-to-br from-gray-600 to-gray-700'
              }`}>
                <span className="text-white text-2xl font-bold">
                  {subscription.status === 'active' ? '✓' :
                   subscription.status === 'trial' ? '🎯' :
                   subscription.status === 'expired' ? '!' :
                   '?'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white capitalize">{subscription.plan} Plan</h2>
                <p className={`${subtext}`}>{getStatusText(subscription.status).toUpperCase()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-6 mb-2">
                <div>
                  <p className={`${subtext} text-sm`}>Students</p>
                  <p className="text-lg font-bold text-white">{subscription.studentsUsed}/{subscription.maxStudents}</p>
                </div>
                <div>
                  <p className={`${subtext} text-sm`}>Teachers</p>
                  <p className="text-lg font-bold text-white">{subscription.teachersUsed}/{subscription.maxTeachers}</p>
                </div>
              </div>
              {subscription.nextBillingDate && (
                <p className={`${subtext} text-sm`}>
                  Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Current Subscription Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`${card} p-8 mb-6`}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Current Subscription Details</h2>
              <p className={`${subtext}`}>View your plan usage, limits, and billing information</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(subscription.status)}`}>
              {getStatusText(subscription.status)}
            </span>
          </div>

          {/* Plan Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Plan Information</h3>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">💎</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className={`${subtext} text-sm mb-1`}>Current Plan</p>
                  <p className="text-xl font-bold text-white capitalize">{subscription.plan}</p>
                </div>
                <div>
                  <p className={`${subtext} text-sm mb-1`}>Status</p>
                  <p className="text-lg font-semibold text-white">{getStatusText(subscription.status)}</p>
                </div>
                {subscription.amount && (
                  <div>
                    <p className={`${subtext} text-sm mb-1`}>Monthly Cost</p>
                    <p className="text-lg font-semibold text-white">₹{subscription.amount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Overview */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Usage Overview</h3>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📊</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`${subtext} text-sm`}>Students</p>
                    <p className="text-sm font-semibold text-white">
                      {subscription.studentsUsed} / {subscription.maxStudents}
                    </p>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${getUsageColor(calculateUsagePercentage(subscription.studentsUsed, subscription.maxStudents))}`}
                      style={{ width: `${calculateUsagePercentage(subscription.studentsUsed, subscription.maxStudents)}%` }}
                    />
                  </div>
                  <p className={`${subtext} text-xs mt-1`}>
                    {calculateUsagePercentage(subscription.studentsUsed, subscription.maxStudents)}% used
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`${subtext} text-sm`}>Teachers</p>
                    <p className="text-sm font-semibold text-white">
                      {subscription.teachersUsed} / {subscription.maxTeachers}
                    </p>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${getUsageColor(calculateUsagePercentage(subscription.teachersUsed, subscription.maxTeachers))}`}
                      style={{ width: `${calculateUsagePercentage(subscription.teachersUsed, subscription.maxTeachers)}%` }}
                    />
                  </div>
                  <p className={`${subtext} text-xs mt-1`}>
                    {calculateUsagePercentage(subscription.teachersUsed, subscription.maxTeachers)}% used
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Billing Information</h3>
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">💳</span>
                </div>
              </div>
              <div className="space-y-3">
                {subscription.nextBillingDate && (
                  <div>
                    <p className={`${subtext} text-sm mb-1`}>Next Billing Date</p>
                    <p className="text-lg font-semibold text-white">
                      {new Date(subscription.nextBillingDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
                {subscription.currentPeriodEnd && (
                  <div>
                    <p className={`${subtext} text-sm mb-1`}>Period Ends</p>
                    <p className="text-lg font-semibold text-white">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
                {subscription.billingCycle && (
                  <div>
                    <p className={`${subtext} text-sm mb-1`}>Billing Cycle</p>
                    <p className="text-lg font-semibold text-white capitalize">{subscription.billingCycle}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Usage Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Student Usage Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`${subtext}`}>Total Students</span>
                  <span className="text-lg font-bold text-white">{subscription.studentsUsed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${subtext}`}>Plan Limit</span>
                  <span className="text-lg font-bold text-white">{subscription.maxStudents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${subtext}`}>Remaining</span>
                  <span className={`text-lg font-bold ${subscription.maxStudents - subscription.studentsUsed <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                    {subscription.maxStudents - subscription.studentsUsed}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`${subtext} text-sm`}>Usage Status</span>
                    <span className={`text-sm font-semibold ${
                      calculateUsagePercentage(subscription.studentsUsed, subscription.maxStudents) >= 90 
                        ? 'text-red-400' 
                        : calculateUsagePercentage(subscription.studentsUsed, subscription.maxStudents) >= 70 
                          ? 'text-yellow-400' 
                          : 'text-green-400'
                    }`}>
                      {calculateUsagePercentage(subscription.studentsUsed, subscription.maxStudents) >= 90 
                        ? 'Near Limit' 
                        : calculateUsagePercentage(subscription.studentsUsed, subscription.maxStudents) >= 70 
                          ? 'Moderate Usage' 
                          : 'Healthy Usage'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Teacher Usage Details</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`${subtext}`}>Total Teachers</span>
                  <span className="text-lg font-bold text-white">{subscription.teachersUsed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${subtext}`}>Plan Limit</span>
                  <span className="text-lg font-bold text-white">{subscription.maxTeachers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${subtext}`}>Remaining</span>
                  <span className={`text-lg font-bold ${subscription.maxTeachers - subscription.teachersUsed <= 3 ? 'text-red-400' : 'text-green-400'}`}>
                    {subscription.maxTeachers - subscription.teachersUsed}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`${subtext} text-sm`}>Usage Status</span>
                    <span className={`text-sm font-semibold ${
                      calculateUsagePercentage(subscription.teachersUsed, subscription.maxTeachers) >= 90 
                        ? 'text-red-400' 
                        : calculateUsagePercentage(subscription.teachersUsed, subscription.maxTeachers) >= 70 
                          ? 'text-yellow-400' 
                          : 'text-green-400'
                    }`}>
                      {calculateUsagePercentage(subscription.teachersUsed, subscription.maxTeachers) >= 90 
                        ? 'Near Limit' 
                        : calculateUsagePercentage(subscription.teachersUsed, subscription.maxTeachers) >= 70 
                          ? 'Moderate Usage' 
                          : 'Healthy Usage'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {subscription.isTrial && subscription.trialDaysLeft !== null && (
            <div className={`mt-6 p-4 rounded-lg ${subscription.trialDaysLeft <= 3 ? 'bg-red-500/20 border border-red-500/30' : 'bg-blue-500/20 border border-blue-500/30'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">
                    Trial Period - {subscription.trialDaysLeft} days left
                  </p>
                  <p className={`${subtext} text-sm`}>
                    Trial ends on {subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {subscription.trialDaysLeft <= 3 && (
                  <Link href="/billing" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all">
                    Upgrade Now
                  </Link>
                )}
              </div>
            </div>
          )}

          {subscription.status === 'expired' && (
            <div className="mt-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 font-semibold">Subscription Expired</p>
                  <p className={`${subtext} text-sm`}>Your subscription has expired. Please renew to continue using the platform.</p>
                </div>
                <Link href="/billing" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all">
                  Renew Now
                </Link>
              </div>
            </div>
          )}

          {subscription.status === 'pending_payment' && (
            <div className="mt-6 p-4 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 font-semibold">Payment Pending</p>
                  <p className={`${subtext} text-sm`}>Complete your payment to activate your subscription.</p>
                </div>
                <Link href="/billing" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-sm font-medium transition-all">
                  Complete Payment
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Available Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className={`${heading} mb-6`}>Upgrade Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className={`${card} p-6 relative ${
                  plan.name === subscription.plan ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                {plan.name === subscription.plan && (
                  <div className="absolute -top-3 -right-3 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                    Current Plan
                  </div>
                )}

                <h3 className="text-xl font-bold text-white mb-2">{plan.displayName}</h3>
                <p className={`${subtext} mb-4`}>{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline mb-2">
                    <span className="text-3xl font-bold text-white">
                      ₹{billing === 'monthly' ? plan.priceMonthly : Math.floor(plan.priceYearly / 12)}
                    </span>
                    <span className={`${subtext} ml-2`}>/month</span>
                  </div>
                  {billing === 'yearly' && (
                    <p className="text-green-400 text-sm">Save 20% with yearly billing</p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className={`${subtext} text-sm`}>Up to {plan.maxStudents} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className={`${subtext} text-sm`}>Up to {plan.maxTeachers} teachers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className={`${subtext} text-sm`}>{plan.trialDays} days trial</span>
                  </div>
                </div>

                {plan.name !== subscription.plan ? (
                  <Link href={`/billing?upgrade=${plan.name}&billing=${billing}`} className={btnPrimary}>
                    {subscription.status === 'trial' ? 'Upgrade' : 'Change Plan'}
                  </Link>
                ) : (
                  <button className={btnSecondary} disabled>
                    Current Plan
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`${card} p-6 mt-6`}
        >
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/billing" className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-center transition-all">
              <div className="text-2xl mb-2">💳</div>
              <p className="text-white font-medium">Billing & Payments</p>
              <p className={`${subtext} text-sm mt-1`}>View invoices and payment history</p>
            </Link>
            <Link href="/settings/school-structure" className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-center transition-all">
              <div className="text-2xl mb-2">🏫</div>
              <p className="text-white font-medium">School Settings</p>
              <p className={`${subtext} text-sm mt-1`}>Manage school information</p>
            </Link>
            <Link href="/settings/users" className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-center transition-all">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-white font-medium">User Management</p>
              <p className={`${subtext} text-sm mt-1`}>Add and manage users</p>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
