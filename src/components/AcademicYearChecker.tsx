import React, { useState, useEffect } from 'react';

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

export function AcademicYearChecker() {
  const [status, setStatus] = useState<AcademicYearStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAcademicYear();
  }, []);

  const checkAcademicYear = async () => {
    try {
      const response = await fetch('/api/system/academic-year-check');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check academic year:', error);
      setStatus({
        hasActiveAcademicYear: false,
        message: 'Unable to verify academic year status',
        activeAcademicYear: null
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span>Checking academic year...</span>
      </div>
    );
  }

  if (!status?.hasActiveAcademicYear) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Academic Year Required</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{status?.message}</p>
              <div className="mt-3">
                <p className="font-medium">To fix this issue:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Go to <span className="font-medium">Settings</span></li>
                  <li>Navigate to <span className="font-medium">School Structure</span></li>
                  <li>Click on <span className="font-medium">Academic Years</span></li>
                  <li>Create or activate an academic year for the current session</li>
                  <li>Set it as <span className="font-medium">Active</span></li>
                </ol>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={checkAcademicYear}
                className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Check Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800">Academic Year Ready</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>{status.message}</p>
            {status.activeAcademicYear && (
              <div className="mt-2 text-xs">
                <span className="font-medium">Session:</span> {status.activeAcademicYear.startDate} to {status.activeAcademicYear.endDate}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
