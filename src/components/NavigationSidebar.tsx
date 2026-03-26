'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { useSchoolDetails } from '@/contexts/SchoolConfigContext';
import { hasPermission, DEFAULT_ROLE_PERMISSIONS, isAdminLikeAccess, type Permission } from '@/lib/permissions';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  DollarSign, 
  ArrowRight, 
  AlertCircle, 
  FileText, 
  Truck,
  BookOpen, 
  UserCheck, 
  Calendar, 
  ClipboardList, 
  CreditCard, 
  Settings, 
  BarChart3, 
  Shield,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Home,
  User,
  Award,
  Receipt,
  Target,
  TrendingUp,
  Building,
  Briefcase,
  Bell,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  Globe,
  Database,
  ShieldCheck,
  FileSpreadsheet,
  PieChart,
  Activity,
  Archive,
  Wallet,
  Calculator,
  FileCheck,
  CheckCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Eye,
  EyeOff,
  Filter,
  Search,
  Menu,
  X,
  LogOut,
  UserCircle,
  Cog,
  Wrench,
  Hammer,
  Package,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Percent,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  Edit,
  Save,
  Download,
  Upload,
  Share,
  Copy,
  Trash,
  RefreshCw,
  RotateCcw,
  History,
  Bookmark,
  Heart,
  MessageSquare,
  Send,
  Paperclip,
  Image,
  Video,
  Music,
  Headphones,
  Mic,
  Camera,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  HardDrive,
  Cpu,
  Server,
  Cloud,
  Wifi,
  Battery,
  Power,
  Bolt,
  Flame,
  Droplet,
  Wind,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  Umbrella,
  TreePine,
  Flower,
  Bug,
  Fish,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Turtle
} from 'lucide-react';

interface NavigationSidebarProps {
  theme: 'dark' | 'light';
  currentPage?: string;
  isSidebarOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  pageKey: string;
  permission?: Permission;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  badge?: string;
  description?: string;
  color?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  icon?: React.ReactNode;
}

// Enhanced navigation items with colored icons and premium styling
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main',
    icon: <Home className="w-4 h-4 text-blue-500" />,
    items: [
      { 
        href: '/dashboard', 
        label: 'Dashboard', 
        icon: <LayoutDashboard className="w-5 h-5 text-blue-500" />, 
        pageKey: 'dashboard', 
        permission: 'view_dashboard'
      },
      { 
        href: '/students', 
        label: 'Students', 
        icon: <Users className="w-5 h-5 text-green-500" />, 
        pageKey: 'students', 
        permission: 'view_students'
      },
      { 
        href: '/alumni', 
        label: 'Alumni', 
        icon: <GraduationCap className="w-5 h-5 text-purple-500" />, 
        pageKey: 'alumni', 
        permission: 'view_alumni'
      },
      { 
        href: '/fees', 
        label: 'Fees', 
        icon: <DollarSign className="w-5 h-5 text-emerald-500" />, 
        pageKey: 'fees', 
        permission: 'view_fees'
      },
      { 
        href: '/refunds', 
        label: 'Refunds', 
        icon: <ArrowRight className="w-5 h-5 text-orange-500" />, 
        pageKey: 'refunds', 
        permission: 'manage_fees'
      },
      { 
        href: '/fines', 
        label: 'Fines', 
        icon: <AlertCircle className="w-5 h-5 text-red-500" />, 
        pageKey: 'fines', 
        permission: 'manage_fines'
      },
      { 
        href: '/expenses', 
        label: 'Expenses', 
        icon: <FileText className="w-5 h-5 text-rose-500" />, 
        pageKey: 'expenses', 
        permission: 'view_expenses'
      },
      { 
        href: '/transport', 
        label: 'Transport', 
        icon: <Truck className="w-5 h-5 text-cyan-500" />, 
        pageKey: 'transport', 
        adminOnly: true
      },
    ],
  },
  {
    label: 'Academic',
    icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
    items: [
      { 
        href: '/teachers', 
        label: 'Staff', 
        icon: <UserCheck className="w-5 h-5 text-indigo-500" />, 
        pageKey: 'teachers', 
        permission: 'view_teachers'
      },
      { 
        href: '/leave', 
        label: 'Leave', 
        icon: <Calendar className="w-5 h-5 text-teal-500" />, 
        pageKey: 'leave', 
        permission: 'view_teachers'
      },
      { 
        href: '/attendance', 
        label: 'Attendance', 
        icon: <ClipboardList className="w-5 h-5 text-amber-500" />, 
        pageKey: 'attendance', 
        permission: 'view_attendance'
      },
      { 
        href: '/assignments', 
        label: 'Assignments', 
        icon: <FileText className="w-5 h-5 text-pink-500" />, 
        pageKey: 'assignments', 
        permission: 'view_exams'
      },
    ],
  },
  {
    label: 'Administration',
    icon: <Cog className="w-4 h-4 text-slate-500" />,
    items: [
      { 
        href: '/subscription', 
        label: 'Subscription', 
        icon: <CreditCard className="w-5 h-5 text-violet-500" />, 
        pageKey: 'subscription', 
        adminOnly: true
      },
      { 
        href: '/settings', 
        label: 'Settings', 
        icon: <Cog className="w-5 h-5 text-slate-500" />, 
        pageKey: 'settings', 
        permission: 'view_settings'
      },
      { 
        href: '/reports', 
        label: 'Reports', 
        icon: <BarChart3 className="w-5 h-5 text-pink-500" />, 
        pageKey: 'reports', 
        permission: 'view_reports'
      },
    ],
  },
];

