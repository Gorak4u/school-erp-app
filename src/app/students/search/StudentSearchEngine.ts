// @ts-nocheck
'use client';

import SmartSearchEngine, { SearchQuery, SearchPattern } from '../../shared/search/SmartSearchEngine';
import QueryParser, { ParsedQuery } from '../../shared/search/QueryParser';
import { Student } from '../types';
import { isArchivedStudentStatus } from '@/lib/studentStatus';

/**
 * Student-Specific Search Engine
 * Optimized for student data structures and queries
 */

export interface StudentSearchQuery extends SearchQuery {
  includeInactive?: boolean;
  includeGraduated?: boolean;
  includeArchived?: boolean;
  academicYear?: string;
}

export interface StudentSearchResult {
  students: Student[];
  totalCount: number;
  searchTime: number;
  cacheHit: boolean;
  suggestions: string[];
  analytics: {
    attendanceDistribution: Record<string, number>;
    feeStatusDistribution: Record<string, number>;
    classDistribution: Record<string, number>;
    riskAssessment: {
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
    };
  };
}

export class StudentSearchEngine extends SmartSearchEngine<Student> {
  private static instance: StudentSearchEngine;
  
  private constructor() {
    super();
  }
  
  /**
   * Singleton pattern for performance
   */
  static getInstance(): StudentSearchEngine {
    if (!StudentSearchEngine.instance) {
      StudentSearchEngine.instance = new StudentSearchEngine();
    }
    return StudentSearchEngine.instance;
  }
  
  /**
   * Student-specific text fields for indexing
   */
  protected getTextFields(record: Student): string[] {
    return [
      'name',
      'email', 
      'fatherName',
      'motherName',
      'parentName',
      'address',
      'city',
      'state',
      'phone',
      'fatherPhone',
      'motherPhone',
      'emergencyContact',
      'bloodGroup',
      'category',
      'religion',
      'medium',
      'board',
      'section',
      'status'
    ];
  }
  
  /**
   * Student-specific indexable fields
   */
  protected getIndexableFields(record: Student): string[] {
    return [
      'id',
      'name',
      'email',
      'class',
      'section',
      'rollNo',
      'admissionNo',
      'attendance',
      'status',
      'gender',
      'bloodGroup',
      'category',
      'medium',
      'board',
      'totalFees',
      'paidFees',
      'pendingFees',
      'overdueFees',
      'academicYear'
    ].filter(field => record[field] !== undefined && record[field] !== null);
  }
  
