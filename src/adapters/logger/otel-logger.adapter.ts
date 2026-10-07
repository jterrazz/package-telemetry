import { logs, SeverityNumber } from '@opentelemetry/api-logs';

import type { LoggerPort } from '../../ports/logger.port.js';

type OtelLogger = ReturnType<typeof logs.getLogger>;

// outside: an OpenTelemetry attribute holds a primitive, so an Error is split into its message and its stack, and any other object is serialized.
function flattenMeta(meta?: Record<string, unknown>): Record<string, boolean | number | string> {
    if (!meta) {
        return {};
    }

    const result: Record<string, boolean | number | string> = {};
    for (const [key, value] of Object.entries(meta)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            result[key] = value;
        } else if (value instanceof Error) {
            result[`${key}.message`] = value.message;
            result[`${key}.stack`] = value.stack ?? '';
        } else if (value !== null && value !== undefined) {
            result[key] = JSON.stringify(value);
        }
    }
    return result;
}

function emitLog(
    otelLogger: OtelLogger,
    severityNumber: SeverityNumber,
    severityText: string,
    message: string,
    meta?: Record<string, unknown>,
): void {
    otelLogger.emit({
        attributes: flattenMeta(meta),
        body: message,
        severityNumber,
        severityText,
    });
}

class OtelChildLoggerAdapter implements LoggerPort {
    private readonly bindings: Record<string, unknown>;
    private readonly innerLogger: LoggerPort;
    private readonly otelLogger: OtelLogger;

    constructor(
        innerLogger: LoggerPort,
        otelLogger: OtelLogger,
        bindings: Record<string, unknown>,
    ) {
        this.innerLogger = innerLogger;
        this.otelLogger = otelLogger;
        this.bindings = bindings;
    }

    child(bindings: Record<string, unknown>): LoggerPort {
        const childInner = this.innerLogger.child(bindings);
        return new OtelChildLoggerAdapter(childInner, this.otelLogger, {
            ...this.bindings,
            ...bindings,
        });
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.debug(message, meta);
        this.emit(SeverityNumber.DEBUG, 'DEBUG', message, meta);
    }

    error(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.error(message, meta);
        this.emit(SeverityNumber.ERROR, 'ERROR', message, meta);
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.info(message, meta);
        this.emit(SeverityNumber.INFO, 'INFO', message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.warn(message, meta);
        this.emit(SeverityNumber.WARN, 'WARN', message, meta);
    }

    private emit(
        severityNumber: SeverityNumber,
        severityText: string,
        message: string,
        meta?: Record<string, unknown>,
    ): void {
        emitLog(this.otelLogger, severityNumber, severityText, message, {
            ...this.bindings,
            ...meta,
        });
    }
}

/** Writes every line to the logger it wraps and emits it to the global OpenTelemetry LoggerProvider, a no-op until `@jterrazz/telemetry/register` registers one. */
export class OtelLoggerAdapter implements LoggerPort {
    private readonly innerLogger: LoggerPort;
    private readonly otelLogger: OtelLogger;

    constructor(innerLogger: LoggerPort) {
        this.innerLogger = innerLogger;
        this.otelLogger = logs.getLogger(process.env.OTEL_SERVICE_NAME ?? 'unknown-service');
    }

    child(bindings: Record<string, unknown>): LoggerPort {
        const childInner = this.innerLogger.child(bindings);
        return new OtelChildLoggerAdapter(childInner, this.otelLogger, bindings);
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.debug(message, meta);
        emitLog(this.otelLogger, SeverityNumber.DEBUG, 'DEBUG', message, meta);
    }

    error(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.error(message, meta);
        emitLog(this.otelLogger, SeverityNumber.ERROR, 'ERROR', message, meta);
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.info(message, meta);
        emitLog(this.otelLogger, SeverityNumber.INFO, 'INFO', message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.innerLogger.warn(message, meta);
        emitLog(this.otelLogger, SeverityNumber.WARN, 'WARN', message, meta);
    }
}
