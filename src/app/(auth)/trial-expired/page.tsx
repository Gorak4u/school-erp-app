'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function TrialExpiredPage() {
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
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-3">Trial Period Expired</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Your 30-day free trial has ended. Your data is safely preserved for 30 more days.
            Upgrade to a paid plan to continue using all features.
          </p>

          <div className="space-y-3">
            <Link href="/billing">
              <motion.button
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-medium transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Upgrade Now
              </motion.button>
            </Link>

            <Link href="/login">
              <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-all mt-3">
                Back to Login
              </button>
            </Link>
          </div>

          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-left">
            <h3 className="text-yellow-400 font-semibold text-sm mb-1">Your data is safe</h3>
            <p className="text-gray-400 text-xs">
              All your school data, students, and records are preserved. Upgrade within 30 days to restore full access.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
