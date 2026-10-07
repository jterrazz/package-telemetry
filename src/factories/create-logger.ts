import { OtelLoggerAdapter } from '../adapters/logger/otel-logger.adapter.js';
import { PinoLoggerAdapter } from '../adapters/logger/pino-logger.adapter.js';
import { PrettyLoggerAdapter } from '../adapters/logger/pretty-logger.adapter.js';
import type { LoggerLevel, LoggerPort } from '../ports/logger.port.js';

export type CreateLoggerOptions = {
    /** Minimum level to log (defaults to 'info') */
    level?: LoggerLevel;
    /** Also emit every line through OTLP — defaults to true when OTEL_EXPORTER_OTLP_ENDPOINT is set. */
    otlp?: boolean;
    /** Colored lines instead of JSON — defaults to true unless NODE_ENV is 'production'. */
    pretty?: boolean;
};

/** Colored lines in development, JSON lines on stdout in production, each also emitted through OTLP when a collector is configured. */
export function createLogger(options: CreateLoggerOptions = {}): LoggerPort {
    const level = options.level ?? 'info';
    const pretty = options.pretty ?? process.env.NODE_ENV !== 'production';

    const logger: LoggerPort = pretty
        ? new PrettyLoggerAdapter({ level })
        : new PinoLoggerAdapter({ level });

    const otlp = options.otlp ?? Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

    return otlp ? new OtelLoggerAdapter(logger) : logger;
}
