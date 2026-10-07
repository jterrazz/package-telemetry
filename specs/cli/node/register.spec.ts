import { directory, text } from '@jterrazz/test';
import { createServer } from 'node:http';
import { describe, expect, test } from 'vitest';

import { cli } from '../cli.specification.js';
import { installPacked } from './__setup__/packed.js';

type Attribute = { key: string; value: Record<string, unknown> };

type Signal = 'logs' | 'metrics' | 'traces';

type Collected = {
    headers: Record<string, string | string[] | undefined>;
    logs: unknown[];
    metrics: unknown[];
    resource: Record<string, unknown>;
    spans: unknown[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const fieldOf = (value: unknown, key: string): unknown =>
    isRecord(value) ? value[key] : undefined;

const valueOf = (value: unknown): unknown => {
    const [only] = Object.values(isRecord(value) ? value : {});
    return only;
};

function attributesOf(value: unknown): Record<string, unknown> {
    return Object.fromEntries(
        listOf(value)
            .filter((attribute): attribute is Attribute => isRecord(attribute))
            .map(({ key, value: held }) => [key, valueOf(held)]),
    );
}

type Scoped = { item: unknown; scope: unknown };

const scopedOf = (payload: unknown, resource: string, scope: string, items: string): Scoped[] =>
    listOf(fieldOf(payload, resource)).flatMap((one) =>
        listOf(fieldOf(one, scope)).flatMap((scoped) =>
            listOf(fieldOf(scoped, items)).map((item) => ({
                item,
                scope: fieldOf(fieldOf(scoped, 'scope'), 'name'),
            })),
        ),
    );

function resourceOf(payload: unknown): Record<string, unknown> {
    const [first] = listOf(fieldOf(payload, 'resourceLogs'));
    const attributes = attributesOf(fieldOf(fieldOf(first, 'resource'), 'attributes'));
    return {
        'deployment.environment': attributes['deployment.environment'],
        'service.name': attributes['service.name'],
    };
}

const logOf = ({ item: record, scope }: Scoped): unknown => ({
    attributes: attributesOf(fieldOf(record, 'attributes')),
    body: valueOf(fieldOf(record, 'body')),
    scope,
    severity: fieldOf(record, 'severityText'),
});

const pointOf = (point: unknown): unknown => ({
    attributes: attributesOf(fieldOf(point, 'attributes')),
    value: fieldOf(point, 'asInt') ?? fieldOf(point, 'asDouble') ?? fieldOf(point, 'sum'),
});

function metricOf({ item: metric, scope }: Scoped): unknown {
    const data = fieldOf(metric, 'sum') ?? fieldOf(metric, 'gauge') ?? fieldOf(metric, 'histogram');
    return {
        name: fieldOf(metric, 'name'),
        points: listOf(fieldOf(data, 'dataPoints')).map((point) => pointOf(point)),
        scope,
    };
}

const spanOf = ({ item: span, scope }: Scoped): unknown => ({
    attributes: attributesOf(fieldOf(span, 'attributes')),
    events: listOf(fieldOf(span, 'events')).map((event) => fieldOf(event, 'name')),
    name: fieldOf(span, 'name'),
    scope,
    status: fieldOf(span, 'status'),
});

/** An OTLP/HTTP collector on a free local port, answering every export and keeping what it was sent, reduced to what a dashboard reads. */
async function startCollector(): Promise<
    AsyncDisposable & { collected: () => Collected; url: string }
> {
    const collected: Collected = { headers: {}, logs: [], metrics: [], resource: {}, spans: [] };
    const readers: Record<Signal, (payload: unknown) => void> = {
        logs: (payload) => {
            collected.resource = resourceOf(payload);
            collected.logs.push(
                ...scopedOf(payload, 'resourceLogs', 'scopeLogs', 'logRecords').map(logOf),
            );
        },
        metrics: (payload) => {
            collected.metrics.push(
                ...scopedOf(payload, 'resourceMetrics', 'scopeMetrics', 'metrics').map(metricOf),
            );
        },
        traces: (payload) => {
            collected.spans.push(
                ...scopedOf(payload, 'resourceSpans', 'scopeSpans', 'spans').map(spanOf),
            );
        },
    };
    const server = createServer((request, response) => {
        const chunks: Buffer[] = [];
        request.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
        });
        request.on('end', () => {
            const signal = request.url?.replace('/v1/', '');
            if (signal === 'logs' || signal === 'metrics' || signal === 'traces') {
                collected.headers = {
                    authorization: request.headers.authorization,
                    tenant: request.headers['x-tenant'],
                };
                readers[signal](JSON.parse(Buffer.concat(chunks).toString('utf8')));
            }
            response.writeHead(200, { 'content-type': 'application/json' }).end('{}');
        });
    });
    await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;

    return {
        [Symbol.asyncDispose]: async () => {
            await new Promise((resolve) => {
                server.close(resolve);
            });
        },
        collected: () => collected,
        url: `http://127.0.0.1:${port}`,
    };
}

