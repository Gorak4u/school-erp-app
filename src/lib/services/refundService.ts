import { invalidateCache, getCachedData, setCachedData } from '@/lib/refundCache';

// AI-Optimized Refund Service Layer (API-only for client-side)
export class RefundService {
  private static instance: RefundService;
  
  static getInstance(): RefundService {
    if (!RefundService.instance) {
      RefundService.instance = new RefundService();
    }
    return RefundService.instance;
  }

  // High-performance refund listing with intelligent caching
  async getRefunds(filters: RefundFilters, pagination: PaginationConfig): Promise<RefundListResponse> {
    const cacheKey = `refunds_list_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Build query parameters
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      pageSize: pagination.pageSize.toString(),
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      ...Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value.toString();
        }
        return acc;
      }, {} as Record<string, string>)
    });

    try {
      const response = await fetch(`/api/refunds?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch refunds: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Cache the result
      setCachedData(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('RefundService.getRefunds error:', error);
      throw error;
    }
  }

  // Smart refund creation with validation and optimization
  async createRefund(data: CreateRefundRequest): Promise<any> {
    try {
      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create refund: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Invalidate relevant caches
      invalidateCache('refund_analytics');
      invalidateCache(`student_refunds_${data.schoolId}_${data.studentId}`);

      return result.refund;
    } catch (error) {
      console.error('RefundService.createRefund error:', error);
      throw error;
    }
  }

  // Batch operations for bulk processing
  async processBulkRefunds(refundIds: string[], action: 'approve' | 'reject'): Promise<BulkOperationResult> {
    try {
      const response = await fetch('/api/refunds/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refundIds, action })
      });

      if (!response.ok) {
        throw new Error(`Failed to process bulk refunds: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Invalidate cache after bulk operation
      invalidateCache('refund_analytics');
      
      return result;
    } catch (error) {
      console.error('RefundService.processBulkRefunds error:', error);
      throw error;
    }
  }

  // Get individual refund details
  async getRefund(refundId: string): Promise<any> {
    try {
      const response = await fetch(`/api/refunds/${refundId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch refund: ${response.statusText}`);
      }

      const result = await response.json();
      return result.refund;
    } catch (error) {
      console.error('RefundService.getRefund error:', error);
      throw error;
    }
  }

  // Update refund status
  async updateRefund(refundId: string, updates: any): Promise<any> {
    try {
      const response = await fetch(`/api/refunds/${refundId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`Failed to update refund: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Invalidate relevant caches
      invalidateCache('refund_analytics');
      
      return result.refund;
    } catch (error) {
      console.error('RefundService.updateRefund error:', error);
      throw error;
    }
  }

  // Cancel refund
  async cancelRefund(refundId: string): Promise<any> {
    try {
      const response = await fetch(`/api/refunds/${refundId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel refund: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Invalidate relevant caches
      invalidateCache('refund_analytics');
      
      return result;
    } catch (error) {
      console.error('RefundService.cancelRefund error:', error);
      throw error;
    }
  }
}

// Type definitions for better type safety
export interface RefundFilters {
  schoolId: string;
  status?: string;
  type?: string;
  studentId?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CreateRefundRequest {
  schoolId: string;
  studentId: string;
  type: string;
  sourceId?: string;
  sourceType?: string;
  amount: number;
  adminFee: number;
  reason: string;
  refundMethod: string;
  bankDetails?: any;
  createdBy: string;
  metadata?: any;
}

export interface RefundListResponse {
  refunds: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BulkOperationResult {
  successful: number;
  failed: number;
  total: number;
}

// Export singleton instance
export const refundService = RefundService.getInstance();
