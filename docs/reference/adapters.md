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

`registerTelemetry()` (`src/register/initialize.ts`) reads these itself:

| Variable                      | Effect                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `OTEL_SDK_DISABLED=true`      | Hard kill switch — skips registration entirely                                           |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Collector endpoint; absent or empty = every export disabled                              |
| `OTEL_SERVICE_NAME`           | `service.name` on the logs and metrics resource (default `unknown-service`)              |
| `OTEL_RESOURCE_ATTRIBUTES`    | `deployment.environment` is parsed out of it for the logs and metrics resource           |
| `NODE_ENV`                    | The `deployment.environment` fallback when the attributes name none (then `development`) |

OpenTelemetry's exporters and SDK read the rest themselves, among them
`OTEL_EXPORTER_OTLP_HEADERS` (`Key=Value,Key2=Value2`, each value
URL-encoded), the per-signal `OTEL_EXPORTER_OTLP_{LOGS,METRICS,TRACES}_ENDPOINT`,
`_HEADERS` and `_TIMEOUT`, `OTEL_EXPORTER_OTLP_PROTOCOL`, and — for traces —
`OTEL_SERVICE_NAME` and `OTEL_RESOURCE_ATTRIBUTES` again.

Before it imports auto-instrumentation, `registerTelemetry()` sets four
defaults, each kept when the environment already sets it:

| Variable                       | Default       | What it does                                                                        |
| ------------------------------ | ------------- | ----------------------------------------------------------------------------------- |
| `OTEL_TRACES_EXPORTER`         | `otlp`        | auto-instrumentation exports its spans over OTLP                                    |
| `OTEL_METRICS_EXPORTER`        | `none`        | its own SDK registers no metrics pipeline: the `MeterProvider` registered here does |
| `OTEL_LOGS_EXPORTER`           | `none`        | its own SDK registers no logs pipeline: the `LoggerProvider` registered here does   |
| `OTEL_NODE_RESOURCE_DETECTORS` | `env,host,os` | the trace resource carries the host and OS, never the process's command line        |

The `unknown-service` default applies where the package names things itself:
the scope of every logger, meter and tracer the factories create, and the
logs and metrics resource. Traces take their resource from
auto-instrumentation's SDK, which follows OpenTelemetry's defaults: with no
`OTEL_SERVICE_NAME` their `service.name` is `unknown_service:<argv0>`
(`unknown_service:node`), and with no `deployment.environment` in
`OTEL_RESOURCE_ATTRIBUTES` they carry no deployment — `NODE_ENV` is not read
for them (`specs/cli/node/defaults.spec.ts`). The app chart sets both
variables, so a deployed service's signals agree.

Signals land in Grafana: logs and traces flow to Loki and Tempo through the
cluster's otel-collector; metrics are remote-written to Prometheus — there
is no `/metrics` endpoint to scrape.

## Related

- [Architecture](../concepts/architecture.md) — the ports these adapters implement, and why the OTel ones need no "is telemetry on" branch.
- [Develop](../guides/develop.md) — where a new adapter goes.
- [Migrate from @jterrazz/logger](../guides/migrate-from-logger.md) — the logger names this package kept.
