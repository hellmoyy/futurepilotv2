/**
 * 🔇 Production-Safe Logger
 * 
 * Automatically disables console.log/info/debug in production
 * while keeping error and warn for debugging.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.log('Debug message'); // Only in development
 *   logger.error('Error message'); // Always logged
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  const currentLevel = LOG_LEVELS[LOG_LEVEL as LogLevel] || LOG_LEVELS.info;
  const messageLevel = LOG_LEVELS[level];
  return messageLevel >= currentLevel;
}

export const logger = {
  /**
   * Debug logging - Only in development mode
   * Disabled in production for performance
   */
  debug: (...args: any[]) => {
    if (IS_DEVELOPMENT && shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info logging - Only in development mode
   * Disabled in production to reduce noise
   */
  log: (...args: any[]) => {
    if (IS_DEVELOPMENT && shouldLog('info')) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (IS_DEVELOPMENT && shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning logging - Always enabled
   * Important for production debugging
   */
  warn: (...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Error logging - Always enabled
   * Critical for production debugging
   */
  error: (...args: any[]) => {
    if (shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  },

  /**
   * Force logging - Always logs regardless of environment
   * Use sparingly for critical production info
   */
  force: (...args: any[]) => {
    console.log('[FORCE]', ...args);
  },
};

// Override global console in production (optional)
if (IS_PRODUCTION) {
  // Disable console.log in production
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  
  // Keep warn and error
  // console.warn and console.error remain untouched
}

export default logger;
