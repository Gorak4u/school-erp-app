import { useState, useEffect } from 'react';

interface AcademicYearStatus {
  hasActiveAcademicYear: boolean;
  message: string;
  activeAcademicYear: {
    id: string;
    year: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
}

export function useAcademicYearCheck() {
  const [status, setStatus] = useState<AcademicYearStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAcademicYear = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/system/academic-year-check');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check academic year');
      }
      
      setStatus(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setStatus({
        hasActiveAcademicYear: false,
        message: errorMessage,
        activeAcademicYear: null
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAcademicYear();
  }, []);

  return {
    status,
    loading,
    error,
    checkAcademicYear,
    canProceed: status?.hasActiveAcademicYear === true,
    errorMessage: status?.hasActiveAcademicYear === false ? status.message : null
  };
}
