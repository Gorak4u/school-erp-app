'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface KPICard {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'stable';
    color: 'green' | 'red' | 'blue';
  };
  icon: string;
  iconBg: string;
  iconColor: string;
  iconGradient: string;
  cardBg: string;
  link?: string;
  aiInsight: string;
}

interface DashboardKPICardsProps {
  theme: 'dark' | 'light';
  kpiData: {
    academic: {
      totalStudents: number;
      activeStudents: number;
      averageAttendance: number;
      passRate: number;
    };
    financial: {
      totalRevenue: number;
      feesCollected: number;
      pendingFees: number;
      collectionRate: number;
      finesWaived: number;
    };
    operational: {
      totalTeachers: number;
      activeTeachers: number;
      satisfactionScore: number;
      efficiency: number;
    };
  };
  canViewFinancials?: boolean;
}

export default function DashboardKPICards({ theme, kpiData, canViewFinancials = true }: DashboardKPICardsProps) {
  const isDark = theme === 'dark';

  const allCards: (KPICard & { financial?: boolean })[] = [
    {
      title: 'Total Students',
      value: kpiData.academic.totalStudents.toLocaleString(),
      subtitle: `Active: ${kpiData.academic.activeStudents}`,
      trend: {
        value: '+5.2%',
        type: 'up',
        color: 'green'
      },
      icon: '👥',
      iconBg: isDark ? 'bg-blue-600/20' : 'bg-blue-100',
      iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
      iconGradient: isDark ? 'from-blue-500 to-cyan-600' : 'from-blue-500 to-cyan-500',
      cardBg: isDark ? 'from-blue-600/20 to-cyan-600/20' : 'from-blue-500/10 to-cyan-500/10',
      link: '/students',
      aiInsight: 'Growing enrollment'
    },
    {
      title: 'Total Revenue',
      value: `₹${(kpiData.financial.totalRevenue / 100000).toFixed(1)}L`,
      subtitle: 'Including fines',
      trend: {
        value: '+15.2%',
        type: 'up',
        color: 'green'
      },
      icon: '💵',
      iconBg: isDark ? 'bg-indigo-600/20' : 'bg-indigo-100',
      iconColor: isDark ? 'text-indigo-400' : 'text-indigo-600',
      iconGradient: isDark ? 'from-indigo-500 to-purple-600' : 'from-indigo-500 to-purple-500',
      cardBg: isDark ? 'from-indigo-600/20 to-purple-600/20' : 'from-indigo-500/10 to-purple-500/10',
      link: '/fees',
      financial: true,
      aiInsight: 'Revenue growth'
    },
    {
      title: 'Fees Collected',
      value: `₹${(kpiData.financial.feesCollected / 100000).toFixed(1)}L`,
      subtitle: `${kpiData.financial.collectionRate}% collection rate`,
      trend: {
        value: '+8.3%',
        type: 'up',
        color: 'green'
      },
      icon: '💰',
      iconBg: isDark ? 'bg-green-600/20' : 'bg-green-100',
      iconColor: isDark ? 'text-green-400' : 'text-green-600',
      iconGradient: isDark ? 'from-green-500 to-emerald-600' : 'from-green-500 to-emerald-500',
      cardBg: isDark ? 'from-green-600/20 to-emerald-600/20' : 'from-green-500/10 to-emerald-500/10',
      link: '/fees',
      financial: true,
      aiInsight: 'Strong collection'
    },
    {
      title: 'Avg Attendance',
      value: `${kpiData.academic.averageAttendance}%`,
      subtitle: 'This month',
      trend: {
        value: '+2.1%',
        type: 'up',
        color: 'green'
      },
      icon: '📊',
      iconBg: isDark ? 'bg-purple-600/20' : 'bg-purple-100',
      iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
      iconGradient: isDark ? 'from-purple-500 to-pink-600' : 'from-purple-500 to-pink-500',
      cardBg: isDark ? 'from-purple-600/20 to-pink-600/20' : 'from-purple-500/10 to-pink-500/10',
      link: '/attendance',
      aiInsight: 'Improved presence'
    },
    {
      title: 'Total Teachers',
      value: kpiData.operational.totalTeachers,
      subtitle: `Active: ${kpiData.operational.activeTeachers}`,
      trend: {
        value: 'Stable',
        type: 'stable',
        color: 'blue'
      },
      icon: '👨‍🏫',
      iconBg: isDark ? 'bg-orange-600/20' : 'bg-orange-100',
      iconColor: isDark ? 'text-orange-400' : 'text-orange-600',
      iconGradient: isDark ? 'from-orange-500 to-amber-600' : 'from-orange-500 to-amber-500',
      cardBg: isDark ? 'from-orange-600/20 to-amber-600/20' : 'from-orange-500/10 to-amber-500/10',
      link: '/teachers',
      aiInsight: 'Stable staffing'
    },
    {
      title: 'Pass Rate',
      value: `${kpiData.academic.passRate}%`,
      subtitle: 'Last semester',
      trend: {
        value: '+3.5%',
        type: 'up',
        color: 'green'
      },
      icon: '🎓',
      iconBg: isDark ? 'bg-emerald-600/20' : 'bg-emerald-100',
      iconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
      iconGradient: isDark ? 'from-emerald-500 to-teal-600' : 'from-emerald-500 to-teal-500',
      cardBg: isDark ? 'from-emerald-600/20 to-teal-600/20' : 'from-emerald-500/10 to-teal-500/10',
      link: '/academics',
      aiInsight: 'Academic excellence'
    },
    {
      title: 'Pending Fees',
      value: `₹${(kpiData.financial.pendingFees / 100000).toFixed(1)}L`,
      subtitle: `${Math.round((kpiData.financial.pendingFees / kpiData.financial.totalRevenue) * 100)}% of total`,
      trend: {
        value: '-12.4%',
        type: 'down',
        color: 'green'
      },
      icon: '⏰',
      iconBg: isDark ? 'bg-red-600/20' : 'bg-red-100',
      iconColor: isDark ? 'text-red-400' : 'text-red-600',
      iconGradient: isDark ? 'from-amber-500 to-orange-600' : 'from-amber-500 to-orange-500',
      cardBg: isDark ? 'from-amber-600/20 to-orange-600/20' : 'from-amber-500/10 to-orange-500/10',
      link: '/fees',
      financial: true,
      aiInsight: 'Reduced pending'
    },
    {
      title: 'Waived Amounts',
      value: `₹${(kpiData.financial.finesWaived / 100000).toFixed(1)}L`,
      subtitle: 'Total waived fines',
      trend: {
        value: '+5.1%',
        type: 'up',
        color: 'blue'
      },
      icon: '🚫',
      iconBg: isDark ? 'bg-pink-600/20' : 'bg-pink-100',
      iconColor: isDark ? 'text-pink-400' : 'text-pink-600',
      iconGradient: isDark ? 'from-pink-500 to-rose-600' : 'from-pink-500 to-rose-500',
      cardBg: isDark ? 'from-pink-600/20 to-rose-600/20' : 'from-pink-500/10 to-rose-500/10',
      link: '/fines',
      financial: true,
      aiInsight: 'Fee adjustments'
    },
    {
      title: 'Teacher Satisfaction',
      value: `${kpiData.operational.satisfactionScore}/5`,
      subtitle: 'Survey results',
      trend: {
        value: '+0.3',
        type: 'up',
        color: 'green'
      },
      icon: '😊',
      iconBg: isDark ? 'bg-yellow-600/20' : 'bg-yellow-100',
      iconColor: isDark ? 'text-yellow-400' : 'text-yellow-600',
      iconGradient: isDark ? 'from-yellow-500 to-amber-600' : 'from-yellow-500 to-amber-500',
      cardBg: isDark ? 'from-yellow-600/20 to-amber-600/20' : 'from-yellow-500/10 to-amber-500/10',
      link: '/teachers',
      aiInsight: 'Happy teachers'
    },
    {
      title: 'Operational Efficiency',
      value: `${kpiData.operational.efficiency}%`,
      subtitle: 'Process optimization',
      trend: {
        value: '+5.7%',
        type: 'up',
        color: 'green'
      },
      icon: '⚡',
      iconBg: isDark ? 'bg-cyan-600/20' : 'bg-cyan-100',
      iconColor: isDark ? 'text-cyan-400' : 'text-cyan-600',
      iconGradient: isDark ? 'from-cyan-500 to-sky-600' : 'from-cyan-500 to-sky-500',
      cardBg: isDark ? 'from-cyan-600/20 to-sky-600/20' : 'from-cyan-500/10 to-sky-500/10',
      link: '/reports',
      aiInsight: 'Optimized ops'
    }
  ];

  const cards = canViewFinancials ? allCards : allCards.filter(c => !c.financial);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const content = (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
            whileHover={{ scale: card.link ? 1.03 : 1, y: card.link ? -4 : 0 }}
            className={`bg-gradient-to-br ${card.cardBg} border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} backdrop-blur-sm p-6 rounded-2xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group ${
              card.link ? 'cursor-pointer' : ''
            }`}
          >
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.iconGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

            {/* Animated Background Pattern */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${card.iconBg} rounded-full -mr-16 -mt-16 opacity-20 animate-pulse`} />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center text-2xl shadow-lg relative`}
                >
                  <span className={card.iconColor}>{card.icon}</span>
                  <div className={`absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r ${card.iconGradient} rounded-full animate-ping`} />
                </motion.div>

                {/* Smart Badge */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-gradient-to-r ${isDark ? 'from-indigo-600/20 to-purple-600/20' : 'from-indigo-100 to-purple-100'} border border-indigo-300/30`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs">✨</span>
                    <span className={`${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Smart</span>
                  </div>
                </motion.div>
              </div>

              {/* Main Value */}
              <div className="mb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
                  className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
                >
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </motion.div>
              </div>

              {/* Title and Trend */}
              <div className="flex items-center justify-between mb-3">
                <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {card.title}
                </div>
                {card.trend && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                      card.trend.type === 'up'
                        ? 'bg-green-100 text-green-600'
                        : card.trend.type === 'down'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    <span>{card.trend.type === 'up' ? '📈' : card.trend.type === 'down' ? '📉' : '→'}</span>
                    <span>{card.trend.value}</span>
                  </motion.div>
                )}
              </div>

              {/* Subtitle */}
              {card.subtitle && (
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mb-2`}>
                  {card.subtitle}
                </p>
              )}

              {/* AI Insight */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1`}
              >
                <span>💡</span>
                <span>{card.aiInsight}</span>
              </motion.div>
            </div>
          </motion.div>
        );

        if (card.link) {
          return (
            <Link key={card.title} href={card.link}>
              {content}
            </Link>
          );
        }

        return <div key={card.title}>{content}</div>;
      })}
    </div>
  );
}
