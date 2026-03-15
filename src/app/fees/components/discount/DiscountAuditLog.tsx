'use client';

import React, { useState, useEffect } from 'react';

interface DiscountAuditLogProps {
  theme: 'dark' | 'light';
}

export default function DiscountAuditLog({ theme }: DiscountAuditLogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fees/discount-audit');
      const data = await res.json();
      
      if (data.success) {
        setLogs(data.data);
      } else {
        throw new Error(data.error || 'Failed to load audit logs');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className={`text-xs uppercase ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
          <tr>
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Request Details</th>
            <th className="px-4 py-3">Additional Info</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No audit logs found</td>
            </tr>
          ) : (
            logs.map((log) => {
              const details = log.details ? JSON.parse(log.details) : {};
              return (
                <tr key={log.id} className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="block font-medium">{new Date(log.createdAt).toLocaleDateString()}</span>
                    <span className={`text-xs ${textSecondary}`}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                      log.action === 'created' ? 'bg-purple-100 text-purple-800' :
                      log.action === 'approved' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'applied' ? 'bg-green-100 text-green-800' :
                      log.action === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{log.actorName}</span>
                    <span className="block text-xs text-gray-500">{log.actorRole}</span>
                  </td>
                  <td className="px-4 py-3">
                    {log.discountRequest ? (
                      <>
                        <span className="font-medium block">{log.discountRequest.name}</span>
                        <span className="text-xs text-gray-500">
                          {log.discountRequest.scope} | {log.discountRequest.discountType}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500 italic">Request Deleted</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" title={JSON.stringify(details)}>
                    {details.reason && <span className="block truncate text-xs"><span className="font-medium">Reason:</span> {details.reason}</span>}
                    {details.note && <span className="block truncate text-xs"><span className="font-medium">Note:</span> {details.note}</span>}
                    {details.appliedCount && <span className="block text-xs"><span className="font-medium">Records updated:</span> {details.appliedCount}</span>}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
