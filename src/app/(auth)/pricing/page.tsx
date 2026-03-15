'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const PLAN_COLORS: Record<string, string> = {
  trial: 'from-gray-500 to-gray-600',
  basic: 'from-blue-500 to-cyan-500',
  professional: 'from-purple-500 to-pink-500',
  enterprise: 'from-orange-500 to-red-500',
};

const PLAN_CTA: Record<string, string> = {
  trial: 'Start Free Trial',
  basic: 'Get Started',
  professional: 'Get Started',
};

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
  isActive: boolean;
  trialDays: number;
  sortOrder: number;
}

export default function PricingPage() {
  const router = useRouter();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<PlanFromDB[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/plans?cache=true')
      .then(r => r.json())
      .then(d => setPlans((d.plans || []).filter((p: PlanFromDB) => p.isActive)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPlan = (planName: string) => {
    router.push(`/register?plan=${planName}&billing=${billing}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold mb-4">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start free, scale as you grow. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={billing === 'monthly' ? 'text-white' : 'text-gray-500'}>Monthly</span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billing === 'yearly' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                  billing === 'yearly' ? 'translate-x-7' : ''
                }`}
              />
            </button>
            <span className={billing === 'yearly' ? 'text-white' : 'text-gray-500'}>
              Yearly <span className="text-green-400 text-sm">(Save 20%)</span>
            </span>
          </div>
        </motion.div>

        {/* Plans Grid */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading plans...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const isPopular = plan.name === 'professional';
            const price = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const isTrial = plan.name === 'trial';
            let featuresList: string[] = [];
            try { featuresList = JSON.parse(plan.features || '[]'); } catch { featuresList = []; }
            // Add student/teacher limits as features
            const displayFeatures = [
              plan.maxStudents >= 999999 ? 'Unlimited students' : `Up to ${plan.maxStudents.toLocaleString()} students`,
              plan.maxTeachers >= 999999 ? 'Unlimited teachers' : `Up to ${plan.maxTeachers} teachers`,
              ...featuresList.map((f: string) => f.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
            ];

            return (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl border ${
                isPopular
                  ? 'border-purple-500/50 bg-gray-900/80'
                  : 'border-gray-800 bg-gray-900/50'
              } backdrop-blur-sm p-6 flex flex-col cursor-pointer`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, borderColor: 'rgba(99,102,241,0.5)' }}
              onClick={() => handleSelectPlan(plan.name)}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-semibold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.displayName}</h3>
                <p className="text-sm text-gray-400">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
                  </span>
                  {isTrial && <span className="text-gray-400 text-sm ml-1">{plan.trialDays} days</span>}
                  {!isTrial && price > 0 && <span className="text-gray-400 text-sm">/{billing === 'monthly' ? 'mo' : 'yr'}</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {displayFeatures.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.name)}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  isPopular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                }`}
              >
                {PLAN_CTA[plan.name] || 'Get Started'}
              </button>
            </motion.div>
            );
          })}
        </div>
        )}

        {/* FAQ */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            {[
              { q: 'What happens after my trial ends?', a: 'Your data is preserved for 30 days. You can upgrade to any plan to continue using the service. After 30 days, data may be deleted.' },
              { q: 'Can I change plans later?', a: 'Yes! You can upgrade or downgrade at any time. Changes take effect immediately with prorated billing.' },
              { q: 'Is there a setup fee?', a: 'No setup fees. You only pay the monthly or yearly subscription fee.' },
              { q: 'What payment methods do you accept?', a: 'We accept UPI, debit/credit cards, net banking, and bank transfers via Razorpay.' },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>Already have an account? <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
