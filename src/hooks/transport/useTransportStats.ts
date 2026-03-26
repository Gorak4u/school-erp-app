'use client';

import { useState, useEffect, useCallback } from 'react';

interface TransportStats {
  totalRoutes: number;
  totalVehicles: number;
  totalStudents: number;
  pendingTransportFees: number;
}

interface UseTransportStatsReturn {
  stats: TransportStats;
  statsRoutes: any[];
  loading: boolean;
  error: string;
  fetchStats: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useTransportStats(): UseTransportStatsReturn {
  const [stats, setStats] = useState<TransportStats>({
    totalRoutes: 0,
    totalVehicles: 0,
    totalStudents: 0,
    pendingTransportFees: 0
  });
  const [statsRoutes, setStatsRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch transport statistics
      const statsResponse = await fetch('/api/transport/stats');
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch transport statistics');
      }
      const statsData = await statsResponse.json();
      
      // Fetch routes with utilization data
      const routesResponse = await fetch('/api/transport/routes');
      if (!routesResponse.ok) {
        throw new Error('Failed to fetch routes data');
      }
      const routesData = await routesResponse.json();
      
      setStats(statsData.stats || statsData);
      setStatsRoutes(Array.isArray(routesData.routes) ? routesData.routes : Array.isArray(routesData) ? routesData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching transport stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    statsRoutes,
    loading,
    error,
    fetchStats,
    refreshStats
  };
}
