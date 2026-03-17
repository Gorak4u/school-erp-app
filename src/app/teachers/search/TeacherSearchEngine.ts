// @ts-nocheck
'use client';

import SmartSearchEngine, { SearchQuery, SearchPattern } from '../../shared/search/SmartSearchEngine';
import QueryParser, { ParsedQuery } from '../../shared/search/QueryParser';

/**
 * Teacher-Specific Search Engine
 * Optimized for teacher data structures and queries
 */

export interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  employeeId: string;
  department?: string;
  subject?: string;
  qualification?: string;
  experience?: number;
  status: 'active' | 'inactive' | 'on_leave';
  joiningDate?: string;
  salary?: number;
  createdAt: string;
}

export interface TeacherSearchQuery extends SearchQuery {
  department?: string;
  status?: string[];
  experienceRange?: {
    min: number;
    max: number;
  };
  salaryRange?: {
    min: number;
    max: number;
  };
}

export interface TeacherSearchResult {
  teachers: Teacher[];
  totalCount: number;
  searchTime: number;
  cacheHit: boolean;
  suggestions: string[];
  analytics: {
    departmentDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
    experienceDistribution: Record<string, number>;
    salaryDistribution: Record<string, number>;
    qualificationBreakdown: Record<string, number>;
  };
}

export class TeacherSearchEngine extends SmartSearchEngine<Teacher> {
  private static instance: TeacherSearchEngine;
  
  private constructor() {
    super();
  }
  
  /**
   * Singleton pattern for performance
   */
  static getInstance(): TeacherSearchEngine {
    if (!TeacherSearchEngine.instance) {
      TeacherSearchEngine.instance = new TeacherSearchEngine();
    }
    return TeacherSearchEngine.instance;
  }
  
  /**
   * Teacher-specific text fields for indexing
   */
  protected getTextFields(record: Teacher): string[] {
    return [
      'name',
      'email',
      'phone',
      'employeeId',
      'department',
      'subject',
      'qualification',
      'status'
    ];
  }
  
  /**
   * Teacher-specific indexable fields
   */
  protected getIndexableFields(record: Teacher): string[] {
    return [
      'id',
      'name',
      'email',
      'phone',
      'employeeId',
      'department',
      'subject',
      'qualification',
      'experience',
      'status',
      'joiningDate',
      'salary',
      'createdAt'
    ].filter(field => record[field] !== undefined && record[field] !== null);
  }
  
