'use client';

import { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { canManageSettingsAccess } from '@/lib/permissions';
import { LoginFormData, FormErrors, validateLoginForm, getErrorMessage } from '../utils/validation';

export const useLoginForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Clear general error when user makes changes
    if (error) {
      setError('');
    }
  }, [formErrors, error]);

  const validateForm = useCallback((): boolean => {
    const errors = validateLoginForm(formData);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Focus on the first field with an error
      const firstErrorField = Object.keys(errors)[0] as keyof LoginFormData;
      setFocusedField(firstErrorField);
      return false;
    }
    
    return true;
  }, [formData]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(getErrorMessage(result.error));
      } else if (result?.ok) {
        // Small delay to ensure session is properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if user is super admin → redirect to /admin
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        if (session?.user?.isSuperAdmin) {
          router.push('/admin');
        } else {
          const canManageSchoolSetup = canManageSettingsAccess({
            role: session?.user?.role,
            isSuperAdmin: session?.user?.isSuperAdmin,
            permissions: session?.user?.permissions,
          });
          
          // For school admins, check if setup is needed before redirecting
          if (canManageSchoolSetup) {
            try {
              const setupRes = await fetch('/api/school-setup/check');
              if (setupRes.ok) {
                const setupData = await setupRes.json();
                if (setupData.redirectToSettings) {
                  router.push('/settings');
                  return;
                }
              }
            } catch (error) {
              console.error('Failed to check setup status:', error);
              // Continue to dashboard if setup check fails
            }
          }
          
          router.push('/dashboard');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } catch (err) {
      setError(getErrorMessage('Network Error'));
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, router]);

  const resetForm = useCallback(() => {
    setFormData({ email: '', password: '' });
    setError('');
    setFormErrors({});
    setShowPassword(false);
    setFocusedField('');
  }, []);

  return {
    formData,
    formErrors,
    isLoading,
    error,
    showPassword,
    setShowPassword,
    focusedField,
    setFocusedField,
    handleInputChange,
    handleLogin,
    validateForm,
    resetForm,
  };
};
