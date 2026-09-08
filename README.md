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
variables — on the jterrazz K8s app chart they are injected automatically.
Without an endpoint configured, telemetry is a silent no-op: logs still reach
stdout, spans and metrics cost nothing.

## The three pillars

| Pillar  | Port          | Factory           |
| ------- | ------------- | ----------------- |
| Logs    | `LoggerPort`  | `createLogger()`  |
| Traces  | `TracerPort`  | `createTracer()`  |
| Metrics | `MetricsPort` | `createMetrics()` |

In production the logger dual-emits: JSON lines on stdout (`kubectl logs`
keeps working) and OTLP to the collector (→ Loki → Grafana). Traces nest
automatically alongside HTTP/DB auto-instrumentation. Metrics flow through
OTLP to the collector, which remote-writes them to Prometheus — no
`/metrics` endpoint, no prom-client.

## Documentation

The full corpus lives in [`docs/`](docs/):

- [Architecture](docs/01-architecture.md) — the layers, the OTel bootstrap, the typed metric catalogue.
- [Developing](docs/02-developing.md) — the toolchain, and where a new file goes.
- [Testing](docs/03-testing.md) — the suites, and what the no-op design buys them.
- [Operating](docs/04-operating.md) — the release, and who is allowed to cut one.
- [Adapters](docs/05-adapters.md) — the concrete adapters, the environment variables, the `@jterrazz/logger` migration.

For agents: read the chapters straight from the repo, plus the
[`skills/jterrazz-telemetry`](skills/jterrazz-telemetry/SKILL.md) Claude Code skill.

## License

MIT
