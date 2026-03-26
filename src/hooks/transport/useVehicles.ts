'use client';

import { useState, useEffect, useCallback } from 'react';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  driverName?: string;
  driverPhone?: string;
  registrationNo?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  isActive: boolean;
}

interface UseVehiclesReturn {
  vehicles: Vehicle[];
  loading: boolean;
  saving: boolean;
  error: string;
  success: string;
  fetchVehicles: () => Promise<void>;
  createVehicle: (vehicleData: Partial<Vehicle>) => Promise<boolean>;
  updateVehicle: (id: string, vehicleData: Partial<Vehicle>) => Promise<boolean>;
  deleteVehicle: (id: string) => Promise<boolean>;
  toggleVehicleStatus: (id: string, isActive: boolean) => Promise<boolean>;
  clearMessages: () => void;
}

export function useVehicles(): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    clearMessages();
    
    try {
      const response = await fetch('/api/transport/vehicles');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      const data = await response.json();
      setVehicles(Array.isArray(data.vehicles) ? data.vehicles : Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch vehicles';
      showMsg(errorMsg, true);
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, [clearMessages, showMsg]);

  const createVehicle = useCallback(async (vehicleData: Partial<Vehicle>) => {
    setSaving(true);
    clearMessages();
    
    try {
      const response = await fetch('/api/transport/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create vehicle');
      }
      
      const result = await response.json();
      setVehicles(prev => [...prev, result.vehicle || result]);
      showMsg('Vehicle created successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create vehicle';
      showMsg(errorMsg, true);
      console.error('Error creating vehicle:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [clearMessages, showMsg]);

  const updateVehicle = useCallback(async (id: string, vehicleData: Partial<Vehicle>) => {
    setSaving(true);
    clearMessages();
    
    try {
      const response = await fetch(`/api/transport/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update vehicle');
      }
      
      const result = await response.json();
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === id ? (result.vehicle || result) : vehicle
      ));
      showMsg('Vehicle updated successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update vehicle';
      showMsg(errorMsg, true);
      console.error('Error updating vehicle:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [clearMessages, showMsg]);

  const deleteVehicle = useCallback(async (id: string) => {
    setSaving(true);
    clearMessages();
    
    try {
      const response = await fetch(`/api/transport/vehicles/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete vehicle');
      }
      
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id));
      showMsg('Vehicle deleted successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete vehicle';
      showMsg(errorMsg, true);
      console.error('Error deleting vehicle:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [clearMessages, showMsg]);

  const toggleVehicleStatus = useCallback(async (id: string, isActive: boolean) => {
    return await updateVehicle(id, { isActive });
  }, [updateVehicle]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    saving,
    error,
    success,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleStatus,
    clearMessages
  };
}
