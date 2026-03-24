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
  link?: string;
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
      iconBg: theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-100',
      iconColor: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
      link: '/students'
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
      iconBg: theme === 'dark' ? 'bg-indigo-600/20' : 'bg-indigo-100',
      iconColor: theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600',
      link: '/fees',
      financial: true
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
      iconBg: theme === 'dark' ? 'bg-green-600/20' : 'bg-green-100',
      iconColor: theme === 'dark' ? 'text-green-400' : 'text-green-600',
      link: '/fees',
      financial: true
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
      iconBg: theme === 'dark' ? 'bg-purple-600/20' : 'bg-purple-100',
      iconColor: theme === 'dark' ? 'text-purple-400' : 'text-purple-600',
      link: '/attendance'
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
      iconBg: theme === 'dark' ? 'bg-orange-600/20' : 'bg-orange-100',
      iconColor: theme === 'dark' ? 'text-orange-400' : 'text-orange-600',
      link: '/teachers'
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
      iconBg: theme === 'dark' ? 'bg-emerald-600/20' : 'bg-emerald-100',
      iconColor: theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600',
      link: '/academics'
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
      iconBg: theme === 'dark' ? 'bg-red-600/20' : 'bg-red-100',
      iconColor: theme === 'dark' ? 'text-red-400' : 'text-red-600',
      link: '/fees',
      financial: true
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
      iconBg: theme === 'dark' ? 'bg-yellow-600/20' : 'bg-yellow-100',
      iconColor: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
      link: '/teachers'
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
      iconBg: theme === 'dark' ? 'bg-cyan-600/20' : 'bg-cyan-100',
      iconColor: theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600',
      link: '/reports'
    }
  ];

  const cards = canViewFinancials ? allCards : allCards.filter(c => !c.financial);

  const getTrendColor = (color: 'green' | 'red' | 'blue') => {
    const colors = {
      green: theme === 'dark' ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600',
      red: theme === 'dark' ? 'bg-red-600/20 text-red-400' : 'bg-red-100 text-red-600',
      blue: theme === 'dark' ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'
    };
    return colors[color];
  };

  const CardContent = ({ card, index }: { card: KPICard; index: number }) => {
    const content = (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: card.link ? 1.02 : 1 }}
        className={`p-6 rounded-xl border hover:shadow-lg transition-all duration-300 ${
          card.link ? 'cursor-pointer' : ''
        } ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg} ${card.iconColor}`}>
            {card.icon}
          </div>
          {card.trend && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTrendColor(card.trend.color)}`}>
              {card.trend.type === 'up' && '↑'}
              {card.trend.type === 'down' && '↓'}
              {card.trend.type === 'stable' && '→'}
              {card.trend.value}
            </span>
          )}
        </div>
        <div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {card.title}
          </p>
          <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {card.value}
          </p>
          {card.subtitle && (
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
              {card.subtitle}
            </p>
          )}
        </div>
      </motion.div>
    );

    if (card.link) {
      return (
        <Link href={card.link}>
          {content}
        </Link>
      );
    }

    return content;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card: KPICard, index: number) => (
        <CardContent key={card.title} card={card} index={index} />
      ))}
    </div>
  );
}
