import pino from 'pino';

import type { LoggerLevel, LoggerPort } from '../../ports/logger.port.js';

/**
 * Structured JSON logger backed by pino. This is the production adapter:
 * one JSON line per log on stdout, ready for collection (kubectl logs, Loki).
 */
export class PinoLoggerAdapter implements LoggerPort {
    private logger: pino.Logger;
    private readonly config: {
        destination?: pino.DestinationStream;
        level: LoggerLevel;
    };

    constructor(config: { destination?: pino.DestinationStream; level: LoggerLevel }) {
        this.config = config;
        this.logger = pino(
            {
                formatters: {
                    level: (label) => ({ level: label }),
                },
                level: this.config.level,
            },
            this.config.destination,
        );
    }

    child(bindings: Record<string, unknown>): LoggerPort {
        const childLogger = new PinoLoggerAdapter(this.config);
        childLogger.logger = this.logger.child(bindings);
        return childLogger;
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(this.formatMeta(meta), message);
    }

    error(message: string, meta?: Record<string, unknown>): void {
        this.logger.error(this.formatMeta(meta), message);
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(this.formatMeta(meta), message);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(this.formatMeta(meta), message);
    }

    private formatMeta(meta?: Record<string, unknown>): Record<string, unknown> {
        if (!meta) {
            return {};
        }

        if (meta.error instanceof Error) {
            const { error, ...metaRest } = meta;

            return {
                error: {
                    ...error,
                    message: error.message,
                    stack: error.stack,
                },
                meta: metaRest,
            };
        }

        return { meta };
    }
}
