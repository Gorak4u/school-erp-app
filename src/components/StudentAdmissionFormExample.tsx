import React from 'react';
import { useAcademicYearCheck } from '@/hooks/useAcademicYearCheck';

export function StudentAdmissionFormExample() {
  const { status, loading, canProceed, errorMessage, checkAcademicYear } = useAcademicYearCheck();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!canProceed) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h2 className="text-lg font-medium text-red-800">Cannot Admit Students</h2>
            </div>
            
            <div className="text-red-700">
              <p className="mb-4">{errorMessage}</p>
              
              <div className="bg-red-100 rounded p-4">
                <h3 className="font-medium text-red-800 mb-2">How to fix:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Navigate to <strong>Settings</strong></li>
                  <li>Click on <strong>School Structure</strong></li>
                  <li>Select <strong>Academic Years</strong></li>
                  <li>Create a new academic year or activate an existing one</li>
                  <li>Ensure the academic year is marked as <strong>Active</strong></li>
                </ol>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={checkAcademicYear}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Success banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">Ready for Student Admission</h3>
              <p className="text-sm text-green-700 mt-1">
                {status?.message}
              </p>
            </div>
          </div>
        </div>

        {/* Student Admission Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Student Admission Form</h2>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Student Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="Enter student name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Class</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                <option value="">Select Class</option>
                <option value="1">Class 1</option>
                <option value="2">Class 2</option>
                <option value="3">Class 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Academic Year</label>
              <input
                type="text"
                value={status?.activeAcademicYear?.year || ''}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 p-2 border"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Automatically set from active academic year</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Admit Student
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
