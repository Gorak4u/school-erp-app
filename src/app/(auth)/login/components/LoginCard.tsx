'use client';

import React from 'react';
import { motion } from 'framer-motion';
import LoginForm from './LoginForm';
import LoginHeader from './LoginHeader';
import LoginFooter from './LoginFooter';
import { FormErrors } from '../utils/validation';

interface LoginCardProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formData: { email: string; password: string };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  error: string;
  formErrors: FormErrors;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  focusedField: string;
  setFocusedField: (field: string) => void;
}

export default function LoginCard({
  onSubmit,
  formData,
  onInputChange,
  isLoading,
  error,
  formErrors,
  showPassword,
  setShowPassword,
  focusedField,
  setFocusedField,
}: LoginCardProps) {
  return (
    <div className="relative">
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl opacity-20 blur-lg" />
      
      <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <LoginHeader />
        
        <LoginForm
          onSubmit={onSubmit}
          formData={formData}
          onInputChange={onInputChange}
          isLoading={isLoading}
          error={error}
          formErrors={formErrors}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />
        
        <LoginFooter />
      </div>
    </div>
  );
}
