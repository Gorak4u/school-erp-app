'use client';

import React, { useState, useCallback, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { teachersApi } from '@/lib/apiClient';
import { createTeacherSearchHandlers } from './handlers/searchHandlers';
import StaffForm, { StaffFormData } from './components/StaffForm';
import { downloadTeacherIdCard } from '@/lib/teacherIdCard';

// Type definitions for teacher data
interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  employeeId?: string;
  department?: string;
  subject?: string;
  designation?: string;
  user?: {
    role?: string;
    customRoleId?: string | null;
  };
  [key: string]: unknown;
}

interface SchoolData {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface Board {
  id: string;
  name: string;
  code: string;
  [key: string]: unknown;
}

interface Medium {
  id: string;
  name: string;
  code: string;
  [key: string]: unknown;
}

interface Class {
  id: string;
  name: string;
  code: string;
  [key: string]: unknown;
}

interface Section {
  id: string;
  name: string;
  code: string;
  [key: string]: unknown;
}

interface AcademicYear {
  id: string;
  name: string;
  year: string;
  [key: string]: unknown;
}

type QueryParams = Record<string, unknown>;

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function StaffPage() {
  const { theme } = useTheme();
  const { hasPermission } = usePermissions();
  const isDark = theme === 'dark';
  
  // Permission checks
  const canCreateTeachers = hasPermission('create_teachers');
  const canEditTeachers = hasPermission('edit_teachers');
  const canDeleteTeachers = hasPermission('delete_teachers');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [downloadingIdCard, setDownloadingIdCard] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Teacher | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [dbClasses, setDbClasses] = useState<Class[]>([]);
  const [dbSections, setDbSections] = useState<Section[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  const fetcher = useCallback((p: QueryParams) => teachersApi.list(p as any), []);
  const {
    data: teachers, total, page, pageSize, totalPages, loading, error,
    filters, setFilter, resetFilters, setPage, setPageSize, toggleSort, sortBy, sortOrder, refresh,
  } = usePaginatedQuery(fetcher, 'teachers', {}, { pageSize: 50 });

  // Load school data for class teacher assignments
  useEffect(() => {
    const loadSchoolData = async () => {
      try {
        // Load school configuration
        const schoolConfigRes = await fetch('/api/school-config');
        if (schoolConfigRes.ok) {
          const schoolConfigData = await schoolConfigRes.json();
          setSchoolData(schoolConfigData);
          setBoards(schoolConfigData.dropdowns?.boards || []);
          setMediums(schoolConfigData.dropdowns?.mediums || []);
          setDbClasses(schoolConfigData.dropdowns?.classes || []);
          setDbSections(schoolConfigData.dropdowns?.sections || []);
        }

        // Load academic years
        const academicYearsRes = await fetch('/api/school-structure/academic-years');
        if (academicYearsRes.ok) {
          const academicYearsData = await academicYearsRes.json();
          setAcademicYears(academicYearsData.academicYears || []);
        }
      } catch (error) {
        console.error('Failed to load school data:', error);
      }
    };

    loadSchoolData();
  }, []);

  const normalizeDateValue = (value: unknown) => {
    if (!value || typeof value !== 'string') return '';
    return value.includes('T') ? value.split('T')[0] : value;
  };

  const mapTeacherToFormData = (teacher: Teacher): StaffFormData => {
    if (!teacher) return { firstName: '', lastName: '', email: '', phone: '', role: 'teacher', customRoleId: '', department: '', subject: '', qualification: '', experience: '', employeeId: '', status: 'active', joiningDate: '', gender: '', dateOfBirth: '', address: '', designation: '', salary: '', bankName: '', bankAccountNo: '', bankIfsc: '', emergencyName: '', emergencyPhone: '', remarks: '', photo: '', aadharNumber: '', bloodGroup: '', isClassTeacher: false, classTeacherAssignments: [] };
    const nameParts = (teacher.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');
    return {
      firstName,
      lastName,
      email: teacher.email || '',
      phone: teacher.phone || '',
      role: (teacher.user?.role as any) || (teacher.role as any) || 'teacher',
      customRoleId: (teacher.user?.customRoleId as any) || (teacher.customRoleId as any) || '',
      department: teacher.department || '',
      subject: teacher.subject || '',
      qualification: (teacher.qualification as any) || '',
      experience: teacher.experience?.toString() || '',
      employeeId: teacher.employeeId || '',
      status: (teacher.status as any) || 'active',
      joiningDate: normalizeDateValue(teacher.joiningDate),
      gender: (teacher.gender as any) || '',
      dateOfBirth: normalizeDateValue(teacher.dateOfBirth),
      address: (teacher.address as any) || '',
      designation: teacher.designation || '',
      salary: teacher.salary?.toString() || '',
      bankName: (teacher.bankName as any) || '',
      bankAccountNo: (teacher.bankAccountNo as any) || '',
      bankIfsc: (teacher.bankIfsc as any) || '',
      emergencyName: (teacher.emergencyName as any) || '',
      emergencyPhone: (teacher.emergencyPhone as any) || '',
      remarks: (teacher.remarks as any) || '',
      photo: (teacher.photo as any) || '',
      aadharNumber: (teacher.aadharNumber as any) || '',
      bloodGroup: (teacher.bloodGroup as any) || '',
      isClassTeacher: (teacher.isClassTeacher as any) || false,
      classTeacherAssignments: (teacher.classTeacherAssignments as any) || [],
    };
  };

  const openEditModal = async (teacher: Teacher) => {
    setFormError('');

    try {
      const response = await teachersApi.get(teacher.id);
      const fullTeacher = ((response as any).teacher || teacher) as Teacher;
      setEditingTeacher(fullTeacher);
    } catch (err) {
      setEditingTeacher(teacher);

      if ((window as any).toast) {
        (window as any).toast({
          type: 'warning',
          title: 'Partial staff data loaded',
          message: 'Full staff details could not be loaded. You can still continue editing basic information.',
          duration: 4000,
        });
      }
    }

    setShowEditModal(true);
  };

  const handleAddSubmit = async (data: StaffFormData) => {
    if (!data.firstName?.trim()) {
      setFormError('First name is required');
      return;
    }
    if (!data.lastName?.trim()) {
      setFormError('Last name is required');
      return;
    }
    if (!data.email?.trim()) {
      setFormError('Email is required to create the linked staff user');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const response = await teachersApi.create({
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phone: data.phone,
        role: data.role || 'teacher',
        customRoleId: data.customRoleId || null,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        subject: data.subject,
        qualification: data.qualification,
        experience: data.experience ? Number(data.experience) : null,
        status: data.status,
        address: data.address,
        photo: data.photo,
        joiningDate: data.joiningDate,
        salary: data.salary ? Number(data.salary) : null,
        department: data.department,
        designation: data.designation,
        bloodGroup: data.bloodGroup,
        aadharNumber: data.aadharNumber,
        bankName: data.bankName,
        bankAccountNo: data.bankAccountNo,
        bankIfsc: data.bankIfsc,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
        remarks: data.remarks,
        employeeId: data.employeeId,
      } as any);

      if (data.isClassTeacher && data.classTeacherAssignments?.length) {
        try {
          const assignmentResponses = await Promise.all(
            data.classTeacherAssignments.map((assignment) =>
              fetch(`/api/teachers/${response.teacher?.id}/class-assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  classId: assignment.classId,
                  sectionId: assignment.sectionId,
                  boardId: assignment.boardId,
                  mediumId: assignment.mediumId,
                  academicYearId: assignment.academicYearId,
                  assignedDate: new Date().toISOString(),
                }),
              })
            )
          );

          const failedAssignmentSync = assignmentResponses.find((assignmentResponse) => !assignmentResponse.ok);
          if (failedAssignmentSync) {
            const assignmentError = await failedAssignmentSync.json().catch(() => null);
            throw new Error(assignmentError?.error || 'Failed to create one or more class teacher assignments');
          }
        } catch (assignmentError) {
          console.error('Failed to create class teacher assignments:', assignmentError);
          if ((window as any).toast) {
            (window as any).toast({
              type: 'warning',
              title: 'Staff created with assignment warning',
              message: assignmentError instanceof Error ? assignmentError.message : 'Some class teacher assignments could not be saved.',
              duration: 5000,
            });
          }
        }
      }

      setShowAddModal(false);
      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Staff created',
          message: response.temporaryPassword
            ? `Staff profile created. Temporary password: ${response.temporaryPassword}`
            : 'Staff profile created successfully.',
          duration: 5000,
        });
      }
      refresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create staff');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (data: StaffFormData) => {
    if (!editingTeacher) return;
    if (!data.firstName?.trim()) {
      setFormError('First name is required');
      return;
    }
    if (!data.lastName?.trim()) {
      setFormError('Last name is required');
      return;
    }
    if (!data.email?.trim()) {
      setFormError('Email is required');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await teachersApi.update(editingTeacher.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phone: data.phone,
        role: data.role || 'teacher',
        customRoleId: data.customRoleId || null,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        subject: data.subject,
        qualification: data.qualification,
        experience: data.experience ? Number(data.experience) : null,
        status: data.status,
        address: data.address,
        photo: data.photo,
        joiningDate: data.joiningDate,
        salary: data.salary ? Number(data.salary) : null,
        department: data.department,
        designation: data.designation,
        bloodGroup: data.bloodGroup,
        aadharNumber: data.aadharNumber,
        bankName: data.bankName,
        bankAccountNo: data.bankAccountNo,
        bankIfsc: data.bankIfsc,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
        remarks: data.remarks,
        employeeId: data.employeeId,
        isClassTeacher: data.isClassTeacher,
      });

      if (data.isClassTeacher) {
        const existingAssignments = editingTeacher.classTeacherAssignments || [];
        const newAssignments = data.classTeacherAssignments || [];
        
        const assignmentsToDelete = (existingAssignments as any).filter(
          (ea: any) => !newAssignments.find((na: any) => na.id === ea.id)
        );

        const assignmentsToCreate = newAssignments.filter((na: any) => !na.id);

        const assignmentResponses = await Promise.all([
          ...assignmentsToDelete.map((a: any) =>
            fetch(`/api/teachers/${editingTeacher.id}/class-assignments?assignmentId=${a.id}`, { method: 'DELETE' })
          ),
          ...assignmentsToCreate.map((assignment: any) =>
            fetch(`/api/teachers/${editingTeacher.id}/class-assignments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                classId: assignment.classId,
                sectionId: assignment.sectionId,
                boardId: assignment.boardId,
                mediumId: assignment.mediumId,
                academicYearId: assignment.academicYearId,
                assignedDate: new Date().toISOString(),
              }),
            })
          ),
        ]);

        const failedAssignmentSync = assignmentResponses.find((assignmentResponse) => !assignmentResponse.ok);
        if (failedAssignmentSync) {
          const assignmentError = await failedAssignmentSync.json().catch(() => null);
          throw new Error(assignmentError?.error || 'Failed to update class teacher assignments');
        }
      } else if (!data.isClassTeacher && editingTeacher.isClassTeacher) {
        // Unchecked isClassTeacher - delete all assignments
        try {
          const existingAssignments = editingTeacher.classTeacherAssignments || [];
          const assignmentResponses = await Promise.all(
            (existingAssignments as any).map((assignment: any) =>
              fetch(`/api/teachers/${editingTeacher.id}/class-assignments?assignmentId=${assignment.id}`, {
                method: 'DELETE',
              })
            )
          );

          const failedAssignmentSync = assignmentResponses.find((assignmentResponse) => !assignmentResponse.ok);
          if (failedAssignmentSync) {
            const assignmentError = await failedAssignmentSync.json().catch(() => null);
            throw new Error(assignmentError?.error || 'Failed to clear class teacher assignments');
          }
        } catch (err) {
          console.error('Failed to clear class teacher assignments:', err);
          throw err;
        }
      }

      setShowEditModal(false);
      setEditingTeacher(null);
      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Staff updated',
          message: 'Staff details were saved successfully.',
          duration: 3000,
        });
      }
      refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff';
      setFormError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadIdCard = async (teacher: Teacher) => {
    if (!teacher || !schoolData) return;
    
    setDownloadingIdCard(teacher.id);
    try {
      // Create a compatible schoolConfig object for the utility
      const config = {
        school: {
          name: (schoolData.settings as any)?.school_details?.name || 'School'
        },
        schoolDetails: {
          logo_url: (schoolData.settings as any)?.school_details?.logo_url
        }
      };
      await downloadTeacherIdCard(teacher, config);
    } catch (error) {
      console.error('Error downloading ID card:', error);
      alert('Failed to download ID card. Please try again.');
    } finally {
      setDownloadingIdCard(null);
    }
  };

  const handleBulkDownloadIdCards = async () => {
    if (selectedTeachers.length === 0 || !schoolData) return;
    
    setDownloadingIdCard('bulk');
    try {
      const selectedStaffData = teachers.filter((t: any) => selectedTeachers.includes(t.id));
      
      const { generateBulkTeacherIdCards, downloadBulkIdCards } = await import('@/lib/bulkIdCards');
      
      const config = {
        school: {
          name: (schoolData.settings as any)?.school_details?.name || 'School'
        },
        schoolDetails: {
          logo_url: (schoolData.settings as any)?.school_details?.logo_url
        }
      };

      const result = await generateBulkTeacherIdCards(selectedStaffData, {
        outputFormat: 'pdf',
        layout: 'grid',
        includeBothSides: true
      }, config);

      downloadBulkIdCards(result, selectedStaffData);
      
      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Bulk Download Ready',
          message: `Generated unified PDF for ${selectedTeachers.length} staff members.`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error in bulk ID card download:', error);
      alert('Failed to download ID cards. Please try again.');
    } finally {
      setDownloadingIdCard(null);
    }
  };

  // Search handlers
  const searchHandlers = createTeacherSearchHandlers({ teachers, refresh });
  const { teacherSearch, setTeacherSearch, toggleTeacherSearch } = searchHandlers;

  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const txt = isDark ? 'text-white' : 'text-gray-900';
  const sub = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
    isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;
  const thCls = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer select-none hover:opacity-80 ${sub}`;
  const tdCls = `px-4 py-3 text-sm ${txt}`;

  const SortIcon = ({ field }: { field: string }) =>
    sortBy === field ? <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span> : <span className="ml-1 opacity-30">↕</span>;

  const activeCount = teachers.filter((t: any) => t.status === 'active').length;
  const inactiveCount = teachers.filter((t: any) => t.status !== 'active').length;
  const classTeacherCount = teachers.filter((t: any) => Array.isArray(t.classTeacherAssignments) && t.classTeacherAssignments.length > 0).length;
  const departmentCount = new Set(teachers.map((t: any) => t.department).filter(Boolean)).size;
  const activeFilterCount = [filters.search, filters.status, filters.role, filters.department].filter(Boolean).length;

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      await teachersApi.delete(teacherId);
      setDeleteConfirm(null);
      setSelectedTeachers((prev) => prev.filter((id) => id !== teacherId));
      refresh();

      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Staff deleted',
          message: 'The staff record and linked login were removed successfully.',
          duration: 3000,
        });
      }
    } catch (err: any) {
      alert('Failed to delete teacher: ' + (err.message || 'Unknown error'));
    }
  };

  const handleToggleStatus = async (teacher: any) => {
    try {
      const action = teacher.status === 'active' ? 'deactivate' : 'activate';
      await teachersApi.update(teacher.id, { action } as any);
      
      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: `Teacher ${action === 'activate' ? 'Activated' : 'Deactivated'}`,
          message: `${teacher.name} has been ${action === 'activate' ? 'activated' : 'deactivated'} successfully.`,
          duration: 3000
        });
      }
      
      refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to ${teacher.status === 'active' ? 'deactivate' : 'activate'} teacher: ` + errorMessage);
    }
  };

  const toggleAllTeachers = () => {
    if (selectedTeachers.length === teachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers((teachers as any).map((t: any) => t.id));
    }
  };

  const toggleTeacherSelection = (teacherId: string) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  return (
    <AppLayout currentPage="teachers">
      <div className="relative px-4 py-6 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden">
          <div className={`absolute left-[-8rem] top-8 h-56 w-56 rounded-full blur-3xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-200/60'}`} />
          <div className={`absolute right-[-6rem] top-10 h-60 w-60 rounded-full blur-3xl ${isDark ? 'bg-violet-500/15' : 'bg-violet-200/60'}`} />
        </div>
        <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className={`relative overflow-hidden rounded-[32px] border px-6 py-7 shadow-2xl sm:px-8 ${isDark ? 'border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,rgba(17,24,39,0.95),rgba(15,23,42,0.92))]' : 'border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.9),_transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))]'}`}>
          <div className={`absolute inset-y-0 right-0 w-80 opacity-70 ${isDark ? 'bg-gradient-to-l from-violet-500/10 to-transparent' : 'bg-gradient-to-l from-violet-200/70 to-transparent'}`} />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${isDark ? 'border-blue-400/20 bg-blue-400/10 text-blue-200' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                Workforce Hub
              </div>
              <h1 className={`mt-4 text-3xl font-bold tracking-tight sm:text-4xl ${txt}`}>Staff Management</h1>
              <p className={`mt-3 max-w-2xl text-sm sm:text-base ${sub}`}>
                Manage teachers, leadership staff, access roles, and class assignments from one premium operational workspace.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${isDark ? 'bg-white/5 text-gray-200' : 'bg-white text-gray-700 shadow-sm'}`}>
                  {total.toLocaleString()} total staff
                </span>
                <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                  {activeCount} active
                </span>
                <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${isDark ? 'bg-violet-500/10 text-violet-200' : 'bg-violet-50 text-violet-700'}`}>
                  {classTeacherCount} class teachers
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              {selectedTeachers.length > 0 && (
                <button
                  onClick={handleBulkDownloadIdCards}
                  disabled={!!downloadingIdCard}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${isDark ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20' : 'border border-emerald-200 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50'} ${downloadingIdCard === 'bulk' ? 'cursor-wait opacity-60' : ''}`}
                >
                  {downloadingIdCard === 'bulk' ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                  Download {selectedTeachers.length} ID Cards
                </button>
              )}
              {canCreateTeachers && (
                <button
                  onClick={() => { setFormError(''); setShowAddModal(true); }}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition-all hover:-translate-y-0.5 ${isDark ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'}`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Staff
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${isDark ? 'border-blue-500/20 bg-gradient-to-br from-blue-900/40 to-slate-900/90' : 'border-blue-100 bg-gradient-to-br from-white to-blue-50'}`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Total Staff</p>
                <p className={`text-3xl font-bold mt-2 ${txt}`}>{total}</p>
                <p className={`text-xs ${sub} mt-2`}>All staff records in the directory</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${isDark ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-900/35 to-slate-900/90' : 'border-emerald-100 bg-gradient-to-br from-white to-emerald-50'}`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-lime-400" />
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>Active</p>
                <p className={`text-3xl font-bold mt-2 ${txt}`}>{activeCount}</p>
                <p className={`text-xs ${sub} mt-2`}>Currently active staff members</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${isDark ? 'border-violet-500/20 bg-gradient-to-br from-violet-900/35 to-slate-900/90' : 'border-violet-100 bg-gradient-to-br from-white to-violet-50'}`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-400" />
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>Class Teachers</p>
                <p className={`text-3xl font-bold mt-2 ${txt}`}>{classTeacherCount}</p>
                <p className={`text-xs ${sub} mt-2`}>With active class assignments</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-violet-600/20' : 'bg-violet-100'}`}>
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl ${isDark ? 'border-amber-500/20 bg-gradient-to-br from-amber-900/35 to-slate-900/90' : 'border-amber-100 bg-gradient-to-br from-white to-amber-50'}`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400" />
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>Coverage</p>
                <p className={`text-3xl font-bold mt-2 ${txt}`}>{departmentCount}</p>
                <p className={`text-xs ${sub} mt-2`}>{inactiveCount} inactive · page {page} of {totalPages || 1}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-amber-600/20' : 'bg-amber-100'}`}>
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M8 7V5a4 4 0 118 0v2m-9 4h10m-10 4h6m-8 6h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Filters Section */}
        <div className={`relative overflow-hidden rounded-[32px] border p-5 shadow-2xl ${isDark ? 'border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.10),_transparent_35%),rgba(15,23,42,0.86)]' : 'border-white/70 bg-[radial-gradient(circle_at_top_right,_rgba(221,214,254,0.75),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(191,219,254,0.7),_transparent_35%),rgba(255,255,255,0.94)]'} backdrop-blur-xl`}>
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400`} />

          {/* Search Header */}
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? 'border-white/10 bg-white/5 text-violet-200' : 'border-violet-200 bg-white text-violet-700 shadow-sm'}`}>
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Search Workspace
              </div>
              <h3 className={`mt-3 text-lg font-semibold ${txt}`}>Search & Filter</h3>
              <p className={`mt-1 text-sm ${sub}`}>Blend smart search with operational filters to quickly isolate staff by role, department, and status.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[440px]">
              <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white/80'}`}>
                <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${sub}`}>Visible</div>
                <div className={`mt-1 text-lg font-bold ${txt}`}>{teachers.length}</div>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white/80'}`}>
                <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${sub}`}>Filters</div>
                <div className={`mt-1 text-lg font-bold ${txt}`}>{activeFilterCount}</div>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-gray-200 bg-white/80'}`}>
                <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${sub}`}>Mode</div>
                <div className={`mt-1 text-sm font-semibold ${teacherSearch.enabled ? 'text-violet-500' : txt}`}>{teacherSearch.enabled ? 'AI search' : 'Normal search'}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="relative">
                <input
                  type="text"
                  className={`${inputCls} rounded-2xl pl-12 pr-12 shadow-sm`}
                  placeholder={teacherSearch.enabled ? "AI-powered search..." : "Search by name, email, employee ID..."}
                  value={teacherSearch.enabled ? teacherSearch.query : (filters.search as string) || ''}
                  onChange={e => {
                    if (teacherSearch.enabled) {
                      setTeacherSearch(prev => ({ ...prev, query: e.target.value }));
                    } else {
                      setFilter('search', e.target.value);
                    }
                  }}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  {teacherSearch.isSearching ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                  ) : (
                    <svg className={`h-5 w-5 ${teacherSearch.enabled ? 'text-violet-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                {teacherSearch.enabled && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="inline-flex items-center rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md">AI</span>
                  </div>
                )}
              </div>

              <button
                onClick={toggleTeacherSearch}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all ${
                  teacherSearch.enabled
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500'
                    : isDark
                      ? 'border border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {teacherSearch.enabled ? (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI Search
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Normal Search
                  </>
                )}
              </button>
            </div>

            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-200 bg-white text-gray-600 shadow-sm'}`}>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {activeFilterCount ? `${activeFilterCount} active filters applied` : 'No filters applied'}
            </div>
          </div>

          {/* Filter Options */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className={`block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5 ${sub}`}>Status</label>
              <select
                className={`${inputCls} rounded-2xl w-full`}
                value={(filters.status as string) || ''}
                onChange={e => setFilter('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
            <div>
              <label className={`block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5 ${sub}`}>Role</label>
              <select
                className={`${inputCls} rounded-2xl w-full`}
                value={(filters.role as string) || ''}
                onChange={e => setFilter('role', e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div>
              <label className={`block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5 ${sub}`}>Department</label>
              <input
                className={`${inputCls} rounded-2xl w-full`}
                placeholder="Department..."
                value={(filters.department as string) || ''}
                onChange={e => setFilter('department', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className={`w-full rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  isDark
                    ? 'border border-white/10 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Modern Table */}
        <div className={`overflow-hidden rounded-[30px] border shadow-2xl ${isDark ? 'border-white/10 bg-slate-900/80' : 'border-white/70 bg-white/90'} backdrop-blur-xl`}>
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          
          {/* Table Header */}
          <div className={`border-b px-6 py-5 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-gray-200 bg-gray-50/80'}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className={`text-lg font-semibold ${txt}`}>Staff Directory</h3>
                  <p className={`mt-1 text-sm ${sub}`}>Operational view of staff records, assignments, and access actions.</p>
                </div>
                {selectedTeachers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isDark ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedTeachers.length} selected
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <select
                  className={`${inputCls} text-sm rounded-xl`}
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} per page</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
                <tr>
                  {[
                    { label: '', field: 'checkbox', width: 'w-12' },
                    { label: 'Staff Member', field: 'name', width: 'min-w-[200px]' },
                    { label: 'Employee ID', field: 'employeeId', width: 'min-w-[120px]' },
                    { label: 'Department', field: 'department', width: 'min-w-[140px]' },
                    { label: 'Subject', field: 'subject', width: 'min-w-[120px]' },
                    { label: 'Class Teacher', field: 'classTeacher', width: 'min-w-[100px]' },
                    { label: 'Experience', field: 'experience', width: 'min-w-[80px]' },
                    { label: 'Status', field: 'status', width: 'min-w-[100px]' },
                    { label: 'Joined', field: 'joiningDate', width: 'min-w-[100px]' },
                    { label: 'Actions', field: 'actions', width: 'w-40' },
                  ].map(col => (
                    <th key={col.field} className={`${thCls} ${col.width || ''} px-4 py-3`} onClick={() => col.field !== 'checkbox' && col.field !== 'actions' && toggleSort(col.field)}>
                      {col.field === 'checkbox' ? (
                        <input
                          type="checkbox"
                          checked={selectedTeachers.length === teachers.length && teachers.length > 0}
                          onChange={toggleAllTeachers}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      ) : (
                        <>
                          {col.label}<SortIcon field={col.field} />
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {loading && teachers.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : teachers.map((teacher: any) => (
                  <tr key={teacher.id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/80'}`}>
                    <td className={tdCls}>
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(teacher.id)}
                        onChange={() => toggleTeacherSelection(teacher.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-3">
                        {teacher.photo ? (
                          <img
                            src={teacher.photo}
                            alt={teacher.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {teacher.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className={`font-medium ${txt}`}>{teacher.name}</div>
                          <div className={`text-xs ${sub}`}>{teacher.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className={tdCls}>{teacher.employeeId || '—'}</td>
                    <td className={tdCls}>{teacher.department || '—'}</td>
                    <td className={tdCls}>{teacher.subject || '—'}</td>
                    <td className={tdCls}>
                      {teacher.classTeacherAssignments && teacher.classTeacherAssignments.length > 0 ? (
                        <div className="text-xs">
                          {teacher.classTeacherAssignments.map((assignment: any, idx: number) => (
                            <div key={idx} className={sub}>
                              {assignment.className} {assignment.sectionName}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className={sub}>—</span>
                      )}
                    </td>
                    <td className={tdCls}>{teacher.experience ? `${teacher.experience} yrs` : '—'}</td>
                    <td className={tdCls}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        teacher.status === 'active'
                          ? 'bg-green-500/15 text-green-400'
                          : teacher.status === 'on_leave'
                          ? 'bg-yellow-500/15 text-yellow-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className={`${tdCls} text-xs`}>{teacher.joiningDate || '—'}</td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-2 flex-wrap">
                        {canEditTeachers && (
                          <button
                            onClick={() => openEditModal(teacher)}
                            className={`px-2.5 py-1.5 text-xs rounded-xl border font-medium transition-colors ${
                              isDark 
                                ? 'border-blue-600 text-blue-400 hover:bg-blue-600/20' 
                                : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadIdCard(teacher)}
                          disabled={!!downloadingIdCard}
                          className={`px-2.5 py-1.5 text-xs rounded-xl border font-medium transition-all flex items-center gap-1 ${
                            isDark 
                              ? 'border-green-600 text-green-400 hover:bg-green-600/20' 
                              : 'border-green-500 text-green-600 hover:bg-green-50'
                          } ${downloadingIdCard === teacher.id ? 'opacity-50 cursor-wait' : ''}`}
                          title="Download Staff ID Card"
                        >
                          {downloadingIdCard === teacher.id ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                          <span>ID Card</span>
                        </button>
                        {(canEditTeachers || canDeleteTeachers) && (
                          <button
                            onClick={() => handleToggleStatus(teacher)}
                            className={`px-2.5 py-1.5 text-xs rounded-xl border font-medium transition-colors ${
                              teacher.status === 'active' 
                                ? isDark 
                                  ? 'border-orange-600 text-orange-400 hover:bg-orange-600/20' 
                                  : 'border-orange-500 text-orange-600 hover:bg-orange-50'
                                : isDark 
                                  ? 'border-green-600 text-green-400 hover:bg-green-600/20' 
                                  : 'border-green-500 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {teacher.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {canDeleteTeachers && (
                          <button
                            onClick={() => setDeleteConfirm(teacher)}
                            className={`px-2.5 py-1.5 text-xs rounded-xl border font-medium transition-colors ${
                              isDark 
                                ? 'border-red-600 text-red-400 hover:bg-red-600/20' 
                                : 'border-red-500 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && teachers.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-14 text-center">
                      <div className="mx-auto max-w-md space-y-3">
                        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className={`text-lg font-semibold ${txt}`}>No staff found</div>
                        <div className={`text-sm ${sub}`}>Try adjusting your search or filters, or create a new staff profile to get started.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
            <p className={`text-sm ${sub}`}>
              {loading ? 'Loading…' : total === 0 ? 'No staff records to display' : `Showing ${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, total)} of ${total.toLocaleString()}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)} disabled={page === 1} className={`px-2 py-1 rounded-lg text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >«</button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-3 py-1 rounded-lg text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >‹ Prev</button>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-medium ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
              >
                {page} / {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={`px-3 py-1 rounded-lg text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >Next ›</button>
              <button
                onClick={() => setPage(totalPages)} disabled={page >= totalPages} className={`px-2 py-1 rounded-lg text-sm disabled:opacity-40 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >»</button>
            </div>
          </div>
        </div>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setShowAddModal(false); setFormError(''); }}>
            <div className={`w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-[32px] border shadow-2xl ${isDark ? 'border-white/10 bg-slate-950/95' : 'border-white/70 bg-white/95'} backdrop-blur-xl`} onClick={e => e.stopPropagation()}>
              <div className={`px-8 py-6 border-b ${isDark ? 'border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_35%),rgba(15,23,42,0.9)]' : 'border-gray-200 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.8),_transparent_35%),rgba(248,250,252,0.9)]'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? 'bg-blue-500/10 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
                      Create Staff Profile
                    </div>
                    <h3 className={`mt-3 text-2xl font-bold ${txt}`}>Add New Staff Member</h3>
                    <p className={`text-sm ${sub} mt-1`}>Create a production-ready staff profile, linked access role, and class assignments in one flow.</p>
                  </div>
                  <button
                    onClick={() => { setShowAddModal(false); setFormError(''); }}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                <StaffForm
                  mode="add"
                  theme={theme}
                  externalError={formError}
                  boards={boards}
                  mediums={mediums}
                  classes={dbClasses}
                  sections={dbSections}
                  academicYears={academicYears}
                  loading={saving}
                  onSubmit={handleAddSubmit}
                  onCancel={() => { setShowAddModal(false); setFormError(''); }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {showEditModal && editingTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setShowEditModal(false); setEditingTeacher(null); setFormError(''); }}>
            <div className={`w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-[32px] border shadow-2xl ${isDark ? 'border-white/10 bg-slate-950/95' : 'border-white/70 bg-white/95'} backdrop-blur-xl`} onClick={e => e.stopPropagation()}>
              <div className={`px-8 py-6 border-b ${isDark ? 'border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.14),_transparent_35%),rgba(15,23,42,0.9)]' : 'border-gray-200 bg-[radial-gradient(circle_at_top_left,_rgba(221,214,254,0.7),_transparent_35%),rgba(248,250,252,0.9)]'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? 'bg-violet-500/10 text-violet-200' : 'bg-violet-50 text-violet-700'}`}>
                      Edit Staff Profile
                    </div>
                    <h3 className={`mt-3 text-2xl font-bold ${txt}`}>Edit Staff Member</h3>
                    <p className={`text-sm ${sub} mt-1`}>Update profile, access, and assignment details for {editingTeacher.name}.</p>
                  </div>
                  <button
                    onClick={() => { setShowEditModal(false); setEditingTeacher(null); setFormError(''); }}
                    className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 180px)' }}>
                <StaffForm
                  mode="edit"
                  theme={theme}
                  initialData={mapTeacherToFormData(editingTeacher)}
                  externalError={formError}
                  boards={boards}
                  mediums={mediums}
                  classes={dbClasses}
                  sections={dbSections}
                  academicYears={academicYears}
                  loading={saving}
                  onSubmit={handleEditSubmit}
                  onCancel={() => { setShowEditModal(false); setEditingTeacher(null); setFormError(''); }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
            <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-red-600/20' : 'bg-red-100'}`}>
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${txt}`}>Delete Staff Member</h3>
                  <p className={`text-sm ${sub}`}>This will permanently delete the teacher and their associated user account. This action cannot be undone.</p>
                </div>
              </div>
              <p className={`${sub} mb-6`}>
                Are you sure you want to permanently delete <span className={`font-medium ${txt}`}>{deleteConfirm.name}</span> and their user account?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTeacher(deleteConfirm.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>
    </AppLayout>
  );
}
