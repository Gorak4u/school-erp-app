'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { showErrorToast, showSuccessToast } from '@/lib/toastUtils';

// Modern Icons
import {
  TrendingUp,
  DollarSign,
  PieChart,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  X,
  Wallet,
  TrendingDown,
  Target,
  BarChart3,
  Receipt,
  Building,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Archive,
  Settings,
  Bell,
  FilterX,
  Zap,
  Shield,
  Award,
  Briefcase,
  Calculator,
  DollarSign as DollarIcon,
  MapPin,
  Bus,
  Car,
  UserPlus,
  Route,
  Wrench,
  Fuel,
  CreditCard as CreditCardIcon,
  AlertTriangle,
  UserCheck,
  Users2,
  Navigation
} from 'lucide-react';

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

// Modern Constants
const TRANSPORT_TABS = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: TrendingUp, 
    description: 'Transport overview and analytics',
    gradient: 'from-blue-500 to-cyan-600'
  },
  { 
    id: 'routes', 
    label: 'Routes', 
    icon: Route, 
    description: 'Manage transport routes',
    gradient: 'from-emerald-500 to-teal-600'
  },
  { 
    id: 'vehicles', 
    label: 'Vehicles', 
    icon: Bus, 
    description: 'Vehicle management',
    gradient: 'from-purple-500 to-pink-600'
  },
  { 
    id: 'students', 
    label: 'Students', 
    icon: Users, 
    description: 'Student assignments',
    gradient: 'from-orange-500 to-red-600'
  },
  { 
    id: 'refunds', 
    label: 'Refunds', 
    icon: DollarSign, 
    description: 'Transport refunds',
    gradient: 'from-indigo-500 to-purple-600'
  },
];

