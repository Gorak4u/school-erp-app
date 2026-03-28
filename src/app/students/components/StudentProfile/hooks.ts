import { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, FeeData, RouteDetails } from './types';

export const useStudentProfile = (selectedStudent: Student | null, includeArchivedStudents = false) => {
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [loadingFeeData, setLoadingFeeData] = useState(false);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [loadingRouteDetails, setLoadingRouteDetails] = useState(false);

  const fetchStudentFeeData = useCallback(async () => {
    if (!selectedStudent?.id) return;
    
    setLoadingFeeData(true);
    try {
      const params = new URLSearchParams({ includeArchived: includeArchivedStudents ? 'true' : 'false' });
      const response = await fetch(`/api/fees/students?${params}`);
      const data = await response.json();
      if (data.success && data.data?.students) {
        const studentData = data.data.students.find((s: any) => s.id === selectedStudent.id);
        if (studentData) {
          setFeeData({
            totalFees: studentData.totalFees,
            totalPaid: studentData.totalPaid,
            totalPending: studentData.totalPending,
            totalDiscount: studentData.totalDiscount,
            totalOverdue: studentData.totalOverdue,
            finesTotal: studentData.finesTotal,
            finesPaid: studentData.finesPaid,
            finesPending: studentData.finesPending,
            finesWaived: studentData.finesWaived,
            pendingFinesCount: studentData.pendingFinesCount
          });
        }
      }
    } catch (error) {
      console.error('Error fetching fee data:', error);
    } finally {
      setLoadingFeeData(false);
    }
  }, [selectedStudent?.id, includeArchivedStudents]);

  const fetchRouteDetails = useCallback(async () => {
    if (!selectedStudent?.transport?.routeId) return;
    
    setLoadingRouteDetails(true);
    try {
      const response = await fetch(`/api/transport/routes/${selectedStudent.transport.routeId}`);
      const data = await response.json();
      
      if (data.route) {
        setRouteDetails({
          id: data.route.id,
          routeName: data.route.routeName,
          routeNumber: data.route.routeNumber,
          driverName: data.route.driverName,
          driverPhone: data.route.driverPhone,
          capacity: data.route.capacity,
          yearlyFee: data.route.yearlyFee,
          monthlyFee: data.route.monthlyFee,
        });
      }
    } catch (error) {
      console.error('Error fetching route details:', error);
    } finally {
      setLoadingRouteDetails(false);
    }
  }, [selectedStudent?.transport?.routeId]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentFeeData();
      fetchRouteDetails();
    }
  }, [selectedStudent, fetchStudentFeeData, fetchRouteDetails]);

  const handleRefreshFeeData = useCallback(() => {
    fetchStudentFeeData();
  }, [fetchStudentFeeData]);

  return {
    feeData,
    loadingFeeData,
    routeDetails,
    loadingRouteDetails,
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

export const useStudentInfoSections = (selectedStudent: Student | null, theme: 'dark' | 'light', routeDetails: RouteDetails | null) => {
  return useMemo(() => {
    if (!selectedStudent) return [];

    const sections = [
      {
        title: 'Basic Information',
        fields: [
          { label: 'Student ID', value: selectedStudent.id },
          { label: 'Admission No', value: selectedStudent.admissionNo },
          { label: 'Roll Number', value: selectedStudent.rollNo },
          { label: 'Name', value: selectedStudent.name },
          { label: 'Class', value: selectedStudent.class },
          { label: 'Section', value: selectedStudent.section },
          { label: 'Date of Birth', value: selectedStudent.dateOfBirth },
          { label: 'Gender', value: selectedStudent.gender },
          { label: 'Blood Group', value: selectedStudent.bloodGroup },
          { label: 'Phone', value: selectedStudent.phone },
          { label: 'Email', value: selectedStudent.email },
          { label: 'Language Medium', value: selectedStudent.languageMedium },
          { label: 'Category', value: selectedStudent.category },
          { label: 'Status', value: selectedStudent.status },
        ],
      },
      {
        title: 'Academic Information',
        fields: [
          { label: 'Academic Year', value: selectedStudent.academicYear },
          { label: 'Admission Date', value: selectedStudent.admissionDate },
          { label: 'Enrollment Date', value: selectedStudent.enrollmentDate },
          { label: 'GPA', value: selectedStudent.gpa?.toFixed(2) },
          { label: 'Rank', value: selectedStudent.rank },
          { label: 'Discipline Score', value: selectedStudent.disciplineScore },
          { label: 'Achievements', value: selectedStudent.achievements },
          { label: 'Incidents', value: selectedStudent.incidents },
          { label: 'Attendance %', value: selectedStudent.attendance?.percentage },
          { label: 'Needs Promotion', value: selectedStudent.needsPromotion ? 'Yes' : 'No' },
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
          { label: 'Parent Name', value: selectedStudent.parentName },
          { label: 'Parent Phone', value: selectedStudent.parentPhone },
          { label: 'Parent Email', value: selectedStudent.parentEmail },
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
        ],
      },
      ...(selectedStudent.transport ? [{
        title: 'Transport Information',
        fields: [
          ...(routeDetails ? [
            { label: 'Route Name', value: routeDetails.routeName },
            { label: 'Route Number', value: routeDetails.routeNumber },
            { label: 'Driver Name', value: routeDetails.driverName || 'N/A' },
            { label: 'Driver Phone', value: routeDetails.driverPhone || 'N/A' },
            { label: 'Vehicle Capacity', value: routeDetails.capacity },
          ] : [
            { label: 'Route ID', value: selectedStudent.transport.routeId },
          ]),
          { label: 'Pickup Stop', value: selectedStudent.transport.pickupStop || 'N/A' },
          { label: 'Drop Stop', value: selectedStudent.transport.dropStop || 'N/A' },
          { label: 'Monthly Fee', value: `₹${selectedStudent.transport.monthlyFee || 0}` },
          ...(routeDetails ? [
            { label: 'Yearly Fee', value: `₹${routeDetails.yearlyFee || 0}` },
          ] : []),
          { label: 'Status', value: selectedStudent.transport.isActive ? 'Active' : 'Inactive' },
        ],
      }] : []),
      {
        title: 'Additional Information',
        fields: [
          { label: 'Remarks', value: selectedStudent.remarks },
        ],
      },
    ];

    return sections.filter(section => 
      section.fields.some(field => field.value && field.value !== 'N/A')
    );
  }, [selectedStudent, theme, routeDetails]);
};

export const useProfileTabs = (): Array<{ id: string; label: string; icon: string }> => {
  return useMemo(() => [
    { id: 'overview', label: 'Overview', icon: 'LayoutGrid' },
    { id: 'academics', label: 'Academics', icon: 'GraduationCap' },
    { id: 'fees', label: 'Fees', icon: 'DollarSign' },
    { id: 'fines', label: 'Fines', icon: 'Scale' },
    { id: 'attendance', label: 'Attendance', icon: 'CalendarCheck' },
    { id: 'communication', label: 'Communication', icon: 'MessageSquare' },
    { id: 'parents', label: 'Parents', icon: 'Users' }
  ], []);
};
