# Testing

What proves a change here is a module test beside the module it covers —
`<file>.test.ts` next to `<file>.ts`, never a `__tests__/` folder (rule I2)
— collected by the single `unit()` project `vitest.config.ts` declares.
There is no `specs/` product suite in this repository today.

```bash
npm test   # vitest --run
```

## What is covered

Nine suites, each beside the code it proves:

| Suite                                               | Proves                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/adapters/logger/pino-logger.adapter.test.ts`   | structured JSON output, level, message, meta                                    |
| `src/adapters/logger/pretty-logger.adapter.test.ts` | the colored development format                                                  |
| `src/adapters/logger/otel-logger.adapter.test.ts`   | dual-emit to the wrapped logger and to OTLP                                     |
| `src/adapters/logger/noop-logger.adapter.test.ts`   | every call is a safe no-op                                                      |
| `src/adapters/tracer/otel-tracer.adapter.test.ts`   | span lifecycle, attributes, error capture                                       |
| `src/adapters/metrics/otel-metrics.adapter.test.ts` | counter/histogram/gauge/observableGauge recording                               |
| `src/factories/create-logger.test.ts`               | `createLogger` picks the right adapter from options and `OTEL_*` env vars       |
| `src/factories/create-tracer.test.ts`               | `createTracer` returns the OTel-backed tracer                                   |
| `src/factories/create-metrics.test.ts`              | `createMetrics` returns the OTel-backed recorder, and accepts a typed catalogue |

`NoopTracerAdapter` and `NoopMetricsAdapter` carry no test of their own —
each is a fixed no-op return, with nothing to prove beyond what the type
checker already holds. `NoopLoggerAdapter` is the exception: `child()`
returns `this` rather than a fixed value, which is worth one test.

## What the OTel suites stand on

`OtelLoggerAdapter`, `OtelTracerAdapter` and `OtelMetricsAdapter` call only
`@opentelemetry/api`, which resolves to a safe no-op provider until
`registerTelemetry()` runs ([Architecture](01-architecture.md)). No suite here
starts the SDK, so no exporter, no collector and no network stub appears in
any of them, and each of the three keeps one test on the unregistered path —
the one production runs until `registerTelemetry()` is called.

Two of the three need a provider to observe what they did. The logger's suite
reads the wrapped logger it was handed, but a span and an instrument are only
reachable through the provider that made them, so
`otel-tracer.adapter.test.ts` and `otel-metrics.adapter.test.ts` register a
fake one on the global API — `trace.setGlobalTracerProvider`,
`metrics.setGlobalMeterProvider`. That global is process-wide state, and the
registering function gives it back itself: it returns a `Symbol.dispose`, each
test declares it with `using`, and the provider is disabled where it was
registered rather than in a hook the reader has to scroll up to find.

## The self-lint

`npm run lint` is `typescript check`, which type-checks, lints, format-checks
and runs the unused-code and docs-layout gates on this repository — a change
that passes `npm test` but not `npm run lint` is not finished.

## Related

- [Developing](02-developing.md) — the commands, and where a new file goes.
- [Architecture](01-architecture.md) — the no-op-until-registered design this suite relies on.
