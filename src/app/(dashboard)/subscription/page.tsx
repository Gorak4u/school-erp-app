'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Crown,
  Users,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  BarChart3,
  Activity,
  Gem,
  ArrowRight,
  Lock,
  Unlock,
  Zap,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  TrendingUp,
  PieChart,
  DollarSign,
  FileText,
  Star,
  Gift,
  Bell,
  Menu,
  X,
  Filter,
  Search,
  Download,
  Upload,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Info,
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  User,
  Building,
  MapPin,
  Globe,
  Wifi,
  Database,
  Server,
  Cloud,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Headphones,
  Camera,
  Mic,
  Video,
  Music,
  Image,
  File,
  Folder,
  Archive,
  Package,
  ShoppingBag,
  ShoppingCart,
  Banknote,
  Receipt,
  Calculator,
  Percent,
  Hash,
  AtSign,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Share2,
  Heart,
  Bookmark,
  Flag,
  Tag,
  Barcode,
  QrCode,
  Fingerprint,
  Key,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Trophy,
  Medal,
  Ribbon,
  GraduationCap,
  BookOpen,
  Book,
  Library,
  School,
  Backpack,
  PenTool,
  Ruler,
  Compass,
  Map,
  Navigation,
  Home,
  Briefcase,
  Wrench,
  Hammer,
  Drill,
  PaintBucket,
  Palette,
  Brush,
  Eraser,
  Pencil,
  Pen,
  Type,
  Text,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Terminal,
  Cpu,
  HardDrive,
  MemoryStick,
  IdCard,
  Usb,
  Bluetooth,
  Signal,
  Radio,
  Antenna,
  Satellite,
  Radar,
  Binoculars,
  Telescope,
  Microscope,
  Stethoscope,
  Syringe,
  Pill,
  Eye as EyeIcon,
  Ear,
  Brain,
  Skull,
  RefreshCw,
  Rocket
} from 'lucide-react';