  /**
   * Enhanced student search with analytics
   */
  searchStudents(query: StudentSearchQuery): StudentSearchResult {
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
    
    // Apply student-specific filters
    let filteredStudents = result.items;
    
    if (query.includeInactive === false) {
      filteredStudents = filteredStudents.filter(s => s.status !== 'inactive');
    }
    
    if (query.includeGraduated === false) {
      filteredStudents = filteredStudents.filter(s => s.status !== 'graduated');
    }

    if (query.includeArchived === false) {
      filteredStudents = filteredStudents.filter(s => !isArchivedStudentStatus(s.status));
    }
    
    if (query.academicYear) {
      filteredStudents = filteredStudents.filter(s => s.academicYear === query.academicYear);
    }
    
    // Generate analytics
    const analytics = this.generateStudentAnalytics(filteredStudents);
    
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
   * Convert parsed patterns to search patterns
   */
  private convertPatterns(parsedPatterns: SearchPattern[]): SearchPattern[] {
    return parsedPatterns.map(pattern => {
      // Handle student-specific field mappings
      const fieldMapping: Record<string, string> = {
        'attendance': 'attendance',
        'fees.pending': 'pendingFees',
        'fees.overdue': 'overdueFees',
        'totalFees': 'totalFees',
        'paymentStatus': 'feeStatus'
      };
      
      return {
        ...pattern,
        field: fieldMapping[pattern.field] || pattern.field
      };
    });
  }
  
  /**
   * Generate student-specific analytics
   */
  private generateStudentAnalytics(students: Student[]): StudentSearchResult['analytics'] {
    const attendanceDistribution: Record<string, number> = {};
    const feeStatusDistribution: Record<string, number> = {};
    const classDistribution: Record<string, number> = {};
    
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    
    for (const student of students) {
      // Attendance distribution
      const attendanceRange = this.getAttendanceRange(student.attendance || 0);
      attendanceDistribution[attendanceRange] = (attendanceDistribution[attendanceRange] || 0) + 1;
      
      // Fee status distribution
      const feeStatus = this.getFeeStatus(student);
      feeStatusDistribution[feeStatus] = (feeStatusDistribution[feeStatus] || 0) + 1;
      
      // Class distribution
      const className = student.class || 'Unknown';
      classDistribution[className] = (classDistribution[className] || 0) + 1;
      
      // Risk assessment
      const risk = this.assessStudentRisk(student);
      if (risk === 'high') highRisk++;
      else if (risk === 'medium') mediumRisk++;
      else lowRisk++;
    }
    
    return {
      attendanceDistribution,
      feeStatusDistribution,
      classDistribution,
      riskAssessment: {
        highRisk,
        mediumRisk,
        lowRisk
      }
    };
  }
  
  /**
   * Get attendance range for distribution
   */
  private getAttendanceRange(attendance: number): string {
    if (attendance >= 90) return '90-100%';
    if (attendance >= 75) return '75-89%';
    if (attendance >= 60) return '60-74%';
    if (attendance >= 40) return '40-59%';
    return '0-39%';
  }
  
  /**
   * Get fee status for distribution
   */
  private getFeeStatus(student: Student): string {
    const pending = student.pendingFees || 0;
    const total = student.totalFees || 0;
    
    if (pending === 0) return 'Fully Paid';
    if (pending >= total * 0.5) return 'High Pending';
    return 'Partial Payment';
  }
  
  /**
   * Assess student risk level
   */
  private assessStudentRisk(student: Student): 'high' | 'medium' | 'low' {
    let riskScore = 0;
    
    // Attendance risk
    if (student.attendance < 60) riskScore += 3;
    else if (student.attendance < 75) riskScore += 2;
    else if (student.attendance < 85) riskScore += 1;
    
    // Fee risk
    const pendingRatio = (student.pendingFees || 0) / (student.totalFees || 1);
    if (pendingRatio > 0.5) riskScore += 3;
    else if (pendingRatio > 0.2) riskScore += 2;
    else if (pendingRatio > 0) riskScore += 1;
    
    // Status risk
    if (student.status === 'inactive' || student.status === 'suspended') riskScore += 2;
    else if (student.status === 'locked') riskScore += 1;
    
    // Academic risk
    if (student.needsPromotion) riskScore += 2;
    
    // Determine risk level
    if (riskScore >= 6) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }
  
  /**
   * Generate smart suggestions for students
   */
  generateStudentSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Attendance-related suggestions
    if (lowerQuery.includes('attend') || lowerQuery.includes('present')) {
      suggestions.push('students with attendance below 60%');
      suggestions.push('students with attendance between 70% and 80%');
      suggestions.push('high attendance students (above 90%)');
      suggestions.push('students with irregular attendance');
    }
    
    // Fee-related suggestions
    if (lowerQuery.includes('fee') || lowerQuery.includes('payment')) {
      suggestions.push('students with pending fees');
      suggestions.push('students with overdue payments');
      suggestions.push('high fee defaulters');
      suggestions.push('students with partial payments');
      suggestions.push('fully paid students');
    }
    
    // Academic-related suggestions
    if (lowerQuery.includes('class') || lowerQuery.includes('grade')) {
      suggestions.push('class 10 students');
      suggestions.push('class 12 students');
      suggestions.push('students needing promotion');
      suggestions.push('students in science stream');
    }
    
    // Risk-related suggestions
    if (lowerQuery.includes('risk') || lowerQuery.includes('problem')) {
      suggestions.push('high-risk students');
      suggestions.push('students with multiple issues');
      suggestions.push('students requiring attention');
      suggestions.push('at-risk students');
    }
    
    // Performance-related suggestions
    if (lowerQuery.includes('perform') || lowerQuery.includes('grade')) {
      suggestions.push('low-performing students');
      suggestions.push('high-performing students');
      suggestions.push('students with failing grades');
      suggestions.push('improvement needed students');
    }
    
    // Add general suggestions if no specific matches
    if (suggestions.length === 0) {
      suggestions.push('active students');
      suggestions.push('inactive students');
      suggestions.push('students with low attendance');
      suggestions.push('students with pending fees');
      suggestions.push('class 10 students');
    }
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }
  
  /**
   * Get search insights for dashboard
   */
  getSearchInsights(): {
    totalStudents: number;
    averageAttendance: number;
    totalPendingFees: number;
    riskDistribution: Record<string, number>;
    popularSearches: Array<{ query: string; count: number }>;
  } {
    const metrics = this.getMetrics();
    
    // Calculate insights from current data
    const allStudents = Array.from(this.index.recordIndex.values());
    const averageAttendance = allStudents.reduce((sum, s) => sum + (s.attendance || 0), 0) / allStudents.length;
    const totalPendingFees = allStudents.reduce((sum, s) => sum + (s.pendingFees || 0), 0);
    
    const riskDistribution = {
      high: 0,
      medium: 0,
      low: 0
    };
    
    for (const student of allStudents) {
      const risk = this.assessStudentRisk(student);
      riskDistribution[risk]++;
    }
    
    return {
      totalStudents: this.index.metadata.totalRecords,
      averageAttendance: Math.round(averageAttendance),
      totalPendingFees,
      riskDistribution,
      popularSearches: [] // Would be populated from search analytics
    };
  }
}

export default StudentSearchEngine;
