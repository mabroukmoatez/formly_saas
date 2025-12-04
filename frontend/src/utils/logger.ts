/**
 * Centralized Logging Service
 * 
 * Professional logging with:
 * - Environment-aware output (disabled in production)
 * - Structured log format
 * - Log levels
 * - Performance tracking
 * - Error reporting integration ready
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  reportErrors: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_ICONS: Record<LogLevel, string> = {
  debug: '🔍',
  info: '📝',
  warn: '⚠️',
  error: '❌',
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: 'color: #6b7280',
  info: 'color: #3b82f6',
  warn: 'color: #f59e0b',
  error: 'color: #ef4444',
};

class Logger {
  private config: LoggerConfig;
  private contextStack: string[] = [];

  constructor() {
    const isDev = import.meta.env.DEV;
    
    this.config = {
      enabled: isDev || import.meta.env.VITE_ENABLE_LOGGING === 'true',
      minLevel: isDev ? 'debug' : 'warn',
      reportErrors: !isDev,
    };
  }

  /**
   * Create a scoped logger for a specific context
   */
  scope(context: string): ScopedLogger {
    return new ScopedLogger(this, context);
  }

  /**
   * Log with full control
   */
  log(level: LogLevel, context: string, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      context,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    this.output(entry);

    // Report errors to external service in production
    if (level === 'error' && this.config.reportErrors) {
      this.reportError(entry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private output(entry: LogEntry): void {
    const icon = LOG_ICONS[entry.level];
    const color = LOG_COLORS[entry.level];
    const prefix = `${icon} [${entry.context}]`;

    if (entry.data !== undefined) {
      console.groupCollapsed(`%c${prefix} ${entry.message}`, color);
      console.log('Data:', entry.data);
      console.log('Time:', entry.timestamp);
      console.groupEnd();
    } else {
      console[entry.level](`%c${prefix} ${entry.message}`, color);
    }
  }

  private reportError(entry: LogEntry): void {
    // Integration point for error reporting services (Sentry, LogRocket, etc.)
    // Example: Sentry.captureMessage(entry.message, { extra: entry.data });
  }

  // Convenience methods
  debug(context: string, message: string, data?: unknown): void {
    this.log('debug', context, message, data);
  }

  info(context: string, message: string, data?: unknown): void {
    this.log('info', context, message, data);
  }

  warn(context: string, message: string, data?: unknown): void {
    this.log('warn', context, message, data);
  }

  error(context: string, message: string, data?: unknown): void {
    this.log('error', context, message, data);
  }

  /**
   * Performance measurement
   */
  time(label: string): () => void {
    if (!this.config.enabled) return () => {};
    
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug('Performance', `${label}: ${duration.toFixed(2)}ms`);
    };
  }

  /**
   * Async operation tracking
   */
  async track<T>(
    context: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const endTimer = this.time(`${context}.${operation}`);
    
    try {
      this.debug(context, `Starting: ${operation}`);
      const result = await fn();
      this.info(context, `Completed: ${operation}`);
      return result;
    } catch (error) {
      this.error(context, `Failed: ${operation}`, error);
      throw error;
    } finally {
      endTimer();
    }
  }
}

/**
 * Scoped logger for specific modules/components
 */
class ScopedLogger {
  constructor(
    private logger: Logger,
    private context: string
  ) {}

  debug(message: string, data?: unknown): void {
    this.logger.debug(this.context, message, data);
  }

  info(message: string, data?: unknown): void {
    this.logger.info(this.context, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.logger.warn(this.context, message, data);
  }

  error(message: string, data?: unknown): void {
    this.logger.error(this.context, message, data);
  }

  time(label: string): () => void {
    return this.logger.time(`${this.context}.${label}`);
  }

  track<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    return this.logger.track(this.context, operation, fn);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export scoped loggers for common contexts
export const sessionLogger = logger.scope('SessionCreation');
export const courseLogger = logger.scope('CourseCreation');
export const apiLogger = logger.scope('API');

export default logger;


