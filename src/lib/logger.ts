import { createWriteStream, existsSync, mkdirSync, WriteStream } from 'fs';
import { join } from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  userId?: string;
  schoolId?: string;
  requestId?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logDir: string;
  private streams: Map<string, WriteStream> = new Map();

  constructor() {
    this.logLevel = this.getLogLevelFromEnv();
    this.logDir = join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.setupStreams();
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    return LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private setupStreams(): void {
    const today = new Date().toISOString().split('T')[0];
    
    // Create separate streams for different log types
    const logTypes = ['app', 'error', 'api', 'auth'];
    
    logTypes.forEach(type => {
      const filename = `${type}-${today}.log`;
      const filepath = join(this.logDir, filename);
      this.streams.set(type, createWriteStream(filepath, { flags: 'a' }));
    });
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, meta, userId, schoolId, requestId } = entry;
    const levelName = LogLevel[level];
    const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
    const contextStr = (userId || schoolId || requestId) ? 
      ` | Context: ${userId || ''}${schoolId ? `|School:${schoolId}` : ''}${requestId ? `|Req:${requestId}` : ''}` : '';
    
    return `[${timestamp}] ${levelName}${contextStr} | ${message}${metaStr}\n`;
  }

  private writeLog(entry: LogEntry): void {
    if (entry.level > this.logLevel) return;

    const formatted = this.formatLogEntry(entry);
    
    // Write to appropriate stream
    let streamType = 'app';
    if (entry.level === LogLevel.ERROR) streamType = 'error';
    else if (entry.message.includes('API') || entry.message.includes('/api/')) streamType = 'api';
    else if (entry.message.includes('auth') || entry.message.includes('login')) streamType = 'auth';

    const stream = this.streams.get(streamType);
    if (stream) {
      stream.write(formatted);
    }

    // Also write to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = entry.level === LogLevel.ERROR ? 'error' : 
                          entry.level === LogLevel.WARN ? 'warn' : 'log';
      console[consoleMethod](formatted.trim());
    }
  }

  private createLogEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.writeLog(this.createLogEntry(LogLevel.ERROR, message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.writeLog(this.createLogEntry(LogLevel.WARN, message, meta));
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.writeLog(this.createLogEntry(LogLevel.INFO, message, meta));
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, meta));
  }

  // API-specific logging with context
  api(method: string, url: string, userId?: string, schoolId?: string, meta?: Record<string, unknown>): void {
    this.writeLog({
      ...this.createLogEntry(LogLevel.INFO, `API ${method} ${url}`, meta),
      userId,
      schoolId,
    });
  }

  apiError(method: string, url: string, error: Error, userId?: string, schoolId?: string): void {
    this.writeLog({
      ...this.createLogEntry(LogLevel.ERROR, `API Error ${method} ${url}`, {
        error: error.message,
        stack: error.stack,
      }),
      userId,
      schoolId,
    });
  }

  // Auth-specific logging
  auth(action: string, userId?: string, email?: string, success?: boolean): void {
    this.writeLog({
      ...this.createLogEntry(LogLevel.INFO, `Auth ${action}`, {
        success,
        email,
      }),
      userId,
    });
  }

  authError(action: string, error: Error, userId?: string, email?: string): void {
    this.writeLog({
      ...this.createLogEntry(LogLevel.ERROR, `Auth Error ${action}`, {
        error: error.message,
        email,
      }),
      userId,
    });
  }

  // Close all streams on shutdown
  close(): void {
    this.streams.forEach(stream => stream.end());
  }
}

// Create singleton instance
export const logger = new Logger();

// Handle process shutdown
process.on('SIGTERM', () => logger.close());
process.on('SIGINT', () => logger.close());
process.on('SIGUSR2', () => logger.close()); // For nodemon

// Export convenience functions
export const logError = (message: string, meta?: any) => logger.error(message, meta);
export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);
export const logApi = (method: string, url: string, userId?: string, schoolId?: string, meta?: any) => 
  logger.api(method, url, userId, schoolId, meta);
export const logApiError = (method: string, url: string, error: any, userId?: string, schoolId?: string) => 
  logger.apiError(method, url, error, userId, schoolId);
export const logAuth = (action: string, userId?: string, email?: string, success?: boolean) => 
  logger.auth(action, userId, email, success);
export const logAuthError = (action: string, error: any, userId?: string, email?: string) => 
  logger.authError(action, error, userId, email);