interface SubscriptionData {
  plan: string;
  status: string;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  trialDaysLeft: number | null;
  trialEndsAt: string | null;
  studentsUsed: number;
  maxStudents: number;
  teachersUsed: number;
  maxTeachers: number;
  nextBillingDate: string | null;
  autoRenew: boolean;
  amount: number;
  billingCycle: string;
  features: string[];
  billingHistory: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
    description: string;
  }>;
  usageAnalytics: {
    students: {
      used: number;
      total: number;
      percentage: number;
    };
    teachers: {
      used: number;
      total: number;
      percentage: number;
    };
    storage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

interface BillingData {
  method: string;
  lastFour: string;
  expiryDate: string;
  cardType: string;
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [autoRenewLoading, setAutoRenewLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [canManageSubscription, setCanManageSubscription] = useState(false);

  useEffect(() => {
    // Check user permissions
    if (session?.user) {
      setCanManageSubscription(true);
    }
  }, [session]);

  useEffect(() => {
    // Fetch subscription data
    const fetchSubscriptionData = async () => {
      try {
        setLoading(true);
        // Mock data - replace with actual API call
        const mockSubscription: SubscriptionData = {
          plan: 'Professional',
          status: 'active',
          isActive: true,
          isTrial: false,
          isExpired: false,
          trialDaysLeft: null,
          trialEndsAt: null,
          studentsUsed: 85,
          maxStudents: 100,
          teachersUsed: 12,
          maxTeachers: 20,
          nextBillingDate: '2024-02-15',
          autoRenew: true,
          amount: 299,
          billingCycle: 'monthly',
          features: [
            'Up to 100 students',
            'Up to 20 teachers',
            'Advanced analytics',
            'Priority support',
            'Custom branding',
            'API access'
          ],
          billingHistory: [
            {
              id: 'inv_001',
              date: '2024-01-15',
              amount: 299,
              status: 'paid',
              description: 'Professional Plan - Monthly'
            },
            {
              id: 'inv_002',
              date: '2023-12-15',
              amount: 299,
              status: 'paid',
              description: 'Professional Plan - Monthly'
            }
          ],
          usageAnalytics: {
            students: {
              used: 85,
              total: 100,
              percentage: 85
            },
            teachers: {
              used: 12,
              total: 20,
              percentage: 60
            },
            storage: {
              used: 45,
              total: 100,
              percentage: 45
            }
          }
        };

        const mockBilling: BillingData = {
          method: 'credit_card',
          lastFour: '4242',
          expiryDate: '12/25',
          cardType: 'visa'
        };

        setSubscription(mockSubscription);
        setBilling(mockBilling);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  // Helper functions for dynamic styling
  const getCardClass = () => {
    return theme === 'dark'
      ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 shadow-2xl'
      : 'bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl';
  };

  const getGradientClass = (type: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'premium') => {
    const gradients = {
      primary: theme === 'dark' ? 'from-blue-600 to-cyan-600' : 'from-blue-500 to-cyan-500',
      secondary: theme === 'dark' ? 'from-purple-600 to-pink-600' : 'from-purple-500 to-pink-500',
      success: theme === 'dark' ? 'from-green-600 to-emerald-600' : 'from-green-500 to-emerald-500',
      warning: theme === 'dark' ? 'from-yellow-600 to-orange-600' : 'from-yellow-500 to-orange-500',
      danger: theme === 'dark' ? 'from-red-600 to-rose-600' : 'from-red-500 to-rose-500',
      premium: theme === 'dark' ? 'from-amber-600 to-yellow-600' : 'from-amber-500 to-yellow-500'
    };
    return gradients[type];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5" />;
      case 'trial':
        return <Clock className="w-5 h-5" />;
      case 'expired':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme === 'dark' ? 'text-green-400' : 'text-green-600';
      case 'trial':
        return theme === 'dark' ? 'text-blue-400' : 'text-blue-600';
      case 'expired':
        return theme === 'dark' ? 'text-red-400' : 'text-red-600';
      default:
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trial':
        return 'Trial';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const calculateUsagePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return theme === 'dark' ? 'text-red-400' : 'text-red-600';
    if (percentage >= 70) return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600';
    return theme === 'dark' ? 'text-green-400' : 'text-green-600';
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return 'Critical';
    if (percentage >= 70) return 'Warning';
    return 'Healthy';
  };

  const getSubscriptionFeatures = (plan: string) => {
    const features = {
      basic: [
        'Up to 50 students',
        'Up to 10 teachers',
        'Basic analytics',
        'Email support'
      ],
      professional: [
        'Up to 100 students',
        'Up to 20 teachers',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access'
      ],
      enterprise: [
        'Unlimited students',
        'Unlimited teachers',
        'Advanced analytics',
        'Dedicated support',
        'Custom branding',
        'API access',
        'Custom integrations',
        'On-premise deployment'
      ]
    };
    return features[plan as keyof typeof features] || features.basic;
  };

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
        ease: "easeOut"
      }
    }
  };

  const handleRenew = async () => {
    setAutoRenewLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (subscription) {
        setSubscription({
          ...subscription,
          autoRenew: !subscription.autoRenew
        });
      }
    } catch (error) {
      console.error('Error updating auto-renewal:', error);
    } finally {
      setAutoRenewLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Access control check
  if (!canManageSubscription) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <div className="fixed inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-rose-600/10 animate-pulse" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`${getCardClass()} p-8 text-center`}
          >
            <motion.div
              initial={{ rotate: -15 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-gradient-to-r from-red-600 to-rose-600 shadow-2xl"
            >
              <Lock className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-3xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Access Denied
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`mb-6 text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              You don't have permission to manage subscription settings.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3"
            >
              <Link
                href="/dashboard"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all bg-gradient-to-r ${getGradientClass('primary')} text-white shadow-lg hover:shadow-xl`}
              >
                <ArrowRight className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <div className="fixed inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 animate-pulse" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`${getCardClass()} p-8 text-center`}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-600 shadow-2xl"
            >
              <RefreshCw className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-3xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              Loading Subscription Details
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`mb-6 text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Please wait while we fetch your subscription information.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // No subscription state
  if (!subscription) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
        <div className="fixed inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-rose-600/10 animate-pulse" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`${getCardClass()} p-8 text-center`}
          >
            <motion.div
              initial={{ rotate: -15 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-gradient-to-r from-red-600 to-rose-600 shadow-2xl"
            >
              <AlertCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-3xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              No Subscription Found
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`mb-6 text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              Unable to load your subscription details. Please try again or contact support.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3"
            >
              <Link
                href="/billing"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all bg-gradient-to-r ${getGradientClass('primary')} text-white shadow-lg hover:shadow-xl`}
              >
                <ArrowRight className="w-4 h-4" />
                Go to Billing
              </Link>
              
              <button
                onClick={() => window.location.reload()}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all bg-gradient-to-r ${getGradientClass('secondary')} text-white shadow-lg hover:shadow-xl`}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      {/* Premium Background Pattern */}
      <div className="fixed inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="premium-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
              <circle cx="30" cy="30" r="1" fill="currentColor" opacity="0.5"/>
            </pattern>
            <pattern id="premium-dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#premium-grid)" />
          <rect width="100%" height="100%" fill="url(#premium-dots)" />
        </svg>
      </div>
      
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 opacity-20">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"
          animate={{
            background: [
              'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
              'linear-gradient(45deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))',
              'linear-gradient(45deg, rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))'
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Section - Title and Description */}
            <div className="flex-1">
              <motion.div
                className="flex items-center gap-4 mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Animated Crown Icon */}
                <motion.div
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-r ${getGradientClass('premium')} shadow-2xl`}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: 10,
                    boxShadow: '0 25px 50px -15px rgba(251, 191, 36, 0.5)'
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(251, 191, 36, 0.4)',
                      '0 0 0 20px rgba(251, 191, 36, 0)',
                      '0 0 0 0 rgba(251, 191, 36, 0)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Crown className="w-10 h-10 text-white" />
                </motion.div>
                
                <div>
                  <motion.h1
                    className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r ${
                      theme === 'dark' ? 'from-white to-gray-200' : 'from-gray-900 to-gray-700'
                    } bg-clip-text text-transparent`}
                    whileHover={{ x: 3 }}
                  >
                    Subscription Management
                  </motion.h1>
                  <motion.p
                    className={`text-base ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Manage your school's subscription, billing, and plan details with advanced features
                  </motion.p>
                </div>
              </motion.div>
            </div>

            {/* Right Section - Premium Actions */}
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={() => setShowPaymentModal(true)}
                className={`px-6 py-3 rounded-xl text-base font-medium transition-all flex items-center gap-2 bg-gradient-to-r ${getGradientClass('premium')} text-white shadow-xl hover:shadow-2xl`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Rocket className="w-4 h-4" />
                Upgrade Plan
              </motion.button>
              <motion.button
                onClick={() => window.open('/billing', '_blank')}
                className={`px-6 py-3 rounded-xl text-base font-medium transition-all flex items-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-gray-300 hover:from-gray-700 hover:to-gray-600 border border-gray-600'
                    : 'bg-gradient-to-r from-white to-gray-100 text-gray-700 hover:from-gray-50 hover:to-white border border-gray-200'
                } shadow-xl hover:shadow-2xl`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-4 h-4" />
                Billing Settings
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Premium Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="relative">
            <motion.div
              className={`absolute inset-0 rounded-2xl ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-gray-800/40 to-gray-700/40' 
                  : 'bg-gradient-to-r from-gray-100/40 to-white/40'
              } backdrop-blur-sm shadow-xl`}
            />
            
            <nav className="relative flex gap-2 p-3">
              {[
                { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'usage', label: 'Usage Analytics', icon: <Activity className="w-4 h-4" /> },
                { id: 'billing', label: 'Billing History', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'plans', label: 'Available Plans', icon: <Gem className="w-4 h-4" /> },
                { id: 'features', label: 'Features', icon: <Sparkles className="w-4 h-4" /> }
              ].map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? theme === 'dark'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className={`absolute inset-0 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/30 border border-blue-500/50'
                          : 'bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-300'
                      } shadow-lg`}
                      transition={{
                        type: "spring" as const,
                        stiffness: 500,
                        damping: 30
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                </motion.button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Current Subscription Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`${getCardClass()} p-8`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Current Plan
                    </h2>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      subscription.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : subscription.status === 'trial'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {getStatusText(subscription.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${getGradientClass('premium')}`}>
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Plan</p>
                          <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {subscription.plan}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${getGradientClass('primary')}`}>
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Amount</p>
                          <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            ${subscription.amount}/{subscription.billingCycle}
                          </p>
                        </div>
                      </div>

                      {subscription.nextBillingDate && (
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${getGradientClass('secondary')}`}>
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Next Billing</p>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {new Date(subscription.nextBillingDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${getGradientClass('success')}`}>
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Students</p>
                          <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {subscription.studentsUsed}/{subscription.maxStudents}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${getGradientClass('warning')}`}>
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Teachers</p>
                          <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {subscription.teachersUsed}/{subscription.maxTeachers}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${getGradientClass(subscription.autoRenew ? 'success' : 'danger')}`}>
                          {subscription.autoRenew ? <CheckCircle className="w-6 h-6 text-white" /> : <XCircle className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Auto-Renewal</p>
                          <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Auto-renewal is {subscription.autoRenew ? 'enabled' : 'disabled'}
                      </p>
                      <motion.button
                        onClick={handleRenew}
                        disabled={autoRenewLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          subscription.autoRenew
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {autoRenewLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          subscription.autoRenew ? 'Disable' : 'Enable'
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Features List */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className={`${getCardClass()} p-6`}
                >
                  <h3 className={`text-lg font-bold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Plan Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getSubscriptionFeatures(subscription.plan.toLowerCase()).map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-6">
                {/* Usage Analytics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`${getCardClass()} p-6`}
                >
                  <h3 className={`text-lg font-bold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Usage Analytics
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Students Usage */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Students
                        </span>
                        <span className={`text-sm ${getUsageColor(subscription.usageAnalytics.students.percentage)}`}>
                          {subscription.usageAnalytics.students.used} of {subscription.usageAnalytics.students.total} ({subscription.usageAnalytics.students.percentage}%)
                        </span>
                      </div>
                      <div className={`w-full h-3 rounded-full overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${getGradientClass(
                            subscription.usageAnalytics.students.percentage >= 90 ? 'danger' :
                            subscription.usageAnalytics.students.percentage >= 70 ? 'warning' : 'success'
                          )}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${subscription.usageAnalytics.students.percentage}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Teachers Usage */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Teachers
                        </span>
                        <span className={`text-sm ${getUsageColor(subscription.usageAnalytics.teachers.percentage)}`}>
                          {subscription.usageAnalytics.teachers.used} of {subscription.usageAnalytics.teachers.total} ({subscription.usageAnalytics.teachers.percentage}%)
                        </span>
                      </div>
                      <div className={`w-full h-3 rounded-full overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${getGradientClass(
                            subscription.usageAnalytics.teachers.percentage >= 90 ? 'danger' :
                            subscription.usageAnalytics.teachers.percentage >= 70 ? 'warning' : 'success'
                          )}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${subscription.usageAnalytics.teachers.percentage}%` }}
                          transition={{ duration: 1, delay: 0.4 }}
                        />
                      </div>
                    </div>

                    {/* Storage Usage */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Storage
                        </span>
                        <span className={`text-sm ${getUsageColor(subscription.usageAnalytics.storage.percentage)}`}>
                          {subscription.usageAnalytics.storage.used}GB of {subscription.usageAnalytics.storage.total}GB ({subscription.usageAnalytics.storage.percentage}%)
                        </span>
                      </div>
                      <div className={`w-full h-3 rounded-full overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${getGradientClass(
                            subscription.usageAnalytics.storage.percentage >= 90 ? 'danger' :
                            subscription.usageAnalytics.storage.percentage >= 70 ? 'warning' : 'success'
                          )}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${subscription.usageAnalytics.storage.percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Usage Statistics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {[
                    { label: 'Total Users', value: subscription.studentsUsed + subscription.teachersUsed, icon: Users, color: 'primary' },
                    { label: 'Active Projects', value: '24', icon: Folder, color: 'secondary' },
                    { label: 'Storage Used', value: `${subscription.usageAnalytics.storage.used}GB`, icon: HardDrive, color: 'success' }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={`${getCardClass()} p-6 text-center`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${getGradientClass(stat.color as any)} mx-auto mb-4`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {stat.value}
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {stat.label}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                {/* Billing History */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`${getCardClass()} p-8`}
                >
                  <h3 className={`text-xl font-bold mb-6 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Billing History
                  </h3>
                  
                  <div className="space-y-4">
                    {subscription.billingHistory.map((invoice, index) => (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={`p-4 rounded-xl border ${
                          theme === 'dark' 
                            ? 'bg-gray-800/50 border-gray-700/50' 
                            : 'bg-gray-50/50 border-gray-200/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {invoice.description}
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(invoice.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              ${invoice.amount}
                            </p>
                            <p className={`text-sm ${invoice.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                              {invoice.status}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Payment Method */}
                {billing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className={`${getCardClass()} p-8`}
                  >
                    <h3 className={`text-xl font-bold mb-6 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Payment Method
                    </h3>
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${getGradientClass('primary')}`}>
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {billing.cardType.toUpperCase()} •••• {billing.lastFour}
                        </p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Expires {billing.expiryDate}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="space-y-6">
                {/* Available Plans */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                  {[
                    {
                      name: 'Basic',
                      price: '$99',
                      period: '/month',
                      features: ['Up to 50 students', 'Up to 10 teachers', 'Basic analytics', 'Email support'],
                      color: 'primary',
                      popular: false
                    },
                    {
                      name: 'Professional',
                      price: '$299',
                      period: '/month',
                      features: ['Up to 100 students', 'Up to 20 teachers', 'Advanced analytics', 'Priority support', 'Custom branding', 'API access'],
                      color: 'premium',
                      popular: true
                    },
                    {
                      name: 'Enterprise',
                      price: '$599',
                      period: '/month',
                      features: ['Unlimited students', 'Unlimited teachers', 'Advanced analytics', 'Dedicated support', 'Custom branding', 'API access', 'Custom integrations', 'On-premise deployment'],
                      color: 'secondary',
                      popular: false
                    }
                  ].map((plan, index) => (
                    <motion.div
                      key={plan.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`${getCardClass()} p-6 relative ${
                        plan.popular ? 'ring-2 ring-amber-500/50' : ''
                      }`}
                    >
                      {plan.popular && (
                        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getGradientClass('premium')} text-white`}>
                          Most Popular
                        </div>
                      )}
                      
                      <div className="text-center mb-6">
                        <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {plan.name}
                        </h3>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {plan.price}
                          </span>
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {plan.period}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <CheckCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <motion.button
                        onClick={() => setSelectedPlan(plan.name)}
                        className={`w-full py-3 rounded-xl font-medium transition-all ${
                          plan.name === subscription.plan
                            ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                            : `bg-gradient-to-r ${getGradientClass(plan.color as any)} text-white`
                        }`}
                        whileHover={plan.name !== subscription.plan ? { scale: 1.05 } : {}}
                        whileTap={plan.name !== subscription.plan ? { scale: 0.95 } : {}}
                        disabled={plan.name === subscription.plan}
                      >
                        {plan.name === subscription.plan ? 'Current Plan' : 'Upgrade'}
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                {/* All Features */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`${getCardClass()} p-8`}
                >
                  <h3 className={`text-xl font-bold mb-6 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    All Features
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { category: 'Core Features', items: ['Student Management', 'Teacher Management', 'Class Scheduling', 'Attendance Tracking', 'Grade Management'] },
                      { category: 'Analytics', items: ['Performance Analytics', 'Progress Reports', 'Custom Dashboards', 'Data Export', 'Real-time Monitoring'] },
                      { category: 'Communication', items: ['Parent Portal', 'Messaging System', 'Email Notifications', 'SMS Alerts', 'Mobile App'] },
                      { category: 'Security', items: ['Data Encryption', 'Role-based Access', 'Audit Logs', 'Backup & Recovery', 'Compliance Tools'] }
                    ].map((category, index) => (
                      <motion.div
                        key={category.category}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <h4 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {category.category}
                        </h4>
                        <div className="space-y-2">
                          {category.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center gap-2">
                              <CheckCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
