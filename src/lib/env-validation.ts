import { z } from 'zod';
import { logger } from './logger';

// Only validate the most critical environment variables that are absolutely required
export interface CriticalEnvConfig {
  // Database - Absolutely required
  DATABASE_URL: string;
  
  // NextAuth - Required for authentication
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  
  // Cron Security - Required for cron jobs
  CRON_SECRET: string;
  
  // App Configuration - Required for basic operation
  NODE_ENV: string;
}

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCriticalEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Only validate the absolutely essential variables
  const criticalVars: (keyof CriticalEnvConfig)[] = [
    'DATABASE_URL',
    'NEXTAUTH_URL', 
    'NEXTAUTH_SECRET',
    'CRON_SECRET',
    'NODE_ENV'
  ];

  for (const varName of criticalVars) {
    const value = process.env[varName];
    if (!value) {
      errors.push(`Required environment variable ${varName} is missing`);
    }
  }

  // Validate specific formats for critical variables only
  if (process.env.DATABASE_URL && !isValidDatabaseUrl(process.env.DATABASE_URL)) {
    errors.push('DATABASE_URL is not a valid PostgreSQL connection string');
  }

  if (process.env.NEXTAUTH_URL && !isValidUrl(process.env.NEXTAUTH_URL)) {
    errors.push('NEXTAUTH_URL is not a valid URL');
  }

  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
  }

  if (process.env.CRON_SECRET && process.env.CRON_SECRET.length < 16) {
    errors.push('CRON_SECRET must be at least 16 characters long');
  }

  const isValid = errors.length === 0;

  // Log validation results
  if (!isValid) {
    logger.error('Critical environment validation failed', { errors, warnings });
  } else {
    logger.info('Critical environment validation passed', { warnings });
  }

  return {
    isValid,
    errors,
    warnings
  };
}

function isValidDatabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
  } catch {
    return false;
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Runtime critical environment validation
export function validateRuntimeCriticalEnv(): void {
  const result = validateCriticalEnvironment();
  
  if (!result.isValid) {
    logger.error('Critical Environment Validation Failed', { errors: result.errors });
    result.errors.forEach(error => logger.error(`Environment validation error: ${error}`));
    
    if (result.warnings.length > 0) {
      logger.warn('Environment validation warnings', { warnings: result.warnings });
      result.warnings.forEach(warning => logger.warn(`Environment validation warning: ${warning}`));
    }
    
    logger.error('Critical environment variables missing - Please check .env file');
    
    process.exit(1);
  }
  
  if (result.warnings.length > 0) {
    logger.warn('Environment validation warnings', { warnings: result.warnings });
    result.warnings.forEach(warning => logger.warn(`Environment validation warning: ${warning}`));
  }
  
  logger.info('Critical environment validation passed');
}
