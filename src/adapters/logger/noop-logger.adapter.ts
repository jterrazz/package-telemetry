import type { LoggerPort } from '../../ports/logger.port.js';

/** A LoggerPort that drops every line — for tests, and for an environment that logs nothing. */
export class NoopLoggerAdapter implements LoggerPort {
    child(_bindings: Record<string, unknown>): LoggerPort {
        return this;
    }

    debug(_message: string, _meta?: Record<string, unknown>): void {}

    error(_message: string, _meta?: Record<string, unknown>): void {}

    info(_message: string, _meta?: Record<string, unknown>): void {}

    warn(_message: string, _meta?: Record<string, unknown>): void {}
}
