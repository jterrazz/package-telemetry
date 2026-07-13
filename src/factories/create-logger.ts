import { OtelLoggerAdapter } from '../adapters/logger/otel-logger.adapter.js';
import { PinoLoggerAdapter } from '../adapters/logger/pino-logger.adapter.js';
import { PrettyLoggerAdapter } from '../adapters/logger/pretty-logger.adapter.js';
import type { LoggerLevel, LoggerPort } from '../ports/logger.port.js';

export interface CreateLoggerOptions {
    /** Minimum level to log (defaults to 'info') */
    level?: LoggerLevel;
    /**
     * Also emit logs through OTLP to the collector.
     * Defaults to true when OTEL_EXPORTER_OTLP_ENDPOINT is set.
     */
    otlp?: boolean;
    /**
     * Human-readable colored output instead of JSON lines.
     * Defaults to true outside production (NODE_ENV !== 'production').
     */
    pretty?: boolean;
}

/**
 * Create a logger following the jterrazz conventions:
 * pretty colored lines in development, JSON lines on stdout in production,
 * dual-emitted to the OTLP collector whenever one is configured.
 */
export function createLogger(options: CreateLoggerOptions = {}): LoggerPort {
    const level = options.level ?? 'info';
    const pretty = options.pretty ?? process.env.NODE_ENV !== 'production';

    const logger: LoggerPort = pretty
        ? new PrettyLoggerAdapter({ level })
        : new PinoLoggerAdapter({ level });

    const otlp = options.otlp ?? Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

    return otlp ? new OtelLoggerAdapter(logger) : logger;
}
