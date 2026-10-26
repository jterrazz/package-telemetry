# @jterrazz/telemetry

Unified observability for Node.js: logs, traces and metrics over OpenTelemetry, with ports & adapters.

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
variables; on the jterrazz K8s app chart they are injected automatically.
Without an endpoint configured, the register entry prints one status line
and exports nothing: logs still reach stdout, spans and metrics cost nothing.
A short-lived process (a job, a CLI) flushes the providers itself before it
exits ([Adapters § Short-lived processes](docs/reference/adapters.md#short-lived-processes)).

## The three pillars

| Pillar  | Port          | Factory           |
| ------- | ------------- | ----------------- |
| Logs    | `LoggerPort`  | `createLogger()`  |
| Traces  | `TracerPort`  | `createTracer()`  |
| Metrics | `MetricsPort` | `createMetrics()` |

When an OTLP endpoint is configured (or `otlp: true` is passed) the logger
dual-emits: its lines on stdout (JSON in production, so `kubectl logs` keeps
working), and every line, whatever its level, over OTLP to the collector,
which hands them to Loki for Grafana; `level` filters only the stdout side. Traces nest
automatically alongside HTTP/DB auto-instrumentation. Metrics flow through
OTLP to the collector, which remote-writes them to Prometheus: no
`/metrics` endpoint, no prom-client.

## Documentation

The manual lives in [`docs/`](docs/README.md):

- [Architecture](docs/concepts/architecture.md): the layers, the OTel bootstrap, the typed metric catalogue.
- [Adapters](docs/reference/adapters.md): the concrete adapters, the naming conventions, the environment variables.
- [Migrate from @jterrazz/logger](docs/guides/migrate-from-logger.md): the logger names this package kept.
- [Develop](docs/guides/develop.md), [Test](docs/guides/test.md), [Release](docs/guides/release.md): changing, proving and publishing the package.

For agents: read the pages straight from the repo, plus the
[`skills/studio-telemetry`](skills/studio-telemetry/SKILL.md) Claude Code skill.

## License

MIT
