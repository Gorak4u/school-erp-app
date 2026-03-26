'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LoginFooter() {
  return (
    <motion.div
      className="mt-8 text-center space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.3 }}
    >
      <div className="flex items-center gap-4 justify-center">
        <Link
          href="/register?plan=trial"
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-sm rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          Start Free Trial
        </Link>
        <Link
          href="/pricing"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          View Plans
        </Link>
      </div>
      <div className="text-sm text-gray-500">
        <Link href="/register" className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded">Create new school account</Link>
        {' | '}
        <Link href="/forgot-password" className="text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded">Forgot password?</Link>
      </div>
    </motion.div>
  );
}
