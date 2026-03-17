// @ts-nocheck
'use client';

import SmartSearchEngine, { SearchQuery, SearchPattern } from '../../shared/search/SmartSearchEngine';
import QueryParser, { ParsedQuery } from '../../shared/search/QueryParser';

/**
 * Fee-Specific Search Engine
 * Optimized for fee data structures and financial queries
 */

export interface StudentFeeSummary {
  id: number;
  studentId: number;
  name: string;
  class: string;
  section: string;
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  overdueFees: number;
  lastPaymentDate: string;
  paymentStatus: 'fully_paid' | 'partially_paid' | 'no_payment' | 'overdue';
  feeStructure: {
    tuition: number;
    transport: number;
    hostel: number;
    other: number;
  };
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: string;
    status: string;
  }>;
}

export interface FeeSearchQuery extends SearchQuery {
  paymentStatus?: string[];
  feeType?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  includeInactive?: boolean;
}

export interface FeeSearchResult {
  students: StudentFeeSummary[];
  totalCount: number;
  searchTime: number;
  cacheHit: boolean;
  suggestions: string[];
  analytics: {
    totalFees: number;
    totalCollected: number;
    totalPending: number;
    totalOverdue: number;
    collectionRate: number;
    paymentStatusBreakdown: Record<string, number>;
    classWiseBreakdown: Record<string, {
      total: number;
      collected: number;
      pending: number;
      students: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      amount: number;
      students: number;
    }>;
    riskAssessment: {
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
    };
  };
}

export class FeeSearchEngine extends SmartSearchEngine<StudentFeeSummary> {
  private static instance: FeeSearchEngine;
  
  private constructor() {
    super();
  }
  
  /**
   * Singleton pattern for performance
   */
  static getInstance(): FeeSearchEngine {
    if (!FeeSearchEngine.instance) {
      FeeSearchEngine.instance = new FeeSearchEngine();
    }
    return FeeSearchEngine.instance;
  }
  
  /**
   * Fee-specific text fields for indexing
   */
  protected getTextFields(record: StudentFeeSummary): string[] {
    return [
      'name',
      'class',
      'section',
      'paymentStatus'
    ];
  }
  
  /**
   * Fee-specific indexable fields
   */
  protected getIndexableFields(record: StudentFeeSummary): string[] {
    return [
      'id',
      'studentId',
      'name',
      'class',
      'section',
      'totalFees',
      'paidFees',
      'pendingFees',
      'overdueFees',
      'paymentStatus',
      'lastPaymentDate'
    ].filter(field => record[field] !== undefined && record[field] !== null);
  }
  
