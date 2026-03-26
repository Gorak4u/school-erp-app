'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Feature {
  icon: string;
  title: string;
  description: string;
  metric: string;
  label: string;
}

export default function HeroSection() {
  const features: Feature[] = [
    {
      icon: '🤖',
      title: 'AI Analytics',
      description: 'Predictive insights for student success',
      metric: '98.5%',
      label: 'Accuracy'
    },
    {
      icon: '📊',
      title: 'Real-time Reports',
      description: 'Comprehensive performance tracking',
      metric: '24/7',
      label: 'Monitoring'
    },
    {
      icon: '🎯',
      title: 'Board Exam Prep',
      description: 'JEE/NEET preparation tools',
      metric: '+45%',
      label: 'Results'
    },
    {
      icon: '👥',
      title: 'Parent Portal',
      description: 'Seamless communication',
      metric: '10K+',
      label: 'Parents'
    },
  ];

  const stats = [
    { value: '5K+', label: 'Schools Trusted' },
    { value: '1M+', label: 'Active Students' },
    { value: '99.9%', label: 'Uptime SLA' },
  ];

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      {/* Logo */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
          <span className="text-white font-bold text-2xl">ERP</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            School ERP
          </h1>
          <p className="text-gray-400 text-lg">Enterprise Education Management</p>
        </div>
      </motion.div>

      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
          Transform Education with
          <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            AI-Powered Excellence
          </span>
        </h2>
        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
          The world's most advanced school management platform. 
          Leverage cutting-edge AI, real-time analytics, and automated workflows to revolutionize educational outcomes.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="group relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl" aria-hidden="true">{feature.icon}</div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{feature.metric}</div>
                  <div className="text-xs text-gray-400">{feature.label}</div>
                </div>
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Trust Indicators */}
      <motion.div
        className="flex items-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 + index * 0.1 }}
          >
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