  /**
   * Enhanced teacher search with analytics
   */
  searchTeachers(query: TeacherSearchQuery): TeacherSearchResult {
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
    
    // Apply teacher-specific filters
    let filteredTeachers = result.items;
    
    if (query.department) {
      filteredTeachers = filteredTeachers.filter(t => t.department === query.department);
    }
    
    if (query.status && query.status.length > 0) {
      filteredTeachers = filteredTeachers.filter(t => query.status!.includes(t.status));
    }
    
    if (query.experienceRange) {
      filteredTeachers = filteredTeachers.filter(t => {
        const exp = t.experience || 0;
        return exp >= query.experienceRange!.min && exp <= query.experienceRange!.max;
      });
    }
    
    if (query.salaryRange) {
      filteredTeachers = filteredTeachers.filter(t => {
        const salary = t.salary || 0;
        return salary >= query.salaryRange!.min && salary <= query.salaryRange!.max;
      });
    }
    
    // Generate analytics
    const analytics = this.generateTeacherAnalytics(filteredTeachers);
    
    return {
      teachers: filteredTeachers,
      totalCount: filteredTeachers.length,
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
      // Handle teacher-specific field mappings
      const fieldMapping: Record<string, string> = {
        'experience': 'experience',
        'salary': 'salary',
        'qualification': 'qualification',
        'department': 'department',
        'subject': 'subject',
        'status': 'status'
      };
      
      return {
        ...pattern,
        field: fieldMapping[pattern.field] || pattern.field
      };
    });
  }
  
  /**
   * Generate teacher-specific analytics
   */
  private generateTeacherAnalytics(teachers: Teacher[]): TeacherSearchResult['analytics'] {
    const departmentDistribution: Record<string, number> = {};
    const statusDistribution: Record<string, number> = {};
    const experienceDistribution: Record<string, number> = {};
    const salaryDistribution: Record<string, number> = {};
    const qualificationBreakdown: Record<string, number> = {};
    
    for (const teacher of teachers) {
      // Department distribution
      const dept = teacher.department || 'Unassigned';
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
      
      // Status distribution
      const status = teacher.status || 'unknown';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      
      // Experience distribution
      const exp = teacher.experience || 0;
      let expRange = '0-2 years';
      if (exp >= 10) expRange = '10+ years';
      else if (exp >= 5) expRange = '5-9 years';
      else if (exp >= 3) expRange = '3-4 years';
      experienceDistribution[expRange] = (experienceDistribution[expRange] || 0) + 1;
      
      // Salary distribution
      const salary = teacher.salary || 0;
      let salaryRange = '0-30k';
      if (salary >= 100000) salaryRange = '100k+';
      else if (salary >= 75000) salaryRange = '75k-100k';
      else if (salary >= 50000) salaryRange = '50k-75k';
      else if (salary >= 30000) salaryRange = '30k-50k';
      salaryDistribution[salaryRange] = (salaryDistribution[salaryRange] || 0) + 1;
      
      // Qualification breakdown
      const qual = teacher.qualification || 'Not specified';
      qualificationBreakdown[qual] = (qualificationBreakdown[qual] || 0) + 1;
    }
    
    return {
      departmentDistribution,
      statusDistribution,
      experienceDistribution,
      salaryDistribution,
      qualificationBreakdown
    };
  }
  
  /**
   * Generate smart suggestions for teachers
   */
  generateTeacherSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Department-related suggestions
    if (lowerQuery.includes('depart') || lowerQuery.includes('dept')) {
      suggestions.push('mathematics department teachers');
      suggestions.push('science department teachers');
      suggestions.push('english department teachers');
      suggestions.push('computer science teachers');
      suggestions.push('physical education teachers');
    }
    
    // Experience-related suggestions
    if (lowerQuery.includes('exper') || lowerQuery.includes('senior') || lowerQuery.includes('junior')) {
      suggestions.push('senior teachers (10+ years)');
      suggestions.push('experienced teachers (5-9 years)');
      suggestions.push('junior teachers (0-2 years)');
      suggestions.push('mid-level teachers (3-4 years)');
    }
    
    // Status-related suggestions
    if (lowerQuery.includes('active') || lowerQuery.includes('inactive') || lowerQuery.includes('leave')) {
      suggestions.push('active teachers only');
      suggestions.push('inactive teachers');
      suggestions.push('teachers on leave');
      suggestions.push('all active teachers');
    }
    
    // Subject-related suggestions
    if (lowerQuery.includes('subject') || lowerQuery.includes('teach')) {
      suggestions.push('mathematics teachers');
      suggestions.push('science teachers');
      suggestions.push('english teachers');
      suggestions.push('computer teachers');
      suggestions.push('social studies teachers');
    }
    
    // Qualification-related suggestions
    if (lowerQuery.includes('qual') || lowerQuery.includes('degree') || lowerQuery.includes('master')) {
      suggestions.push('teachers with PhD');
      suggestions.push('teachers with Masters degree');
      suggestions.push('teachers with Bachelors degree');
      suggestions.push('highly qualified teachers');
    }
    
    // Performance-related suggestions
    if (lowerQuery.includes('perform') || lowerQuery.includes('good') || lowerQuery.includes('best')) {
      suggestions.push('highly experienced teachers');
      suggestions.push('teachers with good qualifications');
      suggestions.push('senior department heads');
      suggestions.push('best performing teachers');
    }
    
    // Add general suggestions if no specific matches
    if (suggestions.length === 0) {
      suggestions.push('active teachers');
      suggestions.push('teachers by department');
      suggestions.push('teachers by experience');
      suggestions.push('teachers by qualification');
      suggestions.push('all teachers');
    }
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }
  
  /**
   * Get teacher insights for dashboard
   */
  getTeacherInsights(): {
    totalTeachers: number;
    activeTeachers: number;
    averageExperience: number;
    averageSalary: number;
    departmentCount: number;
    qualificationDiversity: number;
  } {
    const metrics = this.getMetrics();
    
    // Calculate insights from current data
    const allTeachers = Array.from(this.index.recordIndex.values());
    const activeTeachers = allTeachers.filter(t => t.status === 'active').length;
    const averageExperience = allTeachers.reduce((sum, t) => sum + (t.experience || 0), 0) / allTeachers.length;
    const averageSalary = allTeachers.reduce((sum, t) => sum + (t.salary || 0), 0) / allTeachers.length;
    
    const departments = new Set(allTeachers.map(t => t.department).filter(Boolean));
    const qualifications = new Set(allTeachers.map(t => t.qualification).filter(Boolean));
    
    return {
      totalTeachers: this.index.metadata.totalRecords,
      activeTeachers,
      averageExperience: Math.round(averageExperience),
      averageSalary: Math.round(averageSalary),
      departmentCount: departments.size,
      qualificationDiversity: qualifications.size
    };
  }
}

export default TeacherSearchEngine;
