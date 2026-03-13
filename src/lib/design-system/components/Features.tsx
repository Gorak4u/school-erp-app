// Production-Grade Features Section Component
// Based on the School Management ERP UI Design Documents

'use client';

import React, { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Card, CardContent, Badge } from '../index';

interface Feature {
  id: number;
  icon: string;
  title: string;
  description: string;
  benefits: string[];
  stats: { label: string; value: string }[];
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'indigo';
}

const Features: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const { scrollY } = useScroll();
  const opacityRange = useTransform(scrollY, [300, 600], [0, 1]);

  const features: Feature[] = [
    {
      id: 1,
      icon: '🤖',
      title: 'AI-Powered Analytics',
      description: 'Advanced machine learning algorithms provide predictive insights, automated grading, and personalized learning paths for every student.',
      benefits: ['Predictive Analytics', 'Automated Grading', 'Personalized Learning', 'Performance Tracking'],
      stats: [
        { label: 'Accuracy', value: '98.5%' },
        { label: 'Time Saved', value: '75%' },
        { label: 'Board Results', value: '+45%' }
      ],
      color: 'blue'
    },
    {
      id: 2,
      icon: '🎯',
      title: 'Smart Assessment System',
      description: 'Comprehensive assessment tools with adaptive testing, real-time feedback, and detailed performance analytics.',
      benefits: ['Adaptive Testing', 'Real-time Feedback', 'Performance Analytics', 'Skill Mapping'],
      stats: [
        { label: 'Test Types', value: '50+' },
        { label: 'Feedback Speed', value: 'Instant' },
        { label: 'JEE/NEET Ready', value: '99.2%' }
      ],
      color: 'green'
    },
    {
      id: 3,
      icon: '📱',
      title: 'Mobile-First Platform',
      description: 'Native mobile apps for iOS and Android with offline capabilities, push notifications, and seamless sync.',
      benefits: ['Offline Mode', 'Push Notifications', 'Real-time Sync', 'Cross-Platform'],
      stats: [
        { label: 'Downloads', value: '500K+' },
        { label: 'Rating', value: '4.9★' },
        { label: 'Uptime', value: '99.9%' }
      ],
      color: 'purple'
    },
    {
      id: 4,
      icon: '🔒',
      title: 'Enterprise Security',
      description: 'Bank-level encryption, GDPR compliance, and comprehensive audit trails ensure complete data protection.',
      benefits: ['End-to-End Encryption', 'GDPR Compliant', 'Audit Trails', 'Role-Based Access'],
      stats: [
        { label: 'Security Level', value: 'Bank-Grade' },
        { label: 'Compliance', value: '100%' },
        { label: 'Breaches', value: '0' }
      ],
      color: 'orange'
    },
    {
      id: 5,
      icon: '👥',
      title: 'Collaborative Learning',
      description: 'Virtual classrooms, group projects, and peer-to-peer learning tools that enhance engagement.',
      benefits: ['Virtual Classrooms', 'Group Projects', 'Peer Learning', 'Discussion Forums'],
      stats: [
        { label: 'Active Users', value: '2M+' },
        { label: 'Engagement', value: '85%' },
        { label: 'Collaboration', value: '+60%' }
      ],
      color: 'pink'
    },
    {
      id: 6,
      icon: '📊',
      title: 'Real-Time Reporting',
      description: 'Comprehensive dashboards with customizable reports, automated insights, and executive summaries.',
      benefits: ['Custom Dashboards', 'Automated Insights', 'Executive Reports', 'Data Export'],
      stats: [
        { label: 'Report Types', value: '100+' },
        { label: 'Update Speed', value: 'Real-time' },
        { label: 'Coverage', value: '100%' }
      ],
      color: 'indigo'
    }
  ];

  const colorGradients = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
    pink: 'from-pink-500 to-rose-500',
    indigo: 'from-indigo-500 to-purple-500'
  };

  const colorBadges = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    pink: 'bg-pink-100 text-pink-700 border-pink-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200'
  };

  return (
    <motion.section
      className="py-20 bg-gradient-to-b from-gray-50 to-white"
      style={{ opacity: opacityRange }}
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Badge variant="primary" size="lg" className="mb-6">
            🚀 Cutting-Edge Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}Transform Education
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge technology with educational expertise 
            to deliver unparalleled learning experiences.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              onMouseEnter={() => setActiveFeature(feature.id)}
              onMouseLeave={() => setActiveFeature(null)}
            >
              <Card 
                variant="elevated" 
                className="group h-full cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <CardContent className="p-8">
                  {/* Icon and Title */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${colorGradients[feature.color]} rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <Badge variant="primary" className="text-xs">
                      NEW
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Benefits */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Benefits</h4>
                    <div className="space-y-2">
                      {feature.benefits.slice(0, 3).map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm text-gray-600">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-4">
                      {feature.stats.map((stat, idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                          <div className="text-xs text-gray-500">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <AnimatePresence>
                    {activeFeature === feature.id && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-600/90 rounded-2xl p-8 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-white text-center">
                          <div className="text-4xl mb-4">{feature.icon}</div>
                          <h4 className="text-2xl font-bold mb-2">{feature.title}</h4>
                          <p className="text-white/90 mb-4">{feature.description}</p>
                          <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                            Learn More
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Transform Your School?
            </h3>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of educational institutions already using our platform 
              to deliver exceptional learning experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Start Free Trial
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Schedule Demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Features;
