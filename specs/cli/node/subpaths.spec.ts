import { directory } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { installPacked } from './__setup__/packed.js';

describe('subpaths', () => {
    test('every subpath the exports map publishes loads from the tarball under its condition', async () => {
        // Given - a consumer's project with the packed package installed
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .prepare(installPacked)
            .exec('subpaths.mjs');

        // Then - the ESM and CommonJS builds name the same API, and the register entry starts once however often it is called
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            [Telemetry] No OTEL_EXPORTER_OTLP_ENDPOINT configured, export disabled
            @jterrazz/telemetry (import): LoggerLevelSchema, NoopLoggerAdapter, NoopMetricsAdapter, NoopTracerAdapter, OtelLoggerAdapter, OtelMetricsAdapter, OtelTracerAdapter, PinoLoggerAdapter, PrettyLoggerAdapter, createLogger, createMetrics, createTracer
            @jterrazz/telemetry (require): LoggerLevelSchema, NoopLoggerAdapter, NoopMetricsAdapter, NoopTracerAdapter, OtelLoggerAdapter, OtelMetricsAdapter, OtelTracerAdapter, PinoLoggerAdapter, PrettyLoggerAdapter, createLogger, createMetrics, createTracer
            @jterrazz/telemetry/register (import): registerTelemetry
        `);
    });
});
