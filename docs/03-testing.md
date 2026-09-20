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

## Why the OTel adapters need no mocking

`OtelLoggerAdapter`, `OtelTracerAdapter` and `OtelMetricsAdapter` call only
`@opentelemetry/api`, which resolves to a safe no-op provider until
`registerTelemetry()` runs ([Architecture](01-architecture.md)). Nothing in
this package's own suites registers the SDK, so every OTel-backed test
exercises the real adapter code against the real API's no-op path — no
provider double, no network stub.

## The self-lint

`npm run lint` is `typescript check`, which type-checks, lints, format-checks
and runs the unused-code and docs-layout gates on this repository — a change
that passes `npm test` but not `npm run lint` is not finished.

## Related

- [Developing](02-developing.md) — the commands, and where a new file goes.
- [Architecture](01-architecture.md) — the no-op-until-registered design this suite relies on.
