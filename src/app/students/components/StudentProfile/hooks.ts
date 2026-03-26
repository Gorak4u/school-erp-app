import { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, FeeData } from './types';

export const useStudentProfile = (selectedStudent: Student | null, includeArchivedStudents = false) => {
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [loadingFeeData, setLoadingFeeData] = useState(false);

  const fetchStudentFeeData = useCallback(async () => {
    if (!selectedStudent?.id) return;
    
    setLoadingFeeData(true);
    try {
      const params = new URLSearchParams({ includeArchived: includeArchivedStudents ? 'true' : 'false' });
      const response = await fetch(`/api/fees/students?${params}`);
      const data = await response.json();
      if (data.success && data.data?.students) {
        const studentFeeData = data.data.students.find((s: any) => s.studentId === selectedStudent.id);
        setFeeData(studentFeeData);
      }
    } catch (error) {
      console.error('Failed to fetch fee data:', error);
    } finally {
      setLoadingFeeData(false);
    }
  }, [selectedStudent?.id, includeArchivedStudents]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentFeeData();
    }
  }, [selectedStudent, fetchStudentFeeData]);

  const handleRefreshFeeData = useCallback(() => {
    fetchStudentFeeData();
  }, [fetchStudentFeeData]);

  return {
    feeData,
    loadingFeeData,
    handleRefreshFeeData,
  };
};

export const useStudentPermissions = (
  canEditStudents: boolean,
  canPromoteStudents: boolean,
  isAdmin: boolean,
  selectedStudent: Student | null
) => {
  return useMemo(() => {
    if (!selectedStudent) return { canEdit: false, canRunLifecycle: false };

    const normalizedStatus = selectedStudent.status === 'exit' ? 'exited' : selectedStudent.status;
    const canEditStudentRecord = canEditStudents && 
      !(selectedStudent.needsPromotion || normalizedStatus === 'locked') && 
      (normalizedStatus !== 'exited' || isAdmin);
    const canRunLifecycleActions = normalizedStatus === 'active' || normalizedStatus === 'locked';

    return {
      canEdit: canEditStudentRecord,
      canRunLifecycle: canRunLifecycleActions,
    };
  }, [canEditStudents, canPromoteStudents, isAdmin, selectedStudent]);
};

export const useStudentInfoSections = (selectedStudent: Student | null, theme: 'dark' | 'light') => {
  return useMemo(() => {
    if (!selectedStudent) return [];

    const sections = [
      {
        title: 'Basic Information',
        fields: [
          { label: 'Date of Birth', value: selectedStudent.dateOfBirth },
          { label: 'Gender', value: selectedStudent.gender },
          { label: 'Blood Group', value: selectedStudent.bloodGroup },
          { label: 'Phone', value: selectedStudent.phone },
          { label: 'Email', value: selectedStudent.email },
          { label: 'Language Medium', value: selectedStudent.languageMedium },
        ],
      },
      {
        title: 'Parents Information',
        fields: [
          { label: 'Father Name', value: selectedStudent.fatherName },
          { label: 'Father Phone', value: selectedStudent.fatherPhone },
          { label: 'Father Email', value: selectedStudent.fatherEmail },
          { label: 'Mother Name', value: selectedStudent.motherName },
          { label: 'Mother Phone', value: selectedStudent.motherPhone },
          { label: 'Mother Email', value: selectedStudent.motherEmail },
        ],
      },
      {
        title: 'Contact & Address',
        fields: [
          { label: 'Street Address', value: selectedStudent.address },
          { label: 'City', value: selectedStudent.city },
          { label: 'State', value: selectedStudent.state },
          { label: 'Emergency Contact', value: selectedStudent.emergencyContact },
          { label: 'Emergency Relation', value: selectedStudent.emergencyRelation },
          { label: 'Category', value: selectedStudent.category },
        ],
      },
    ];

    return sections.filter(section => 
      section.fields.some(field => field.value && field.value !== 'N/A')
    );
  }, [selectedStudent, theme]);
};

export const useProfileTabs = (): Array<{ id: string; label: string; icon: string }> => {
  return useMemo(() => [
    { id: 'overview', label: '📋 Overview', icon: '📋' },
    { id: 'academics', label: '📈 Academics', icon: '📈' },
    { id: 'fees', label: '💰 Fees', icon: '💰' },
    { id: 'fines', label: '⚖️ Fines', icon: '⚖️' },
    { id: 'attendance', label: '📊 Attendance', icon: '📊' },
    { id: 'analytics', label: '📈 Analytics', icon: '📈' },
    { id: 'medical', label: '🏥 Medical', icon: '🏥' },
    { id: 'communication', label: '💬 Communication', icon: '💬' },
    { id: 'parents', label: '👨‍👩‍👧 Parents', icon: '👨‍👩‍👧' }
  ], []);
};