export default function TransportPageRefactored() {
  const { theme } = useTheme();
  const { hasPermission, isAdmin } = usePermissions();
  const canManageTransport = isAdmin || hasPermission('manage_transport' as any);
  const isDark = theme === 'dark';
  
  // Modern theme configuration
  const themeConfig = useMemo(() => ({
    bg: isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-white via-gray-50 to-white',
    border: isDark ? 'border-gray-700/50' : 'border-gray-200/50',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      muted: isDark ? 'text-gray-500' : 'text-gray-500',
      accent: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    card: isDark 
      ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-sm' 
      : 'bg-gradient-to-br from-white/80 to-gray-50/80 border-gray-200/50 backdrop-blur-sm',
    input: isDark 
      ? 'bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20' 
      : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20',
    button: {
      primary: isDark 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25' 
        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25',
      secondary: isDark 
        ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50 hover:border-gray-500/50' 
        : 'bg-white/50 hover:bg-gray-100/50 text-gray-700 border-gray-300/50 hover:border-gray-400/50',
      danger: isDark 
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25' 
        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25',
      success: isDark 
        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25' 
        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25',
    },
    gradients: {
      primary: 'from-blue-500 to-cyan-600',
      secondary: 'from-purple-500 to-pink-600',
      success: 'from-green-500 to-emerald-600',
      warning: 'from-orange-500 to-red-600',
      danger: 'from-red-500 to-pink-600',
      info: 'from-indigo-500 to-purple-600',
    }
  }), [isDark]);

  // Helper functions
  const getCardClass = () => themeConfig.card;
  const getInputClass = () => themeConfig.input;
  const getBtnClass = (type: 'primary' | 'secondary' | 'danger' | 'success' = 'primary') => themeConfig.button[type];
  const getTextClass = (type: 'primary' | 'secondary' | 'muted' | 'accent' = 'primary') => themeConfig.text[type];

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
    <AppLayout currentPage="transport" title="Transport Management">
      <div className="space-y-0 pb-6">
        {/* Modern Tabs */}
        <div className="relative">
          <div className={`flex space-x-1 p-1 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm border ${themeConfig.border}`}>
            {TRANSPORT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 relative overflow-hidden group ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                    : `${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hover:scale-105`
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-100`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">
                  <tab.icon className="w-4 h-4" />
                </span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Tab Description */}
          <div className="mt-4 text-center">
            <p className={`text-sm ${getTextClass('secondary')}`}>
              {TRANSPORT_TABS.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {(routeError || vehicleError || studentError) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-2xl ${getCardClass()} border-l-4 border-red-500`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-red-600/20' : 'bg-red-100'}`}>
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className={`font-medium ${getTextClass('primary')}`}>Error</p>
                    <p className={`text-sm ${getTextClass('secondary')}`}>{routeError || vehicleError || studentError}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(routeSuccess || vehicleSuccess || studentSuccess) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mb-6 p-4 rounded-2xl ${getCardClass()} border-l-4 border-green-500`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className={`font-medium ${getTextClass('primary')}`}>Success</p>
                    <p className={`text-sm ${getTextClass('secondary')}`}>{routeSuccess || vehicleSuccess || studentSuccess}</p>
                  </div>
                </div>
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
                card={getCardClass()}
                text={getTextClass('primary')}
                subtext={getTextClass('secondary')}
                btnPrimary={getBtnClass('primary')}
              />
            )}

            {/* Routes Tab */}
            {activeTab === 'routes' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${TRANSPORT_TABS.find(t => t.id === 'routes')?.gradient}`}>
                      <Route className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Route Management</h2>
                      <p className={`text-sm ${getTextClass('secondary')}`}>Manage transport routes and schedules</p>
                    </div>
                  </div>
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
                    className={getBtnClass('primary')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Route
                  </button>
                </div>

                <RouteFilters
                  search={routeSearch}
                  statusFilter={routeStatusFilter}
                  academicYearFilter={routeAYFilter}
                  academicYears={[]} // TODO: Get from API
                  isDark={isDark}
                  input={getInputClass()}
                  label={`block text-sm font-semibold mb-2 ${getTextClass('secondary')}`}
                  btnSecondary={getBtnClass('secondary')}
                  onSearchChange={setRouteSearch}
                  onStatusFilterChange={setRouteStatusFilter}
                  onAcademicYearFilterChange={setRouteAYFilter}
                  onClearFilters={clearRouteFilters}
                />

                {routesLoading ? (
                  <div className={`text-center py-12 ${getCardClass()} rounded-2xl`}>
                    <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className={getTextClass('secondary')}>Loading routes...</p>
                  </div>
                ) : filteredRoutes.length === 0 ? (
                  <div className={`text-center py-12 ${getCardClass()} rounded-2xl`}>
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Route className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className={`text-lg font-semibold ${getTextClass('primary')} mb-2`}>No routes found</h3>
                    <p className={`text-sm ${getTextClass('secondary')}`}>Create your first transport route to get started</p>
                  </div>
                ) : (
                  <RouteList
                    routes={filteredRoutes}
                    isDark={isDark}
                    card={getCardClass()}
                    text={getTextClass('primary')}
                    subtext={getTextClass('secondary')}
                    btnDanger={getBtnClass('danger')}
                    btnSecondary={getBtnClass('secondary')}
                    onEdit={handleEditRoute}
                    onDelete={handleDeleteRoute}
                    onToggleStatus={toggleRouteStatus}
                  />
                )}
              </motion.div>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${TRANSPORT_TABS.find(t => t.id === 'vehicles')?.gradient}`}>
                      <Bus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Vehicle Management</h2>
                      <p className={`text-sm ${getTextClass('secondary')}`}>Manage transport vehicles and drivers</p>
                    </div>
                  </div>
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
                    className={getBtnClass('primary')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vehicle
                  </button>
                </div>

                <VehicleFilters
                  search={vehicleSearch}
                  typeFilter={vehicleTypeFilter}
                  statusFilter={vehicleStatusFilter}
                  isDark={isDark}
                  input={getInputClass()}
                  btnSecondary={getBtnClass('secondary')}
                  onSearchChange={setVehicleSearch}
                  onTypeFilterChange={setVehicleTypeFilter}
                  onStatusFilterChange={setVehicleStatusFilter}
                  onClearFilters={clearVehicleFilters}
                />

                {vehiclesLoading ? (
                  <div className={`text-center py-12 ${getCardClass()} rounded-2xl`}>
                    <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className={getTextClass('secondary')}>Loading vehicles...</p>
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <div className={`text-center py-12 ${getCardClass()} rounded-2xl`}>
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Bus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className={`text-lg font-semibold ${getTextClass('primary')} mb-2`}>No vehicles found</h3>
                    <p className={`text-sm ${getTextClass('secondary')}`}>Add your first vehicle to get started</p>
                  </div>
                ) : (
                  <VehicleList
                    vehicles={filteredVehicles}
                    isDark={isDark}
                    card={getCardClass()}
                    text={getTextClass('primary')}
                    subtext={getTextClass('secondary')}
                    btnDanger={getBtnClass('danger')}
                    btnSecondary={getBtnClass('secondary')}
                    onEdit={handleEditVehicle}
                    onDelete={handleDeleteVehicle}
                    onToggleStatus={toggleVehicleStatus}
                  />
                )}
              </motion.div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${TRANSPORT_TABS.find(t => t.id === 'students')?.gradient}`}>
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${getTextClass('primary')}`}>Student Assignments</h2>
                      <p className={`text-sm ${getTextClass('secondary')}`}>Manage student transport assignments</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowBulkModal(true)}
                      className={`px-5 py-3 rounded-xl text-sm font-bold transition-all transform border-2 ${
                        isDark 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                      } flex items-center gap-2`}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>👥 Bulk Assign</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
                      className={`px-5 py-3 rounded-xl text-sm font-bold transition-all transform bg-gradient-to-r ${
                        isDark 
                          ? 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                          : 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                      } text-white shadow-lg shadow-blue-500/25 flex items-center gap-2`}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>👤 Assign Student</span>
                    </motion.button>
                  </div>
                </div>

                {studentsLoading ? (
                  <div className={`text-center py-12 ${getCardClass()} rounded-2xl`}>
                    <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className={getTextClass('secondary')}>Loading assignments...</p>
                  </div>
                ) : (
                  <AssignmentList
                    students={students}
                    isDark={isDark}
                    card={getCardClass()}
                    text={getTextClass('primary')}
                    subtext={getTextClass('secondary')}
                    btnDanger={getBtnClass('danger')}
                    btnSecondary={getBtnClass('secondary')}
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
              </motion.div>
            )}

            {/* Refunds Tab */}
            {activeTab === 'refunds' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TransportRefunds
                  isDark={isDark}
                  card={getCardClass()}
                  text={getTextClass('primary')}
                  subtext={getTextClass('secondary')}
                  btnPrimary={getBtnClass('primary')}
                  btnSecondary={getBtnClass('secondary')}
                  btnDanger={getBtnClass('danger')}
                  theme={theme}
                />
              </motion.div>
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
                card={getCardClass()}
                text={getTextClass('primary')}
                subtext={getTextClass('secondary')}
                label={`block text-sm font-semibold mb-2 ${getTextClass('secondary')}`}
                input={getInputClass()}
                btnPrimary={getBtnClass('primary')}
                btnSecondary={getBtnClass('secondary')}
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
                card={getCardClass()}
                text={getTextClass('primary')}
                subtext={getTextClass('secondary')}
                label={`block text-sm font-semibold mb-2 ${getTextClass('secondary')}`}
                input={getInputClass()}
                btnPrimary={getBtnClass('primary')}
                btnSecondary={getBtnClass('secondary')}
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
                card={getCardClass()}
                text={getTextClass('primary')}
                subtext={getTextClass('secondary')}
                label={`block text-sm font-semibold mb-2 ${getTextClass('secondary')}`}
                input={getInputClass()}
                btnPrimary={getBtnClass('primary')}
                btnSecondary={getBtnClass('secondary')}
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
                card={getCardClass()}
                text={getTextClass('primary')}
                subtext={getTextClass('secondary')}
                label={`block text-sm font-semibold mb-2 ${getTextClass('secondary')}`}
                input={getInputClass()}
                btnPrimary={getBtnClass('primary')}
                btnSecondary={getBtnClass('secondary')}
                onBulkAssign={handleBulkAssign}
                onClose={() => setShowBulkModal(false)}
              />
            )}
          </AnimatePresence>
    </div>
    </AppLayout>
  );
}
