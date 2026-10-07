import { logs, SeverityNumber } from '@opentelemetry/api-logs';

import type { LoggerPort } from '../../ports/logger.port.js';

type OtelLogger = ReturnType<typeof logs.getLogger>;

type Level = 'debug' | 'error' | 'info' | 'warn';

const SEVERITIES: Record<Level, SeverityNumber> = {
    debug: SeverityNumber.DEBUG,
    error: SeverityNumber.ERROR,
    info: SeverityNumber.INFO,
    warn: SeverityNumber.WARN,
};

// outside: an OpenTelemetry attribute holds a primitive, so an Error is split into its message and its stack, any other object is serialized, and what JSON cannot hold is left out.
function flattenMeta(meta: Record<string, unknown>): Record<string, boolean | number | string> {
    const result: Record<string, boolean | number | string> = {};
    for (const [key, value] of Object.entries(meta)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            result[key] = value;
        } else if (value instanceof Error) {
            result[`${key}.message`] = value.message;
            result[`${key}.stack`] = value.stack ?? '';
        } else if (typeof value === 'object' && value !== null) {
            result[key] = JSON.stringify(value);
        }
    }
    return result;
}

/** Writes every line to the logger it wraps and emits it to the global OpenTelemetry LoggerProvider, a no-op until `@jterrazz/telemetry/register` registers one. */
export class OtelLoggerAdapter implements LoggerPort {
    private readonly bindings: Record<string, unknown>;
    private readonly innerLogger: LoggerPort;
    private readonly otelLogger: OtelLogger;

    constructor(innerLogger: LoggerPort, bindings: Record<string, unknown> = {}) {
        this.innerLogger = innerLogger;
        this.bindings = bindings;
        this.otelLogger = logs.getLogger(process.env.OTEL_SERVICE_NAME ?? 'unknown-service');
    }

    child(bindings: Record<string, unknown>): LoggerPort {
        return new OtelLoggerAdapter(this.innerLogger.child(bindings), {
            ...this.bindings,
            ...bindings,
        });
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.debug(message, meta);
        this.emit('debug', message, meta);
    }

    error(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.error(message, meta);
        this.emit('error', message, meta);
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.info(message, meta);
        this.emit('info', message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.warn(message, meta);
        this.emit('warn', message, meta);
    }

    private emit(level: Level, message: string, meta?: Record<string, unknown>): void {
        this.otelLogger.emit({
            attributes: flattenMeta({ ...this.bindings, ...meta }),
            body: message,
            severityNumber: SEVERITIES[level],
            severityText: level.toUpperCase(),
        });
    }
}
