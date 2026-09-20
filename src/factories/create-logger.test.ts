import { describe, expect, test, vi } from 'vitest';

import { OtelLoggerAdapter } from '../adapters/logger/otel-logger.adapter.js';
import { PinoLoggerAdapter } from '../adapters/logger/pino-logger.adapter.js';
import { PrettyLoggerAdapter } from '../adapters/logger/pretty-logger.adapter.js';
import { createLogger } from './create-logger.js';

/**
 * The environment every test starts from — no OTLP endpoint, not production.
 * The preset's `unstubEnvs` gives the real environment back.
 */
function givenEnvironment(): void {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
    vi.stubEnv('NODE_ENV', 'test');
}

describe('createLogger', () => {
    test('should default to a pretty logger outside production', () => {
        // Given - no explicit options and a non-production environment
        givenEnvironment();

        // Then - a pretty logger is returned
        expect(createLogger()).toBeInstanceOf(PrettyLoggerAdapter);
    });

    test('should default to a pino logger in production', () => {
        // Given - a production environment
        givenEnvironment();
        vi.stubEnv('NODE_ENV', 'production');

        // Then - a pino logger is returned
        expect(createLogger()).toBeInstanceOf(PinoLoggerAdapter);
    });

    test('should wrap with the OTLP adapter when an endpoint is configured', () => {
        // Given - an OTLP endpoint configured through the environment
        givenEnvironment();
        vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://collector:4318');

        // Then - the OTel-backed adapter is returned
        expect(createLogger()).toBeInstanceOf(OtelLoggerAdapter);
    });

    test('should honor explicit options over the environment', () => {
        // Given - a production environment and options forcing pretty output
        givenEnvironment();
        vi.stubEnv('NODE_ENV', 'production');

        // Then - the explicit options win over the environment
        expect(createLogger({ otlp: false, pretty: true })).toBeInstanceOf(PrettyLoggerAdapter);
    });
});
