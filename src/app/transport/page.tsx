'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

// Import extracted components
import { TransportDashboard } from '@/components/transport/TransportDashboard';
import { RouteList, RouteForm, RouteFilters } from '@/components/transport/RouteManagement';
import { VehicleList, VehicleForm, VehicleFilters } from '@/components/transport/VehicleManagement';
import { AssignmentList, AssignmentForm, BulkAssignment } from '@/components/transport/StudentAssignment';
import TransportRefunds from '@/components/transport/TransportRefunds';

// Import custom hooks
import { 
  useTransportStats, 
  useRoutes, 
  useVehicles, 
  useStudentAssignments 
} from '@/hooks/transport';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'routes', label: 'Routes', icon: '🗺️' },
  { id: 'vehicles', label: 'Vehicles', icon: '🚌' },
  { id: 'students', label: 'Students', icon: '👥' },
  { id: 'refunds', label: 'Refunds', icon: '💸' },
];

export default function TransportPageRefactored() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme classes
  const bg = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const card = isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500';
  const input = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDark ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const label = `block text-xs font-semibold uppercase tracking-wide mb-2 ${subtext}`;
  const btnPrimary = `px-5 py-2.5 rounded-xl text-sm font-medium transition-all transform hover:scale-105 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`;
  const btnSecondary = `px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const btnDanger = `px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105 ${isDark ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`;

  // Tab state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Custom hooks
  const { stats, statsRoutes, loading: statsLoading } = useTransportStats();
  const { 
    routes, 
    loading: routesLoading, 
    saving: savingRoute, 
    createRoute, 
    updateRoute, 
    deleteRoute, 
    toggleRouteStatus,
    error: routeError,
    success: routeSuccess 
  } = useRoutes();
  const { 
    vehicles, 
    loading: vehiclesLoading, 
    saving: savingVehicle, 
    createVehicle, 
    updateVehicle, 
    deleteVehicle, 
    toggleVehicleStatus,
    error: vehicleError,
    success: vehicleSuccess 
  } = useVehicles();
  const { 
    students, 
    loading: studentsLoading, 
    saving: savingStudent, 
    searchLoading,
    searchResults,
    createAssignment, 
    updateAssignment, 
    deleteAssignment, 
    toggleAssignmentStatus,
    searchStudents,
    bulkAssignStudents,
    error: studentError,
    success: studentSuccess,
    pagination,
    nextPage,
    prevPage,
    goToPage,
    changePageSize
  } = useStudentAssignments();

  // Modal states
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  // Form states
  const [routeForm, setRouteForm] = useState<any>({ 
    routeNumber: '', 
    routeName: '', 
    description: '', 
    stops: '', 
    vehicleId: '', 
    driverName: '', 
    driverPhone: '', 
    capacity: 40, 
    monthlyFee: 0, 
    yearlyFee: 0, 
    academicYearId: '', 
    isActive: true 
  });
  
  const [vehicleForm, setVehicleForm] = useState<any>({ 
    vehicleNumber: '', 
    vehicleType: 'bus', 
    capacity: 40, 
    driverName: '', 
    driverPhone: '', 
    registrationNo: '', 
    insuranceExpiry: '', 
    fitnessExpiry: '',
    isActive: true
  });
  
  const [assignForm, setAssignForm] = useState<any>({ 
    studentSearch: '', 
    studentId: '', 
    studentName: '',
    studentAdmissionNo: '',
    routeId: '', 
    pickupStop: '', 
    dropStop: '', 
    monthlyFee: 0,
    isActive: true
  });

  // Filter states
  const [routeSearch, setRouteSearch] = useState('');
  const [routeStatusFilter, setRouteStatusFilter] = useState('all');
  const [routeAYFilter, setRouteAYFilter] = useState('all');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');

  // Filter functions
  const filteredRoutes = (routes || []).filter(r => {
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

  const filteredVehicles = (vehicles || []).filter(v => {
    const matchesSearch = !vehicleSearch ||
      v.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      (v.driverName && v.driverName.toLowerCase().includes(vehicleSearch.toLowerCase())) ||
      (v.registrationNo && v.registrationNo.toLowerCase().includes(vehicleSearch.toLowerCase()));
    const matchesType = vehicleTypeFilter === 'all' || v.vehicleType === vehicleTypeFilter;
    const matchesStatus = vehicleStatusFilter === 'all' ||
      (vehicleStatusFilter === 'active' && v.isActive) ||
      (vehicleStatusFilter === 'inactive' && !v.isActive);
    return matchesSearch && matchesType && matchesStatus;
  });

  // Route handlers
  const handleSaveRoute = async () => {
    const success = editingRoute 
      ? await updateRoute(editingRoute.id, routeForm)
      : await createRoute(routeForm);
    
    if (success) {
      setShowRouteModal(false);
      setEditingRoute(null);
      setRouteForm({ 
        routeNumber: '', 
        routeName: '', 
        description: '', 
        stops: '', 
        vehicleId: '', 
        driverName: '', 
        driverPhone: '', 
        capacity: 40, 
        monthlyFee: 0, 
        yearlyFee: 0, 
        academicYearId: '', 
        isActive: true 
      });
    }
  };

  const handleEditRoute = (route: any) => {
    setEditingRoute(route);
    setRouteForm(route);
    setShowRouteModal(true);
  };

  const handleDeleteRoute = async (id: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      await deleteRoute(id);
    }
  };

  // Vehicle handlers
  const handleSaveVehicle = async () => {
    const success = editingVehicle 
      ? await updateVehicle(editingVehicle.id, vehicleForm)
      : await createVehicle(vehicleForm);
    
    if (success) {
      setShowVehicleModal(false);
      setEditingVehicle(null);
      setVehicleForm({ 
        vehicleNumber: '', 
        vehicleType: 'bus', 
        capacity: 40, 
        driverName: '', 
        driverPhone: '', 
        registrationNo: '', 
        insuranceExpiry: '', 
        fitnessExpiry: '',
        isActive: true
      });
    }
  };

  const handleEditVehicle = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setVehicleForm(vehicle);
    setShowVehicleModal(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      await deleteVehicle(id);
    }
  };

  // Assignment handlers
  const handleSaveAssignment = async () => {
    const success = editingAssignment 
      ? await updateAssignment(editingAssignment.id, assignForm)
      : await createAssignment(assignForm);
    
    if (success) {
      setShowAssignModal(false);
      setEditingAssignment(null);
      setAssignForm({ 
        studentSearch: '', 
        studentId: '', 
        studentName: '',
        studentAdmissionNo: '',
        routeId: '', 
        pickupStop: '', 
        dropStop: '', 
        monthlyFee: 0,
        isActive: true
      });
    }
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setAssignForm({
      ...assignment,
      studentSearch: assignment.student?.name || '',
      studentName: assignment.student?.name || '',
      studentAdmissionNo: assignment.student?.admissionNo || ''
    });
    setShowAssignModal(true);
  };

  const handleDeleteAssignment = async (id: string) => {
    if (confirm('Are you sure you want to remove this student assignment?')) {
      await deleteAssignment(id);
    }
  };

  const handleTransportCancelled = (result: any) => {
    // Refresh the students list after transport cancellation
    // This will trigger a refetch of the student assignments
    window.location.reload();
  };

  const handleSelectStudent = (student: any) => {
    setAssignForm((prev: any) => ({
      ...prev,
      studentId: student.id,
      studentName: student.name,
      studentAdmissionNo: student.admissionNo,
      studentSearch: student.name
    }));
  };

  const handleBulkAssign = async (routeId: string, studentIds: string[]) => {
    const success = await bulkAssignStudents(routeId, studentIds);
    if (success) {
      setShowBulkModal(false);
    }
  };

  // Clear filters
  const clearRouteFilters = () => {
    setRouteSearch('');
    setRouteStatusFilter('all');
    setRouteAYFilter('all');
  };

  const clearVehicleFilters = () => {
    setVehicleSearch('');
    setVehicleTypeFilter('all');
    setVehicleStatusFilter('all');
  };

  return (
    <AppLayout currentPage="transport">
      <div className={`min-h-screen ${bg}`}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${text} mb-2`}>Transport Management</h1>
            <p className={subtext}>Manage school transport routes, vehicles, and student assignments</p>
          </div>

          {/* Tabs */}
          <div className={`flex space-x-1 mb-8 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-xl p-1`}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {(routeError || vehicleError || studentError) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-red-600/20 border border-red-600/30 text-red-400' : 'bg-red-100 border border-red-200 text-red-600'}`}
              >
                {routeError || vehicleError || studentError}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(routeSuccess || vehicleSuccess || studentSuccess) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-green-600/20 border border-green-600/30 text-green-400' : 'bg-green-100 border border-green-200 text-green-600'}`}
              >
                {routeSuccess || vehicleSuccess || studentSuccess}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Content */}
          <div className="transition-all duration-300">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <TransportDashboard
                stats={stats}
                statsRoutes={statsRoutes}
                vehicles={vehicles}
                isDark={isDark}
                card={card}
                text={text}
                subtext={subtext}
                btnPrimary={btnPrimary}
              />
            )}

            {/* Routes Tab */}
            {activeTab === 'routes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className={`text-2xl font-bold ${text}`}>Route Management</h2>
                  <button
                    onClick={() => {
                      setEditingRoute(null);
                      setRouteForm({ 
                        routeNumber: '', 
                        routeName: '', 
                        description: '', 
                        stops: '', 
                        vehicleId: '', 
                        driverName: '', 
                        driverPhone: '', 
                        capacity: 40, 
                        monthlyFee: 0, 
                        yearlyFee: 0, 
                        academicYearId: '', 
                        isActive: true 
                      });
                      setShowRouteModal(true);
                    }}
                    className={btnPrimary}
                  >
                    Add Route
                  </button>
                </div>

                <RouteFilters
                  search={routeSearch}
                  statusFilter={routeStatusFilter}
                  academicYearFilter={routeAYFilter}
                  academicYears={[]} // TODO: Get from API
                  isDark={isDark}
                  input={input}
                  label={label}
                  btnSecondary={btnSecondary}
                  onSearchChange={setRouteSearch}
                  onStatusFilterChange={setRouteStatusFilter}
                  onAcademicYearFilterChange={setRouteAYFilter}
                  onClearFilters={clearRouteFilters}
                />

                {routesLoading ? (
                  <div className={`text-center py-12 ${subtext}`}>
                    <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p>Loading routes...</p>
                  </div>
                ) : filteredRoutes.length === 0 ? (
                  <div className={`text-center py-12 ${subtext}`}>
                    <p>No routes found</p>
                  </div>
                ) : (
                  <RouteList
                    routes={filteredRoutes}
                    isDark={isDark}
                    card={card}
                    text={text}
                    subtext={subtext}
                    btnDanger={btnDanger}
                    btnSecondary={btnSecondary}
                    onEdit={handleEditRoute}
                    onDelete={handleDeleteRoute}
                    onToggleStatus={toggleRouteStatus}
                  />
                )}
              </div>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className={`text-2xl font-bold ${text}`}>Vehicle Management</h2>
                  <button
                    onClick={() => {
                      setEditingVehicle(null);
                      setVehicleForm({ 
                        vehicleNumber: '', 
                        vehicleType: 'bus', 
                        capacity: 40, 
                        driverName: '', 
                        driverPhone: '', 
                        registrationNo: '', 
                        insuranceExpiry: '', 
                        fitnessExpiry: '',
                        isActive: true
                      });
                      setShowVehicleModal(true);
                    }}
                    className={btnPrimary}
                  >
                    Add Vehicle
                  </button>
                </div>

                <VehicleFilters
                  search={vehicleSearch}
                  typeFilter={vehicleTypeFilter}
                  statusFilter={vehicleStatusFilter}
                  isDark={isDark}
                  input={input}
                  btnSecondary={btnSecondary}
                  onSearchChange={setVehicleSearch}
                  onTypeFilterChange={setVehicleTypeFilter}
                  onStatusFilterChange={setVehicleStatusFilter}
                  onClearFilters={clearVehicleFilters}
                />

                {vehiclesLoading ? (
                  <div className={`text-center py-12 ${subtext}`}>
                    <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p>Loading vehicles...</p>
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <div className={`text-center py-12 ${subtext}`}>
                    <p>No vehicles found</p>
                  </div>
                ) : (
                  <VehicleList
                    vehicles={filteredVehicles}
                    isDark={isDark}
                    card={card}
                    text={text}
                    subtext={subtext}
                    btnDanger={btnDanger}
                    btnSecondary={btnSecondary}
                    onEdit={handleEditVehicle}
                    onDelete={handleDeleteVehicle}
                    onToggleStatus={toggleVehicleStatus}
                  />
                )}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className={`text-2xl font-bold ${text}`}>Student Assignments</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className={btnSecondary}
                    >
                      Bulk Assign
                    </button>
                    <button
                      onClick={() => {
                        setEditingAssignment(null);
                        setAssignForm({ 
                          studentSearch: '', 
                          studentId: '', 
                          studentName: '',
                          studentAdmissionNo: '',
                          routeId: '', 
                          pickupStop: '', 
                          dropStop: '', 
                          monthlyFee: 0,
                          isActive: true
                        });
                        setShowAssignModal(true);
                      }}
                      className={btnPrimary}
                    >
                      Assign Student
                    </button>
                  </div>
                </div>

                {studentsLoading ? (
                  <div className={`text-center py-12 ${subtext}`}>
                    <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p>Loading assignments...</p>
                  </div>
                ) : (
                  <AssignmentList
                    students={students}
                    isDark={isDark}
                    card={card}
                    text={text}
                    subtext={subtext}
                    btnDanger={btnDanger}
                    btnSecondary={btnSecondary}
                    onEdit={handleEditAssignment}
                    onDelete={handleDeleteAssignment}
                    onToggleStatus={toggleAssignmentStatus}
                    onTransportCancelled={handleTransportCancelled}
                    theme={theme}
                    pagination={pagination}
                    onNextPage={nextPage}
                    onPrevPage={prevPage}
                    onGoToPage={goToPage}
                    onChangePageSize={changePageSize}
                  />
                )}
              </div>
            )}

            {/* Refunds Tab */}
            {activeTab === 'refunds' && (
              <TransportRefunds
                isDark={isDark}
                card={card}
                text={text}
                subtext={subtext}
                btnPrimary={btnPrimary}
                btnSecondary={btnSecondary}
                btnDanger={btnDanger}
                theme={theme}
              />
            )}
          </div>

          {/* Route Modal */}
          <AnimatePresence>
            {showRouteModal && (
              <RouteForm
                form={routeForm}
                vehicles={vehicles}
                academicYears={[]} // TODO: Get from API
                isDark={isDark}
                card={card}
                text={text}
                subtext={subtext}
                label={label}
                input={input}
                btnPrimary={btnPrimary}
                btnSecondary={btnSecondary}
                onChange={(field, value) => setRouteForm((prev: any) => ({ ...prev, [field]: value }))}
                onSave={handleSaveRoute}
                onCancel={() => setShowRouteModal(false)}
                saving={savingRoute}
              />
            )}
          </AnimatePresence>

          {/* Vehicle Modal */}
          <AnimatePresence>
            {showVehicleModal && (
              <VehicleForm
                form={vehicleForm}
                isDark={isDark}
                card={card}
                text={text}
                subtext={subtext}
                label={label}
                input={input}
                btnPrimary={btnPrimary}
                btnSecondary={btnSecondary}
                onChange={(field, value) => setVehicleForm((prev: any) => ({ ...prev, [field]: value }))}
                onSave={handleSaveVehicle}
                onCancel={() => setShowVehicleModal(false)}
                saving={savingVehicle}
              />
            )}
          </AnimatePresence>

          {/* Assignment Modal */}
          <AnimatePresence>
            {showAssignModal && (
              <AssignmentForm
                form={assignForm}
                routes={routes}
                searchResults={searchResults}
                searchLoading={searchLoading}
                isDark={isDark}
                card={card}
                text={text}
                subtext={subtext}
                label={label}
                input={input}
                btnPrimary={btnPrimary}
                btnSecondary={btnSecondary}
                onChange={(field, value) => setAssignForm((prev: any) => ({ ...prev, [field]: value }))}
                onStudentSearch={(query) => searchStudents(query)}
                onSelectStudent={handleSelectStudent}
                onSave={handleSaveAssignment}
                onCancel={() => setShowAssignModal(false)}
                saving={savingStudent}
              />
            )}
          </AnimatePresence>

          {/* Bulk Assignment Modal */}
          <AnimatePresence>
            {showBulkModal && (
              <BulkAssignment
                routes={routes}
                isDark={isDark}
                card={card}
                text={text}
                subtext={subtext}
                label={label}
                input={input}
                btnPrimary={btnPrimary}
                btnSecondary={btnSecondary}
                onBulkAssign={handleBulkAssign}
                onClose={() => setShowBulkModal(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
