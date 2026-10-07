# Adapters

Every port has one adapter per backend. The factories cover the common
path; every adapter is also exported for custom wiring.

| Pillar  | Adapters                                                                             |
| ------- | ------------------------------------------------------------------------------------ |
| Logs    | `PinoLoggerAdapter`, `PrettyLoggerAdapter`, `OtelLoggerAdapter`, `NoopLoggerAdapter` |
| Traces  | `OtelTracerAdapter`, `NoopTracerAdapter`                                             |
| Metrics | `OtelMetricsAdapter`, `NoopMetricsAdapter`                                           |

`createLogger()` picks `PrettyLoggerAdapter` or `PinoLoggerAdapter` from
`options.pretty` (default: `NODE_ENV !== 'production'`), then wraps it in
`OtelLoggerAdapter` when `options.otlp` or an OTLP endpoint is configured
(`src/factories/create-logger.ts`). `createTracer()` and `createMetrics()`
always return the OTel-backed adapter — the no-op behaviour comes from the
API layer itself, not from a factory branch
([Architecture](../concepts/architecture.md)).

## Naming conventions

Metric and span names are lowercase `dot.case`, low cardinality
(`pipeline.run`, `articles.processed`). High-cardinality detail — ids, urls —
goes in attributes, never in names. The application domain is never part of
a name: it is injected once through the `namespace` option and prefixed at
emission (`{namespace}.{name}`, e.g. `signews.task.started`). Service
identity itself comes from `OTEL_SERVICE_NAME` / `OTEL_RESOURCE_ATTRIBUTES`
(OpenTelemetry semantic-convention resource attributes), injected by the
infrastructure rather than passed by the application.

## Environment variables

`registerTelemetry()` (`src/register/initialize.ts`) reads these, and
nothing else:

| Variable                      | Effect                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Collector endpoint; absent = every export disabled                              |
| `OTEL_SERVICE_NAME`           | Service identity on every signal (default `unknown-service`)                    |
| `OTEL_RESOURCE_ATTRIBUTES`    | Extra resource attributes; `deployment.environment` is parsed out of it         |
| `OTEL_EXPORTER_OTLP_HEADERS`  | `Key=Value,Key2=Value2` headers, each value URL-encoded, sent with every signal |
| `OTEL_SDK_DISABLED=true`      | Hard kill switch — skips registration entirely                                  |

Signals land in Grafana: logs and traces flow to Loki and Tempo through the
cluster's otel-collector; metrics are remote-written to Prometheus — there
is no `/metrics` endpoint to scrape.

## Related

- [Architecture](../concepts/architecture.md) — the ports these adapters implement, and why the OTel ones need no "is telemetry on" branch.
- [Develop](../guides/develop.md) — where a new adapter goes.
- [Migrate from @jterrazz/logger](../guides/migrate-from-logger.md) — the logger names this package kept.
