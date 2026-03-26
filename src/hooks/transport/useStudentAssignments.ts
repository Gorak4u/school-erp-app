'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Student {
  id: string;
  name: string;
  admissionNo: string;
  class?: { name: string };
  section?: { name: string };
  fatherPhone?: string;
  motherPhone?: string;
}

interface Assignment {
  id: string;
  studentId: string;
  student?: Student;
  routeId: string;
  route?: {
    id: string;
    routeNumber: string;
    routeName: string;
    driverName?: string;
  };
  pickupStop?: string;
  dropStop?: string;
  monthlyFee: number;
  isActive: boolean;
}

interface UseStudentAssignmentsReturn {
  assignments: Assignment[];
  students: Assignment[];
  loading: boolean;
  saving: boolean;
  searchLoading: boolean;
  searchResults: Student[];
  error: string;
  success: string;
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  fetchAssignments: (page?: number, pageSize?: number) => Promise<void>;
  createAssignment: (assignmentData: Partial<Assignment>) => Promise<boolean>;
  updateAssignment: (id: string, assignmentData: Partial<Assignment>) => Promise<boolean>;
  deleteAssignment: (id: string) => Promise<boolean>;
  toggleAssignmentStatus: (id: string, isActive: boolean) => Promise<boolean>;
  searchStudents: (query: string) => void;
  bulkAssignStudents: (routeId: string, studentIds: string[]) => Promise<boolean>;
  clearMessages: () => void;
  clearSearchResults: () => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  changePageSize: (pageSize: number) => void;
}

export function useStudentAssignments(): UseStudentAssignmentsReturn {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0
  });

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  const showMsg = useCallback((msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 3000);
    }
  }, []);

  const fetchAssignments = useCallback(async (page = 1, pageSize = 50) => {
    setLoading(true);
    clearMessages();
    
    try {
      const response = await fetch(`/api/transport/students?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', response.status, errorText);
        throw new Error(`Failed to fetch student assignments (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      const assignments = Array.isArray(data.assignments) ? data.assignments : Array.isArray(data) ? data : [];
      setAssignments(assignments);
      setStudents(assignments); // Use assignments for students since they're the same data
      
      // Set pagination data
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch assignments';
      console.error('Full fetch error:', err);
      showMsg(errorMsg, true);
    } finally {
      setLoading(false);
    }
  }, [clearMessages, showMsg]);

  const searchStudents = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    
    try {
      const response = await fetch(`/api/students?search=${encodeURIComponent(query)}&pageSize=10`);
      if (!response.ok) {
        console.warn('Student search failed with status:', response.status);
        setSearchResults([]);
        return;
      }
      const data = await response.json();
      setSearchResults(Array.isArray(data.students) ? data.students : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error searching students:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search to avoid too many API calls
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSearchStudents = useCallback((query: string): void => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchStudents(query);
    }, 300); // 300ms debounce
  }, [searchStudents]);

  // Pagination functions
  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchAssignments(pagination.page + 1, pagination.pageSize);
    }
  }, [pagination, fetchAssignments]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchAssignments(pagination.page - 1, pagination.pageSize);
    }
  }, [pagination, fetchAssignments]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchAssignments(page, pagination.pageSize);
    }
  }, [pagination, fetchAssignments]);

  const changePageSize = useCallback((newPageSize: number) => {
    fetchAssignments(1, newPageSize);
  }, [fetchAssignments]);

  const createAssignment = useCallback(async (assignmentData: Partial<Assignment>) => {
    setSaving(true);
    clearMessages();
    
    try {
      const response = await fetch('/api/transport/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create assignment');
      }
      
      const result = await response.json();
      const newAssignment = result.assignment || result;
      setStudents(prev => [...prev, newAssignment]);
      setAssignments(prev => [...prev, newAssignment]);
      showMsg('Student assigned successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create assignment';
      showMsg(errorMsg, true);
      console.error('Error creating assignment:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [clearMessages, showMsg]);

  const updateAssignment = useCallback(async (id: string, assignmentData: Partial<Assignment>) => {
    setSaving(true);
    clearMessages();
    
    try {
      const response = await fetch(`/api/transport/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update assignment');
      }
      
      const result = await response.json();
      const updatedAssignment = result.assignment || result;
      setStudents(prev => prev.map(student => 
        student.id === id ? updatedAssignment : student
      ));
      setAssignments(prev => prev.map(assignment => 
        assignment.id === id ? updatedAssignment : assignment
      ));
      showMsg('Assignment updated successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update assignment';
      showMsg(errorMsg, true);
      console.error('Error updating assignment:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [clearMessages, showMsg]);

  const deleteAssignment = useCallback(async (id: string) => {
    setSaving(true);
    clearMessages();
    
    try {
      const response = await fetch(`/api/transport/students/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete assignment');
      }
      
      setStudents(prev => prev.filter(student => student.id !== id));
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
      showMsg('Assignment removed successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete assignment';
      showMsg(errorMsg, true);
      console.error('Error deleting assignment:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [clearMessages, showMsg]);

  const toggleAssignmentStatus = useCallback(async (id: string, isActive: boolean) => {
    return await updateAssignment(id, { isActive });
  }, [updateAssignment]);

  const bulkAssignStudents = useCallback(async (routeId: string, studentIds: string[]) => {
    setSaving(true);
    clearMessages();
    
    try {
      const response = await fetch('/api/transport/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, studentIds })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk assign students');
      }
      
      const result = await response.json();
      showMsg(`Successfully assigned ${studentIds.length} students`);
      await fetchAssignments(); // Refresh the list
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to bulk assign students';
      showMsg(errorMsg, true);
      console.error('Error bulk assigning students:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [clearMessages, showMsg, fetchAssignments]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    assignments,
    students,
    loading,
    saving,
    searchLoading,
    searchResults,
    error,
    success,
    pagination,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    toggleAssignmentStatus,
    searchStudents: debouncedSearchStudents,
    bulkAssignStudents,
    clearMessages,
    clearSearchResults,
    nextPage,
    prevPage,
    goToPage,
    changePageSize
  };
}
