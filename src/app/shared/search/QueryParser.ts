// @ts-nocheck
'use client';

import { SearchQuery, SearchPattern } from './SmartSearchEngine';

/**
 * Natural Language Query Parser
 * Converts human language to structured search patterns
 */

export interface ParsedQuery {
  text: string;
  patterns: SearchPattern[];
  intent: 'search' | 'filter' | 'analytics';
  confidence: number;
}

export class QueryParser {
  private static readonly PATTERNS = {
    // Attendance patterns
    attendance: {
      keywords: ['attendance', 'present', 'absent', 'low', 'high', 'below', 'above'],
      patterns: [
        { regex: /low\s+attendance|attendance\s+low/gi, operator: '<', value: 75, priority: 3 },
        { regex: /high\s+attendance|attendance\s+high/gi, operator: '>', value: 90, priority: 3 },
        { regex: /attendance\s+(below|under)\s+(\d+)/gi, operator: '<', priority: 2 },
        { regex: /attendance\s+(above|over)\s+(\d+)/gi, operator: '>', priority: 2 },
        { regex: /attendance\s+(between|from)\s+(\d+)\s+(to|and)\s+(\d+)/gi, operator: 'between', priority: 2 }
      ]
    },
    
    // Fee patterns
    fees: {
      keywords: ['fees', 'fee', 'payment', 'paid', 'pending', 'overdue', 'due'],
      patterns: [
        { regex: /pending\s+fees|fees\s+pending/gi, operator: '>', field: 'fees.pending', value: 0, priority: 3 },
        { regex: /overdue\s+fees|fees\s+overdue/gi, operator: '>', field: 'fees.overdue', value: 0, priority: 3 },
        { regex: /fully\s+paid|paid\s+fully/gi, operator: '=', field: 'paymentStatus', value: 'fully_paid', priority: 3 },
        { regex: /partial\s+payment|payment\s+partial/gi, operator: '=', field: 'paymentStatus', value: 'partially_paid', priority: 3 },
        { regex: /fees\s+(above|over)\s+(\d+)/gi, operator: '>', field: 'totalFees', priority: 2 },
        { regex: /fees\s+(below|under)\s+(\d+)/gi, operator: '<', field: 'totalFees', priority: 2 }
      ]
    },
    
    // Class patterns
    class: {
      keywords: ['class', 'grade', 'section'],
      patterns: [
        { regex: /class\s+(\d+)([a-z]?)\b/gi, operator: '=', field: 'class', priority: 3 },
        { regex: /grade\s+(\d+)([a-z]?)\b/gi, operator: '=', field: 'class', priority: 3 },
        { regex: /section\s+([a-z])\b/gi, operator: '=', field: 'section', priority: 2 }
      ]
    },
    
    // Status patterns
    status: {
      keywords: ['active', 'inactive', 'graduated', 'transferred', 'suspended', 'locked'],
      patterns: [
        { regex: /\b(active|inactive|graduated|transferred|suspended|locked)\b/gi, operator: '=', field: 'status', priority: 3 }
      ]
    },
    
    // Name patterns
    name: {
      keywords: ['name', 'student'],
      patterns: [
        { regex: /name\s+(contains|like)\s+([a-zA-Z\s]+)/gi, operator: 'contains', field: 'name', priority: 2 }
      ]
    }
  };

  /**
   * Parse natural language query into structured search patterns
   */
  static parse(query: string): ParsedQuery {
    const trimmedQuery = query.trim().toLowerCase();
    const patterns: SearchPattern[] = [];
    let confidence = 0;
    let intent: 'search' | 'filter' | 'analytics' = 'search';
    
    // Extract patterns from each category
    for (const [category, config] of Object.entries(this.PATTERNS)) {
      // Check if query contains keywords from this category
      const hasKeywords = config.keywords.some(keyword => 
        trimmedQuery.includes(keyword.toLowerCase())
      );
      
      if (hasKeywords) {
        // Try to match patterns in this category
        for (const pattern of config.patterns) {
          const matches = [...trimmedQuery.matchAll(pattern.regex)];
          
          for (const match of matches) {
            const searchPattern: SearchPattern = {
              type: category as any,
              operator: pattern.operator as any,
              field: pattern.field || this.getDefaultField(category),
              value: this.extractValue(match, pattern),
              priority: pattern.priority
            };
            
            patterns.push(searchPattern);
            confidence += pattern.priority;
          }
        }
      }
    }
    
    // Determine intent based on patterns found
    if (patterns.length > 0) {
      intent = 'filter';
      if (patterns.some(p => p.type === 'fees')) {
        intent = 'analytics';
      }
    }
    
    // Normalize confidence
    confidence = Math.min(confidence / 10, 1);
    
    // Remove matched patterns from text for clean search
    const cleanText = this.removeMatchedPatterns(query, patterns);
    
    return {
      text: cleanText,
      patterns: patterns.sort((a, b) => b.priority - a.priority),
      intent,
      confidence
    };
  }

