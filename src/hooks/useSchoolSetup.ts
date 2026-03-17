import { useState, useEffect } from 'react';

interface SetupStatus {
  isConfigured: boolean;
  configuredSettings: number;
  totalEssential: number;
  hasAcademicYears: boolean;
  academicYearsCount: number;
  redirectToSettings: boolean;
  missingEssential: string[];
  loading: boolean;
  error?: string;
}

export function useSchoolSetup() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    isConfigured: false,
    configuredSettings: 0,
    totalEssential: 0,
    hasAcademicYears: false,
    academicYearsCount: 0,
    redirectToSettings: false,
    missingEssential: [],
    loading: true
  });

  useEffect(() => {
    const checkSetup = async () => {
      try {
        console.log('Checking school setup status...');
        const response = await fetch('/api/school-setup/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Setup check response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Setup check data:', data);
          setSetupStatus({
            ...data,
            loading: false,
            error: undefined
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Setup check failed:', response.status, errorData);
          setSetupStatus(prev => ({ 
            ...prev, 
            loading: false, 
            error: `Failed to check setup: ${response.status} - ${errorData.error || 'Unknown error'}`
          }));
        }
      } catch (error: any) {
        console.error('Error checking setup:', error);
        setSetupStatus(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message || 'Network error occurred'
        }));
      }
    };

    checkSetup();
  }, []);

  return setupStatus;
}
