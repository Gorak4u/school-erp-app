// AI-Advanced Error Handling and Logging System for Refund Operations
import type { NextRequest } from 'next/server';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: string;
  userId?: string;
  schoolId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  stack?: string;
  performance?: {
    duration?: number;
    memoryUsage?: number;
    cacheHits?: number;
    cacheMisses?: number;
  };
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  schoolId?: string;
  requestId?: string;
  refundId?: string;
  studentId?: string;
  amount?: number;
  additionalData?: Record<string, any>;
}

// AI-Enhanced Logger with intelligent error categorization
export class RefundLogger {
  private static instance: RefundLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enableConsole = true;
  private enableFile = false; // Can be enabled for production

  static getInstance(): RefundLogger {
    if (!RefundLogger.instance) {
      RefundLogger.instance = new RefundLogger();
    }
    return RefundLogger.instance;
  }

  // Core logging method with AI-enhanced context
  private log(
    level: LogLevel,
    message: string,
    context: string,
    errorContext?: ErrorContext,
    error?: Error
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: errorContext?.userId,
      schoolId: errorContext?.schoolId,
      requestId: errorContext?.requestId,
      metadata: {
        operation: errorContext?.operation,
        refundId: errorContext?.refundId,
        studentId: errorContext?.studentId,
        amount: errorContext?.amount,
        ...errorContext?.additionalData
      },
      stack: error?.stack
    };

    // Add to memory logs
    this.addLog(logEntry);

    // Console output with formatting
    if (this.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // File output for production (can be implemented)
    if (this.enableFile) {
      this.outputToFile(logEntry);
    }

    // Critical error handling
    if (level === LogLevel.CRITICAL) {
      this.handleCriticalError(logEntry);
    }
  }

