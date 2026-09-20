import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { OtelLoggerAdapter } from '../adapters/logger/otel-logger.adapter.js';
import { PinoLoggerAdapter } from '../adapters/logger/pino-logger.adapter.js';
import { PrettyLoggerAdapter } from '../adapters/logger/pretty-logger.adapter.js';
import { createLogger } from './create-logger.js';

describe('createLogger', () => {
    beforeEach(() => {
        vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
        vi.stubEnv('NODE_ENV', 'test');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    test('should default to a pretty logger outside production', () => {
        // Given - no explicit options and a non-production environment
        // Then - a pretty logger is returned
        expect(createLogger()).toBeInstanceOf(PrettyLoggerAdapter);
    });

    test('should default to a pino logger in production', () => {
        // Given - a production environment
        vi.stubEnv('NODE_ENV', 'production');

        // Then - a pino logger is returned
        expect(createLogger()).toBeInstanceOf(PinoLoggerAdapter);
    });

    test('should wrap with the OTLP adapter when an endpoint is configured', () => {
        // Given - an OTLP endpoint configured through the environment
        vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://collector:4318');

        // Then - the OTel-backed adapter is returned
        expect(createLogger()).toBeInstanceOf(OtelLoggerAdapter);
    });

    test('should honor explicit options over the environment', () => {
        // Given - a production environment and options forcing pretty output
        vi.stubEnv('NODE_ENV', 'production');

        // Then - the explicit options win over the environment
        expect(createLogger({ otlp: false, pretty: true })).toBeInstanceOf(PrettyLoggerAdapter);
    });
});
