'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SubscriptionRequiredPage() {
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
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-3">Subscription Required</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Your subscription has expired or been cancelled. Please renew or upgrade your plan to continue using the platform.
          </p>

          <div className="space-y-3">
            <Link href="/pricing">
              <motion.button
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Choose a Plan
              </motion.button>
            </Link>

            <Link href="/login">
              <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-all mt-3">
                Back to Login
              </button>
            </Link>
          </div>

          <p className="mt-6 text-gray-500 text-xs">
            Need help? Contact us at{' '}
            <a href="mailto:support@schoolerp.com" className="text-blue-400 hover:text-blue-300">
              support@schoolerp.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
