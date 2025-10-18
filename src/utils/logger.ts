/**
 * Structured Logging Utility
 * 
 * Replaces all console.log statements with structured logging using Pino.
 * Provides different log levels and context-aware logging.
 */

import pino from 'pino';

const logger = pino({
  level: import.meta.env.MODE === 'production' ? 'info' : 'debug',
  browser: {
    asObject: true
  },
  transport: import.meta.env.MODE !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  } : undefined
});

// Context-aware logging helpers
export const createContextLogger = (context: string) => ({
  debug: (message: string, data?: any) => logger.debug({ context }, message, data),
  info: (message: string, data?: any) => logger.info({ context }, message, data),
  warn: (message: string, data?: any) => logger.warn({ context }, message, data),
  error: (message: string, data?: any) => logger.error({ context }, message, data),
});

// Default logger for general use
export default logger;

// Pre-configured loggers for common contexts
export const authLogger = createContextLogger('auth');
export const chatLogger = createContextLogger('chat');
export const apiLogger = createContextLogger('api');
export const storeLogger = createContextLogger('store');
export const serviceLogger = createContextLogger('service');
export const generalLogger = createContextLogger('general');
