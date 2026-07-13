---
name: jterrazz-telemetry
description: Use when adding or configuring observability — logging, tracing, or metrics. Covers structured logs (pino + OTLP dual-emit), spans, typed metric catalogues, and the OpenTelemetry SDK setup via @jterrazz/telemetry.
---

# @jterrazz/telemetry

Part of the @jterrazz ecosystem. Defines how all projects log, trace and
measure. Replaces `@jterrazz/logger` and `@jterrazz/monitor` (both deprecated).

## Setup

1. `npm install @jterrazz/telemetry`
2. Start the app with the SDK loaded first:
    ```bash
    node --import @jterrazz/telemetry/register dist/index.js
    ```
3. Nothing else. Config comes from `OTEL_*` env vars, injected by the K8s app
   chart (`OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
   `OTEL_RESOURCE_ATTRIBUTES`). No endpoint = silent no-op (stdout logs only).

## Factories (the common path)

```typescript
import { createLogger, createMetrics, createTracer } from '@jterrazz/telemetry';

const logger = createLogger(); // pretty in dev, pino JSON + OTLP in prod
const tracer = createTracer({ namespace: 'myapp' });
const metrics = createMetrics<AppMetrics>({ namespace: 'myapp' });
```

Inject the ports (`LoggerPort`, `TracerPort`, `MetricsPort`) in application
code, never the adapters.

## Ports

```typescript
interface LoggerPort {
    child: (bindings: Record<string, unknown>) => LoggerPort;
    debug/info/warn/error: (message: string, meta?: Record<string, unknown>) => void;
}

interface TracerPort {
    span: <T>(name: string, fn: () => Promise<T>, options?: { attributes? }) => Promise<T>;
    event: (name: string, attributes?) => void; // on active span
    setAttribute: (key: string, value) => void; // on active span
}

interface MetricsPort<TMetrics> {
    counter: (name, options?: { attributes?; value? }) => void;
    histogram: (name, value: number, options?: { attributes? }) => void;
    gauge: (name, value: number, options?: { attributes? }) => void;
}
```

## Typed metric catalogue

```typescript
import type { TelemetryBaseMetrics } from '@jterrazz/telemetry';

// MUST be a type alias (&), not an interface (index-signature constraint)
type AppMetrics = TelemetryBaseMetrics & {
    'articles.processed': { source: string };
};

const metrics = createMetrics<AppMetrics>({ namespace: 'signews' });
metrics.counter('articles.processed', { attributes: { source: 'worldnews' } });
```

Base catalogue (uniform dashboards across services): `task.started`,
`task.completed`, `task.failed`, `task.duration` — all take `{ task }`.

## Conventions

- Names: lowercase `dot.case`, low cardinality (`pipeline.run`). Ids/urls go
  in attributes, never in names.
- Domain is NOT in the name — set it once via `namespace`; emission becomes
  `{namespace}.{name}` (e.g. `signews.task.started`).
- Signals land in Grafana: logs → Loki, traces → Tempo, metrics → Prometheus
  (via the cluster otel-collector; no /metrics endpoint needed).

## Testing

Noop adapters for every pillar: `NoopLoggerAdapter`, `NoopTracerAdapter`,
`NoopMetricsAdapter`. The OTel adapters are themselves no-ops until the SDK
is registered, so unit tests need no mocking.

## Migrating from @jterrazz/logger

`LoggerPort`, `LoggerLevel`, `PinoLoggerAdapter`, `NoopLoggerAdapter`: change
the import to `@jterrazz/telemetry`. `prettyPrint` option is gone — use
`createLogger()` (auto) or `PrettyLoggerAdapter` (explicit).
