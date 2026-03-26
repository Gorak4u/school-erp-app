// @ts-nocheck
'use client';

import SmartSearchEngine, { SearchQuery, SearchPattern } from '../../shared/search/SmartSearchEngine';
import QueryParser, { ParsedQuery } from '../../shared/search/QueryParser';

/**
 * Refund-Specific Search Engine
 * Based on StudentSearchEngine architecture
 */

export interface RefundSearchQuery extends SearchQuery {
  includeProcessed?: boolean;
  includeRejected?: boolean;
  dateRange?: { from: string; to: string };
  minAmount?: number;
  maxAmount?: number;
}

export interface RefundSearchResult {
  refunds: any[];
  totalCount: number;
  searchTime: number;
  cacheHit: boolean;
  suggestions: string[];
  analytics: {
    statusDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
    amountDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
  };
}

export class RefundSearchEngine extends SmartSearchEngine<any> {
  private static instance: RefundSearchEngine;
  
  private constructor() {
    super();
  }
  
  /**
   * Singleton pattern for performance
   */
  static getInstance(): RefundSearchEngine {
    if (!RefundSearchEngine.instance) {
      RefundSearchEngine.instance = new RefundSearchEngine();
    }
    return RefundSearchEngine.instance;
  }
  
  /**
   * Refund-specific text fields for indexing
   */
  protected getTextFields(record: any): string[] {
    return [
      'type',
      'status',
      'priority',
      'reason',
      'refundMethod',
      'rejectionReason',
      'student.name',
      'student.admissionNo',
      'student.email',
      'student.phone',
      'student.class',
      'student.section'
    ];
  }
  
  /**
   * Refund-specific indexable fields
   */
  protected getIndexableFields(record: any): string[] {
    return [
      'id',
      'type',
      'status',
      'priority',
      'amount',
      'netAmount',
      'refundMethod',
      'createdAt',
      'student.id',
      'student.name',
      'student.admissionNo',
      'student.class',
      'student.section'
    ].filter(field => record[field] !== undefined && record[field] !== null);
  }
  
  /**
   * Enhanced refund search with analytics
   */
  searchRefunds(query: RefundSearchQuery): RefundSearchResult {
    const startTime = performance.now();
    
    // Parse natural language query
    const parsedQuery = QueryParser.parse(query.text);
    
    // Convert parsed patterns to search patterns
    const searchPatterns = this.convertPatterns(parsedQuery.patterns);
    
    // Build search query
    const searchQuery: SearchQuery = {
      text: parsedQuery.text,
      patterns: searchPatterns,
      filters: query.filters || {},
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };
    
    // Execute search
    const result = this.search(searchQuery);
    
    // Apply refund-specific filters
    let filteredRefunds = result.items;
    
    if (query.includeProcessed === false) {
      filteredRefunds = filteredRefunds.filter(r => r.status !== 'processed');
    }
    
    if (query.includeRejected === false) {
      filteredRefunds = filteredRefunds.filter(r => r.status !== 'rejected');
    }

    if (query.dateRange) {
      const fromDate = new Date(query.dateRange.from);
      const toDate = new Date(query.dateRange.to);
      filteredRefunds = filteredRefunds.filter(r => {
        const refundDate = new Date(r.createdAt);
        return refundDate >= fromDate && refundDate <= toDate;
      });
    }

    if (query.minAmount !== undefined) {
      filteredRefunds = filteredRefunds.filter(r => r.amount >= query.minAmount);
    }

    if (query.maxAmount !== undefined) {
      filteredRefunds = filteredRefunds.filter(r => r.amount <= query.maxAmount);
    }
    
    // Generate analytics
    const analytics = this.generateRefundAnalytics(filteredRefunds);
    
    return {
      refunds: filteredRefunds,
      totalCount: filteredRefunds.length,
      searchTime: performance.now() - startTime,
      cacheHit: result.cacheHit,
      suggestions: result.suggestions,
      analytics
    };
  }
  
  /**
   * Convert parsed patterns to search patterns
   */
  private convertPatterns(parsedPatterns: SearchPattern[]): SearchPattern[] {
    return parsedPatterns.map(pattern => {
      // Handle refund-specific field mappings
      const fieldMapping: Record<string, string> = {
        'status': 'status',
        'type': 'type',
        'priority': 'priority',
        'amount': 'amount',
        'method': 'refundMethod',
        'student': 'student.name',
        'class': 'student.class',
        'section': 'student.section'
      };
      
      return {
        ...pattern,
        field: fieldMapping[pattern.field] || pattern.field
      };
    });
  }
  
