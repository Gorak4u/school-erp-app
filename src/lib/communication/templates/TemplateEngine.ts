/**
 * Template Engine - World-Class Communication Template System
 * 
 * Provides variable substitution, conditional blocks, loops, and helper functions
 * for rendering professional email templates with school branding.
 * 
 * @module TemplateEngine
 */

import { logger } from '@/lib/logger';

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface TemplateVariableSchema {
  variables: TemplateVariable[];
}

export interface RenderOptions {
  stripUnknown?: boolean;  // Remove unknown variables instead of leaving as-is
  strict?: boolean;        // Throw error if required variable missing
  escapeHtml?: boolean;    // Escape HTML in variable values
}

/**
 * Helper functions available in templates
 */
const templateHelpers: Record<string, Function> = {
  /**
   * Format date to locale string
   * Usage: {{formatDate date "long"}}
   */
  formatDate: (value: string | Date, format: string = 'medium'): string => {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return String(value);
    
    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      short: { month: 'short', day: 'numeric', year: 'numeric' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { month: 'long', day: 'numeric', year: 'numeric', weekday: 'long' },
      full: { month: 'long', day: 'numeric', year: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' }
    };
    
    if (format === 'iso') return date.toISOString();
    return date.toLocaleDateString('en-IN', formatOptions[format] || formatOptions.medium);
  },

  /**
   * Format currency in INR
   * Usage: {{formatCurrency amount}}
   */
  formatCurrency: (value: number | string): string => {
    if (value === undefined || value === null) return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  },

  /**
   * Format number with commas
   * Usage: {{formatNumber count}}
   */
  formatNumber: (value: number | string): string => {
    if (value === undefined || value === null) return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return String(value);
    return new Intl.NumberFormat('en-IN').format(num);
  },

  /**
   * Uppercase first letter
   * Usage: {{capitalize status}}
   */
  capitalize: (value: string): string => {
    if (!value || typeof value !== 'string') return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  },

  /**
   * Uppercase all words
   * Usage: {{titleCase studentName}}
   */
  titleCase: (value: string): string => {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  /**
   * Truncate text with ellipsis
   * Usage: {{truncate message 100}}
   */
  truncate: (value: string, length: number = 100): string => {
    if (!value || typeof value !== 'string') return '';
    if (value.length <= length) return value;
    return value.substring(0, length).trim() + '...';
  },

  /**
   * Get current date
   * Usage: {{now "long"}}
   */
  now: (format: string = 'medium'): string => {
    return templateHelpers.formatDate(new Date(), format);
  },

  /**
   * Calculate days from date
   * Usage: {{daysFromNow dueDate}}
   */
  daysFromNow: (date: string | Date): number => {
    if (!date) return 0;
    const target = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  /**
   * Check if date is overdue
   * Usage: {{#if (isOverdue dueDate)}}Overdue{{/if}}
   */
  isOverdue: (date: string | Date): boolean => {
    if (!date) return false;
    const target = typeof date === 'string' ? new Date(date) : date;
    return target < new Date();
  },

  /**
   * Pluralize word based on count
   * Usage: {{pluralize days "day" "days"}}
   */
  pluralize: (count: number, singular: string, plural: string): string => {
    return count === 1 ? singular : plural;
  },

  /**
   * Join array with separator
   * Usage: {{join subjects ", "}}
   */
  join: (arr: any[], separator: string = ', '): string => {
    if (!Array.isArray(arr)) return '';
    return arr.map((item: unknown) => String(item)).join(separator);
  }
};

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Validate variables against schema
 */
export function validateVariables(
  data: Record<string, any>,
  schema?: TemplateVariableSchema
): { valid: boolean; missing: string[]; errors: string[] } {
  if (!schema || !schema.variables) {
    return { valid: true, missing: [], errors: [] };
  }

  const missing: string[] = [];
  const errors: string[] = [];

  for (const variable of schema.variables) {
    const value = data[variable.name];
    const hasValue = value !== undefined && value !== null && value !== '';

    if (variable.required && !hasValue) {
      missing.push(variable.name);
      continue;
    }

    if (hasValue) {
      // Type validation
      switch (variable.type) {
        case 'number':
          if (typeof value === 'string') {
            const num = parseFloat(value);
            if (isNaN(num)) {
              errors.push(`${variable.name}: Expected number, got "${value}"`);
            }
          } else if (typeof value !== 'number') {
            errors.push(`${variable.name}: Expected number, got ${typeof value}`);
          }
          break;
        case 'date':
          const date = typeof value === 'string' ? new Date(value) : value;
          if (!(date instanceof Date) || isNaN(date.getTime())) {
            errors.push(`${variable.name}: Invalid date format "${value}"`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${variable.name}: Expected boolean, got ${typeof value}`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`${variable.name}: Expected array, got ${typeof value}`);
          }
          break;
      }
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
}

/**
 * Parse variable schema from JSON string
 */
export function parseVariableSchema(schemaJson?: string): TemplateVariableSchema | undefined {
  if (!schemaJson) return undefined;
  try {
    return JSON.parse(schemaJson);
  } catch (error) {
    logger.warn('Failed to parse variable schema', { error, schemaJson });
    return undefined;
  }
}

/**
 * Render template with variable substitution
 * 
 * Supports:
 * - Simple variables: {{studentName}}
 * - Helper functions: {{formatDate date "long"}}
 * - Conditional blocks: {{#if condition}}...{{/if}}
 * - Unless blocks: {{#unless condition}}...{{/unless}}
 * - Each loops: {{#each items}}...{{/each}}
 * - With blocks: {{#with object}}...{{/with}}
 */
export function renderTemplate(
  template: string,
  data: Record<string, any>,
  options: RenderOptions = {}
): string {
  const { stripUnknown = false, strict = false, escapeHtml: shouldEscape = true } = options;

  let result = template;

  // 1. Process block helpers first (they may contain nested content)
  result = processBlockHelpers(result, data);

  // 2. Process simple variables and helper functions
  result = processVariables(result, data, shouldEscape);

  return result;
}

/**
 * Process block helpers (#if, #unless, #each, #with)
 */
function processBlockHelpers(template: string, data: Record<string, any>): string {
  let result = template;

  // Process #if blocks
  result = processIfBlocks(result, data);

  // Process #unless blocks
  result = processUnlessBlocks(result, data);

  // Process #each blocks
  result = processEachBlocks(result, data);

  // Process #with blocks
  result = processWithBlocks(result, data);

  return result;
}

/**
 * Process {{#if condition}}...{{/if}} blocks
 * Also supports {{else}} and complex conditions
 */
function processIfBlocks(template: string, data: Record<string, any>): string {
  // Match {{#if condition}}content{{/if}}
  // Also match {{#if (helper arg)}} for helper-based conditions
  const ifRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

  return template.replace(ifRegex, (match, condition, content) => {
    // Check for else block
    const elseParts = content.split(/\{\{else\}\}/);
    const trueContent = elseParts[0];
    const falseContent = elseParts[1] || '';

    const conditionResult = evaluateCondition(condition.trim(), data);
    return conditionResult ? trueContent : falseContent;
  });
}

/**
 * Process {{#unless condition}}...{{/unless}} blocks (inverse of if)
 */
function processUnlessBlocks(template: string, data: Record<string, any>): string {
  const unlessRegex = /\{\{#unless\s+([^}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g;

  return template.replace(unlessRegex, (match, condition, content) => {
    const elseParts = content.split(/\{\{else\}\}/);
    const trueContent = elseParts[0];
    const falseContent = elseParts[1] || '';

    const conditionResult = evaluateCondition(condition.trim(), data);
    return conditionResult ? falseContent : trueContent;
  });
}

/**
 * Process {{#each array}}...{{/each}} blocks
 * Supports {{@index}} and {{@first}}, {{@last}} variables
 */
function processEachBlocks(template: string, data: Record<string, any>): string {
  const eachRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  return template.replace(eachRegex, (match, arrayName, content) => {
    const array = getValueFromPath(data, arrayName);
    
    if (!Array.isArray(array) || array.length === 0) {
      return '';
    }

    return array.map((item, index) => {
      const itemData = {
        ...data,
        ...((typeof item === 'object' && item !== null) ? item : { this: item }),
        '@index': index,
        '@first': index === 0,
        '@last': index === array.length - 1
      };
      return renderTemplate(content, itemData, { escapeHtml: true });
    }).join('');
  });
}

/**
 * Process {{#with object}}...{{/with}} blocks
 */
function processWithBlocks(template: string, data: Record<string, any>): string {
  const withRegex = /\{\{#with\s+([^}]+)\}\}([\s\S]*?)\{\{\/with\}\}/g;

  return template.replace(withRegex, (match, objectName, content) => {
    const obj = getValueFromPath(data, objectName);
    
    if (!obj || typeof obj !== 'object') {
      return '';
    }

    const withData = { ...data, ...obj };
    return renderTemplate(content, withData, { escapeHtml: true });
  });
}

/**
 * Evaluate a condition (for #if and #unless)
 */
function evaluateCondition(condition: string, data: Record<string, any>): boolean {
  // Check for helper-based conditions: (helperName arg1 arg2)
  const helperMatch = condition.match(/^\((\w+)\s+([^)]+)\)$/);
  if (helperMatch) {
    const [, helperName, argsStr] = helperMatch;
    const helper = templateHelpers[helperName];
    if (helper) {
      const args = argsStr.split(/\s+/).map(arg => {
        // Remove quotes if present
        if ((arg.startsWith('"') && arg.endsWith('"')) || 
            (arg.startsWith("'") && arg.endsWith("'"))) {
          return arg.slice(1, -1);
        }
        return getValueFromPath(data, arg);
      });
      return !!helper(...args);
    }
  }

  // Simple variable or comparison
  // Support: variable, !variable, variable == value, variable != value
  
  // Not operator: !variable
  if (condition.startsWith('!')) {
    const value = getValueFromPath(data, condition.slice(1).trim());
    return !value;
  }

  // Equality: variable == value or variable != value
  const eqMatch = condition.match(/^(.+?)\s*==\s*(.+)$/);
  if (eqMatch) {
    const left = getValueFromPath(data, eqMatch[1].trim());
    const right = parseLiteral(eqMatch[2].trim());
    return left == right;
  }

  const neqMatch = condition.match(/^(.+?)\s*!=\s*(.+)$/);
  if (neqMatch) {
    const left = getValueFromPath(data, neqMatch[1].trim());
    const right = parseLiteral(neqMatch[2].trim());
    return left != right;
  }

  // Simple truthy check
  const value = getValueFromPath(data, condition);
  return !!value;
}

/**
 * Parse a literal value (string, number, boolean)
 */
function parseLiteral(value: string): any {
  // String literal
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Null
  if (value === 'null') return null;
  
  // Number
  const num = parseFloat(value);
  if (!isNaN(num) && String(num) === value) {
    return num;
  }
  
  // Return as-is (variable name, will be resolved later)
  return value;
}

/**
 * Process simple variables {{name}} and helpers {{helperName arg1 arg2}}
 */
function processVariables(template: string, data: Record<string, any>, shouldEscape: boolean): string {
  // Match {{name}} or {{helperName arg1 arg2}}
  const variableRegex = /\{\{(\{?)\s*([^}\s][^}]*)\s*\}\}?\}/g;

  return template.replace(variableRegex, (match, isTriple, content) => {
    // Triple braces {{{...}}} mean don't escape HTML
    const escapeThis = shouldEscape && !isTriple;
    
    const parts = content.trim().split(/\s+/);
    const name = parts[0];

    // Check if it's a helper function call
    if (parts.length > 1 && templateHelpers[name]) {
      const args = parts.slice(1).map((arg: string) => {
        // Remove quotes if present
        if ((arg.startsWith('"') && arg.endsWith('"')) || 
            (arg.startsWith("'") && arg.endsWith("'"))) {
          return arg.slice(1, -1);
        }
        return getValueFromPath(data, arg);
      });
      
      const result = templateHelpers[name](...args);
      return escapeThis ? escapeHtml(String(result)) : String(result);
    }

    // Simple variable substitution
    const value = getValueFromPath(data, name);
    
    if (value === undefined || value === null) {
      return match; // Leave unchanged if not found
    }

    const strValue = String(value);
    return escapeThis ? escapeHtml(strValue) : strValue;
  });
}

/**
 * Get value from data using dot notation path (e.g., "student.name")
 */
function getValueFromPath(data: Record<string, any>, path: string): any {
  if (!path || !data) return undefined;
  
  const parts = path.split('.');
  let value = data;
  
  for (const part of parts) {
    if (value === undefined || value === null) return undefined;
    value = value[part];
  }
  
  return value;
}

/**
 * Extract variable names from template (for validation)
 */
export function extractVariables(template: string): string[] {
  const variables = new Set<string>();
  
  // Match {{variable}} and {{helper variable}}
  const regex = /\{\{[^{}]+\}\}/g;
  const matches = template.match(regex) || [];
  
  for (const match of matches) {
    const content = match.replace(/\{\{|\}\}/g, '').trim();
    const parts = content.split(/\s+/);
    
    // Skip block helpers
    if (parts[0].startsWith('#') || parts[0].startsWith('/')) {
      continue;
    }
    
    // For simple variables and helpers with variable args
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Skip string literals and helper names (first part)
      if (i === 0 && templateHelpers[part]) continue;
      if (part.startsWith('"') || part.startsWith("'")) continue;
      if (!isNaN(Number(part))) continue;
      
      variables.add(part.replace(/^!/, '')); // Remove not operator
    }
  }
  
  return Array.from(variables);
}

export default {
  render: renderTemplate,
  validate: validateVariables,
  extract: extractVariables,
  helpers: templateHelpers,
  parseSchema: parseVariableSchema
};
