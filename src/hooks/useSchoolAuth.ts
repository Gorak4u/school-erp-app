'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { getSchoolTheme, type SchoolTheme } from '@/lib/school-theme';

interface SchoolInfo {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
}

export function useSchoolAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subdomain, setSubdomain] = useState('');
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [schoolError, setSchoolError] = useState('');
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [theme, setTheme] = useState<SchoolTheme | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Resolve subdomain
  useEffect(() => {
    const paramSubdomain = searchParams.get('subdomain');
    const hostnameSubdomain = (() => {
      if (typeof window === 'undefined') return '';
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') return '';
      if (host.endsWith('.localhost')) return host.replace('.localhost', '');
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
      if (host.endsWith(`.${appDomain}`)) return host.replace(`.${appDomain}`, '');
      return '';
    })();

    const resolved = paramSubdomain || hostnameSubdomain;
    if (resolved) {
      setSubdomain(resolved);
    }
  }, [searchParams]);

  // Fetch school info and theme
  useEffect(() => {
    if (!subdomain) return;

    const fetchSchool = async () => {
      setLoadingSchool(true);
      setSchoolError('');
      
      try {
        const response = await fetch(`/api/schools/by-subdomain?subdomain=${subdomain}`);
        if (!response.ok) {
          throw new Error('School not found');
        }
        
        const data = await response.json();
        setSchool(data.school);
        
        // Generate theme
        const schoolTheme = await getSchoolTheme(data.school.name);
        setTheme(schoolTheme);
        
      } catch (error) {
        setSchoolError('School not found. Please check your subdomain.');
        // Fallback theme
        const fallbackTheme = await getSchoolTheme('Default School');
        setTheme(fallbackTheme);
      } finally {
        setLoadingSchool(false);
      }
    };

    fetchSchool();
  }, [subdomain]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        // Check if user is super admin
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        if (session?.user?.isSuperAdmin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // School data
    subdomain,
    school,
    schoolError,
    loadingSchool,
    theme,
    
    // Form data
    email,
    password,
    showPassword,
    isLoading,
    error,
    
    // Actions
    setEmail,
    setPassword,
    setShowPassword,
    handleLogin,
  };
}
