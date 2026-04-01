'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { showToast } from '@/lib/toastUtils';

interface DeletionPreview {
  student: {
    id: string;
    admissionNo: string;
    name: string;
  };
  totalRecords: number;
  affectedTables: Array<{
    table: string;
    records: number;
  }>;
  warning: string;
}

function StudentDataDeletionWithParams() {
  const { theme } = useTheme();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const searchParams = useSearchParams();
  const isDark = theme === 'dark';

  // Initialize all state hooks first, before any conditional logic
  const [studentId, setStudentId] = useState(searchParams.get('studentId') || '');
  const [admissionNo, setAdmissionNo] = useState(searchParams.get('admissionNo') || '');
  const [searchType, setSearchType] = useState<'id' | 'admission'>('id');
  const [schoolId, setSchoolId] = useState(searchParams.get('schoolId') || '');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [deletionResult, setDeletionResult] = useState<any>(null);
  const [schools, setSchools] = useState<Array<{id: string, name: string, slug: string}>>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);

  // Fetch schools on component mount
  React.useEffect(() => {
    const fetchSchools = async () => {
      setSchoolsLoading(true);
      try {
        const response = await fetch('/api/admin/schools?page=1&limit=100&includeCounts=false');
        const data = await response.json();
        const schoolList = (data.schools || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug
        }));
        setSchools(schoolList);
      } catch (error) {
        console.error('Failed to fetch schools:', error);
        showToast('error', 'Error', 'Failed to load schools');
      } finally {
        setSchoolsLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // Only SaaS super admins can access this page
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-center p-8 rounded-xl ${
          isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
        } border`}>
          <div className="text-red-500 text-4xl mb-4">🚫</div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            Access Denied
          </h2>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Only SaaS Super Administrators can access the Student Data Deletion tool.
          </p>
        </div>
      </div>
    );
  }

  const handlePreview = async () => {
    const studentIdentifier = searchType === 'id' ? studentId : admissionNo;
    if (!studentIdentifier || !schoolId) {
      const identifierLabel = searchType === 'id' ? 'Student ID' : 'Admission Number';
      showToast('error', 'Validation Error', `${identifierLabel} and School are required`);
      return;
    }

    setLoading(true);
    try {
      const studentIdentifier = searchType === 'id' ? studentId : admissionNo;
      const paramName = searchType === 'id' ? 'studentId' : 'admissionNo';
      
      const response = await fetch(
        `/api/admin/student-data-deletion?${paramName}=${encodeURIComponent(studentIdentifier)}&schoolId=${encodeURIComponent(schoolId)}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to preview deletion');
      }

      const data = await response.json();
      setPreview(data);
      setDeletionResult(null);
    } catch (error) {
      showToast('error', 'Preview Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletion = async () => {
    const studentIdentifier = searchType === 'id' ? studentId : admissionNo;
    if (!studentIdentifier || !schoolId) {
      const identifierLabel = searchType === 'id' ? 'Student ID' : 'Admission Number';
      showToast('error', 'Validation Error', `${identifierLabel} and School are required`);
      return;
    }

    if (confirmation !== 'DELETE_STUDENT_DATA_PERMANENTLY') {
      showToast('error', 'Confirmation Required', 'Please type the exact confirmation phrase');
      return;
    }

    if (!preview) {
      showToast('error', 'Preview Required', 'Please preview the deletion first');
      return;
    }

    setLoading(true);
    try {
      const studentIdentifier = searchType === 'id' ? studentId : admissionNo;
      const paramName = searchType === 'id' ? 'studentId' : 'admissionNo';
      
      const response = await fetch('/api/admin/student-data-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [paramName]: studentIdentifier,
          schoolId,
          confirmation
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete student data');
      }

      const result = await response.json();
      setDeletionResult(result);
      setPreview(null);
      setConfirmation('');
      
      showToast('success', 'Deletion Completed', `Successfully deleted ${result.deletionLog.recordsDeleted} records from ${result.deletionLog.tablesAffected.length} tables`);
    } catch (error) {
      showToast('error', 'Deletion Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          🗑️ Student Data Deletion
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Permanently delete all data for a specific student from all tables
        </p>
        <div className={`mt-4 p-4 rounded-lg border ${
          isDark ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <p className="font-semibold mb-2">⚠️ CRITICAL WARNING:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>This action is <strong>PERMANENT</strong> and cannot be undone</li>
            <li>All student data will be completely removed from the database</li>
            <li>This includes academic, financial, attendance, and all other records</li>
            <li>This action should only be performed with explicit school management request</li>
            <li>All deletions are logged for audit purposes</li>
          </ul>
        </div>
      </div>

      {/* Input Form */}
      <div className={`p-6 rounded-xl border mb-6 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Student Information
        </h2>
        
        {/* Search Type Selection */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Search By
          </label>
          <div className="flex gap-4">
            <label className={`flex items-center cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <input
                type="radio"
                name="searchType"
                value="id"
                checked={searchType === 'id'}
                onChange={(e) => {
                  setSearchType('id');
                  setAdmissionNo(''); // Clear admission number when switching
                }}
                className="mr-2"
              />
              Student ID
            </label>
            <label className={`flex items-center cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <input
                type="radio"
                name="searchType"
                value="admission"
                checked={searchType === 'admission'}
                onChange={(e) => {
                  setSearchType('admission');
                  setStudentId(''); // Clear student ID when switching
                }}
                className="mr-2"
              />
              Admission Number
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {searchType === 'id' ? 'Student ID' : 'Admission Number'}
            </label>
            <input
              type="text"
              value={searchType === 'id' ? studentId : admissionNo}
              onChange={(e) => searchType === 'id' ? setStudentId(e.target.value) : setAdmissionNo(e.target.value)}
              placeholder={`Enter ${searchType === 'id' ? 'student ID' : 'admission number'}`}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              School
            </label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              disabled={schoolsLoading}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Select a school...</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.slug})
                </option>
              ))}
            </select>
            {schoolsLoading && (
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading schools...
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={handlePreview}
            disabled={loading || !(searchType === 'id' ? studentId : admissionNo) || !schoolId}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              loading || !(searchType === 'id' ? studentId : admissionNo) || !schoolId
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Loading...' : 'Preview Deletion'}
          </button>
        </div>
      </div>

      {/* Preview Results */}
      {preview && (
        <div className={`p-6 rounded-xl border mb-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            📋 Deletion Preview
          </h2>
          
          <div className={`p-4 rounded-lg mb-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Student: {preview.student.name} ({preview.student.admissionNo})
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Total Records to Delete: <span className="font-bold text-red-500">{preview.totalRecords}</span>
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Affected Tables:
            </h4>
            {preview.affectedTables.map((table, index) => (
              <div key={index} className={`flex justify-between p-2 rounded ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  {table.table}
                </span>
                <span className="font-medium text-red-500">
                  {table.records} records
                </span>
              </div>
            ))}
          </div>

          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              {preview.warning}
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Form */}
      {preview && (
        <div className={`p-6 rounded-xl border mb-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            🔐 Final Confirmation
          </h2>
          
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            To proceed with the permanent deletion, please type the following confirmation phrase exactly:
          </p>
          
          <div className={`p-3 rounded-lg font-mono text-sm mb-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            DELETE_STUDENT_DATA_PERMANENTLY
          </div>
          
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Type confirmation phrase above"
            className={`w-full px-4 py-2 rounded-lg border mb-4 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          
          <button
            onClick={handleDeletion}
            disabled={loading || confirmation !== 'DELETE_STUDENT_DATA_PERMANENTLY'}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loading || confirmation !== 'DELETE_STUDENT_DATA_PERMANENTLY'
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {loading ? 'Deleting...' : '🗑️ Delete All Student Data'}
          </button>
        </div>
      )}

      {/* Deletion Results */}
      {deletionResult && (
        <div className={`p-6 rounded-xl border ${
          isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-green-400' : 'text-green-700'}`}>
            ✅ Deletion Completed
          </h2>
          
          <div className="space-y-2">
            <p><strong>Student:</strong> {deletionResult.deletionLog.name}</p>
            <p><strong>Admission No:</strong> {deletionResult.deletionLog.admissionNo}</p>
            <p><strong>School:</strong> {deletionResult.deletionLog.schoolName}</p>
            <p><strong>Records Deleted:</strong> {deletionResult.deletionLog.recordsDeleted}</p>
            <p><strong>Tables Affected:</strong> {deletionResult.deletionLog.tablesAffected.join(', ')}</p>
            <p><strong>Duration:</strong> {deletionResult.duration}</p>
            <p><strong>Deleted At:</strong> {new Date(deletionResult.deletionLog.deletedAt).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Export with Suspense wrapper
export default function StudentDataDeletionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <StudentDataDeletionWithParams />
    </Suspense>
  );
}
