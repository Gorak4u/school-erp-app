/**
 * Shared Types for Templates
 * 
 * @module TemplateTypes
 */

export interface DefaultTemplate {
  key: string;
  category: 'email' | 'sms' | 'push';
  type: string;
  name: string;
  description?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  smsBody?: string;
  variablesSchema?: string;
  primaryColor?: string;
  accentColor?: string;
  version?: number;
  isDefault: boolean;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  description?: string;
}

export interface TemplateVariablesSchema {
  variables: TemplateVariable[];
}
