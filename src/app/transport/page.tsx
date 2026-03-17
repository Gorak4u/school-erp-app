// @ts-nocheck
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'routes', label: 'Routes', icon: '🗺️' },
  { id: 'vehicles', label: 'Vehicles', icon: '🚌' },
  { id: 'students', label: 'Students', icon: '👥' },
];

const VEHICLE_TYPES = ['bus', 'van', 'auto', 'minibus', 'tempo'];

export default function TransportPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bg = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const card = isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500';
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-xs font-semibold uppercase tracking-wide mb-2 ${subtext}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>({ totalRoutes: 0, totalVehicles: 0, totalStudents: 0, pendingTransportFees: 0 });
  const [statsRoutes, setStatsRoutes] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<Array<{id: string; year: string; name: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  // Forms
  const [routeForm, setRouteForm] = useState<any>({ routeNumber: '', routeName: '', description: '', stops: '', vehicleId: '', driverName: '', driverPhone: '', capacity: 40, monthlyFee: 0, academicYearId: '', isActive: true });
  const [vehicleForm, setVehicleForm] = useState<any>({ vehicleNumber: '', vehicleType: 'bus', capacity: 40, driverName: '', driverPhone: '', registrationNo: '', insuranceExpiry: '', fitnessExpiry: '' });
  const [assignForm, setAssignForm] = useState<any>({ studentSearch: '', studentId: '', routeId: '', pickupStop: '', dropStop: '', monthlyFee: 0 });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filters and Search
  const [routeSearch, setRouteSearch] = useState('');
  const [routeStatusFilter, setRouteStatusFilter] = useState('all');
  const [routeAYFilter, setRouteAYFilter] = useState('all');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentRouteFilter, setStudentRouteFilter] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
  };

  // Filter functions
  const filteredRoutes = routes.filter(r => {
    const matchesSearch = !routeSearch || 
      r.routeNumber.toLowerCase().includes(routeSearch.toLowerCase()) ||
      r.routeName.toLowerCase().includes(routeSearch.toLowerCase()) ||
      r.description?.toLowerCase().includes(routeSearch.toLowerCase());
    const matchesStatus = routeStatusFilter === 'all' || 
      (routeStatusFilter === 'active' && r.isActive) ||
      (routeStatusFilter === 'inactive' && !r.isActive);
    const matchesAY = routeAYFilter === 'all' || r.academicYearId === routeAYFilter;
    return matchesSearch && matchesStatus && matchesAY;
  });

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = !vehicleSearch ||
      v.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.driverName.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.registrationNo?.toLowerCase().includes(vehicleSearch.toLowerCase());
    const matchesType = vehicleTypeFilter === 'all' || v.vehicleType === vehicleTypeFilter;
    const matchesStatus = vehicleStatusFilter === 'all' ||
      (vehicleStatusFilter === 'active' && v.isActive) ||
      (vehicleStatusFilter === 'inactive' && !v.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredStudents = students.filter(s => {
    const matchesSearch = !studentSearch ||
      s.student?.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.student?.admissionNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.pickupStop.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesRoute = !studentRouteFilter || s.routeId === studentRouteFilter;
    const matchesStatus = studentStatusFilter === 'all' ||
      (studentStatusFilter === 'active' && s.isActive) ||
      (studentStatusFilter === 'inactive' && !s.isActive);
    return matchesSearch && matchesRoute && matchesStatus;
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/transport/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setStatsRoutes(data.routeUtilization || []);
      }
    } catch {}
  }, []);

  const fetchRoutes = useCallback(async () => {
    const res = await fetch('/api/transport/routes');
    if (res.ok) { const data = await res.json(); setRoutes(data.routes || []); }
  }, []);

  const fetchVehicles = useCallback(async () => {
    const res = await fetch('/api/transport/vehicles');
    if (res.ok) { const data = await res.json(); setVehicles(data.vehicles || []); }
  }, []);

  const fetchStudents = useCallback(async () => {
    const url = studentRouteFilter ? `/api/transport/students?routeId=${studentRouteFilter}&isActive=true` : '/api/transport/students?isActive=true';
    const res = await fetch(url);
    if (res.ok) { const data = await res.json(); setStudents(data.assignments || []); }
  }, [studentRouteFilter]);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const res = await fetch('/api/school-structure/academic-years');
      if (res.ok) {
        const data = await res.json();
        setAcademicYears(data.academicYears || []);
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
    }
  }, []);

  useEffect(() => { fetchStats(); fetchRoutes(); fetchVehicles(); fetchAcademicYears(); }, []);
  useEffect(() => { if (activeTab === 'students') fetchStudents(); }, [activeTab, studentRouteFilter]);

  const searchStudents = async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&pageSize=10`);
      if (res.ok) { const data = await res.json(); setSearchResults(data.students || []); }
    } finally { setSearchLoading(false); }
  };

  // ── Route CRUD ─────────────────────────────────────────────────────────────
  const openCreateRoute = () => {
    setEditingRoute(null);
    setRouteForm({ routeNumber: '', routeName: '', description: '', stops: '', vehicleId: '', driverName: '', driverPhone: '', capacity: 40, monthlyFee: 0, isActive: true });
    setShowRouteModal(true);
  };
  const openEditRoute = (r: any) => {
    setEditingRoute(r);
    const stopsArr = (() => { try { return JSON.parse(r.stops || '[]'); } catch { return []; } })();
    setRouteForm({ routeNumber: r.routeNumber, routeName: r.routeName, description: r.description || '', stops: stopsArr.join(', '), vehicleId: r.vehicleId || '', driverName: r.driverName || '', driverPhone: r.driverPhone || '', capacity: r.capacity, monthlyFee: r.monthlyFee, academicYearId: r.academicYearId || '', isActive: r.isActive });
    setShowRouteModal(true);
  };

  const copyRouteToNextAY = async (route: any) => {
    if (!route.academicYearId) {
      showMsg('Route has no academic year assigned', true); return;
    }
    
    // Find next academic year
    const currentAYIndex = academicYears.findIndex(ay => ay.id === route.academicYearId);
    if (currentAYIndex === -1 || currentAYIndex === academicYears.length - 1) {
      showMsg('No next academic year found', true); return;
    }
    
    const nextAY = academicYears[currentAYIndex + 1];
    
    // Check if route already exists in next AY
    const existingInNextAY = routes.find(r => 
      r.routeNumber === route.routeNumber && 
      r.academicYearId === nextAY.id
    );
    
    if (existingInNextAY) {
      showMsg(`Route ${route.routeNumber} already exists in ${nextAY.name || nextAY.year}`, true); return;
    }
    
    setSaving(true);
    try {
      const payload = {
        routeNumber: route.routeNumber,
        routeName: route.routeName,
        description: route.description || null,
        stops: JSON.parse(route.stops || '[]'),
        vehicleId: route.vehicleId || null,
        driverName: route.driverName || null,
        driverPhone: route.driverPhone || null,
        capacity: route.capacity,
        monthlyFee: route.monthlyFee,
        academicYearId: nextAY.id,
        isActive: true,
      };
      
      const res = await fetch('/api/transport/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) {
        showMsg(data.error || 'Failed to copy route', true);
        return;
      }
      
      showMsg(`Route copied to ${nextAY.name || nextAY.year}!`);
      fetchRoutes(); fetchStats();
    } finally {
      setSaving(false);
    }
  };
  const saveRoute = async () => {
    if (!routeForm.academicYearId) {
      showMsg('Please select an Academic Year', true); return;
    }
    setSaving(true);
    try {
      const stopsArray = routeForm.stops ? routeForm.stops.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const payload = { ...routeForm, stops: stopsArray, vehicleId: routeForm.vehicleId || null, capacity: Number(routeForm.capacity), monthlyFee: Number(routeForm.monthlyFee), academicYearId: routeForm.academicYearId };
      const url = editingRoute ? `/api/transport/routes/${editingRoute.id}` : '/api/transport/routes';
      const method = editingRoute ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || 'Failed to save route', true); return; }
      showMsg(editingRoute ? 'Route updated!' : 'Route created!');
      setShowRouteModal(false);
      fetchRoutes(); fetchStats();
    } finally { setSaving(false); }
  };
  const deleteRoute = async (id: string) => {
    if (!confirm('Delete this route?')) return;
    const res = await fetch(`/api/transport/routes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { showMsg(data.error || 'Failed to delete', true); return; }
    showMsg('Route deleted');
    fetchRoutes(); fetchStats();
  };

  // ── Vehicle CRUD ───────────────────────────────────────────────────────────
  const openCreateVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({ vehicleNumber: '', vehicleType: 'bus', capacity: 40, driverName: '', driverPhone: '', registrationNo: '', insuranceExpiry: '', fitnessExpiry: '' });
    setShowVehicleModal(true);
  };
  const openEditVehicle = (v: any) => {
    setEditingVehicle(v);
    setVehicleForm({ vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType, capacity: v.capacity, driverName: v.driverName, driverPhone: v.driverPhone, registrationNo: v.registrationNo || '', insuranceExpiry: v.insuranceExpiry || '', fitnessExpiry: v.fitnessExpiry || '' });
    setShowVehicleModal(true);
  };
  const saveVehicle = async () => {
    setSaving(true);
    try {
      const payload = { ...vehicleForm, capacity: Number(vehicleForm.capacity) };
      const url = editingVehicle ? `/api/transport/vehicles/${editingVehicle.id}` : '/api/transport/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || 'Failed to save vehicle', true); return; }
      showMsg(editingVehicle ? 'Vehicle updated!' : 'Vehicle added!');
      setShowVehicleModal(false);
      fetchVehicles(); fetchStats();
    } finally { setSaving(false); }
  };
  const deleteVehicle = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    const res = await fetch(`/api/transport/vehicles/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { showMsg(data.error || 'Failed to delete', true); return; }
    showMsg('Vehicle deleted');
    fetchVehicles();
  };

  // ── Student Assignment ─────────────────────────────────────────────────────
  const saveAssignment = async () => {
    if (!assignForm.studentId || !assignForm.routeId || !assignForm.pickupStop) {
      showMsg('Please fill all required fields', true); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/transport/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...assignForm, monthlyFee: Number(assignForm.monthlyFee), generateFeeRecord: true })
      });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || 'Failed to assign student', true); return; }
      showMsg('Student assigned to route! Transport fee record created.');
      setShowAssignModal(false);
      setAssignForm({ studentSearch: '', studentId: '', routeId: '', pickupStop: '', dropStop: '', monthlyFee: 0 });
      setSearchResults([]);
      fetchStudents(); fetchStats();
    } finally { setSaving(false); }
  };

  const removeAssignment = async (id: string) => {
    if (!confirm('Remove this student from transport?')) return;
    const res = await fetch(`/api/transport/students/${id}`, { method: 'DELETE' });
    if (!res.ok) { showMsg('Failed to remove', true); return; }
    showMsg('Student removed from transport');
    fetchStudents(); fetchStats();
  };

  const selectedRoute = routes.find(r => r.id === assignForm.routeId);

  return (
    <AppLayout currentPage="transport" title="Transport Management" theme={theme}>
      <div className={`min-h-screen ${bg} p-4 md:p-6`}>
        <div className="space-y-8 pb-8">
          {/* Modern Header */}
          <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-8 shadow-lg`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-green-600/20' : 'bg-green-100'}`}>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className={`text-3xl font-bold ${text}`}>Transport Management</h1>
                    <p className={`text-sm ${subtext} mt-1`}>
                      {loading ? 'Loading transport data...' : `Manage ${stats?.totalRoutes || 0} routes, ${stats?.totalVehicles || 0} vehicles, and ${stats?.totalStudents || 0} students`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}>
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Report
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Toast messages */}
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm flex items-center gap-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-500/10 border-b border-green-500/20 text-green-400 text-sm flex items-center gap-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          {/* Modern Tabs */}
          <div className={`rounded-2xl border p-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
            <div className="flex gap-1">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === t.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : theme === 'dark' 
                        ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── DASHBOARD ───────────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Modern Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${theme === 'dark' ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50' : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>Active Routes</p>
                      <p className={`text-3xl font-bold mt-2 ${text}`}>{stats?.totalRoutes || 0}</p>
                      <p className={`text-xs ${subtext} mt-1`}>Transport routes</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                      <span className="text-2xl">🗺️</span>
                    </div>
                  </div>
                </div>
                
                <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${theme === 'dark' ? 'bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50' : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>Vehicles</p>
                      <p className={`text-3xl font-bold mt-2 ${text}`}>{stats?.totalVehicles || 0}</p>
                      <p className={`text-xs ${subtext} mt-1`}>Total fleet</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-green-600/20' : 'bg-green-100'}`}>
                      <span className="text-2xl">🚌</span>
                    </div>
                  </div>
                </div>
                
                <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${theme === 'dark' ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>Students</p>
                      <p className={`text-3xl font-bold mt-2 ${text}`}>{stats?.totalStudents || 0}</p>
                      <p className={`text-xs ${subtext} mt-1`}>Using transport</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                      <span className="text-2xl">👥</span>
                    </div>
                  </div>
                </div>
                
                <div className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${theme === 'dark' ? 'bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/50' : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'}`}>Pending Fees</p>
                      <p className={`text-3xl font-bold mt-2 ${text}`}>₹{(stats?.pendingTransportFees || 0).toLocaleString('en-IN')}</p>
                      <p className={`text-xs ${subtext} mt-1`}>Outstanding</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-orange-600/20' : 'bg-orange-100'}`}>
                      <span className="text-2xl">💰</span>
                    </div>
                  </div>
                </div>
              </div>

            {/* Modern Route Utilization */}
            <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-6 shadow-lg`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${text}`}>Route Utilization</h3>
                  <p className={`text-sm ${subtext}`}>Monitor capacity and vehicle assignments</p>
                </div>
              </div>
              
              {statsRoutes.length === 0 ? (
                <div className={`text-center py-12 ${subtext}`}>
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <p className="font-medium">No routes configured yet</p>
                  <p className={`text-sm mt-1`}>Add routes from the Routes tab to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statsRoutes.map(r => (
                    <div key={r.id} className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                            <span className="text-lg">🗺️</span>
                          </div>
                          <div>
                            <h4 className={`font-medium ${text}`}>{r.routeNumber} — {r.routeName}</h4>
                            <p className={`text-sm ${subtext}`}>
                              {r.studentCount}/{r.capacity} students ({r.utilization}% capacity)
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          r.utilization >= 90 
                            ? 'bg-red-100 text-red-700' 
                            : r.utilization >= 70 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {r.utilization >= 90 ? 'Full' : r.utilization >= 70 ? 'High' : 'Available'}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              r.utilization >= 90 
                                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                : r.utilization >= 70 
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                                  : 'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                            style={{ width: `${Math.min(r.utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className={`text-sm ${subtext}`}>
                          {r.vehicle ? (
                            <span className="flex items-center gap-2">
                              <span>🚌</span>
                              <span>{r.vehicle.vehicleNumber} — {r.vehicle.driverName}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-orange-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <span>No vehicle assigned</span>
                            </span>
                          )}
                        </div>
                        <div className={`text-sm font-medium ${text}`}>
                          ₹{r.monthlyFee}/month
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ROUTES ──────────────────────────────────────────────────────── */}
        {activeTab === 'routes' && (
          <div className="space-y-6">
            {/* Modern Filters Section */}
            <div className={`rounded-2xl border ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} p-6 shadow-lg`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${text}`}>Search & Filters</h3>
                  <p className={`text-sm ${subtext}`}>Find routes quickly</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-xs font-medium mb-2 ${subtext}`}>Search Routes</label>
                  <input
                    type="text"
                    placeholder="Route number, name, description..."
                    value={routeSearch}
                    onChange={(e) => setRouteSearch(e.target.value)}
                    className={`${input} rounded-xl`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-2 ${subtext}`}>Academic Year</label>
                  <select value={routeAYFilter} onChange={(e) => setRouteAYFilter(e.target.value)} className={`${input} rounded-xl`}>
                    <option value="all">All Years</option>
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.id}>{ay.name || ay.year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-2 ${subtext}`}>Status</label>
                  <select value={routeStatusFilter} onChange={(e) => setRouteStatusFilter(e.target.value)} className={`${input} rounded-xl`}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button 
                    onClick={() => { setRouteSearch(''); setRouteAYFilter('all'); setRouteStatusFilter('all'); }}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      theme === 'dark' 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Clear
                  </button>
                  <button 
                    onClick={openCreateRoute} 
                    className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Route
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className={`text-sm ${subtext}`}>
                  Showing {filteredRoutes.length} of {routes.length} routes
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border overflow-hidden shadow-lg ${card}`}>
              {filteredRoutes.length === 0 ? (
                <div className={`p-8 text-center ${subtext}`}>No routes found. Create your first transport route.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}>
                      {['Route #', 'Name', 'Academic Year', 'Vehicle / Driver', 'Stops', 'Students', 'Monthly Fee', 'Status', 'Actions'].map(h => (
                        <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase ${subtext}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map(r => {
                      const stopsArr = (() => { try { return JSON.parse(r.stops || '[]'); } catch { return []; } })();
                      return (
                        <tr key={r.id} className={`border-t ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <td className={`px-4 py-3 font-medium ${text}`}>{r.routeNumber}</td>
                          <td className={`px-4 py-3 ${text}`}>{r.routeName}<br /><span className={`text-xs ${subtext}`}>{r.description}</span></td>
                          <td className={`px-4 py-3 ${subtext} text-xs`}>
                            {(() => {
                              const ay = academicYears.find(a => a.id === r.academicYearId);
                              return ay ? (ay.name || ay.year) : '—';
                            })()}
                          </td>
                          <td className={`px-4 py-3 ${subtext} text-xs`}>
                            {r.vehicle ? <><span className={text}>{r.vehicle.vehicleNumber}</span><br />{r.vehicle.driverName}</> : (r.driverName || '—')}
                          </td>
                          <td className={`px-4 py-3 ${subtext} text-xs`}>{stopsArr.length > 0 ? stopsArr.slice(0, 3).join(', ') + (stopsArr.length > 3 ? ` +${stopsArr.length - 3}` : '') : '—'}</td>
                          <td className={`px-4 py-3 ${text}`}>{r.students?.length || 0}</td>
                          <td className={`px-4 py-3 ${text}`}>₹{r.monthlyFee}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {r.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => openEditRoute(r)} className={`px-3 py-2 text-xs rounded-xl border ${btnSecondary}`}>Edit</button>
                              <button onClick={() => copyRouteToNextAY(r)} disabled={saving} className={`px-3 py-2 text-xs rounded-xl border ${btnSecondary} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {saving ? 'Copying...' : 'Copy to Next AY'}
                              </button>
                              <button onClick={() => deleteRoute(r.id)} className={btnDanger}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── VEHICLES ────────────────────────────────────────────────────── */}
        {activeTab === 'vehicles' && (
          <div>
            {/* Search and Filters */}
            <div className={`rounded-xl border p-4 mb-4 ${card}`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={label}>Search Vehicles</label>
                  <input
                    type="text"
                    placeholder="Vehicle number, driver, registration..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>Vehicle Type</label>
                  <select value={vehicleTypeFilter} onChange={(e) => setVehicleTypeFilter(e.target.value)} className={input}>
                    <option value="all">All Types</option>
                    {VEHICLE_TYPES.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Status</label>
                  <select value={vehicleStatusFilter} onChange={(e) => setVehicleStatusFilter(e.target.value)} className={input}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button 
                    onClick={() => { setVehicleSearch(''); setVehicleTypeFilter('all'); setVehicleStatusFilter('all'); }}
                    className={btnSecondary}
                  >
                    Clear Filters
                  </button>
                  <button onClick={openCreateVehicle} className={btnPrimary}>+ Add Vehicle</button>
                </div>
              </div>
              <div className={`text-xs ${subtext} mt-2`}>
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
              </div>
            </div>

            <div className={`rounded-2xl border overflow-hidden shadow-lg ${card}`}>
              {filteredVehicles.length === 0 ? (
                <div className={`p-8 text-center ${subtext}`}>No vehicles found. Add your first vehicle.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}>
                      {['Vehicle No.', 'Type', 'Driver', 'Capacity', 'Routes', 'Insurance Expiry', 'Status', 'Actions'].map(h => (
                        <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase ${subtext}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map(v => (
                      <tr key={v.id} className={`border-t ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <td className={`px-4 py-3 font-medium ${text}`}>{v.vehicleNumber}</td>
                        <td className={`px-4 py-3 capitalize ${subtext}`}>{v.vehicleType}</td>
                        <td className={`px-4 py-3 ${text}`}>{v.driverName}<br /><span className={`text-xs ${subtext}`}>{v.driverPhone}</span></td>
                        <td className={`px-4 py-3 ${text}`}>{v.capacity}</td>
                        <td className={`px-4 py-3 ${subtext} text-xs`}>{v.routes?.length ? v.routes.map((r: any) => r.routeNumber).join(', ') : '—'}</td>
                        <td className={`px-4 py-3 text-xs ${v.insuranceExpiry && new Date(v.insuranceExpiry) < new Date() ? 'text-red-500 font-medium' : subtext}`}>
                          {v.insuranceExpiry || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {v.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEditVehicle(v)} className={`px-3 py-2 text-xs rounded-xl border ${btnSecondary}`}>Edit</button>
                            <button onClick={() => deleteVehicle(v.id)} className={btnDanger}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── STUDENTS ────────────────────────────────────────────────────── */}
        {activeTab === 'students' && (
          <div>
            {/* Search and Filters */}
            <div className={`rounded-xl border p-4 mb-4 ${card}`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={label}>Search Students</label>
                  <input
                    type="text"
                    placeholder="Name, admission no, pickup stop..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>Filter by Route</label>
                  <select
                    value={studentRouteFilter}
                    onChange={e => setStudentRouteFilter(e.target.value)}
                    className={input}
                  >
                    <option value="">All Routes</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.routeNumber} — {r.routeName}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Status</label>
                  <select value={studentStatusFilter} onChange={(e) => setStudentStatusFilter(e.target.value)} className={input}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button 
                    onClick={() => { setStudentSearch(''); setStudentRouteFilter(''); setStudentStatusFilter('all'); }}
                    className={btnSecondary}
                  >
                    Clear Filters
                  </button>
                  <button onClick={() => { setAssignForm({ studentSearch: '', studentId: '', routeId: '', pickupStop: '', dropStop: '', monthlyFee: 0 }); setSearchResults([]); setShowAssignModal(true); }} className={btnPrimary}>
                    + Assign Student
                  </button>
                </div>
              </div>
              <div className={`text-xs ${subtext} mt-2`}>
                Showing {filteredStudents.length} of {students.length} student assignments
              </div>
            </div>

            <div className={`rounded-2xl border overflow-hidden shadow-lg ${card}`}>
              {filteredStudents.length === 0 ? (
                <div className={`p-8 text-center ${subtext}`}>No student transport assignments found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}>
                      {['Student', 'Class', 'Route', 'Pickup Stop', 'Monthly Fee', 'Assigned', 'Actions'].map(h => (
                        <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase ${subtext}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(a => (
                      <tr key={a.id} className={`border-t ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <td className={`px-4 py-3 ${text}`}>
                          {a.student?.name}<br />
                          <span className={`text-xs ${subtext}`}>{a.student?.admissionNo}</span>
                        </td>
                        <td className={`px-4 py-3 ${subtext}`}>{a.student?.class} {a.student?.section}</td>
                        <td className={`px-4 py-3 ${text}`}>
                          {a.route?.routeNumber}<br />
                          <span className={`text-xs ${subtext}`}>{a.route?.routeName}</span>
                        </td>
                        <td className={`px-4 py-3 ${subtext}`}>{a.pickupStop}</td>
                        <td className={`px-4 py-3 ${text}`}>₹{a.monthlyFee}</td>
                        <td className={`px-4 py-3 text-xs ${subtext}`}>{new Date(a.assignedAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeAssignment(a.id)} className={btnDanger}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── ROUTE MODAL ─────────────────────────────────────────────────── */}
        {showRouteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowRouteModal(false)}>
            <div className={`relative w-full max-w-xl rounded-2xl border overflow-hidden shadow-2xl ${card} z-10 max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
              <div className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${text}`}>{editingRoute ? 'Edit Route' : 'New Transport Route'}</h3>
                    <p className={`text-xs ${subtext}`}>{editingRoute ? 'Update route details' : 'Create a new transport route'}</p>
                  </div>
                </div>
                <button onClick={() => setShowRouteModal(false)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={label}>Route Number *</label><input className={input} value={routeForm.routeNumber} onChange={e => setRouteForm({ ...routeForm, routeNumber: e.target.value })} placeholder="R001" /></div>
                <div><label className={label}>Route Name *</label><input className={input} value={routeForm.routeName} onChange={e => setRouteForm({ ...routeForm, routeName: e.target.value })} placeholder="Main Road Route" /></div>
                <div className="col-span-2"><label className={label}>Description</label><input className={input} value={routeForm.description} onChange={e => setRouteForm({ ...routeForm, description: e.target.value })} placeholder="Route description" /></div>
                <div className="col-span-2">
                  <label className={label}>Stops (comma separated)</label>
                  <input className={input} value={routeForm.stops} onChange={e => setRouteForm({ ...routeForm, stops: e.target.value })} placeholder="Stop 1, Stop 2, Stop 3" />
                </div>
                <div>
                  <label className={label}>Assign Vehicle</label>
                  <select className={input} value={routeForm.vehicleId} onChange={e => setRouteForm({ ...routeForm, vehicleId: e.target.value })}>
                    <option value="">No vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber} — {v.driverName}</option>)}
                  </select>
                </div>
                <div><label className={label}>Capacity</label><input type="number" className={input} value={routeForm.capacity} onChange={e => setRouteForm({ ...routeForm, capacity: e.target.value })} /></div>
                <div><label className={label}>Monthly Fee (₹)</label><input type="number" className={input} value={routeForm.monthlyFee} onChange={e => setRouteForm({ ...routeForm, monthlyFee: e.target.value })} /></div>
                <div>
                  <label className={label}>Academic Year *</label>
                  <select className={input} value={routeForm.academicYearId} onChange={e => setRouteForm({ ...routeForm, academicYearId: e.target.value })}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name || ay.year}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Status</label>
                  <select className={input} value={routeForm.isActive.toString()} onChange={e => setRouteForm({ ...routeForm, isActive: e.target.value === 'true' })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                {!routeForm.vehicleId && <>
                  <div><label className={label}>Driver Name</label><input className={input} value={routeForm.driverName} onChange={e => setRouteForm({ ...routeForm, driverName: e.target.value })} /></div>
                  <div><label className={label}>Driver Phone</label><input className={input} value={routeForm.driverPhone} onChange={e => setRouteForm({ ...routeForm, driverPhone: e.target.value })} /></div>
                </>}
              </div>
              </div>
              <div className={`px-6 py-4 border-t flex gap-3 flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button onClick={saveRoute} disabled={saving} className={`flex-1 ${btnPrimary} justify-center flex items-center gap-2`}>
                  {saving ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving...</> : 'Save Route'}
                </button>
                <button onClick={() => setShowRouteModal(false)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── VEHICLE MODAL ───────────────────────────────────────────────── */}
        {showVehicleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowVehicleModal(false)}>
            <div className={`relative w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl ${card} z-10 max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
              <div className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${text}`}>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
                    <p className={`text-xs ${subtext}`}>{editingVehicle ? 'Update vehicle details' : 'Register a new vehicle'}</p>
                  </div>
                </div>
                <button onClick={() => setShowVehicleModal(false)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={label}>Vehicle Number *</label><input className={input} value={vehicleForm.vehicleNumber} onChange={e => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })} placeholder="KA01AB1234" /></div>
                <div>
                  <label className={label}>Type</label>
                  <select className={input} value={vehicleForm.vehicleType} onChange={e => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}>
                    {VEHICLE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div><label className={label}>Capacity</label><input type="number" className={input} value={vehicleForm.capacity} onChange={e => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} /></div>
                <div><label className={label}>Registration No.</label><input className={input} value={vehicleForm.registrationNo} onChange={e => setVehicleForm({ ...vehicleForm, registrationNo: e.target.value })} /></div>
                <div><label className={label}>Driver Name *</label><input className={input} value={vehicleForm.driverName} onChange={e => setVehicleForm({ ...vehicleForm, driverName: e.target.value })} /></div>
                <div><label className={label}>Driver Phone *</label><input className={input} value={vehicleForm.driverPhone} onChange={e => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })} /></div>
                <div><label className={label}>Insurance Expiry</label><input type="date" className={input} value={vehicleForm.insuranceExpiry} onChange={e => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })} /></div>
                <div><label className={label}>Fitness Expiry</label><input type="date" className={input} value={vehicleForm.fitnessExpiry} onChange={e => setVehicleForm({ ...vehicleForm, fitnessExpiry: e.target.value })} /></div>
              </div>
              </div>
              <div className={`px-6 py-4 border-t flex gap-3 flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button onClick={saveVehicle} disabled={saving} className={`flex-1 ${btnPrimary} justify-center flex items-center gap-2`}>
                  {saving ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving...</> : 'Save Vehicle'}
                </button>
                <button onClick={() => setShowVehicleModal(false)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ASSIGN STUDENT MODAL ────────────────────────────────────────── */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}>
            <div className={`relative w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl ${card} z-10 max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
              <div className={`px-6 py-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${text}`}>Assign Student to Route</h3>
                    <p className={`text-xs ${subtext}`}>Auto-creates transport fee record in fee collection</p>
                  </div>
                </div>
                <button onClick={() => setShowAssignModal(false)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">

              {/* Student search */}
              <div className="mb-4">
                <label className={label}>Search Student *</label>
                <input
                  className={input}
                  value={assignForm.studentSearch}
                  onChange={e => {
                    setAssignForm({ ...assignForm, studentSearch: e.target.value, studentId: '' });
                    searchStudents(e.target.value);
                  }}
                  placeholder="Search by name or admission no..."
                />
                {searchLoading && <p className={`text-xs mt-1 ${subtext}`}>Searching...</p>}
                {searchResults.length > 0 && !assignForm.studentId && (
                  <div className={`mt-1 border rounded-xl overflow-hidden ${card} shadow-lg`}>
                    {searchResults.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setAssignForm({ ...assignForm, studentId: s.id, studentSearch: `${s.name} (${s.admissionNo})` }); setSearchResults([]); }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${text}`}
                      >
                        {s.name} <span className={subtext}>({s.admissionNo}) — {s.class} {s.section}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={label}>Route *</label>
                  <select className={input} value={assignForm.routeId} onChange={e => {
                    const r = routes.find(x => x.id === e.target.value);
                    setAssignForm({ ...assignForm, routeId: e.target.value, monthlyFee: r?.monthlyFee || 0 });
                  }}>
                    <option value="">Select route...</option>
                    {routes.filter(r => r.isActive).map(r => <option key={r.id} value={r.id}>{r.routeNumber} — {r.routeName} (₹{r.monthlyFee}/mo)</option>)}
                  </select>
                </div>
                {selectedRoute && (() => {
                  const stops = (() => { try { return JSON.parse(selectedRoute.stops || '[]'); } catch { return []; } })();
                  return stops.length > 0 ? <>
                    <div>
                      <label className={label}>Pickup Stop *</label>
                      <select className={input} value={assignForm.pickupStop} onChange={e => setAssignForm({ ...assignForm, pickupStop: e.target.value })}>
                        <option value="">Select stop...</option>
                        {stops.map((s: string) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={label}>Drop Stop</label>
                      <select className={input} value={assignForm.dropStop} onChange={e => setAssignForm({ ...assignForm, dropStop: e.target.value })}>
                        <option value="">Same as pickup</option>
                        {stops.map((s: string) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </> : <>
                    <div><label className={label}>Pickup Stop *</label><input className={input} value={assignForm.pickupStop} onChange={e => setAssignForm({ ...assignForm, pickupStop: e.target.value })} placeholder="Enter stop name" /></div>
                    <div><label className={label}>Drop Stop</label><input className={input} value={assignForm.dropStop} onChange={e => setAssignForm({ ...assignForm, dropStop: e.target.value })} placeholder="Enter stop name" /></div>
                  </>;
                })()}
                <div>
                  <label className={label}>Monthly Fee (₹)</label>
                  <input type="number" className={input} value={assignForm.monthlyFee} onChange={e => setAssignForm({ ...assignForm, monthlyFee: e.target.value })} />
                </div>
              </div>
              <div className={`mt-4 p-3 rounded-xl text-xs ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                ✅ A transport FeeRecord will be auto-created. It will appear in <strong>Fee Collection</strong>, <strong>Receipts</strong>, and <strong>Promotion Arrears</strong>.
              </div>
              </div>
              <div className={`px-6 py-4 border-t flex gap-3 flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button onClick={saveAssignment} disabled={saving} className={`flex-1 ${btnPrimary} justify-center flex items-center gap-2`}>
                  {saving ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Assigning...</> : 'Assign & Create Fee'}
                </button>
                <button onClick={() => setShowAssignModal(false)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}
