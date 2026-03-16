'use client';

import React, { useState, useEffect } from 'react';

interface DiscountApprovalQueueProps {
  theme: 'dark' | 'light';
  userRole: string;
  viewMode: 'my_requests' | 'all';
}

export default function DiscountApprovalQueue({ theme, userRole, viewMode }: DiscountApprovalQueueProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feeStructures, setFeeStructures] = useState<Array<{id: string; name: string; class?: {name: string}}>>([]);

  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  useEffect(() => {
    fetchRequests();
  }, [viewMode]);

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      const res = await fetch('/api/fees/structures');
      if (res.ok) {
        const data = await res.json();
        setFeeStructures(data.feeStructures || []);
      }
    } catch (err) {
      console.error('Failed to fetch fee structures:', err);
    }
  };

  // Helper function to get fee structure names
  const getFeeStructureNames = (feeStructureIds: string[]) => {
    if (!feeStructureIds || feeStructureIds.length === 0) return [];
    
    return feeStructureIds.map(id => {
      const structure = feeStructures.find(fs => fs.id === id);
      return structure ? {
        id: structure.id,
        name: structure.name,
        class: structure.class?.name || 'All Classes'
      } : { id, name: 'Unknown Structure', class: 'N/A' };
    });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      const baseUrl = viewMode === 'my_requests' 
        ? '/api/fees/discount-requests' 
        : '/api/fees/discount-requests';
      
      const url = viewMode === 'my_requests' 
        ? baseUrl 
        : `${baseUrl}?status=pending`;
        
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setRequests(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load requests');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject' | 'apply', reason?: string) => {
    try {
      setIsProcessing(true);
      let url = `/api/fees/discount-requests/${requestId}`;
      let options: RequestInit = {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: reason, rejectionReason: reason })
      };

      if (action === 'apply') {
        url = `/api/fees/discount-requests/${requestId}/apply`;
        options = { method: 'POST' };
      }

      const res = await fetch(url, options);
      const data = await res.json();

      if (!data.success && !res.ok) {
        throw new Error(data.error || `Failed to ${action} request`);
      }

      // Show success toast
      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Success',
          message: data.message || `Request ${action}d successfully`,
          duration: 3000
        });
      }

      setSelectedRequest(null);
      setApprovalNote('');
      fetchRequests(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle modal open with fee structure fetch
  const handleViewDetails = async (request: any) => {
    setSelectedRequest(request);
    // Ensure fee structures are loaded when opening modal
    if (feeStructures.length === 0) {
      await fetchFeeStructures();
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className={`text-xs uppercase ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
            <tr>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Requested By</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Fee Structures</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No {viewMode === 'my_requests' ? 'requests found' : 'pending approvals'}
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className={`border-b ${isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <td className="px-4 py-3 font-medium">{req.name}</td>
                  <td className="px-4 py-3">
                    {req.requestedByName}
                    <span className="block text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-4 py-3 capitalize">{req.scope}</td>
                  <td className="px-4 py-3">
                    {req.targetType === 'total' ? (
                      <span className="text-xs font-medium text-blue-600">All Fees</span>
                    ) : (
                      (() => {
                        const structures = getFeeStructureNames(JSON.parse(req.feeStructureIds || '[]'));
                        const count = structures.length;
                        return count > 0 ? (
                          <span className="text-xs font-medium text-purple-600">
                            {count} {count === 1 ? 'Structure' : 'Structures'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">None</span>
                        );
                      })()
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {req.discountType === 'percentage' ? `${req.discountValue}%` : 
                     req.discountType === 'fixed' ? `₹${req.discountValue}` : 'Full Waiver'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      req.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      req.status === 'applied' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleViewDetails(req)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className={`text-xl font-bold ${textPrimary}`}>Discount Request Details</h3>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className={textSecondary}>Reason</p>
                  <p className={`font-medium ${textPrimary}`}>{selectedRequest.name}</p>
                </div>
                <div>
                  <p className={textSecondary}>Requested By</p>
                  <p className={`font-medium ${textPrimary}`}>{selectedRequest.requestedByName} ({selectedRequest.requestedByEmail})</p>
                </div>
                <div>
                  <p className={textSecondary}>Created By</p>
                  <p className={`font-medium ${textPrimary}`}>
                    {selectedRequest.requestedByName} ({selectedRequest.requestedByEmail})
                  </p>
                  <p className={`text-xs ${textSecondary}`}>
                    Created: {new Date(selectedRequest.createdAt).toLocaleDateString()} at {new Date(selectedRequest.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className={textSecondary}>Discount Value</p>
                  <p className={`font-medium ${textPrimary}`}>
                    {selectedRequest.discountType === 'percentage' ? `${selectedRequest.discountValue}%` : 
                     selectedRequest.discountType === 'fixed' ? `₹${selectedRequest.discountValue}` : 'Full Waiver'}
                    {selectedRequest.maxCapAmount && ` (Max ₹${selectedRequest.maxCapAmount})`}
                  </p>
                </div>
                <div>
                  <p className={textSecondary}>Target</p>
                  <p className={`font-medium ${textPrimary} capitalize`}>{selectedRequest.scope} - {selectedRequest.targetType.replace('_', ' ')}</p>
                </div>
                
                {/* Fee Structures Information */}
                <div className="col-span-2">
                  <p className={textSecondary}>Fee Structures</p>
                  <div className={`mt-2 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    {(() => {
                      
                      if (selectedRequest.targetType === 'fee_structure') {
                        let feeStructureIds = [];
                        try {
                          feeStructureIds = JSON.parse(selectedRequest.feeStructureIds || '[]');
                        } catch (e) {
                          feeStructureIds = [];
                        }
                        
                        const structures = getFeeStructureNames(feeStructureIds);
                        
                        if (structures.length > 0) {
                          return (
                            <div className="space-y-2">
                              {structures.map(structure => (
                                <div key={structure.id} className="flex items-center justify-between">
                                  <div>
                                    <span className={`font-medium ${textPrimary}`}>{structure.name}</span>
                                    <span className={`ml-2 text-xs ${textSecondary}`}>({structure.class})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        } else {
                          return (
                            <div>
                              <p className={textSecondary}>No specific fee structures selected</p>
                              <p className={`text-xs ${textSecondary} mt-2`}>
                                Raw IDs: {selectedRequest.feeStructureIds}
                              </p>
                            </div>
                          );
                        }
                      } else {
                        return (
                          <div>
                            <p className={`font-medium ${textPrimary}`}>All Fee Structures</p>
                            <p className={`text-xs ${textSecondary} mt-1`}>
                              (Total Fees option - applies to all fee structures)
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
                
                <div className="col-span-2">
                  <p className={textSecondary}>Reason / Justification</p>
                  <div className={`mt-1 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={textPrimary}>{selectedRequest.reason}</p>
                  </div>
                </div>
              </div>

              {/* Actions based on status and role */}
              {selectedRequest.status === 'pending' && (userRole === 'admin' || userRole === 'super_admin') && selectedRequest.requestedBy !== 'current-user-id' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <label className="block text-sm font-medium mb-2">Approval/Rejection Note (Optional)</label>
                  <textarea
                    className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                    rows={3}
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Add a note before approving or rejecting..."
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(selectedRequest.id, 'reject', approvalNote)}
                      className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium"
                    >
                      Reject Request
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(selectedRequest.id, 'approve', approvalNote)}
                      className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2"
                    >
                      {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      Approve Discount
                    </button>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'approved' && (userRole === 'admin' || userRole === 'super_admin') && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                    <p className="text-blue-800 dark:text-blue-300 text-sm">
                      This request has been approved. Click apply to execute the batch update on all target fee records. This action cannot be undone automatically.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(selectedRequest.id, 'apply')}
                      className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium flex items-center gap-2"
                    >
                      {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      Apply to Fee Records
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
