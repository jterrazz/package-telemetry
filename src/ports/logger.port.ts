import { z } from 'zod';

/**
 * Logger port - defines how to log messages with different severity levels
 */
export const LoggerLevelSchema = z.enum(['debug', 'info', 'warn', 'error', 'silent']);
export type LoggerLevel = z.infer<typeof LoggerLevelSchema>;

export interface LoggerPort {
    /**
     * Create a child logger with specific bindings
     */
    child: (bindings: Record<string, unknown>) => LoggerPort;

    /**
     * Log a debug message
     */
    debug: (message: string, meta?: Record<string, unknown>) => void;

    /**
     * Log an error message
     */
    error: (message: string, meta?: Record<string, unknown>) => void;

    /**
     * Log an informational message
     */
    info: (message: string, meta?: Record<string, unknown>) => void;

    /**
     * Log a warning message
     */
    warn: (message: string, meta?: Record<string, unknown>) => void;
}
