// Production-Grade Pricing Section Component
// Based on the School Management ERP UI Design Documents

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, Badge, ButtonAdvanced } from '../index';

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
  icon: string;
  color: 'blue' | 'green' | 'purple';
  cta: string;
  limitations?: string[];
}

const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);

  const plans: PricingPlan[] = [
    {
      id: 1,
      name: "Starter",
      description: "Perfect for small schools and coaching centers",
      price: billingCycle === 'monthly' ? "₹4,999" : "₹3,999",
      period: "/month",
      icon: "🌱",
      color: 'blue',
      cta: "Start Free Trial",
      features: [
        "Up to 100 students",
        "Basic analytics",
        "Email support",
        "Mobile app access",
        "5GB storage",
        "Standard reports",
        "Parent portal",
        "CBSE/ICSE compliance"
      ],
      limitations: [
        "Limited to 5 teachers",
        "Basic features only",
        "No API access"
      ]
    },
    {
      id: 2,
      name: "Professional",
      description: "Ideal for growing schools and institutions",
      price: billingCycle === 'monthly' ? "₹12,999" : "₹10,399",
      period: "/month",
      icon: "🚀",
      color: 'green',
      highlighted: true,
      cta: "Most Popular Choice",
      features: [
        "Up to 500 students",
        "Advanced analytics",
        "Priority support",
        "Mobile app access",
        "50GB storage",
        "Custom reports",
        "Parent portal",
        "Teacher collaboration tools",
        "Automated workflows",
        "Integration with LMS",
        "JEE/NEET preparation modules",
        "Board exam analytics"
      ],
      limitations: [
        "Limited to 20 teachers",
        "No dedicated account manager"
      ]
    },
    {
      id: 3,
      name: "Enterprise",
      description: "Complete solution for large institutions",
      price: billingCycle === 'monthly' ? "₹39,999" : "₹31,999",
      period: "/month",
      icon: "🏢",
      color: 'purple',
      cta: "Contact Sales",
      features: [
        "Unlimited students",
        "AI-powered analytics",
        "24/7 phone support",
        "Mobile app access",
        "Unlimited storage",
        "Custom reports",
        "Parent portal",
        "Teacher collaboration tools",
        "Automated workflows",
        "LMS integration",
        "API access",
        "Custom branding",
        "Dedicated account manager",
        "On-site training",
        "SLA guarantee",
        "Multiple board support",
        "Regional language support"
      ]
    }
  ];

  const colorGradients = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500'
  };

  const colorBorders = {
    blue: 'border-blue-200',
    green: 'border-green-200',
    purple: 'border-purple-200'
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
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
            💰 Transparent Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choose Your Perfect
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}Growth Plan
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Flexible pricing designed to scale with your institution's needs. 
            No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg ${billingCycle === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors duration-300"
            >
              <motion.div
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                animate={{ x: billingCycle === 'monthly' ? 4 : 32 }}
                transition={{ duration: 0.3 }}
              />
            </button>
            <span className={`text-lg ${billingCycle === 'annual' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Annual
              <Badge variant="success" size="sm" className="ml-2">
                Save 20%
              </Badge>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              <Card
                variant={plan.highlighted ? "elevated" : "default"}
                className={`relative h-full transform transition-all duration-300 ${
                  plan.highlighted 
                    ? 'scale-105 shadow-2xl ring-2 ring-green-500 ring-offset-2' 
                    : 'hover:scale-105 hover:shadow-xl'
                }`}
              >
                {/* Popular Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="success" className="bg-green-500 text-white px-4 py-1 text-sm font-semibold">
                      ⭐ MOST POPULAR
                    </Badge>
                  </div>
                )}

                <CardContent className="p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${colorGradients[plan.color]} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    
                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-gray-500">{plan.period}</span>
                      </div>
                      {billingCycle === 'annual' && (
                        <p className="text-sm text-green-600 mt-1">
                          Billed annually (save 20%)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations?.map((limitation, idx) => (
                      <div key={idx} className="flex items-start gap-3 opacity-60">
                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <ButtonAdvanced
                    variant={plan.highlighted ? "primary" : "outline"}
                    size="lg"
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-transparent'
                        : `border-${colorBorders[plan.color]} hover:bg-gray-50`
                    }`}
                  >
                    {plan.cta}
                  </ButtonAdvanced>
                </CardContent>
              </Card>

              {/* Hover Overlay */}
              <AnimatePresence>
                {hoveredPlan === plan.id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-600/95 to-indigo-600/95 rounded-2xl p-8 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="text-white text-center">
                      <div className="text-4xl mb-4">{plan.icon}</div>
                      <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                      <p className="text-white/90 mb-4">{plan.description}</p>
                      <div className="text-3xl font-bold mb-4">
                        {plan.price}
                        <span className="text-lg font-normal text-white/80">{plan.period}</span>
                      </div>
                      <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        Get Started
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Not sure which plan is right for you?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our education specialists are here to help you choose the perfect plan 
              for your institution's unique needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ButtonAdvanced variant="primary" size="lg" className="px-8">
                Schedule a Consultation
              </ButtonAdvanced>
              <ButtonAdvanced variant="outline" size="lg" className="px-8">
                Compare Features
              </ButtonAdvanced>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 mt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No setup fees
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