  /**
   * Enhanced fee search with financial analytics
   */
  searchFees(query: FeeSearchQuery): FeeSearchResult {
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
    
    // Apply fee-specific filters
    let filteredStudents = result.items;
    
    // Payment status filter
    if (query.paymentStatus && query.paymentStatus.length > 0) {
      filteredStudents = filteredStudents.filter(s => 
        query.paymentStatus!.includes(s.paymentStatus)
      );
    }
    
    // Date range filter
    if (query.dateRange) {
      filteredStudents = filteredStudents.filter(s => {
        if (!s.lastPaymentDate) return false;
        const paymentDate = new Date(s.lastPaymentDate);
        const startDate = new Date(query.dateRange!.start);
        const endDate = new Date(query.dateRange!.end);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }
    
    // Amount range filter
    if (query.amountRange) {
      filteredStudents = filteredStudents.filter(s => 
        s.totalFees >= query.amountRange!.min && 
        s.totalFees <= query.amountRange!.max
      );
    }
    
    // Generate analytics
    const analytics = this.generateFeeAnalytics(filteredStudents);
    
    return {
      students: filteredStudents,
      totalCount: filteredStudents.length,
      searchTime: performance.now() - startTime,
      cacheHit: result.cacheHit,
      suggestions: result.suggestions,
      analytics
    };
  }
  
  /**
   * Convert parsed patterns to fee search patterns
   */
  private convertPatterns(parsedPatterns: SearchPattern[]): SearchPattern[] {
    return parsedPatterns.map(pattern => {
      // Handle fee-specific field mappings
      const fieldMapping: Record<string, string> = {
        'fees.pending': 'pendingFees',
        'fees.overdue': 'overdueFees',
        'fees.total': 'totalFees',
        'fees.paid': 'paidFees',
        'paymentStatus': 'paymentStatus'
      };
      
      return {
        ...pattern,
        field: fieldMapping[pattern.field] || pattern.field
      };
    });
  }
  
  /**
   * Generate fee-specific analytics
   */
  private generateFeeAnalytics(students: StudentFeeSummary[]): FeeSearchResult['analytics'] {
    const totalFees = students.reduce((sum, s) => sum + (s.totalFees || 0), 0);
    const totalCollected = students.reduce((sum, s) => sum + (s.paidFees || 0), 0);
    const totalPending = students.reduce((sum, s) => sum + (s.pendingFees || 0), 0);
    const totalOverdue = students.reduce((sum, s) => sum + (s.overdueFees || 0), 0);
    const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0;
    
    // Payment status breakdown
    const paymentStatusBreakdown: Record<string, number> = {};
    for (const student of students) {
      const status = student.paymentStatus || 'unknown';
      paymentStatusBreakdown[status] = (paymentStatusBreakdown[status] || 0) + 1;
    }
    
    // Class-wise breakdown
    const classWiseBreakdown: Record<string, any> = {};
    for (const student of students) {
      const className = student.class || 'Unknown';
      if (!classWiseBreakdown[className]) {
        classWiseBreakdown[className] = {
          total: 0,
          collected: 0,
          pending: 0,
          students: 0
        };
      }
      
      classWiseBreakdown[className].total += student.totalFees || 0;
      classWiseBreakdown[className].collected += student.paidFees || 0;
      classWiseBreakdown[className].pending += student.pendingFees || 0;
      classWiseBreakdown[className].students += 1;
    }
    
    // Monthly trend (mock data - would come from payment history)
    const monthlyTrend = this.generateMonthlyTrend(students);
    
    // Risk assessment
    const riskAssessment = this.assessFeeRisk(students);
    
    return {
      totalFees,
      totalCollected,
      totalPending,
      totalOverdue,
      collectionRate,
      paymentStatusBreakdown,
      classWiseBreakdown,
      monthlyTrend,
      riskAssessment
    };
  }
  
  /**
   * Generate monthly trend data
   */
  private generateMonthlyTrend(students: StudentFeeSummary[]): Array<{
    month: string;
    amount: number;
    students: number;
  }> {
    const trend: Array<{ month: string; amount: number; students: number }> = [];
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      const monthData = {
        month: months[i],
        amount: 0,
        students: 0
      };
      
      // Calculate monthly collections from payment history
      for (const student of students) {
        if (student.paymentHistory) {
          for (const payment of student.paymentHistory) {
            const paymentDate = new Date(payment.date);
            if (paymentDate.getFullYear() === currentYear && paymentDate.getMonth() === i) {
              monthData.amount += payment.amount;
              monthData.students += 1;
            }
          }
        }
      }
      
      trend.push(monthData);
    }
    
    return trend;
  }
  
  /**
   * Assess fee collection risk
   */
  private assessFeeRisk(students: StudentFeeSummary[]): {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  } {
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    
    for (const student of students) {
      const risk = this.calculateFeeRisk(student);
      if (risk === 'high') highRisk++;
      else if (risk === 'medium') mediumRisk++;
      else lowRisk++;
    }
    
    return { highRisk, mediumRisk, lowRisk };
  }
  
  /**
   * Calculate individual fee risk
   */
  private calculateFeeRisk(student: StudentFeeSummary): 'high' | 'medium' | 'low' {
    let riskScore = 0;
    
    // Payment status risk
    if (student.paymentStatus === 'overdue') riskScore += 4;
    else if (student.paymentStatus === 'no_payment') riskScore += 3;
    else if (student.paymentStatus === 'partially_paid') riskScore += 2;
    
    // Pending amount risk
    const pendingRatio = (student.pendingFees || 0) / (student.totalFees || 1);
    if (pendingRatio > 0.7) riskScore += 3;
    else if (pendingRatio > 0.3) riskScore += 2;
    else if (pendingRatio > 0) riskScore += 1;
    
    // Last payment date risk
    if (student.lastPaymentDate) {
      const daysSincePayment = Math.floor(
        (Date.now() - new Date(student.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSincePayment > 90) riskScore += 3;
      else if (daysSincePayment > 60) riskScore += 2;
      else if (daysSincePayment > 30) riskScore += 1;
    } else {
      riskScore += 3; // No payment history
    }
    
    // Determine risk level
    if (riskScore >= 7) return 'high';
    if (riskScore >= 4) return 'medium';
    return 'low';
  }
  
  /**
   * Generate fee-specific suggestions
   */
  generateFeeSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Payment-related suggestions
    if (lowerQuery.includes('payment') || lowerQuery.includes('paid')) {
      suggestions.push('fully paid students');
      suggestions.push('partially paid students');
      suggestions.push('students with no payments');
      suggestions.push('recent payments');
      suggestions.push('payment history');
    }
    
    // Fee-related suggestions
    if (lowerQuery.includes('fee')) {
      suggestions.push('students with pending fees');
      suggestions.push('students with overdue fees');
      suggestions.push('high fee defaulters');
      suggestions.push('fees above 50000');
      suggestions.push('fees below 20000');
    }
    
    // Class-specific suggestions
    if (lowerQuery.includes('class') || lowerQuery.includes('grade')) {
      suggestions.push('class 10 fee status');
      suggestions.push('class 12 fee collection');
      suggestions.push('class-wise fee breakdown');
      suggestions.push('fee collection by class');
    }
    
    // Risk-related suggestions
    if (lowerQuery.includes('risk') || lowerQuery.includes('default')) {
      suggestions.push('high-risk students');
      suggestions.push('payment defaulters');
      suggestions.push('overdue payments');
      suggestions.push('students requiring follow-up');
    }
    
    // Collection-related suggestions
    if (lowerQuery.includes('collect') || lowerQuery.includes('recover')) {
      suggestions.push('students for follow-up');
      suggestions.push('overdue fee recovery');
      suggestions.push('collection targets');
      suggestions.push('payment reminders');
    }
    
    // Add general suggestions if no specific matches
    if (suggestions.length === 0) {
      suggestions.push('students with pending fees');
      suggestions.push('overdue payments');
      suggestions.push('class 10 fee status');
      suggestions.push('payment status breakdown');
      suggestions.push('fee collection analysis');
    }
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }
  
  /**
   * Get fee collection insights
   */
  getFeeInsights(): {
    totalStudents: number;
    totalFees: number;
    collectionRate: number;
    overdueAmount: number;
    riskDistribution: Record<string, number>;
    monthlyTarget: number;
    monthlyAchievement: number;
  } {
    const metrics = this.getMetrics();
    
    // Calculate insights from current data
    const allStudents = Array.from(this.index.recordIndex.values());
    const totalFees = allStudents.reduce((sum, s) => sum + (s.totalFees || 0), 0);
    const totalCollected = allStudents.reduce((sum, s) => sum + (s.paidFees || 0), 0);
    const collectionRate = totalFees > 0 ? (totalCollected / totalFees) * 100 : 0;
    const overdueAmount = allStudents.reduce((sum, s) => sum + (s.overdueFees || 0), 0);
    
    const riskDistribution = {
      high: 0,
      medium: 0,
      low: 0
    };
    
    for (const student of allStudents) {
      const risk = this.calculateFeeRisk(student);
      riskDistribution[risk]++;
    }
    
    return {
      totalStudents: this.index.metadata.totalRecords,
      totalFees,
      collectionRate,
      overdueAmount,
      riskDistribution,
      monthlyTarget: totalFees / 12, // Simple target calculation
      monthlyAchievement: totalCollected / 12 // Simple achievement calculation
    };
  }
}

export default FeeSearchEngine;
