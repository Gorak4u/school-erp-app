'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

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

export default function BillingPage() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<PlanFromDB[]>([]);

  // Use fixed dark theme colors to match subscription page
  const card = 'bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl';
  const heading = 'text-xl font-bold text-white';
  const subtext = 'text-sm text-gray-400';
  const btnPrimary = 'w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch subscription data from database API
        const subscriptionResponse = await fetch('/api/subscription?cache=true');
        const subscriptionData = await subscriptionResponse.json();
        
        if (subscriptionData.subscription) {
          console.log('Subscription data from API:', subscriptionData.subscription);
          console.log('Original plan:', subscriptionData.subscription.plan);
          setSubscription({
            plan: subscriptionData.subscription.plan || 'basic',
            status: subscriptionData.subscription.status || 'pending_payment',
            maxStudents: subscriptionData.subscription.maxStudents || 100,
            maxTeachers: subscriptionData.subscription.maxTeachers || 10,
            trialEndsAt: subscriptionData.subscription.trialEndsAt,
          });
        } else {
          console.log('No subscription data from API, using session fallback');
          console.log('Session plan:', (session as any)?.subscriptionPlan);
          // Fallback to session data
          setSubscription({
            plan: (session as any)?.subscriptionPlan || 'basic',
            status: (session as any)?.subscriptionStatus || 'pending_payment',
            maxStudents: 100,
            maxTeachers: 10,
            trialEndsAt: (session as any)?.trialEndsAt,
          });
        }

        // Fetch plans from database
        const plansResponse = await fetch('/api/admin/plans?cache=true');
        const plansData = await plansResponse.json();
        setPlans((plansData.plans || []).filter((p: PlanFromDB) => p.isActive));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleUpgrade = async (planName: string) => {
    try {
      console.log('Starting payment process for plan:', planName);
      
      // Find plan in database
      const plan = plans.find(p => p.name === planName);
      if (!plan) {
        console.error('Plan not found:', planName);
        alert('Plan not found. Please try again.');
        return;
      }

      // Get pricing from database
      const amount = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly;
      console.log('Payment amount:', amount, 'Billing cycle:', billing);

      // Create payment order
      const response = await fetch('/api/create-payment-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: plan.name,
          amount,
          currency: 'INR',
          billingCycle: billing,
        }),
      });

      const data = await response.json();
      console.log('Payment order response:', data);

      if (!data.success) {
        console.error('Payment order failed:', data.error);
        alert(`Payment order failed: ${data.error || 'Unknown error'}`);
        return;
      }

      // Check if Razorpay is available
      if (typeof (window as any).Razorpay === 'undefined') {
        console.error('Razorpay not loaded');
        alert('Payment gateway is not available. Please refresh the page and try again.');
        return;
      }

      // Initialize Razorpay
      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'School ERP',
        description: `Subscription Plan: ${plan.name.toUpperCase()} (${billing === 'monthly' ? 'Monthly' : 'Yearly'})`,
        order_id: data.order.id,
        handler: async function (response: any) {
          console.log('Payment response:', response);
          
          // Verify payment
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              schoolId: (session as any)?.schoolId,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              billingCycle: billing,
            }),
          });

          const verifyData = await verifyResponse.json();
          console.log('Payment verification response:', verifyData);

          if (verifyData.success) {
            // Payment successful, redirect to dashboard
            alert('Payment successful! Redirecting to dashboard...');
            window.location.href = '/dashboard';
          } else {
            console.error('Payment verification failed:', verifyData.error);
            alert(`Payment verification failed: ${verifyData.error || 'Unknown error'}. Please contact support.`);
          }
        },
        prefill: {
          name: `${session?.user?.name || ''}`,
          email: session?.user?.email || '',
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
          }
        }
      };

      console.log('Initializing Razorpay with options:', options);
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const isPendingPayment = subscription?.status === 'pending_payment';
  const isTrial = subscription?.status === 'trial';
  const isExpired = subscription?.status === 'expired';
  const isActive = subscription?.status === 'active';

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-3">Billing & Subscription</h1>
          <p className="text-gray-400">
            Manage your subscription plan and payment methods
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

        {/* Current Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={card}
        >
          <div className="p-6">
            <h2 className={heading}>Current Plan</h2>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {plans.find(p => p.name === subscription?.plan)?.displayName || subscription?.plan}
                  </span>
                  {isPendingPayment && (
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                      Pending Payment
                    </span>
                  )}
                  {isTrial && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      Trial
                    </span>
                  )}
                  {isActive && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      Active
                    </span>
                  )}
                  {isExpired && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      Expired
                    </span>
                  )}
                </div>
                <p className={`mt-2 ${subtext}`}>
                  {plans.find(p => p.name === subscription?.plan)?.maxStudents || subscription?.maxStudents} students • {plans.find(p => p.name === subscription?.plan)?.maxTeachers || subscription?.maxTeachers} teachers
                </p>
                {isTrial && subscription?.trialEndsAt && (
                  <p className={`mt-1 ${subtext}`}>
                    Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
                  </p>
                )}
                {isExpired && (
                  <p className={`mt-1 text-red-500 text-sm`}>
                    Trial expired on {subscription?.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString() : 'Unknown date'}
                  </p>
                )}
              </div>
              {(isPendingPayment || isExpired) && (
                <div className="text-right">
                  <p className="text-red-500 font-medium mb-2">
                    {isPendingPayment ? 'Payment Required' : 'Trial Expired'}
                  </p>
                  <button 
                    onClick={() => handleUpgrade(subscription?.plan)}
                    className={btnPrimary}
                  >
                    {isPendingPayment ? 'Complete Payment' : 'Upgrade Now'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Payment Required Alert */}
        {isPendingPayment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="p-4 rounded-lg border bg-yellow-900/20 border-yellow-800 text-yellow-300"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Payment Required</h3>
                <p className="text-sm mt-1">
                  Your subscription payment is pending. Complete the payment to activate your account and unlock all features.
                </p>
                <div className="mt-3">
                  <button 
                    onClick={() => handleUpgrade(subscription?.plan)}
                    className={btnPrimary}
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Trial Expired Alert */}
        {isExpired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="p-4 rounded-lg border bg-red-900/20 border-red-800 text-red-300"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Trial Period Expired</h3>
                <p className="text-sm mt-1">
                  Your free trial has ended. Upgrade to a paid plan to continue using all features. Your data is safely preserved.
                </p>
                <div className="mt-3">
                  <button 
                    onClick={() => handleUpgrade(subscription?.plan)}
                    className={btnPrimary}
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Available Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className={card}
        >
          <div className="p-6">
            <h2 className={heading}>Available Plans</h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const price = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly;
                const period = billing === 'monthly' ? 'mo' : 'yr';
                let featuresList: string[] = [];
                try { featuresList = JSON.parse(plan.features || '[]'); } catch { featuresList = []; }
                
                return (
                <div 
                  key={plan.id}
                  className={`p-4 rounded-lg border border-gray-700 ${
                    subscription?.plan === plan.name ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h3 className="font-bold">{plan.displayName}</h3>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">₹{price.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">/{period}</span>
                    {billing === 'yearly' && (
                      <p className="text-green-400 text-xs mt-1">Save 20% annually</p>
                    )}
                  </div>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li>• {plan.maxStudents} students</li>
                    <li>• {plan.maxTeachers} teachers</li>
                    {featuresList.slice(0, 3).map((feature, idx) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => handleUpgrade(plan.name)}
                    className={`mt-4 w-full py-2 rounded-lg font-medium transition-all ${
                      subscription?.plan === plan.name
                        ? 'bg-gray-800 text-gray-400'
                        : btnPrimary
                    }`}
                    disabled={subscription?.plan === plan.name}
                  >
                    {subscription?.plan === plan.name ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Billing History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={card}
        >
          <div className="p-6">
            <h2 className={heading}>Billing History</h2>
            <div className="mt-4">
              <p className={subtext}>No billing history available.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
