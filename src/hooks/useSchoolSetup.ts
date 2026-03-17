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
        const response = await fetch('/api/school-setup/check');
        if (response.ok) {
          const data = await response.json();
          setSetupStatus({
            ...data,
            loading: false
          });
        } else {
          console.error('Failed to check setup status');
          setSetupStatus(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Error checking setup:', error);
        setSetupStatus(prev => ({ ...prev, loading: false }));
      }
    };

    checkSetup();
  }, []);

  return setupStatus;
}
