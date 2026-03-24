'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, CheckCircle, Clock, Filter } from 'lucide-react';

interface DiscountAnalyticsProps {
  theme: 'dark' | 'light';
}

export default function DiscountAnalytics({ theme }: DiscountAnalyticsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ academicYear: '', dateFrom: '', dateTo: '', scope: '', status: '' });

  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const bgCard = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const params = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v));
        const res = await fetch(`/api/fees/discount-analytics?${params}`);
        if (res.ok) {
          const result = await res.json();
          setData(result.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [filters]);

  if (loading) return <div className="p-8 text-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  if (!data) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">No data available</div>;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className={`p-4 rounded-xl border ${bgCard}`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className={`font-semibold ${textPrimary}`}>Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input type="text" placeholder="Academic Year" value={filters.academicYear} onChange={(e) => setFilters({...filters, academicYear: e.target.value})} className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
          <select value={filters.scope} onChange={(e) => setFilters({...filters, scope: e.target.value})} className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
            <option value="">All Scopes</option>
            <option value="student">Single Student</option>
            <option value="class">Class</option>
            <option value="bulk">Bulk Students</option>
          </select>
          <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="applied">Applied</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-6 rounded-xl border ${bgCard}`}>
          <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
          <p className={`text-sm ${textSecondary}`}>Total Requests</p>
          <p className={`text-3xl font-bold ${textPrimary}`}>{data.summary.totalRequests.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-xl border ${bgCard}`}>
          <DollarSign className="w-8 h-8 text-green-600 mb-2" />
          <p className={`text-sm ${textSecondary}`}>Total Discounted</p>
          <p className={`text-3xl font-bold ${textPrimary}`}>₹{Number(data.summary.totalAmountDiscounted).toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-xl border ${bgCard}`}>
          <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
          <p className={`text-sm ${textSecondary}`}>Approval Rate</p>
          <p className={`text-3xl font-bold ${textPrimary}`}>{data.summary.approvalRate}</p>
        </div>
        <div className={`p-6 rounded-xl border ${bgCard}`}>
          <Clock className="w-8 h-8 text-orange-600 mb-2" />
          <p className={`text-sm ${textSecondary}`}>Avg Approval Time</p>
          <p className={`text-3xl font-bold ${textPrimary}`}>{data.summary.avgApprovalTimeHours}h</p>
        </div>
      </div>

      {/* Monthly Trends Table */}
      <div className={`p-6 rounded-xl border ${bgCard}`}>
        <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Monthly Trends</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`text-xs uppercase ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left">Month</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Approved</th>
                <th className="px-4 py-3 text-right">Applied</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyTrends.map((trend: any) => (
                <tr key={trend.month} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3">{trend.month}</td>
                  <td className="px-4 py-3 text-right">{trend.totalRequests}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{trend.approved}</td>
                  <td className="px-4 py-3 text-right text-green-600">{trend.applied}</td>
                  <td className="px-4 py-3 text-right font-semibold">₹{trend.totalAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
