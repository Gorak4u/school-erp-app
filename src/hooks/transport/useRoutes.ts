'use client';

import { useState, useEffect, useCallback } from 'react';

interface Route {
  id: string;
  routeNumber: string;
  routeName: string;
  description?: string;
  stops?: string;
  vehicleId?: string;
  driverName?: string;
  driverPhone?: string;
  capacity: number;
  monthlyFee: number;
  yearlyFee: number;
  academicYearId: string;
  isActive: boolean;
  assignedStudents?: number;
}

interface UseRoutesReturn {
  routes: Route[];
  loading: boolean;
  saving: boolean;
  error: string;
  success: string;
  fetchRoutes: () => Promise<void>;
  createRoute: (routeData: Partial<Route>) => Promise<boolean>;
  updateRoute: (id: string, routeData: Partial<Route>) => Promise<boolean>;
  deleteRoute: (id: string) => Promise<boolean>;
  toggleRouteStatus: (id: string, isActive: boolean) => Promise<boolean>;
  clearMessages: () => void;
}

export function useRoutes(): UseRoutesReturn {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
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

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    clearMessages();
    
    try {
      const response = await fetch('/api/transport/routes');
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      const data = await response.json();
      setRoutes(Array.isArray(data.routes) ? data.routes : Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch routes';
      showMsg(errorMsg, true);
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  }, [clearMessages, showMsg]);

  const createRoute = useCallback(async (routeData: Partial<Route>) => {
    setSaving(true);
    clearMessages();
    
    try {
      const response = await fetch('/api/transport/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create route');
      }
      
      const result = await response.json();
      setRoutes(prev => [...prev, result.route || result]);
      showMsg('Route created successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create route';
      showMsg(errorMsg, true);
      console.error('Error creating route:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [clearMessages, showMsg]);

  const updateRoute = useCallback(async (id: string, routeData: Partial<Route>) => {
    setSaving(true);
    clearMessages();
    
    try {
      const response = await fetch(`/api/transport/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update route');
      }
      
      const result = await response.json();
      setRoutes(prev => prev.map(route => 
        route.id === id ? (result.route || result) : route
      ));
      showMsg('Route updated successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update route';
      showMsg(errorMsg, true);
      console.error('Error updating route:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [clearMessages, showMsg]);

  const deleteRoute = useCallback(async (id: string) => {
    setSaving(true);
    clearMessages();
    
    try {
      const response = await fetch(`/api/transport/routes/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete route');
      }
      
      setRoutes(prev => prev.filter(route => route.id !== id));
      showMsg('Route deleted successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete route';
      showMsg(errorMsg, true);
      console.error('Error deleting route:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [clearMessages, showMsg]);

  const toggleRouteStatus = useCallback(async (id: string, isActive: boolean) => {
    return await updateRoute(id, { isActive });
  }, [updateRoute]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return {
    routes,
    loading,
    saving,
    error,
    success,
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    toggleRouteStatus,
    clearMessages
  };
}
