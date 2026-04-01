import { useState, useEffect, useRef } from 'react';

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
  const isFetching = useRef(false);

  useEffect(() => {
    if (isFetching.current) return;
    isFetching.current = true;
    
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/school-setup/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setSetupStatus({
            ...data,
            loading: false,
            error: undefined
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          setSetupStatus(prev => ({ 
            ...prev, 
            loading: false, 
            error: `Failed to check setup: ${response.status} - ${errorData.error || 'Unknown error'}`
          }));
        }
      } catch (error: any) {
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
