# Architecture

One package holds the three observability pillars — logs, traces, metrics —
behind ports & adapters, so application code depends on an interface it
owns and never on OpenTelemetry directly.

## The layers

| Layer        | Holds                                                                                                                                                                         | Reached by                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `ports/`     | `LoggerPort`, `TracerPort`, `MetricsPort` — the interfaces application code depends on (`src/ports/logger.port.ts`, `tracer.port.ts`, `metrics.port.ts`, `telemetry.port.ts`) | application code, by type import                     |
| `adapters/`  | one concrete implementation per port per backend — Pino, pretty-printed, OTel, noop                                                                                           | the factories, and direct import for custom wiring   |
| `factories/` | `createLogger`, `createTracer`, `createMetrics` — the common path, choosing an adapter from options and the environment (`src/factories/`)                                    | `import { createLogger } from '@jterrazz/telemetry'` |
| `register/`  | the OpenTelemetry SDK bootstrap (`src/register/initialize.ts`), loaded once before the application                                                                            | `node --import @jterrazz/telemetry/register`         |

`src/index.ts` re-exports every port, adapter and factory as one barrel; the
bootstrap is a separate entry so that loading it does not pull the SDK into
a process that only needs the ports.

## The exports map

```json
{
    ".": { "require": "./dist/index.cjs", "import": "./dist/index.js" },
    "./register": { "import": "./dist/register.js" }
}
```

`./register` is ESM-only (`package.json`): `register/initialize.ts` uses a
top-level `await import(...)` for the auto-instrumentation package, and
`--import` itself only loads ESM. `tsdown.config.ts` builds it as a second,
non-cleaning entry alongside the CJS+ESM barrel.

## The OTel bootstrap is opt-in and idempotent

`registerTelemetry()` (`src/register/initialize.ts`) reads `OTEL_*`
environment variables and does nothing beyond logging to stdout unless
`OTEL_EXPORTER_OTLP_ENDPOINT` is set and `OTEL_SDK_DISABLED` is not `true`.
When it does run, it sets a global `LoggerProvider` and `MeterProvider`
explicitly — relying on the auto-instrumentation SDK alone leaves
`getMeter()` on the global no-op — then imports
`@opentelemetry/auto-instrumentations-node/register` for trace
auto-instrumentation. A second call is a no-op (`initialized` guard): the
function is safe to load from more than one entry point.

Until `registerTelemetry()` has run, every OTel-backed adapter
(`OtelLoggerAdapter`, `OtelTracerAdapter`, `OtelMetricsAdapter`) is itself a
safe no-op, because they only ever call `@opentelemetry/api`, which returns
no-op implementations before a provider is registered. That is what lets
`createTracer()` and `createMetrics()` return a real port with no branch for
"is telemetry configured" — the answer is decided once, at the SDK layer.

## The typed metric catalogue

`MetricsPort<TMetrics>` (`src/ports/metrics.port.ts`) is generic over a
catalogue — a `Record<string, TelemetryAttributes>` mapping a metric name to
its attribute shape. `TelemetryBaseMetrics` ships the generic task-lifecycle
names every service emits (`task.started`, `task.completed`, `task.failed`,
`task.duration`); a consumer composes its own names on top with a type
alias:

```typescript
type AppMetrics = TelemetryBaseMetrics & {
    'articles.processed': { source: string };
};

const metrics = createMetrics<AppMetrics>({ namespace: 'signews' });
```

An interface does not satisfy the catalogue constraint — it lacks the
implicit index signature `Record<string, TelemetryAttributes>` requires —
so the catalogue must be a type alias (`&`), never an `interface`. This is
enforced by the type system, not by a lint rule: a wrong name or a wrong
attribute shape is a compile error at the call site.

## Related

- [Developing](02-developing.md) — the toolchain this package builds and lints with.
- [Adapters](05-adapters.md) — the concrete adapters behind each port, and the environment variables that select them.