export default function NavigationSidebar({ 
  theme, 
  currentPage = 'dashboard',
  isSidebarOpen,
  onMouseEnter,
  onMouseLeave
}: NavigationSidebarProps) {
  const [isClient, setIsClient] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Main', 'Academic', 'Administration']);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { data: session } = useSession();
  const userIsSuperAdmin = (session?.user as any)?.isSuperAdmin === true;
  const userRole = (session?.user as any)?.role || '';
  const userPermissions: Permission[] = (session?.user as any)?.permissions || DEFAULT_ROLE_PERMISSIONS[userRole] || [];
  const isAdmin = isAdminLikeAccess({
    role: userRole,
    isSuperAdmin: userIsSuperAdmin,
    permissions: userPermissions,
  });
  const schoolDetails = useSchoolDetails();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter navigation items based on role + permissions
  const filteredGroups = useMemo(() => {
    const filtered = NAV_GROUPS
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          // Super admin sees everything
          if (userIsSuperAdmin) return true;
          // Admin-only items hidden from non-admins
          if (item.adminOnly && !isAdmin) return false;
          // Permission-based: check if user has the required permission
          if (item.permission) {
            // Admins get all permissions
            if (isAdmin) return true;
            return hasPermission(userPermissions, item.permission);
          }
          return true;
        }),
      }))
      .filter(group => group.items.length > 0); // Hide empty groups
    
    return filtered;
  }, [userRole, userPermissions, isAdmin, userIsSuperAdmin]);

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupLabel) 
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  const getThemeClasses = () => {
    const isDark = theme === 'dark';
    return {
      sidebar: `fixed left-0 top-0 h-full w-64 z-40 transition-all duration-300 ${
        isDark 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
      }`,
      backdrop: 'backdrop-blur-xl border-r shadow-2xl',
      logo: `w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg`,
      schoolName: `text-xl font-bold truncate ${
        isDark ? 'text-white' : 'text-gray-900'
      }`,
      groupHeader: `text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
        isDark ? 'text-gray-500' : 'text-gray-400'
      }`,
      navItem: (isActive: boolean, isHovered: boolean) => `
        group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive 
          ? isDark
            ? 'bg-gray-800 text-white border border-gray-600 shadow-lg'
            : 'bg-gray-100 text-gray-900 border border-gray-300 shadow-lg'
          : isHovered
            ? isDark
              ? 'bg-gray-800/50 text-gray-200 border border-gray-600/30'
              : 'bg-gray-100/50 text-gray-800 border border-gray-200/50'
            : isDark
              ? 'text-gray-400 hover:text-gray-300'
              : 'text-gray-600 hover:text-gray-800'
        }
      `,
      navItemIcon: (isActive: boolean) => `
        relative z-10 transition-all duration-200 flex-shrink-0
        ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}
      `,
      navItemText: (isActive: boolean) => `
        font-medium transition-all duration-200 flex-1 min-w-0
        ${isActive ? 'font-semibold' : ''}
      `,
      description: () => `
        text-xs transition-all duration-200 truncate
        ${isDark ? 'text-gray-500' : 'text-gray-500'}
        opacity-0 w-0
      `,
      saasAdmin: (isActive: boolean) => `
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive
          ? isDark
            ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/10'
            : 'bg-orange-50 text-orange-600 border border-orange-200 shadow-lg shadow-orange-200/50'
          : isDark
            ? 'text-orange-300 hover:bg-gray-800'
            : 'text-orange-600 hover:bg-gray-100'
        }
      `,
      iconGlow: () => {
        return isDark ? 'from-gray-400 to-gray-600' : 'from-gray-400 to-gray-600';
      }
    };
  };

  const themeClasses = getThemeClasses();

  if (!isClient) {
    return null;
  }

  return (
    <motion.aside
      className={`${themeClasses.sidebar} ${themeClasses.backdrop}`}
      initial={{ x: -256 }}
      animate={{ x: isSidebarOpen ? 0 : -256 }}
      transition={{ 
        duration: 0.4, 
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-gray-900/50 to-black/50' 
          : 'bg-gradient-to-b from-white/50 to-blue-50/50'
      } pointer-events-none`} />
      
      <div className="relative flex flex-col h-full p-4">
        {/* Enhanced Logo */}
        <Link 
          href="/dashboard" 
          className="flex items-center gap-4 mb-8 flex-shrink-0 group relative"
        >
          {/* Logo Glow Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-20 blur-xl rounded-2xl"
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            className={`relative ${themeClasses.logo}`}
            whileHover={{ 
              scale: 1.05, 
              rotate: 5,
              boxShadow: '0 20px 40px -15px rgba(59, 130, 246, 0.5)'
            }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Animated Logo Background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 opacity-0"
              animate={{
                opacity: [0, 0.3, 0],
                background: [
                  'linear-gradient(45deg, #60a5fa, #06b6d4, #3b82f6)',
                  'linear-gradient(45deg, #3b82f6, #06b6d4, #60a5fa)',
                  'linear-gradient(45deg, #60a5fa, #06b6d4, #3b82f6)'
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {schoolDetails.logo_url ? (
              <img 
                src={schoolDetails.logo_url} 
                alt="School Logo" 
                className="w-full h-full object-cover relative z-10"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="text-white font-bold text-lg flex items-center justify-center h-full relative z-10">ERP</div>';
                  }
                }}
              />
            ) : (
              <div className="text-white font-bold text-lg flex items-center justify-center h-full relative z-10">
                ERP
              </div>
            )}
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <motion.div 
              className={themeClasses.schoolName}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              {schoolDetails.name || 'School ERP'}
            </motion.div>
            <div className={`text-xs font-medium ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            } mt-1`}>
              Management System
            </div>
            {/* Status Indicator */}
            <motion.div
              className="flex items-center gap-2 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <span className={`text-xs ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                System Active
              </span>
            </motion.div>
          </div>
        </Link>

        {/* Enhanced Navigation Menu */}
        <nav className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence>
            {filteredGroups.map((group, groupIndex) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="space-y-2"
              >
                {/* Group Header */}
                <motion.button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-800 text-gray-500' 
                      : 'hover:bg-gray-100 text-gray-400'
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`flex items-center gap-2 ${themeClasses.groupHeader}`}>
                    {group.icon}
                    <span>{group.label}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedGroups.includes(group.label) ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </motion.div>
                </motion.button>

                {/* Group Items */}
                <AnimatePresence>
                  {expandedGroups.includes(group.label) && group.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.pageKey}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: itemIndex * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={themeClasses.navItem(
                          currentPage === item.pageKey,
                          hoveredItem === item.pageKey
                        )}
                        onMouseEnter={() => setHoveredItem(item.pageKey)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {/* Icon Background Glow */}
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-r ${themeClasses.iconGlow()} opacity-5`}
                          initial={{ opacity: 0 }}
                          animate={{ 
                            opacity: hoveredItem === item.pageKey ? 0.1 : 0,
                            scale: hoveredItem === item.pageKey ? 1.05 : 1
                          }}
                          transition={{ duration: 0.3 }}
                        />
                        
                        {/* Active Indicator */}
                        {currentPage === item.pageKey && (
                          <motion.div
                            layoutId="activeIndicator"
                            className={`absolute inset-0 rounded-xl ${
                              theme === 'dark' 
                                ? 'bg-gray-800/50' 
                                : 'bg-gray-200/50'
                            }`}
                            transition={{
                              type: "spring" as const,
                              stiffness: 500,
                              damping: 30
                            }}
                          />
                        )}
                        
                        <div className="relative z-10 flex items-center gap-3 flex-1">
                          {/* Enhanced Icon Container */}
                          <motion.div
                            className={themeClasses.navItemIcon(currentPage === item.pageKey)}
                            whileHover={{ 
                              rotate: [0, -10, 10, 0],
                              scale: 1.1
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            {/* Icon Glow Effect */}
                            <motion.div
                              className={`absolute inset-0 bg-gradient-to-r ${themeClasses.iconGlow()} opacity-20 blur-md`}
                              animate={{
                                opacity: currentPage === item.pageKey ? [0.3, 0.6, 0.3] : 0,
                                scale: currentPage === item.pageKey ? [1, 1.2, 1] : 1
                              }}
                              transition={{
                                duration: 2,
                                repeat: currentPage === item.pageKey ? Infinity : 0,
                                ease: "easeInOut"
                              }}
                            />
                            <div className="relative">
                              {item.icon}
                            </div>
                          </motion.div>
                          
                          <div className="flex-1 min-w-0">
                            <div className={themeClasses.navItemText(currentPage === item.pageKey)}>
                              {item.label}
                            </div>
                          </div>
                          
                          {/* Animated Badge */}
                          {item.badge && (
                            <motion.div
                              className={`px-2 py-1 text-xs rounded-full font-medium ${
                                theme === 'dark' 
                                  ? 'bg-gray-700 text-gray-300' 
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2, type: "spring" as const }}
                              whileHover={{ scale: 1.05 }}
                            >
                              {item.badge}
                            </motion.div>
                          )}
                          
                          {/* Hover Arrow */}
                          <motion.div
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            initial={{ x: -10 }}
                            animate={{ 
                              x: hoveredItem === item.pageKey ? 0 : -10,
                              opacity: hoveredItem === item.pageKey ? 1 : 0
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Enhanced SaaS Admin Section */}
          {userIsSuperAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-6 border-t border-gray-200/20"
            >
              <motion.button
                onClick={() => toggleGroup('Platform')}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-800 text-orange-500' 
                    : 'hover:bg-gray-100 text-orange-600'
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`flex items-center gap-2 ${themeClasses.groupHeader} ${
                  theme === 'dark' ? 'text-orange-500' : 'text-orange-600'
                }`}>
                  <Shield className="w-4 h-4" />
                  <span>Platform</span>
                </div>
                <motion.div
                  animate={{ rotate: expandedGroups.includes('Platform') ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-3 h-3" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {expandedGroups.includes('Platform') && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link
                      href="/admin/saas"
                      className={themeClasses.saasAdmin(currentPage === 'saas-settings')}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <Shield className="w-5 h-5" />
                        </motion.div>
                        <div>
                          <div className="font-medium">SaaS Admin</div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </nav>

              </div>
    </motion.aside>
  );
}
