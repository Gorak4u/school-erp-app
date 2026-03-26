'use client';

import React from 'react';
import { TransportStats } from './TransportStats';
import { RouteAnalytics } from './RouteAnalytics';
import { VehicleStatus } from './VehicleStatus';
import { FeeOverview } from './FeeOverview';
import { RecentActivity } from './RecentActivity';

interface TransportDashboardProps {
  stats: {
    totalRoutes: number;
    totalVehicles: number;
    totalStudents: number;
    pendingTransportFees: number;
  };
  statsRoutes: any[];
  vehicles: any[];
  isDark: boolean;
  card: string;
  text: string;
  subtext: string;
  btnPrimary: string;
}

export function TransportDashboard({
  stats,
  statsRoutes,
  vehicles,
  isDark,
  card,
  text,
  subtext,
  btnPrimary
}: TransportDashboardProps) {
  return (
    <div className="space-y-6">
      <TransportStats
        stats={stats}
        isDark={isDark}
        card={card}
        text={text}
        subtext={subtext}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RouteAnalytics
          statsRoutes={statsRoutes}
          isDark={isDark}
          card={card}
          text={text}
          subtext={subtext}
          btnPrimary={btnPrimary}
        />
        
        <VehicleStatus
          vehicles={vehicles}
          isDark={isDark}
          card={card}
          text={text}
          subtext={subtext}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeeOverview
          pendingTransportFees={stats.pendingTransportFees}
          isDark={isDark}
          card={card}
          text={text}
          subtext={subtext}
          btnPrimary={btnPrimary}
        />
        
        <RecentActivity
          isDark={isDark}
          card={card}
          text={text}
          subtext={subtext}
        />
      </div>
    </div>
  );
}
