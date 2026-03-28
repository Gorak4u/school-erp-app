'use client';

import { useState, useEffect, useCallback } from 'react';

export type DashboardType = 'students' | 'teachers' | 'fees' | 'expenses' | 'overview';
export type Period = 'all' | 'today' | 'this_week' | 'this_month' | 'this_year';

// Student dashboard stats interface
export interface StudentDashboardStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  graduatedStudents: number;
  newStudentsThisMonth: number;
  averageAttendance: number;
  lowAttendanceStudents: number;
  totalFeesCollected: number;
  pendingFees: number;
  feeDefaulters: number;
  collectionRate: number;
  classDistribution: Record<string, number>;
  genderDistribution: { male: number; female: number; other: number };
  pendingApprovals: number;
  systemHealth: number;
  recentActivities: Array<{
    id: string;
    type: 'admission' | 'fee_payment' | 'status_change' | 'document_upload';
    description: string;
    timestamp: string;
    studentName: string;
  }>;
  period: Period;
  lastUpdated: string;
}

// Teacher dashboard stats interface
export interface TeacherDashboardStats {
  totalTeachers: number;
  activeTeachers: number;
  departmentDistribution: Record<string, number>;
  period: Period;
  lastUpdated: string;
}

// Fee dashboard stats interface
export interface FeeDashboardStats {
  totalFeesAmount: number;
  totalFeesCollected: number;
  totalFeesPaid: number;
  totalFeesPending: number;
  totalFeesOverdue: number;
  paidCount: number;
  pendingCount: number;
  partialCount: number;
  fullyPaidCount: number;
  partiallyPaidCount: number;
  overdueCount: number;
  collectionRate: number;
  totalStudents: number;
  totalDiscount: number;
  totalWaived: number;
  pendingApprovals: number;
  recentActivities: Array<{
    id: string;
    icon: string;
    message: string;
    time: string;
  }>;
  period: Period;
  lastUpdated: string;
}

// Expense dashboard stats interface
export interface ExpenseDashboardStats {
  totalExpenses: number;
  categoryBreakdown: Record<string, { amount: number; count: number }>;
  period: Period;
  lastUpdated: string;
}

// Overview stats interface
export interface OverviewStats {
  totalStudents: number;
  totalTeachers: number;
  totalFeesCollected: number;
  totalFeesPending: number;
  collectionRate: number;
  activeStudents: number;
  period: Period;
  lastUpdated: string;
  components: {
    students: StudentDashboardStats;
    teachers: TeacherDashboardStats;
    fees: FeeDashboardStats;
  };
}

export type DashboardStats = 
  | StudentDashboardStats 
  | TeacherDashboardStats 
  | FeeDashboardStats 
  | ExpenseDashboardStats 
  | OverviewStats;

interface UseDashboardStatsReturn<T extends DashboardStats> {
  stats: T | null;
  period: Period;
  setPeriod: (period: Period) => void;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardStats<T extends DashboardStats>(
  type: DashboardType,
  initialPeriod: Period = 'all'
): UseDashboardStatsReturn<T> {
  const [stats, setStats] = useState<T | null>(null);
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync internal period state when initialPeriod prop changes
  useEffect(() => {
    setPeriod(initialPeriod);
  }, [initialPeriod]);

  const fetchStats = useCallback(async () => {
    console.log('useDashboardStats fetching with type:', type, 'period:', period);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/dashboard/stats?type=${type}&period=${period}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('useDashboardStats received data:', result);
      
      if (result.success && result.data) {
        setStats(result.data as T);
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (err: any) {
      console.error('Dashboard stats fetch error:', err);
      setError(err.message || 'Failed to load dashboard stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [type, period]);

  // Fetch stats when type, period changes, or refresh triggered
  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTrigger]);

  // Manual refresh function
  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    stats,
    period,
    setPeriod,
    loading,
    error,
    refetch,
  };
}

// Convenience hooks for specific dashboard types
export function useStudentDashboardStats(initialPeriod?: Period) {
  return useDashboardStats<StudentDashboardStats>('students', initialPeriod);
}

export function useTeacherDashboardStats(initialPeriod?: Period) {
  return useDashboardStats<TeacherDashboardStats>('teachers', initialPeriod);
}

export function useFeeDashboardStats(initialPeriod?: Period) {
  return useDashboardStats<FeeDashboardStats>('fees', initialPeriod);
}

export function useExpenseDashboardStats(initialPeriod?: Period) {
  return useDashboardStats<ExpenseDashboardStats>('expenses', initialPeriod);
}

export function useOverviewStats(initialPeriod?: Period) {
  return useDashboardStats<OverviewStats>('overview', initialPeriod);
}