  /**
   * Get default field for category
   */
  private static getDefaultField(category: string): string {
    const fieldMap: Record<string, string> = {
      attendance: 'attendance',
      fees: 'fees.pending',
      class: 'class',
      status: 'status',
      name: 'name'
    };
    
    return fieldMap[category] || 'name';
  }

  /**
   * Extract value from regex match
   */
  private static extractValue(match: RegExpMatchArray, pattern: any): any {
    switch (pattern.operator) {
      case 'between':
        return {
          min: parseInt(match[2]),
          max: parseInt(match[4])
        };
      
      case '<':
      case '>':
      case '<=':
      case '>=':
        return parseInt(match[2] || match[match.length - 1]);
      
      case 'contains':
        return match[2] || match[match.length - 1];
      
      case '=':
      default:
        return match[1] || match[match.length - 1];
    }
  }

  /**
   * Remove matched patterns from query text
   */
  private static removeMatchedPatterns(query: string, patterns: SearchPattern[]): string {
    let cleanText = query;
    
    // Remove common pattern indicators
    cleanText = cleanText.replace(/\b(with|and|or|who|that|have|has)\b/gi, ' ');
    
    // Remove matched phrases
    for (const pattern of patterns) {
      if (pattern.type === 'attendance') {
        cleanText = cleanText.replace(/low\s+attendance|attendance\s+low/gi, ' ');
        cleanText = cleanText.replace(/high\s+attendance|attendance\s+high/gi, ' ');
        cleanText = cleanText.replace(/attendance\s+(below|under|above|over)\s+\d+/gi, ' ');
      }
      
      if (pattern.type === 'fees') {
        cleanText = cleanText.replace(/pending\s+fees|fees\s+pending/gi, ' ');
        cleanText = cleanText.replace(/overdue\s+fees|fees\s+overdue/gi, ' ');
        cleanText = cleanText.replace(/fully\s+paid|paid\s+fully/gi, ' ');
        cleanText = cleanText.replace(/partial\s+payment|payment\s+partial/gi, ' ');
      }
      
      if (pattern.type === 'class') {
        cleanText = cleanText.replace(/class\s+\d+[a-z]?/gi, ' ');
        cleanText = cleanText.replace(/grade\s+\d+[a-z]?/gi, ' ');
        cleanText = cleanText.replace(/section\s+[a-z]/gi, ' ');
      }
      
      if (pattern.type === 'status') {
        cleanText = cleanText.replace(/\b(active|inactive|graduated|transferred|suspended|locked)\b/gi, ' ');
      }
    }
    
    // Clean up extra spaces
    return cleanText.replace(/\s+/g, ' ').trim();
  }

  /**
   * Generate suggestions based on partial query
   */
  static generateSuggestions(partialQuery: string): string[] {
    const suggestions: string[] = [];
    const query = partialQuery.toLowerCase().trim();
    
    // Attendance suggestions
    if (query.includes('attend') || query.includes('present')) {
      suggestions.push('students with low attendance');
      suggestions.push('attendance below 60%');
      suggestions.push('attendance between 70% and 80%');
      suggestions.push('high attendance students');
    }
    
    // Fee suggestions
    if (query.includes('fee') || query.includes('payment') || query.includes('paid')) {
      suggestions.push('students with pending fees');
      suggestions.push('overdue payments');
      suggestions.push('fees above 50000');
      suggestions.push('fully paid students');
      suggestions.push('partial payment students');
    }
    
    // Class suggestions
    if (query.includes('class') || query.includes('grade')) {
      suggestions.push('class 10 students');
      suggestions.push('class 12 science');
      suggestions.push('all classes');
      suggestions.push('grade 9 students');
    }
    
    // Status suggestions
    if (query.includes('active') || query.includes('inactive')) {
      suggestions.push('active students');
      suggestions.push('inactive students');
      suggestions.push('graduated students');
      suggestions.push('transferred students');
    }
    
    // General suggestions
    if (query.length < 3) {
      suggestions.push('students with low attendance');
      suggestions.push('students with pending fees');
      suggestions.push('class 10 students');
      suggestions.push('overdue payments');
    }
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }

  /**
   * Validate parsed query
   */
  static validate(parsed: ParsedQuery): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for invalid operators
    for (const pattern of parsed.patterns) {
      if (pattern.value === undefined || pattern.value === null) {
        errors.push(`Invalid value for ${pattern.field}`);
      }
      
      if (pattern.operator === 'between' && typeof pattern.value !== 'object') {
        errors.push(`Invalid range for ${pattern.field}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get query complexity score
   */
  static getComplexity(query: string): number {
    const parsed = this.parse(query);
    
    let complexity = 0;
    
    // Base complexity for text search
    if (parsed.text.trim()) complexity += 1;
    
    // Add complexity for each pattern
    for (const pattern of parsed.patterns) {
      complexity += pattern.priority;
    }
    
    // Add complexity for multiple conditions
    if (parsed.patterns.length > 1) complexity += 2;
    
    // Add complexity for range queries
    if (parsed.patterns.some(p => p.operator === 'between')) complexity += 3;
    
    return Math.min(complexity, 10); // Cap at 10
  }
}

export default QueryParser;