describe('register', () => {
    test('with no collector configured the application runs and nothing is exported', async () => {
        // Given - the register entry loaded before an application, no OTLP endpoint set
        const result = await cli
            .fixture(directory('./__fixtures__/consumer/'))
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
        // Given - a collector, its headers and the deployment named by the environment, and an application recording one of each signal
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

        // Then - every signal arrives namespaced, with its attributes and the service's identity, through the configured headers
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toMatch(`
            [Telemetry] Initialized {
              endpoint: 'http://127.0.0.1:{{port}}',
              environment: 'staging',
              serviceName: 'consumer'
            }
            {"level":"info","time":{{int}},"pid":{{int}},"hostname":"{{any}}","requestId":"r-42","route":"/cart","meta":{"cached":true,"status":200,"user":{"id":7}},"msg":"request.served"}
            {"level":"warn","time":{{int}},"pid":{{int}},"hostname":"{{any}}","error":{"message":"boom","stack":"Error: boom\\n{{any}}"},"meta":{"sku":null},"msg":"stock.low"}
            flushed
        `);
        const collected = JSON.stringify(collector.collected(), null, 4);
        expect(text(collected)).toMatch(`
            {
                "headers": {
                    "authorization": "Bearer s3cret",
                    "tenant": "shop"
                },
                "logs": [
                    {
                        "attributes": {
                            "requestId": "r-42",
                            "route": "/cart",
                            "cached": true,
                            "status": 200,
                            "user": "{\\"id\\":7}"
                        },
                        "body": "request.served",
                        "scope": "consumer",
                        "severity": "INFO"
                    },
                    {
                        "attributes": {
                            "error.message": "boom",
                            "error.stack": "Error: boom\\n{{any}}"
                        },
                        "body": "stock.low",
                        "scope": "consumer",
                        "severity": "WARN"
                    }
                ],
                "metrics": [
                    {
                        "name": "orders.refunded",
                        "points": [
                            {
                                "attributes": {},
                                "value": 1
                            }
                        ],
                        "scope": "orders-meter"
                    },
                    {
                        "name": "shop.orders.placed",
                        "points": [
                            {
                                "attributes": {
                                    "channel": "web"
                                },
                                "value": 3
                            },
                            {
                                "attributes": {
                                    "channel": "app"
                                },
                                "value": 1
                            }
                        ],
                        "scope": "consumer"
                    },
                    {
                        "name": "shop.checkout.duration",
                        "points": [
                            {
                                "attributes": {
                                    "channel": "web"
                                },
                                "value": 125
                            }
                        ],
                        "scope": "consumer"
                    },
                    {
                        "name": "shop.queue.depth",
                        "points": [
                            {
                                "attributes": {},
                                "value": 7
                            }
                        ],
                        "scope": "consumer"
                    },
                    {
                        "name": "shop.cart.size",
                        "points": [
                            {
                                "attributes": {
                                    "stat": "mean"
                                },
                                "value": 3
                            }
                        ],
                        "scope": "consumer"
                    }
                ],
                "resource": {
                    "deployment.environment": "staging",
                    "service.name": "consumer"
                },
                "spans": [
                    {
                        "attributes": {
                            "channel": "web",
                            "cart.paid": true
                        },
                        "events": [
                            "cart.priced"
                        ],
                        "name": "shop.checkout.run",
                        "scope": "consumer",
                        "status": {
                            "code": 1
                        }
                    },
                    {
                        "attributes": {},
                        "events": [
                            "exception"
                        ],
                        "name": "shop.payment.charge",
                        "scope": "consumer",
                        "status": {
                            "code": 2,
                            "message": "card declined"
                        }
                    },
                    {
                        "attributes": {},
                        "events": [],
                        "name": "nightly.run",
                        "scope": "jobs-tracer",
                        "status": {
                            "code": 1
                        }
                    }
                ]
            }`);
    });
});
