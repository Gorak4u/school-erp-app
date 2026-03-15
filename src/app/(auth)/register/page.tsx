// School ERP SaaS Registration Page
// Flow: Choose Plan (from /pricing) → School Details → Payment (paid) or Create (trial) → Auto-login

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';

interface PlanFromDB {
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxStudents: number;
  maxTeachers: number;
  features: string;
  trialDays: number;
  isActive: boolean;
  sortOrder: number;
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') || '';
  const billingParam = searchParams.get('billing') as 'monthly' | 'yearly' || 'monthly';
  const [selectedPlan, setSelectedPlan] = useState(planParam || '');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(billingParam);
  const [plans, setPlans] = useState<PlanFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const planInfo = plans.find(p => p.name === selectedPlan);
  const isTrial = planInfo?.priceMonthly === 0;
  const isPaid = planInfo && planInfo.priceMonthly > 0;

  // Fetch plans from database
  useEffect(() => {
    fetch('/api/admin/plans?cache=true')
      .then(res => res.json())
      .then(data => {
        const activePlans = (data.plans || []).filter((p: PlanFromDB) => p.isActive);
        setPlans(activePlans);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch plans:', err);
        setLoading(false);
      });
  }, []);

  const [formData, setFormData] = useState({
    schoolName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(selectedPlan ? 2 : 1);
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (planParam && plans.find(p => p.name === planParam)) {
      setSelectedPlan(planParam);
      if (billingParam) setBillingCycle(billingParam);
      setCurrentStep(2);
    }
  }, [planParam, billingParam, plans]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Total steps: 1=Plan, 2=Details, 3=Payment (paid only) or Confirm (trial/free)
  const totalSteps = selectedPlan && plans.find(p => p.name === selectedPlan)?.priceMonthly ? 4 : 3;

  const steps = selectedPlan
    ? selectedPlan === 'trial' || !plans.find(p => p.name === selectedPlan)?.priceMonthly
      ? [
          { id: 1, title: 'Choose Plan' },
          { id: 2, title: 'School Details' },
          { id: 3, title: 'Confirm & Create' },
        ]
      : [
          { id: 1, title: 'Choose Plan' },
          { id: 2, title: 'School Details' },
          { id: 3, title: 'Payment' },
          { id: 4, title: 'Confirm & Create' },
        ]
    : [{ id: 1, title: 'Choose Plan' }];

  const validateStep2 = () => {
    if (!formData.schoolName) return 'School name is required';
    if (!formData.firstName) return 'First name is required';
    if (!formData.lastName) return 'Last name is required';
    if (!formData.email) return 'Email is required';
    if (!formData.password || formData.password.length < 8) return 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (!formData.agreeToTerms) return 'You must agree to the terms';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: formData.schoolName,
          email: formData.email,
          phone: formData.phone,
          adminFirstName: formData.firstName,
          adminLastName: formData.lastName,
          adminEmail: formData.email,
          adminPassword: formData.password,
          plan: selectedPlan,
        }),
      });

      const data = await res.json();
      console.log('Registration response:', data);
      console.log('Response status:', res.status);
      if (!res.ok) {
        if (data.error === 'ACCOUNT_PENDING_PAYMENT') {
          // User has pending payment, redirect to payment screen
          console.log('Detected pending payment, redirecting to:', data.redirectUrl);
          setError(data.message);
          setTimeout(() => {
            router.push(data.redirectUrl || '/subscription-required?pending=true');
          }, 2000);
          return;
        }
        setError(data.error || 'Registration failed.');
        return;
      }

      // Auto-login after registration
      setSuccess('Account created! Logging you in...');
      const loginResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (loginResult?.ok) {
        // Check subscription status after login
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        // Redirect based on subscription status
        if (session?.user?.subscriptionStatus === 'pending_payment') {
          router.push('/subscription-required?pending=true');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login?message=Registration successful! Please log in.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!planInfo) {
      setError('Plan information not available');
      return;
    }

    setIsProcessingPayment(true);
    setError('');

    try {
      // First register the user
      setSuccess('Creating your account...');
      const registerRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: formData.schoolName,
          email: formData.email,
          phone: formData.phone,
          adminFirstName: formData.firstName,
          adminLastName: formData.lastName,
          adminEmail: formData.email,
          adminPassword: formData.password,
          plan: selectedPlan,
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        if (registerData.error === 'ACCOUNT_PENDING_PAYMENT') {
          // User has pending payment, redirect to payment screen
          setError(registerData.message);
          setTimeout(() => {
            router.push(registerData.redirectUrl || '/subscription-required?pending=true');
          }, 2000);
          return;
        }
        setError(`Registration failed: ${registerData.error || 'Unknown error'}`);
        return;
      }

      // Auto-login after registration
      const loginResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (!loginResult?.ok) {
        setError('Login failed after registration. Please try logging in manually.');
        return;
      }

      setSuccess('Account created! Initializing payment...');

      // Now create payment order
      const response = await fetch('/api/create-payment-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planInfo.name,
          amount: Math.round((billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly) * 1.18), // Include GST
          currency: 'INR',
          billingCycle: billingCycle,
        }),
      });

      const data = await response.json();
      console.log('Payment order response:', data);

      if (!data.success) {
        setError(`Payment order failed: ${data.error || 'Unknown error'}`);
        return;
      }

      // Check if Razorpay is available
      if (typeof (window as any).Razorpay === 'undefined') {
        setError('Payment gateway is not available. Please refresh the page and try again.');
        return;
      }

      // Initialize Razorpay
      const options = {
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'School ERP',
        description: `Subscription Plan: ${planInfo.displayName} (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`,
        order_id: data.order.id,
        handler: async function (response: any) {
          console.log('Payment successful:', response);
          
          // Verify payment
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              billingCycle: billingCycle,
            }),
          });

          const verifyData = await verifyResponse.json();
          console.log('Payment verification response:', verifyData);

          if (verifyData.success) {
            // Payment successful, redirect to dashboard
            setSuccess('Payment successful! Redirecting to dashboard...');
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 2000);
          } else {
            setError(`Payment verification failed: ${verifyData.error || 'Unknown error'}. Please contact support.`);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setIsProcessingPayment(false);
          }
        }
      };

      console.log('Initializing Razorpay with options:', options);
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      setError(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedPlan) {
      setError('Please select a plan');
      return;
    }
    if (currentStep === 2) {
      const validationError = validateStep2();
      if (validationError) {
        setError(validationError);
        return;
      }
      // If trial, register immediately
      if (isTrial) {
        handleRegister();
        return;
      }
      // If paid plan, go to payment step
      if (isPaid) {
        setCurrentStep(3);
        return;
      }
    }
    setError('');
    setCurrentStep(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">ERP</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                School ERP
              </span>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">Create Your School Account</h1>
            <p className="text-gray-400">Get started in under 5 minutes</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'bg-gray-800/50 text-gray-500 border border-gray-700'
                }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    currentStep > step.id ? 'bg-green-500 text-white' :
                    currentStep === step.id ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {currentStep > step.id ? '✓' : step.id}
                  </span>
                  {step.title}
                </div>
                {i < steps.length - 1 && <div className="w-8 h-px bg-gray-700" />}
              </React.Fragment>
            ))}
          </div>

          {/* Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-20 blur-lg" />
            <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">

              <AnimatePresence mode="wait">
                {/* Step 1: Choose Plan */}
                {currentStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-xl font-bold mb-4">Choose Your Plan</h2>
                    
                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <span className={billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}>Monthly</span>
                      <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                            billingCycle === 'yearly' ? 'translate-x-7' : ''
                          }`}
                        />
                      </button>
                      <span className={billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}>
                        Yearly <span className="text-green-400 text-sm">(Save 20%)</span>
                      </span>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-8 text-gray-500">Loading plans...</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {plans.map((plan) => {
                          let featuresList: string[] = [];
                          try { featuresList = JSON.parse(plan.features || '[]'); } catch { featuresList = []; }
                          const planColor = plan.name === 'trial' ? 'from-gray-500 to-gray-600' :
                                          plan.name === 'basic' ? 'from-blue-500 to-cyan-500' :
                                          plan.name === 'professional' ? 'from-purple-500 to-pink-500' :
                                          'from-orange-500 to-red-500';
                          const currentPrice = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
                          const period = billingCycle === 'yearly' ? 'year' : 'month';
                          return (
                            <div
                              key={plan.name}
                              onClick={() => { setSelectedPlan(plan.name); setError(''); }}
                              className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                                selectedPlan === plan.name
                                  ? 'border-purple-500 bg-purple-500/10'
                                  : 'border-gray-700 hover:border-gray-600'
                              }`}
                            >
                              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-gradient-to-r ${planColor} text-white`}>
                                {plan.displayName}
                              </div>
                              <div className="text-2xl font-bold text-white mb-1">
                                {currentPrice === 0 ? 'Free' : `₹${currentPrice.toLocaleString()}`}
                                {currentPrice > 0 && <span className="text-sm text-gray-400 font-normal">/{period}</span>}
                                {currentPrice === 0 && <span className="text-sm text-gray-400 font-normal ml-1">{plan.trialDays} days</span>}
                              </div>
                              {billingCycle === 'yearly' && plan.priceYearly > 0 && (
                                <div className="text-xs text-green-400 mb-2">
                                  Save ₹{Math.round((plan.priceMonthly * 12 - plan.priceYearly)).toLocaleString()}/year
                                </div>
                              )}
                              <ul className="mt-3 space-y-1">
                                {featuresList.slice(0, 4).map((f, i) => (
                                  <li key={`${plan.name}-feature-${i}`} className="text-xs text-gray-400 flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-center text-gray-500 text-xs mt-4">
                      Need more? <Link href="/pricing" className="text-purple-400 hover:text-purple-300">View all plans</Link> or{' '}
                      <a href="mailto:sales@schoolerp.com" className="text-purple-400 hover:text-purple-300">contact sales</a> for Enterprise.
                    </p>
                  </motion.div>
                )}

                {/* Step 2: School & Admin Details */}
                {currentStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    {/* Selected Plan Badge */}
                    {planInfo && (
                      <div className="flex items-center justify-between mb-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${
                            planInfo.name === 'trial' ? 'from-gray-500 to-gray-600' :
                            planInfo.name === 'basic' ? 'from-blue-500 to-cyan-500' :
                            planInfo.name === 'professional' ? 'from-purple-500 to-pink-500' :
                            'from-orange-500 to-red-500'
                          } text-white`}>
                            {planInfo.displayName}
                          </div>
                          <span className="text-sm text-gray-400">
                            {planInfo.priceMonthly === 0 ? `Free for ${planInfo.trialDays} days` : 
                             `₹${(billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly).toLocaleString()}/${billingCycle === 'yearly' ? 'year' : 'month'}`}
                          </span>
                        </div>
                        <button onClick={() => setCurrentStep(1)} className="text-xs text-purple-400 hover:text-purple-300">
                          Change
                        </button>
                      </div>
                    )}

                    <h2 className="text-xl font-bold mb-6">School & Admin Details</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">School Name</label>
                        <input name="schoolName" type="text" placeholder="e.g. Springfield International School" value={formData.schoolName} onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                          <input name="firstName" type="text" placeholder="Admin first name" value={formData.firstName} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                          <input name="lastName" type="text" placeholder="Admin last name" value={formData.lastName} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                          <input name="email" type="email" placeholder="admin@school.com" value={formData.email} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                          <input name="phone" type="tel" placeholder="+91-XXXXXXXXXX" value={formData.phone} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                          <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={formData.password} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                          <input name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Confirm password" value={formData.confirmPassword} onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="rounded bg-gray-800 border-gray-600" />
                        Show passwords
                      </label>
                      <label className="flex items-start gap-2 text-sm text-gray-300">
                        <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleInputChange}
                          className="mt-1 rounded bg-gray-800 border-gray-600 text-purple-600 focus:ring-purple-500" />
                        <span>I agree to the <Link href="#" className="text-purple-400 underline">Terms of Service</Link> and <Link href="#" className="text-purple-400 underline">Privacy Policy</Link></span>
                      </label>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment (paid plans only) */}
                {currentStep === 3 && isPaid && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-xl font-bold mb-6">Complete Payment</h2>
                    
                    {/* Order Summary */}
                    {planInfo && (
                      <div className="mb-6 p-5 bg-gray-800/50 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-white">Order Summary</h3>
                          <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1 border border-gray-700">
                            <button
                              onClick={() => setBillingCycle('monthly')}
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                billingCycle === 'monthly' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Monthly
                            </button>
                            <button
                              onClick={() => setBillingCycle('yearly')}
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                billingCycle === 'yearly' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Yearly <span className="text-green-400 ml-1">-20%</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">{planInfo.displayName} Plan ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})</span>
                          <span className="text-white font-medium">₹{(billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">GST (18%)</span>
                          <span className="text-white font-medium">₹{Math.round((billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly) * 0.18).toLocaleString()}</span>
                        </div>
                        <div className="border-t border-gray-700 mt-3 pt-3 flex justify-between">
                          <span className="font-semibold text-white">Total</span>
                          <span className="font-bold text-xl text-white">₹{Math.round((billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly) * 1.18).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Payment Methods */}
                    <div className="space-y-3 mb-6">
                      <h3 className="font-semibold text-white text-sm">Payment Method</h3>
                      {[
                        { id: 'razorpay', name: 'Razorpay (UPI, Cards, Net Banking)', icon: '💳' },
                        { id: 'bank', name: 'Bank Transfer (Manual)', icon: '🏦' },
                      ].map(method => (
                        <div key={method.id} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700 cursor-pointer hover:border-purple-500/50 transition-all">
                          <span className="text-xl">{method.icon}</span>
                          <span className="text-sm text-gray-300">{method.name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-400 text-sm font-medium">Razorpay Integration</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Payment gateway integration will be connected here. For now, clicking "Pay & Create Account" will create your account with an active subscription.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error / Success Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-4 bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-400 text-sm">
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex gap-4 mt-6">
                {currentStep > 1 && (
                  <button onClick={() => { setCurrentStep(prev => prev - 1); setError(''); }}
                    className="flex-1 px-6 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-700 transition-all">
                    Back
                  </button>
                )}
                {currentStep === 1 && (
                  <button onClick={handleNext} disabled={!selectedPlan}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-lg font-medium transition-all">
                    Continue with {selectedPlan ? plans.find(p => p.name === selectedPlan)?.displayName || 'selected plan' : 'selected plan'}
                  </button>
                )}
                {currentStep === 2 && isTrial && (
                  <button onClick={handleNext} disabled={isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium transition-all">
                    {isLoading ? 'Creating your school...' : 'Start Free Trial'}
                  </button>
                )}
                {currentStep === 2 && isPaid && (
                  <button onClick={handleNext} disabled={isLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-lg font-medium transition-all">
                    Proceed to Payment
                  </button>
                )}
                {currentStep === 3 && isPaid && (
                  <button onClick={handlePayment} disabled={isProcessingPayment}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium transition-all">
                    {isProcessingPayment ? 'Initializing Payment...' : `Pay ₹${planInfo ? Math.round((billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly) * 1.18).toLocaleString() : ''} & Create Account`}
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="text-purple-400 hover:text-purple-300">Sign in</Link>
                {' | '}
                <Link href="/pricing" className="text-purple-400 hover:text-purple-300">View all plans</Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
