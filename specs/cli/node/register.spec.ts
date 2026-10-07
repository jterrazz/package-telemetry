import { directory, file, text } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { startCollector } from './__setup__/collector.js';
import { installPacked } from './__setup__/packed.js';

describe('register', () => {
    test('with no collector configured the application runs and nothing is exported', async () => {
        // Given - the register entry loaded before an application, its OTLP endpoint set empty
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .env({ OTEL_EXPORTER_OTLP_ENDPOINT: '' })
            .prepare(installPacked)
            .exec('--import @jterrazz/telemetry/register idle.mjs');

        // Then - the entry says export is off, and the application runs after it
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            [Telemetry] No OTEL_EXPORTER_OTLP_ENDPOINT configured, export disabled
            the application ran
        `);
    });

    test('the kill switch turns export off even with a collector configured', async () => {
        // Given - an OTLP endpoint and OTEL_SDK_DISABLED=true
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .env({ OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:9', OTEL_SDK_DISABLED: 'true' })
            .prepare(installPacked)
            .exec('--import @jterrazz/telemetry/register idle.mjs');

        // Then - the entry says the SDK is disabled, and the application runs after it
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            [Telemetry] Disabled by OTEL_SDK_DISABLED
            the application ran
        `);
    });

    test('logs, metrics and spans reach the collector the environment names', async () => {
        // Given - a collector, its headers and the deployment named by the environment, an application recording one of each signal, and a logger it builds with otlp off
        await using collector = await startCollector();
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .env({
                OTEL_EXPORTER_OTLP_ENDPOINT: collector.url,
                OTEL_EXPORTER_OTLP_HEADERS: 'authorization=Bearer%20s3cret,x-tenant=shop',
                OTEL_EXPORTER_OTLP_PROTOCOL: 'http/json',
                OTEL_NODE_ENABLED_INSTRUMENTATIONS: 'http',
                OTEL_RESOURCE_ATTRIBUTES: 'deployment.environment=staging',
            })
            .prepare(installPacked)
            .exec('--import @jterrazz/telemetry/register export.mjs', {
                timeout: 20_000,
                waitFor: 'flushed',
            });

        // Then - every signal arrives namespaced, with its attributes and the service's identity on each signal's resource, through the configured headers, and the line of the logger built with otlp off reaches stderr only
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            [Telemetry] Initialized {
              endpoint: 'http://127.0.0.1:{{port}}',
              environment: 'staging',
              serviceName: 'consumer'
            }
            {"level":"debug","time":{{int}},"pid":{{int}},"hostname":"{{string}}","meta":{"entries":3},"msg":"cache.warmed"}
            {"level":"info","time":{{int}},"pid":{{int}},"hostname":"{{string}}","requestId":"r-42","route":"/cart","meta":{"cached":true,"status":200,"user":{"id":7}},"msg":"request.served"}
            {"level":"warn","time":{{int}},"pid":{{int}},"hostname":"{{string}}","error":{"message":"boom","stack":"Error: boom\\n    at checkout (cart.mjs:1:1)"},"meta":{"reserved":{"units":4},"sku":null,"stock":10},"msg":"stock.low"}
            {"level":"error","time":{{int}},"pid":{{int}},"hostname":"{{string}}","meta":{"attempt":2,"cause":{}},"msg":"payment.failed"}
            flushed
        `);
        expect(text(result.stderr.raw.replaceAll('\u001B', String.raw`\e`))).toMatch(`
            \\e[31mERROR\\e[0m \\e[2m[{{time}}]\\e[0m: local.only
        `);
        const collected = JSON.stringify(collector.collected(), null, 4);
        expect(text(collected)).toMatch(
            file(
                './__expected__/logs-metrics-and-spans-reach-the-collector-the-environment-names.txt',
            ),
        );
    });
});
