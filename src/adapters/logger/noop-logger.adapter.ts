import type { LoggerPort } from '../../ports/logger.port.js';

/**
 * No-op logger adapter that implements LoggerPort but performs no operations.
 * Useful for tests and environments where logging should be disabled.
 */
export class NoopLoggerAdapter implements LoggerPort {
    child(_bindings: Record<string, unknown>): LoggerPort {
        return this;
    }

    debug(_message: string, _meta?: Record<string, unknown>): void {
        // No operation
    }

    error(_message: string, _meta?: Record<string, unknown>): void {
        // No operation
    }

    info(_message: string, _meta?: Record<string, unknown>): void {
        // No operation
    }

    warn(_message: string, _meta?: Record<string, unknown>): void {
        // No operation
    }
}
