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

  const bg = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const card = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subtext = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const input = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const label = `block text-xs font-semibold uppercase tracking-wide mb-1 ${subtext}`;
  const btnPrimary = 'px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors';
  const btnSecondary = `px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = 'px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors';

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
  const [routeForm, setRouteForm] = useState<any>({ routeNumber: '', routeName: '', description: '', stops: '', vehicleId: '', driverName: '', driverPhone: '', capacity: 40, monthlyFee: 0, isActive: true });
  const [vehicleForm, setVehicleForm] = useState<any>({ vehicleNumber: '', vehicleType: 'bus', capacity: 40, driverName: '', driverPhone: '', registrationNo: '', insuranceExpiry: '', fitnessExpiry: '' });
  const [assignForm, setAssignForm] = useState<any>({ studentSearch: '', studentId: '', routeId: '', pickupStop: '', dropStop: '', monthlyFee: 0 });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Student filter
  const [studentRouteFilter, setStudentRouteFilter] = useState('');

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(''), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/transport/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setStatsRoutes(data.routes || []);
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

  useEffect(() => { fetchStats(); fetchRoutes(); fetchVehicles(); }, []);
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
    setRouteForm({ routeNumber: r.routeNumber, routeName: r.routeName, description: r.description || '', stops: stopsArr.join(', '), vehicleId: r.vehicleId || '', driverName: r.driverName || '', driverPhone: r.driverPhone || '', capacity: r.capacity, monthlyFee: r.monthlyFee, isActive: r.isActive });
    setShowRouteModal(true);
  };
  const saveRoute = async () => {
    setSaving(true);
    try {
      const stopsArray = routeForm.stops ? routeForm.stops.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const payload = { ...routeForm, stops: stopsArray, vehicleId: routeForm.vehicleId || null, capacity: Number(routeForm.capacity), monthlyFee: Number(routeForm.monthlyFee) };
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>🚌 Transport Management</h1>
            <p className={`text-sm mt-1 ${subtext}`}>Manage routes, vehicles, and student assignments</p>
          </div>
        </div>

        {/* Toast messages */}
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 text-sm">{success}</div>}

        {/* Tabs */}
        <div className={`flex gap-1 p-1 rounded-xl mb-6 border ${card}`}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ───────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Routes', value: stats.totalRoutes, icon: '🗺️', color: 'blue' },
                { label: 'Vehicles', value: stats.totalVehicles, icon: '🚌', color: 'green' },
                { label: 'Students', value: stats.totalStudents, icon: '👥', color: 'purple' },
                { label: 'Pending Fees', value: `₹${(stats.pendingTransportFees || 0).toLocaleString('en-IN')}`, icon: '💰', color: 'orange' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl border p-4 ${card}`}>
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className={`text-2xl font-bold ${text}`}>{s.value}</div>
                  <div className={`text-xs ${subtext} mt-1`}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Route utilization */}
            <div className={`rounded-xl border p-5 ${card}`}>
              <h3 className={`text-sm font-bold mb-4 ${text}`}>Route Utilization</h3>
              {statsRoutes.length === 0 ? (
                <p className={`text-sm ${subtext}`}>No routes configured yet. Add routes from the Routes tab.</p>
              ) : (
                <div className="space-y-3">
                  {statsRoutes.map(r => (
                    <div key={r.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-medium ${text}`}>{r.routeNumber} — {r.routeName}</span>
                        <span className={`text-xs ${subtext}`}>{r.studentCount}/{r.capacity} students ({r.utilization}%)</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${r.utilization >= 90 ? 'bg-red-500' : r.utilization >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(r.utilization, 100)}%` }}
                        />
                      </div>
                      <div className={`text-xs ${subtext} mt-0.5`}>
                        {r.vehicle ? `🚌 ${r.vehicle.vehicleNumber} — ${r.vehicle.driverName}` : 'No vehicle assigned'} · ₹{r.monthlyFee}/month
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
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={openCreateRoute} className={btnPrimary}>+ Add Route</button>
            </div>
            <div className={`rounded-xl border overflow-hidden ${card}`}>
              {routes.length === 0 ? (
                <div className={`p-8 text-center ${subtext}`}>No routes found. Create your first transport route.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className={theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}>
                      {['Route #', 'Name', 'Vehicle / Driver', 'Stops', 'Students', 'Monthly Fee', 'Status', 'Actions'].map(h => (
                        <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase ${subtext}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map(r => {
                      const stopsArr = (() => { try { return JSON.parse(r.stops || '[]'); } catch { return []; } })();
                      return (
                        <tr key={r.id} className={`border-t ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <td className={`px-4 py-3 font-medium ${text}`}>{r.routeNumber}</td>
                          <td className={`px-4 py-3 ${text}`}>{r.routeName}<br /><span className={`text-xs ${subtext}`}>{r.description}</span></td>
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
                            <div className="flex gap-2">
                              <button onClick={() => openEditRoute(r)} className={`px-3 py-1.5 text-xs rounded-lg border ${btnSecondary}`}>Edit</button>
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
            <div className="flex justify-end mb-4">
              <button onClick={openCreateVehicle} className={btnPrimary}>+ Add Vehicle</button>
            </div>
            <div className={`rounded-xl border overflow-hidden ${card}`}>
              {vehicles.length === 0 ? (
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
                    {vehicles.map(v => (
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
                            <button onClick={() => openEditVehicle(v)} className={`px-3 py-1.5 text-xs rounded-lg border ${btnSecondary}`}>Edit</button>
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
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <select
                value={studentRouteFilter}
                onChange={e => setStudentRouteFilter(e.target.value)}
                className={`${input} w-auto min-w-[200px]`}
              >
                <option value="">All Routes</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.routeNumber} — {r.routeName}</option>)}
              </select>
              <button onClick={() => { setAssignForm({ studentSearch: '', studentId: '', routeId: '', pickupStop: '', dropStop: '', monthlyFee: 0 }); setSearchResults([]); setShowAssignModal(true); }} className={btnPrimary}>
                + Assign Student
              </button>
            </div>
            <div className={`rounded-xl border overflow-hidden ${card}`}>
              {students.length === 0 ? (
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
                    {students.map(a => (
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowRouteModal(false)} />
            <div className={`relative w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${card} z-10 max-h-[90vh] overflow-y-auto`}>
              <h3 className={`text-lg font-bold mb-5 ${text}`}>{editingRoute ? 'Edit Route' : 'New Transport Route'}</h3>
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
              <div className="flex gap-3 mt-6">
                <button onClick={saveRoute} disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : 'Save Route'}</button>
                <button onClick={() => setShowRouteModal(false)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── VEHICLE MODAL ───────────────────────────────────────────────── */}
        {showVehicleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowVehicleModal(false)} />
            <div className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${card} z-10 max-h-[90vh] overflow-y-auto`}>
              <h3 className={`text-lg font-bold mb-5 ${text}`}>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
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
              <div className="flex gap-3 mt-6">
                <button onClick={saveVehicle} disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : 'Save Vehicle'}</button>
                <button onClick={() => setShowVehicleModal(false)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── ASSIGN STUDENT MODAL ────────────────────────────────────────── */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAssignModal(false)} />
            <div className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${card} z-10 max-h-[90vh] overflow-y-auto`}>
              <h3 className={`text-lg font-bold mb-5 ${text}`}>Assign Student to Route</h3>
              <p className={`text-xs ${subtext} mb-4`}>A transport fee record will be auto-created and will appear in fee collection, receipts, and promotion arrears.</p>

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
                  <div className={`mt-1 border rounded-lg overflow-hidden ${card} shadow-lg`}>
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
              <div className={`mt-4 p-3 rounded-lg text-xs ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                ✅ A transport FeeRecord will be auto-created. It will appear in <strong>Fee Collection</strong>, <strong>Receipts</strong>, and <strong>Promotion Arrears</strong>.
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={saveAssignment} disabled={saving} className={btnPrimary}>{saving ? 'Assigning...' : 'Assign & Create Fee'}</button>
                <button onClick={() => setShowAssignModal(false)} className={btnSecondary}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