  private addLog(logEntry: LogEntry): void {
    this.logs.push(logEntry);
    
    // Maintain log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private outputToConsole(logEntry: LogEntry): void {
    const { timestamp, level, message, context, metadata } = logEntry;
    const metadataStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    
    const formattedMessage = `[${timestamp}] ${level.toUpperCase()} [${context}] ${message}${metadataStr}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, logEntry);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage, logEntry);
        break;
    }
  }

  private outputToFile(logEntry: LogEntry): void {
    // Implementation for file logging in production
    // Can integrate with Winston, Pino, or other logging libraries
  }

  private handleCriticalError(logEntry: LogEntry): void {
    // Critical error handling
    // 1. Send alerts to administrators
    // 2. Create incident tickets
    // 3. Trigger monitoring alerts
    console.error('🚨 CRITICAL REFUND SYSTEM ERROR:', logEntry);
  }

  // Public logging methods
  debug(message: string, context: string, errorContext?: ErrorContext): void {
    this.log(LogLevel.DEBUG, message, context, errorContext);
  }

  info(message: string, context: string, errorContext?: ErrorContext): void {
    this.log(LogLevel.INFO, message, context, errorContext);
  }

  warn(message: string, context: string, errorContext?: ErrorContext, error?: Error): void {
    this.log(LogLevel.WARN, message, context, errorContext, error);
  }

  error(message: string, context: string, errorContext?: ErrorContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, errorContext, error);
  }

  critical(message: string, context: string, errorContext?: ErrorContext, error?: Error): void {
    this.log(LogLevel.CRITICAL, message, context, errorContext, error);
  }

  // Performance logging
  logPerformance(
    operation: string,
    duration: number,
    context: string,
    errorContext?: ErrorContext
  ): void {
    const performanceEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `Performance: ${operation} completed in ${duration}ms`,
      context,
      userId: errorContext?.userId,
      schoolId: errorContext?.schoolId,
      requestId: errorContext?.requestId,
      metadata: {
        operation,
        performance: { duration }
      }
    };

    this.addLog(performanceEntry);
    
    // Warn for slow operations
    if (duration > 5000) {
      this.warn(`Slow operation detected: ${operation}`, context, errorContext);
    }
  }

  // Get logs with filtering
  getLogs(filter?: {
    level?: LogLevel;
    context?: string;
    userId?: string;
    schoolId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      if (filter.context) {
        filteredLogs = filteredLogs.filter(log => log.context.includes(filter.context!));
      }
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
      }
      if (filter.schoolId) {
        filteredLogs = filteredLogs.filter(log => log.schoolId === filter.schoolId);
      }
      if (filter.fromDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filter.fromDate!);
      }
      if (filter.toDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= filter.toDate!);
      }
    }

    return filteredLogs;
  }

  // Get error analytics
  getErrorAnalytics(): {
    totalErrors: number;
    errorsByLevel: Record<LogLevel, number>;
    errorsByContext: Record<string, number>;
    recentErrors: LogEntry[];
    criticalErrors: LogEntry[];
  } {
    const errorLogs = this.logs.filter(log => 
      log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL
    );

    const errorsByLevel = errorLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);

    const errorsByContext = errorLogs.reduce((acc, log) => {
      acc[log.context] = (acc[log.context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = errorLogs
      .filter(log => Date.now() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000)
      .slice(-10);

    const criticalErrors = errorLogs.filter(log => log.level === LogLevel.CRITICAL);

    return {
      totalErrors: errorLogs.length,
      errorsByLevel,
      errorsByContext,
      recentErrors,
      criticalErrors
    };
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs for analysis
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // CSV format
      const headers = 'timestamp,level,message,context,userId,schoolId,requestId';
      const rows = this.logs.map(log => 
        `${log.timestamp},${log.level},"${log.message}",${log.context},${log.userId || ''},${log.schoolId || ''},${log.requestId || ''}`
      );
      return [headers, ...rows].join('\n');
    }
  }
}

// Error handling utilities
export class RefundErrorHandler {
  private logger = RefundLogger.getInstance();

  // Handle API errors with intelligent categorization
  handleApiError(
    error: any,
    context: string,
    errorContext: ErrorContext,
    request?: NextRequest
  ): { error: string; code: number; shouldRetry?: boolean } {
    const requestId = request?.headers.get('x-request-id') || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const enhancedContext = { ...errorContext, requestId };

    // Categorize error types
    if (error.name === 'ValidationError') {
      this.logger.warn('Validation error', context, enhancedContext, error);
      return { error: 'Invalid input data', code: 400 };
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      this.logger.error('Database error', context, enhancedContext, error);
      return { error: 'Database operation failed', code: 500, shouldRetry: true };
    }

    if (error.name === 'PrismaClientUnknownRequestError') {
      this.logger.critical('Unknown database error', context, enhancedContext, error);
      return { error: 'System error occurred', code: 500 };
    }

    if (error.message?.includes('duplicate')) {
      this.logger.warn('Duplicate resource error', context, enhancedContext, error);
      return { error: 'Resource already exists', code: 409 };
    }

    if (error.message?.includes('not found')) {
      this.logger.warn('Resource not found', context, enhancedContext, error);
      return { error: 'Resource not found', code: 404 };
    }

    if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      this.logger.warn('Authorization error', context, enhancedContext, error);
      return { error: 'Insufficient permissions', code: 403 };
    }

    // Network or timeout errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      this.logger.error('Network error', context, enhancedContext, error);
      return { error: 'Network error occurred', code: 503, shouldRetry: true };
    }

    // Default error handling
    this.logger.error('Unhandled error', context, enhancedContext, error);
    return { error: 'An unexpected error occurred', code: 500 };
  }

  // Handle async errors with retry logic
  async handleAsyncError<T>(
    operation: () => Promise<T>,
    context: string,
    errorContext: ErrorContext,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        const errorInfo = this.handleApiError(error, context, errorContext);
        
        if (!errorInfo.shouldRetry || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Retry attempt ${attempt}/${maxRetries} after ${delay}ms`,
          context,
          errorContext
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

// Performance monitoring
export class RefundPerformanceMonitor {
  private logger = RefundLogger.getInstance();
  private operations = new Map<string, number>();

  startOperation(operationId: string): void {
    this.operations.set(operationId, Date.now());
  }

  endOperation(operationId: string, context: string, errorContext?: ErrorContext): number {
    const startTime = this.operations.get(operationId);
    if (!startTime) {
      this.logger.warn('Operation not found for performance tracking', context, errorContext);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.operations.delete(operationId);

    this.logger.logPerformance(operationId, duration, context, errorContext);

    return duration;
  }

  // Monitor memory usage
  getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
    const usage = process.memoryUsage();
    const used = usage.heapUsed;
    const total = usage.heapTotal;
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  }

  // Log memory usage
  logMemoryUsage(context: string, errorContext?: ErrorContext): void {
    const memory = this.getMemoryUsage();
    
    this.logger.info(
      `Memory usage: ${memory.percentage.toFixed(2)}%`,
      context,
      { ...errorContext, operation: 'memory_monitor', additionalData: { memory } }
    );

    // Warn if memory usage is high
    if (memory.percentage > 80) {
      this.logger.warn(
        'High memory usage detected',
        context,
        { ...errorContext, operation: 'memory_monitor', additionalData: { memory } }
      );
    }
  }
}

// Export singleton instances
export const refundLogger = RefundLogger.getInstance();
export const refundErrorHandler = new RefundErrorHandler();
export const refundPerformanceMonitor = new RefundPerformanceMonitor();

// Utility functions
export function createErrorContext(
  operation: string,
  ctx: any,
  additionalData?: Record<string, any>
): ErrorContext {
  return {
    operation,
    userId: ctx.userId,
    schoolId: ctx.schoolId,
    requestId: ctx.requestId,
    additionalData
  };
}

export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string,
  operation: string
) {
  return async (...args: T): Promise<R> => {
    const errorContext = createErrorContext(operation, { userId: 'system' });
    
    try {
      return await fn(...args);
    } catch (error) {
      const errorInfo = refundErrorHandler.handleApiError(error, context, errorContext);
      throw new Error(errorInfo.error);
    }
  };
}
