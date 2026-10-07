import { directory, text } from '@jterrazz/test';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { startCollector } from './__setup__/collector.js';
import { installPacked } from './__setup__/packed.js';

describe('defaults', () => {
    test('with no service or deployment named, each signal carries its own defaults', async () => {
        // Given - a collector, and an application with neither OTEL_SERVICE_NAME, OTEL_RESOURCE_ATTRIBUTES nor NODE_ENV set
        await using collector = await startCollector();
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
            .env({
                NODE_ENV: null,
                OTEL_EXPORTER_OTLP_ENDPOINT: collector.url,
                OTEL_EXPORTER_OTLP_PROTOCOL: 'http/json',
                OTEL_NODE_ENABLED_INSTRUMENTATIONS: 'http',
                OTEL_SERVICE_NAME: null,
            })
            .prepare(installPacked)
            .exec('--import @jterrazz/telemetry/register heartbeat.mjs', {
                timeout: 20_000,
                waitFor: 'flushed',
            });

        // Then - logs and metrics carry unknown-service in development, while traces carry OpenTelemetry's own unknown_service:node and no deployment
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            [Telemetry] Initialized {
              endpoint: 'http://127.0.0.1:{{port}}',
              environment: 'development',
              serviceName: 'unknown-service'
            }
            {"level":"info","time":{{int}},"pid":{{int}},"hostname":"{{string}}","msg":"heartbeat"}
            flushed
        `);
        const collected = JSON.stringify(collector.collected(), null, 4);
        expect(text(collected)).toMatch(`
            {
                "headers": {},
                "logs": [
                    {
                        "attributes": {},
                        "body": "heartbeat",
                        "scope": "unknown-service",
                        "severity": "INFO (9)"
                    }
                ],
                "metrics": [
                    {
                        "name": "beats",
                        "points": [
                            {
                                "attributes": {},
                                "value": 1
                            }
                        ],
                        "scope": "unknown-service"
                    }
                ],
                "resources": {
                    "logs": {
                        "deployment.environment": "development",
                        "host.*": false,
                        "process.*": false,
                        "service.name": "unknown-service"
                    },
                    "metrics": {
                        "deployment.environment": "development",
                        "host.*": false,
                        "process.*": false,
                        "service.name": "unknown-service"
                    },
                    "traces": {
                        "host.*": true,
                        "process.*": false,
                        "service.name": "unknown_service:node"
                    }
                },
                "spans": [
                    {
                        "attributes": {},
                        "events": [],
                        "name": "beat.run",
                        "scope": "unknown-service",
                        "status": {
                            "code": 1
                        }
                    }
                ]
            }`);
    });
});
