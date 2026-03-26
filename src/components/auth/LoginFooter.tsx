'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function LoginFooter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1 }}
      className="mt-6 text-center space-y-3"
    >
      <Link
        href="/forgot-password"
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        Forgot your password?
      </Link>
      <div className="text-xs text-gray-500">
        <Link href="/register" className="text-blue-400 hover:text-blue-300">Create account</Link>
        {' | '}
        <Link href="/" className="text-gray-400 hover:text-gray-300">Back to home</Link>
      </div>
    </motion.div>
  );
}