  /**
   * Generate refund-specific analytics
   */
  private generateRefundAnalytics(refunds: any[]): RefundSearchResult['analytics'] {
    const statusDistribution: Record<string, number> = {};
    const typeDistribution: Record<string, number> = {};
    const amountDistribution: Record<string, number> = {};
    const priorityDistribution: Record<string, number> = {};
    
    for (const refund of refunds) {
      // Status distribution
      const status = refund.status || 'unknown';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      
      // Type distribution
      const type = refund.type || 'unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      
      // Amount distribution
      const amountRange = this.getAmountRange(refund.amount || 0);
      amountDistribution[amountRange] = (amountDistribution[amountRange] || 0) + 1;
      
      // Priority distribution
      const priority = refund.priority || 'normal';
      priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
    }
    
    return {
      statusDistribution,
      typeDistribution,
      amountDistribution,
      priorityDistribution
    };
  }
  
  /**
   * Get amount range for distribution
   */
  private getAmountRange(amount: number): string {
    if (amount === 0) return '₹0';
    if (amount < 1000) return '₹1-999';
    if (amount < 5000) return '₹1,000-4,999';
    if (amount < 10000) return '₹5,000-9,999';
    if (amount < 25000) return '₹10,000-24,999';
    return '₹25,000+';
  }
  
  /**
   * Generate smart suggestions for refunds
   */
  generateRefundSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Status-related suggestions
    if (lowerQuery.includes('status') || lowerQuery.includes('pending')) {
      suggestions.push('pending refunds');
      suggestions.push('approved refunds');
      suggestions.push('rejected refunds');
      suggestions.push('processed refunds');
    }
    
    // Type-related suggestions
    if (lowerQuery.includes('type') || lowerQuery.includes('fee')) {
      suggestions.push('transport fee refunds');
      suggestions.push('academic fee refunds');
      suggestions.push('fine refunds');
      suggestions.push('overpayment refunds');
      suggestions.push('transport fee waivers');
    }
    
    // Amount-related suggestions
    if (lowerQuery.includes('amount') || lowerQuery.includes('money')) {
      suggestions.push('refunds above ₹10,000');
      suggestions.push('refunds below ₹5,000');
      suggestions.push('high amount refunds');
      suggestions.push('small amount refunds');
    }
    
    // Priority-related suggestions
    if (lowerQuery.includes('priority') || lowerQuery.includes('urgent')) {
      suggestions.push('high priority refunds');
      suggestions.push('normal priority refunds');
      suggestions.push('urgent refunds');
    }
    
    // Student-related suggestions
    if (lowerQuery.includes('student') || lowerQuery.includes('class')) {
      suggestions.push('refunds for class 10');
      suggestions.push('refunds for class 12');
      suggestions.push('refunds by student name');
    }
    
    // Add general suggestions if no specific matches
    if (suggestions.length === 0) {
      suggestions.push('pending refunds');
      suggestions.push('approved refunds');
      suggestions.push('transport fee refunds');
      suggestions.push('academic fee refunds');
      suggestions.push('high priority refunds');
    }
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }
  
  /**
   * Get search insights for dashboard
   */
  getSearchInsights(): {
    totalRefunds: number;
    averageAmount: number;
    pendingCount: number;
    approvedCount: number;
    distribution: Record<string, number>;
    popularSearches: Array<{ query: string; count: number }>;
  } {
    const metrics = this.getMetrics();
    
    // Calculate insights from current data
    const allRefunds = Array.from(this.index.recordIndex.values());
    const averageAmount = allRefunds.reduce((sum, r) => sum + (r.amount || 0), 0) / allRefunds.length;
    const pendingCount = allRefunds.filter(r => r.status === 'pending').length;
    const approvedCount = allRefunds.filter(r => r.status === 'approved').length;
    
    const distribution = {
      pending: pendingCount,
      approved: approvedCount,
      rejected: allRefunds.filter(r => r.status === 'rejected').length,
      processed: allRefunds.filter(r => r.status === 'processed').length
    };
    
    return {
      totalRefunds: this.index.metadata.totalRecords,
      averageAmount: Math.round(averageAmount),
      pendingCount,
      approvedCount,
      distribution,
      popularSearches: [] // Would be populated from search analytics
    };
  }
}

export default RefundSearchEngine;
