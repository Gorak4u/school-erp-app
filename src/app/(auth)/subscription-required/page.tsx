'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

function SubscriptionRequiredContent() {
  const searchParams = useSearchParams();
  const isPendingPayment = searchParams.get('pending') === 'true';
  const isTrialExpired = searchParams.get('trial_expired') === 'true';

  const iconGradient = isPendingPayment
    ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
    : isTrialExpired
      ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
      : 'bg-gradient-to-br from-purple-500 to-pink-500';

  const title = isPendingPayment
    ? 'Payment Required'
    : isTrialExpired
      ? 'Your Free Trial Has Ended'
      : 'Subscription Required';

  const description = isPendingPayment
    ? 'Your payment is pending. Please complete the payment to activate your account and start using the platform.'
    : isTrialExpired
      ? 'Your free trial period has expired. Upgrade to a paid plan to continue using all features and keep your data.'
      : 'Your subscription has expired or been cancelled. Please renew or upgrade your plan to continue using the platform.';

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

      <motion.div
        className="relative z-10 max-w-lg w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-10 shadow-2xl">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${iconGradient}`}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isPendingPayment ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : isTrialExpired ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              )}
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-3">{title}</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">{description}</p>

          <div className="space-y-3">
            {isPendingPayment ? (
              <Link href="/billing">
                <motion.button
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white rounded-lg font-medium transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Complete Payment
                </motion.button>
              </Link>
            ) : (
              <Link href="/pricing">
                <motion.button
                  className={`w-full py-3 text-white rounded-lg font-medium transition-all bg-gradient-to-r ${
                    isTrialExpired
                      ? 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                      : 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isTrialExpired ? 'Upgrade to a Paid Plan' : 'Choose a Plan'}
                </motion.button>
              </Link>
            )}

            <Link href="/login">
              <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-all mt-3">
                Back to Login
              </button>
            </Link>
          </div>

          <p className="mt-6 text-gray-500 text-xs">
            Need help? Contact us at{' '}
            <Link href="mailto:support@schoolerp.com" className="text-blue-400 hover:text-blue-300">
              support@schoolerp.com
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function SubscriptionRequiredPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <SubscriptionRequiredContent />
    </Suspense>
  );
}
