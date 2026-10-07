import { createServer } from 'node:http';

type Attribute = { key: string; value: Record<string, unknown> };

type Signal = 'logs' | 'metrics' | 'traces';

type Collected = {
    headers: Record<string, string | string[] | undefined>;
    logs: unknown[];
    metrics: unknown[];
    resource: Record<string, unknown>;
    spans: unknown[];
    traceResource: { host: boolean; process: boolean };
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
    severity: `${String(fieldOf(record, 'severityText'))} (${String(fieldOf(record, 'severityNumber'))})`,
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

function traceResourceOf(payload: unknown): Collected['traceResource'] {
    const [first] = listOf(fieldOf(payload, 'resourceSpans'));
    const resource = fieldOf(first, 'resource');
    const keys = Object.keys(attributesOf(fieldOf(resource, 'attributes')));
    return {
        host: keys.some((key) => key.startsWith('host.')),
        process: keys.some((key) => key.startsWith('process.')),
    };
}

function readersOf(collected: Collected): Record<Signal, (payload: unknown) => void> {
    return {
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
            collected.traceResource = traceResourceOf(payload);
            collected.spans.push(
                ...scopedOf(payload, 'resourceSpans', 'scopeSpans', 'spans').map(spanOf),
            );
        },
    };
}

/** An OTLP/HTTP collector on a free local port, answering every export and keeping what it was sent, reduced to what a dashboard reads. */
export async function startCollector(): Promise<
    AsyncDisposable & { collected: () => Collected; url: string }
> {
    const collected: Collected = {
        headers: {},
        logs: [],
        metrics: [],
        resource: {},
        spans: [],
        traceResource: { host: false, process: false },
    };
    const readers = readersOf(collected);
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
