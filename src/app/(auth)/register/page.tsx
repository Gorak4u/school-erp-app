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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function planGradient(name: string) {
  if (name === 'trial') return 'from-emerald-500 to-teal-500';
  if (name === 'basic') return 'from-blue-500 to-cyan-500';
  if (name === 'professional') return 'from-purple-500 to-pink-500';
  return 'from-orange-500 to-red-500';
}

function StepDot({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
        done ? 'bg-green-500 text-white' : active ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700'
      }`}>
        {done ? '✓' : num}
      </div>
      <span className={`text-sm font-medium hidden sm:block ${active ? 'text-white' : done ? 'text-green-400' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}

function FieldInput({ label, name, type = 'text', placeholder, value, onChange, required }: {
  label: string; name: string; type?: string; placeholder?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
      <input
        name={name} type={type} placeholder={placeholder} value={value} onChange={onChange} autoComplete="off"
        className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get('plan') || '';
  const billingParam = (searchParams.get('billing') as 'monthly' | 'yearly') || 'monthly';
  const [selectedPlan, setSelectedPlan] = useState(planParam || '');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(billingParam);
  const [plans, setPlans] = useState<PlanFromDB[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const planInfo = plans.find(p => p.name === selectedPlan);
  const isTrial = !!planInfo && planInfo.priceMonthly === 0;
  const isPaid = !!planInfo && planInfo.priceMonthly > 0;

  useEffect(() => {
    fetch('/api/plans?cache=true')
      .then(res => res.json())
      .then(data => {
        const active = (data.plans || []).filter((p: PlanFromDB) => p.isActive);
        setPlans(active);
        setLoadingPlans(false);
      })
      .catch(() => setLoadingPlans(false));
  }, []);

  const [form, setForm] = useState({
    schoolName: '', firstName: '', lastName: '',
    email: '', phone: '', password: '', confirmPassword: '', agreeToTerms: false,
  });
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (planParam && plans.find(p => p.name === planParam)) {
      setSelectedPlan(planParam);
      if (billingParam) setBillingCycle(billingParam);
    }
  }, [planParam, billingParam, plans]);

  const totalSteps = isPaid ? 3 : 2;

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateDetails = (): string | null => {
    if (!form.schoolName.trim()) return 'School name is required';
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.lastName.trim()) return 'Last name is required';
    if (!form.email.trim() || !form.email.includes('@')) return 'Valid email is required';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!form.agreeToTerms) return 'You must agree to the terms';
    return null;
  };

  // ── Register school + user via API, return schoolId on success ──────────────
  const registerAccount = async (): Promise<string | null> => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: form.schoolName,
        email: form.email,
        phone: form.phone,
        adminFirstName: form.firstName,
        adminLastName: form.lastName,
        adminEmail: form.email,
        adminPassword: form.password,
        plan: selectedPlan,
        billingCycle,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === 'ACCOUNT_PENDING_PAYMENT') {
        setError(data.message || 'Account already exists with pending payment.');
        setTimeout(() => router.push(data.redirectUrl || '/subscription-required?pending=true'), 2000);
        return null;
      }
      setError(data.error || 'Registration failed. Please try again.');
      return null;
    }
    return data.school?.id ?? null;
  };

  // ── Trial: register → auto-login → dashboard ────────────────────────────────
  const handleTrialSubmit = async () => {
    const err = validateDetails();
    if (err) { setError(err); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const schoolId = await registerAccount();
      if (!schoolId) return;
      setSuccess('Trial account created! Logging you in...');
      const login = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (!login?.ok) {
        setSuccess('');
        setError('Auto-login failed. Please log in manually.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }
      setSuccess(`Welcome! Redirecting to your dashboard...`);
      setTimeout(() => { window.location.href = '/dashboard'; }, 1200);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Paid: register → Razorpay → verify → re-login → dashboard ───────────────
  const handlePaidSubmit = async () => {
    if (!planInfo) return;
    setIsSubmitting(true);
    setError('');
    try {
      setSuccess('Creating your account...');
      const schoolId = await registerAccount();
      if (!schoolId) { setSuccess(''); return; }

      setSuccess('Initializing payment...');
      const amount = Math.round((billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly) * 1.18);
      const orderRes = await fetch('/api/create-payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planInfo.name, amount, currency: 'INR', billingCycle }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) { setSuccess(''); setError(orderData.error || 'Payment order failed.'); return; }

      if (typeof (window as any).Razorpay === 'undefined') {
        setSuccess(''); setError('Payment gateway unavailable. Please refresh and try again.'); return;
      }

      const rzp = new (window as any).Razorpay({
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'School ERP',
        description: `${planInfo.displayName} – ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
        order_id: orderData.order.id,
        prefill: { name: `${form.firstName} ${form.lastName}`, email: form.email },
        theme: { color: '#7c3aed' },
        modal: { ondismiss: () => { setIsSubmitting(false); setSuccess(''); } },
        handler: async (response: any) => {
          setSuccess('Payment received! Activating your account...');
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              billingCycle, schoolId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            await signIn('credentials', { email: form.email, password: form.password, redirect: false });
            setSuccess('Payment verified! Redirecting to dashboard...');
            setTimeout(() => { window.location.href = '/dashboard'; }, 1200);
          } else {
            setSuccess('');
            setError(verifyData.error || 'Payment verification failed. Contact support.');
            setIsSubmitting(false);
          }
        },
      });
      rzp.open();
    } catch {
      setSuccess('');
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };


  // ── UI ────────────────────────────────────────────────────────────────────────
  const stepLabels = isPaid
    ? ['Choose Plan', 'School Details', 'Payment']
    : ['Choose Plan', 'School Details'];

  const priceDisplay = planInfo
    ? planInfo.priceMonthly === 0
      ? `Free — ${planInfo.trialDays} day trial`
      : `₹${(billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly).toLocaleString()}/${billingCycle === 'yearly' ? 'yr' : 'mo'} + GST`
    : '';

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 py-12">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">ERP</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">School ERP</span>
        </Link>

        <motion.div className="w-full max-w-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {stepLabels.map((label, i) => (
              <React.Fragment key={`si-${i}`}>
                <StepDot num={i + 1} label={label} active={step === i + 1} done={step > i + 1} />
                {i < stepLabels.length - 1 && (
                  <div className={`flex-1 max-w-[48px] h-px transition-colors ${step > i + 1 ? 'bg-green-500' : 'bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Card */}
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Plan banner when selected */}
            {planInfo && step > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-800/40">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${planGradient(planInfo.name)} text-white`}>
                    {planInfo.displayName}
                  </span>
                  <span className="text-sm text-gray-300">{priceDisplay}</span>
                </div>
                <button onClick={() => { setStep(1); setError(''); }} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Change plan
                </button>
              </div>
            )}

            <div className="p-8">
              <AnimatePresence mode="wait">

                {/* ── STEP 1: Plan Selection ── */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-2xl font-bold mb-1">Choose Your Plan</h2>
                    <p className="text-gray-400 text-sm mb-6">Start free with a trial or go straight to a paid plan.</p>

                    {/* Billing toggle */}
                    <div className="flex items-center gap-3 mb-5">
                      <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
                      <button
                        onClick={() => setBillingCycle((b: 'monthly' | 'yearly') => b === 'monthly' ? 'yearly' : 'monthly')}
                        className={`relative w-11 h-6 rounded-full transition-colors ${billingCycle === 'yearly' ? 'bg-purple-600' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-5' : ''}`} />
                      </button>
                      <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
                        Yearly <span className="text-emerald-400 text-xs ml-1">Save 20%</span>
                      </span>
                    </div>

                    {loadingPlans ? (
                      <div className="text-center py-10 text-gray-500">Loading plans...</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {plans.map(plan => {
                          let features: string[] = [];
                          try { features = JSON.parse(plan.features || '[]'); } catch { features = []; }
                          const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
                          const selected = selectedPlan === plan.name;
                          return (
                            <button
                              key={plan.name}
                              onClick={() => { setSelectedPlan(plan.name); setError(''); }}
                              className={`text-left rounded-xl border-2 p-4 transition-all ${
                                selected ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                              }`}
                            >
                              <div className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${planGradient(plan.name)} text-white mb-2`}>
                                {plan.displayName}
                              </div>
                              <div className="text-2xl font-bold text-white">
                                {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
                                {price > 0 && <span className="text-sm text-gray-400 font-normal">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>}
                                {price === 0 && <span className="text-sm text-gray-400 font-normal"> · {plan.trialDays} days</span>}
                              </div>
                              <ul className="mt-2 space-y-1">
                                {features.slice(0, 3).map((f, fi) => (
                                  <li key={`f-${plan.name}-${fi}`} className="text-xs text-gray-400 flex items-center gap-1.5">
                                    <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                              {selected && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-purple-400 font-medium">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                  Selected
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => { if (!selectedPlan) { setError('Please select a plan to continue'); return; } setError(''); setStep(2); }}
                        disabled={!selectedPlan || loadingPlans}
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white rounded-xl font-semibold transition-all"
                      >
                        Continue →
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: School & Admin Details ── */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-2xl font-bold mb-1">School & Admin Details</h2>
                    <p className="text-gray-400 text-sm mb-6">Tell us about your school and create your admin account.</p>

                    <div className="space-y-4">
                      <FieldInput label="School Name" name="schoolName" placeholder="e.g. Springfield International School" value={form.schoolName} onChange={onChange} required />
                      <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="First Name" name="firstName" placeholder="Admin first name" value={form.firstName} onChange={onChange} required />
                        <FieldInput label="Last Name" name="lastName" placeholder="Admin last name" value={form.lastName} onChange={onChange} required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="Email" name="email" type="email" placeholder="admin@school.com" value={form.email} onChange={onChange} required />
                        <FieldInput label="Phone" name="phone" type="tel" placeholder="+91-XXXXXXXXXX" value={form.phone} onChange={onChange} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldInput label="Password" name="password" type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={onChange} required />
                        <FieldInput label="Confirm Password" name="confirmPassword" type={showPw ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword} onChange={onChange} required />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
                        <input type="checkbox" checked={showPw} onChange={() => setShowPw((p: boolean) => !p)} className="rounded bg-gray-800 border-gray-600 accent-purple-600" />
                        Show passwords
                      </label>
                      <label className="flex items-start gap-2 text-sm text-gray-300 cursor-pointer select-none">
                        <input type="checkbox" name="agreeToTerms" checked={form.agreeToTerms} onChange={onChange}
                          className="mt-0.5 rounded bg-gray-800 border-gray-600 accent-purple-600" />
                        <span>I agree to the <Link href="#" className="text-purple-400 hover:underline">Terms of Service</Link> and <Link href="#" className="text-purple-400 hover:underline">Privacy Policy</Link></span>
                      </label>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button onClick={() => { setStep(1); setError(''); }} className="px-5 py-3 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white rounded-xl font-medium transition-all">
                        ← Back
                      </button>
                      {isTrial && (
                        <button onClick={handleTrialSubmit} disabled={isSubmitting}
                          className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                          {isSubmitting ? (
                            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Creating...</>
                          ) : `Start ${planInfo?.trialDays ?? 14}-Day Free Trial`}
                        </button>
                      )}
                      {isPaid && (
                        <button
                          onClick={() => { const e = validateDetails(); if (e) { setError(e); return; } setError(''); setStep(3); }}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all">
                          Review & Pay →
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 3: Payment (paid plans only) ── */}
                {step === 3 && isPaid && planInfo && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-2xl font-bold mb-1">Complete Payment</h2>
                    <p className="text-gray-400 text-sm mb-6">Review your order and proceed to payment.</p>

                    {/* Order Summary */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 mb-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white">Order Summary</h3>
                        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-700">
                          {(['monthly', 'yearly'] as const).map(c => (
                            <button key={c} onClick={() => setBillingCycle(c)}
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${billingCycle === c ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                              {c === 'monthly' ? 'Monthly' : 'Yearly'}
                              {c === 'yearly' && <span className="text-emerald-400 ml-1 text-[10px]">-20%</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                      {(() => {
                        const base = billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly;
                        const gst = Math.round(base * 0.18);
                        const total = Math.round(base * 1.18);
                        return (
                          <>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="text-gray-400">{planInfo.displayName} ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})</span>
                              <span className="text-white">₹{base.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-3">
                              <span className="text-gray-400">GST (18%)</span>
                              <span className="text-white">₹{gst.toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                              <span className="font-semibold text-white">Total</span>
                              <span className="font-bold text-2xl text-white">₹{total.toLocaleString()}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* What you get */}
                    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 mb-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">What you get</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                        <div className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Up to {planInfo.maxStudents} students</div>
                        <div className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Up to {planInfo.maxTeachers} teachers</div>
                        <div className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Full feature access</div>
                        <div className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Email support</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => { setStep(2); setError(''); }} className="px-5 py-3 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white rounded-xl font-medium transition-all">
                        ← Back
                      </button>
                      <button onClick={handlePaidSubmit} disabled={isSubmitting}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
                        {isSubmitting ? (
                          <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Processing...</>
                        ) : (
                          <>Pay ₹{Math.round((billingCycle === 'yearly' ? planInfo.priceYearly : planInfo.priceMonthly) * 1.18).toLocaleString()} via Razorpay</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Feedback messages */}
              <AnimatePresence>
                {error && (
                  <motion.div key="err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-400 text-sm flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div key="ok" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">Sign in</Link>
            <span className="mx-2 text-gray-700">·</span>
            <Link href="/pricing" className="text-purple-400 hover:text-purple-300 font-medium">View all plans</Link>
          </p>
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
