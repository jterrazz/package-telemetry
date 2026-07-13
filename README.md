# @jterrazz/telemetry

Unified observability for Node.js — logs, traces and metrics over OpenTelemetry, with ports & adapters.

Replaces `@jterrazz/logger` (absorbed) and `@jterrazz/monitor` (deprecated).

## Installation

```bash
npm install @jterrazz/telemetry
```

## Quick start

```typescript
import { createLogger, createMetrics, createTracer } from '@jterrazz/telemetry';

const logger = createLogger();
const tracer = createTracer({ namespace: 'myapp' });
const metrics = createMetrics({ namespace: 'myapp' });

await tracer.span('pipeline.run', async () => {
    logger.info('Processing started', { source: 'worldnews' });
    metrics.counter('task.started', { attributes: { task: 'pipeline' } });
});
```

Then load the OpenTelemetry SDK before your app:

```bash
node --import @jterrazz/telemetry/register dist/index.js
```

That's the entire setup. Everything is configured from `OTEL_*` environment
variables — on the jterrazz K8s app chart they are injected automatically
(`OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`, `OTEL_EXPORTER_OTLP_ENDPOINT`).
Without an endpoint configured, telemetry is a silent no-op: logs still reach
stdout, spans and metrics cost nothing.

## The three pillars

### Logs — `LoggerPort`

```typescript
const logger = createLogger({
    level: 'info', // 'debug' | 'info' | 'warn' | 'error' | 'silent'
    pretty: true, // colored inline output; defaults to true outside production
    otlp: true, // dual-emit to the OTLP collector; defaults to auto-detect
});

logger.info('Server started', { port: 3000 });
logger.error('Request failed', { error: new Error('Connection timeout') });

const requestLogger = logger.child({ requestId: 'abc-123' });
requestLogger.info('Processing'); // includes requestId in every log
```

In production the logger dual-emits: JSON lines on stdout (`kubectl logs`
keeps working) and OTLP to the collector (→ Loki → Grafana).

### Traces — `TracerPort`

```typescript
const tracer = createTracer({ namespace: 'myapp' });

await tracer.span(
    'articles.fetch', // emitted as 'myapp.articles.fetch'
    async () => fetchArticles(),
    { attributes: { source: 'worldnews' } },
);

tracer.event('cache.miss', { key: 'articles' }); // on the active span
tracer.setAttribute('user.id', 42); // on the active span
```

Spans record timing and status, capture thrown errors (then rethrow), and
nest automatically alongside HTTP/DB auto-instrumentation.

### Metrics — `MetricsPort`

```typescript
const metrics = createMetrics<AppMetrics>({ namespace: 'myapp' });

metrics.counter('task.started', { attributes: { task: 'pipeline' } });
metrics.histogram('task.duration', 125, { attributes: { task: 'pipeline' } });
metrics.gauge('queue.depth', 7);
```

Metrics flow through OTLP to the collector, which remote-writes them to
Prometheus — no `/metrics` endpoint, no prom-client.

## Typed metric catalogue

Compose the base catalogue with app-specific metrics to get a compile-time
metrics plan (same pattern as `AnalyticsEvents` in `@jterrazz/analytics`):

```typescript
import { createMetrics, type TelemetryBaseMetrics } from '@jterrazz/telemetry';

// Use a type alias (&), not an interface — interfaces lack the implicit
// index signature required by the catalogue constraint.
type AppMetrics = TelemetryBaseMetrics & {
    'articles.processed': { source: string };
};

const metrics = createMetrics<AppMetrics>({ namespace: 'signews' });

metrics.counter('articles.processed', { attributes: { source: 'worldnews' } });
metrics.counter('articles.procesed'); // ✗ compile error
```

The base catalogue ships generic task lifecycle metrics so dashboards stay
uniform across services: `task.started`, `task.completed`, `task.failed`,
`task.duration`. The domain is never part of the metric name — the
`namespace` option prefixes it at emission (`signews.task.started`).

## Conventions (OpenTelemetry-aligned)

- Metric and span names: lowercase `dot.case`, low cardinality
  (`pipeline.run`, `articles.processed`).
- High-cardinality detail (ids, urls) goes in attributes, never in names.
- Service identity comes from `OTEL_SERVICE_NAME` / `OTEL_RESOURCE_ATTRIBUTES`
  (semconv resource attributes), injected by the infrastructure.

## Environment reference

| Variable                      | Effect                                          |
| ----------------------------- | ----------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Collector endpoint; absent = export disabled    |
| `OTEL_SERVICE_NAME`           | Service identity on every signal                |
| `OTEL_RESOURCE_ATTRIBUTES`    | Extra resource attrs (`deployment.environment`) |
| `OTEL_EXPORTER_OTLP_HEADERS`  | `Key=Value,Key2=Value2` auth headers            |
| `OTEL_SDK_DISABLED=true`      | Hard kill switch                                |

## Adapters

Every pillar follows ports & adapters. The factories cover the common path;
adapters are exported for custom wiring:

| Pillar  | Adapters                                                                             |
| ------- | ------------------------------------------------------------------------------------ |
| Logs    | `PinoLoggerAdapter`, `PrettyLoggerAdapter`, `OtelLoggerAdapter`, `NoopLoggerAdapter` |
| Traces  | `OtelTracerAdapter`, `NoopTracerAdapter`                                             |
| Metrics | `OtelMetricsAdapter`, `NoopMetricsAdapter`                                           |

The OTel adapters use only `@opentelemetry/api`: they are safe no-ops until
`@jterrazz/telemetry/register` initializes the SDK, so tests and local runs
need no special casing.

## Migrating from @jterrazz/logger

`LoggerPort`, `LoggerLevel`, `PinoLoggerAdapter` and `NoopLoggerAdapter` are
source-compatible — change the import:

```diff
-import { type LoggerPort, PinoLoggerAdapter } from '@jterrazz/logger';
+import { type LoggerPort, PinoLoggerAdapter } from '@jterrazz/telemetry';
```

`PinoLoggerAdapter` no longer takes `prettyPrint` — use `createLogger()` or
`PrettyLoggerAdapter` for development output.

## License

MIT
