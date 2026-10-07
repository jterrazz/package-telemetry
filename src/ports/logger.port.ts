import { z } from 'zod';

export const LoggerLevelSchema: z.ZodEnum<{
    debug: 'debug';
    error: 'error';
    info: 'info';
    silent: 'silent';
    warn: 'warn';
}> = z.enum(['debug', 'info', 'warn', 'error', 'silent']);
export type LoggerLevel = z.infer<typeof LoggerLevelSchema>;

export type LoggerPort = {
    /** A logger carrying these bindings on every line, beside its parent's. */
    child: (bindings: Record<string, unknown>) => LoggerPort;
    debug: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, meta?: Record<string, unknown>) => void;
    info: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
};
