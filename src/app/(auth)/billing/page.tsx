'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/lib/toastUtils';

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
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [errorDialog, setErrorDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  // Scroll to plans section
  const scrollToPlans = () => {
    const plansSection = document.getElementById('plans-section');
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Show error dialog
  const showErrorDialog = (title: string, message: string) => {
    setErrorDialog({ isOpen: true, title, message });
  };

  // Close error dialog
  const closeErrorDialog = () => {
    setErrorDialog({ isOpen: false, title: '', message: '' });
  };

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
        const plansResponse = await fetch('/api/plans?cache=true');
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
        showErrorDialog('Plan Not Found', 'The selected plan could not be found. Please try again.');
        return;
      }

      // Get pricing from database
      const amount = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly;
      console.log('Payment amount:', amount, 'Billing cycle:', billing);
      console.log('Plan details:', { name: plan.name, priceMonthly: plan.priceMonthly, priceYearly: plan.priceYearly });

      // Validate amount before sending
      if (!amount || amount <= 0) {
        console.error('Invalid amount:', amount);
        showErrorDialog('Invalid Plan Amount', 'This plan has no pricing configured. Please select a different plan or contact support for assistance.');
        return;
      }

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
        showErrorDialog('Payment Failed', `Failed to create payment order: ${data.error || 'Unknown error'}. Please try again.`);
        return;
      }

      // Check if Razorpay is available
      if (typeof (window as any).Razorpay === 'undefined') {
        console.error('Razorpay not loaded');
        showErrorDialog('Payment Gateway Unavailable', 'The payment gateway is not available. Please refresh the page and try again.');
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
              schoolId: session?.user?.schoolId,
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
            showToast('success', 'Payment Successful', 'Payment successful! Redirecting to dashboard...');
            window.location.href = '/dashboard';
          } else {
            console.error('Payment verification failed:', verifyData.error);
            showToast('error', 'Payment Failed', `Payment verification failed: ${verifyData.error || 'Unknown error'}. Please contact support.`);
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
      showToast('error', 'Payment Failed', `Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
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

  const isPendingPayment = subscription?.status === 'pending_payment' || subscription?.status === 'past_due';
  const isTrial = subscription?.status === 'trial';
  const isExpired = ['expired', 'suspended', 'cancelled'].includes(subscription?.status);
  const isActive = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';

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
                      {isPastDue ? 'Past Due' : 'Pending Payment'}
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
                    {isPendingPayment ? 'Payment Required' : 'Subscription Inactive'}
                  </p>
                  <button 
                    onClick={() => handleUpgrade(subscription?.plan)}
                    className={btnPrimary}
                  >
                    {isPendingPayment ? 'Complete Payment' : 'Choose a Plan'}
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
                  {isPastDue
                    ? 'Your renewal payment is overdue. Complete the payment to restore active access and avoid suspension.'
                    : 'Your subscription payment is pending. Complete the payment to activate your account and unlock all features.'}
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
                <h3 className="font-medium">Subscription Inactive</h3>
                <p className="text-sm mt-1">
                  Your subscription has expired, been suspended, or been cancelled. Choose a plan to restore access. Your data is safely preserved.
                </p>
                <div className="mt-3">
                  <button 
                    onClick={scrollToPlans}
                    className={btnPrimary}
                  >
                    Choose a Plan to Upgrade
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Available Plans */}
        <motion.div
          id="plans-section"
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
                  key={`plan-${plan.id || plan.name}`}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                    selectedPlan === plan.name 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : subscription?.plan === plan.name 
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  {selectedPlan === plan.name && (
                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                      Selected
                    </div>
                  )}
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
                      <li key={`feature-${plan.id || plan.name}-${idx}`}>• {feature}</li>
                    ))}
                  </ul>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedPlan === plan.name) {
                        handleUpgrade(plan.name);
                      } else {
                        setSelectedPlan(plan.name);
                      }
                    }}
                    className={`mt-4 w-full py-2 rounded-lg font-medium transition-all ${
                      subscription?.plan === plan.name
                        ? 'bg-gray-800 text-gray-400'
                        : selectedPlan === plan.name
                          ? btnPrimary
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    disabled={subscription?.plan === plan.name}
                  >
                    {subscription?.plan === plan.name 
                      ? 'Current Plan' 
                      : selectedPlan === plan.name
                        ? 'Pay Now'
                        : 'Select Plan'
                    }
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Payment Confirmation */}
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={card}
          >
            <div className="p-6">
              <h2 className={heading}>Complete Your Upgrade</h2>
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Selected Plan:</span>
                  <span className="font-semibold text-white">
                    {plans.find(p => p.name === selectedPlan)?.displayName}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Billing Cycle:</span>
                  <span className="text-white capitalize">{billing}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <span className="font-semibold text-white">Total:</span>
                  <span className="text-xl font-bold text-white">
                    ₹{(
                      (billing === 'monthly' 
                        ? plans.find(p => p.name === selectedPlan)?.priceMonthly || 0
                        : plans.find(p => p.name === selectedPlan)?.priceYearly || 0
                      ) * 1.18
                    ).toLocaleString()} (incl. GST)
                  </span>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={() => setSelectedPlan('')}
                  className="px-6 py-3 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleUpgrade(selectedPlan)}
                  className={btnPrimary}
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </motion.div>
        )}

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

      {/* Error Dialog */}
      {errorDialog.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeErrorDialog}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{errorDialog.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{errorDialog.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeErrorDialog}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
