import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { NoopLoggerAdapter } from '../adapters/logger/noop-logger.adapter.js';
import { OtelLoggerAdapter } from '../adapters/logger/otel-logger.adapter.js';
import { PinoLoggerAdapter } from '../adapters/logger/pino-logger.adapter.js';
import { PrettyLoggerAdapter } from '../adapters/logger/pretty-logger.adapter.js';
import { OtelMetricsAdapter } from '../adapters/metrics/otel-metrics.adapter.js';
import { OtelTracerAdapter } from '../adapters/tracer/otel-tracer.adapter.js';
import { createLogger } from './create-logger.js';
import { createMetrics } from './create-metrics.js';
import { createTracer } from './create-tracer.js';

describe('createLogger', () => {
    beforeEach(() => {
        vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
        vi.stubEnv('NODE_ENV', 'test');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    test('should default to a pretty logger outside production', () => {
        expect(createLogger()).toBeInstanceOf(PrettyLoggerAdapter);
    });

    test('should default to a pino logger in production', () => {
        vi.stubEnv('NODE_ENV', 'production');
        expect(createLogger()).toBeInstanceOf(PinoLoggerAdapter);
    });

    test('should wrap with the OTLP adapter when an endpoint is configured', () => {
        vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://collector:4318');
        expect(createLogger()).toBeInstanceOf(OtelLoggerAdapter);
    });

    test('should honor explicit options over the environment', () => {
        vi.stubEnv('NODE_ENV', 'production');
        expect(createLogger({ otlp: false, pretty: true })).toBeInstanceOf(PrettyLoggerAdapter);
    });
});

describe('createTracer / createMetrics', () => {
    test('should build OTel-backed adapters', () => {
        expect(createTracer({ namespace: 'app' })).toBeInstanceOf(OtelTracerAdapter);
        expect(createMetrics({ namespace: 'app' })).toBeInstanceOf(OtelMetricsAdapter);
    });
});

describe('typed metric catalogue', () => {
    test('should accept base metrics extended with app metrics', () => {
        // Compile-time contract: this test passing type-check is the assertion
        type AppMetrics = {
            'articles.processed': { source: string };
            'task.started': { task: string };
        };
        const metrics = createMetrics<AppMetrics>({ namespace: 'signews' });

        expect(() => {
            metrics.counter('articles.processed', { attributes: { source: 'worldnews' } });
            metrics.counter('task.started', { attributes: { task: 'pipeline' } });
        }).not.toThrow();
    });

    test('noop logger stays silent', () => {
        const logger = new NoopLoggerAdapter();
        expect(() => logger.child({ a: 1 }).info('nothing')).not.toThrow();
    });
});
