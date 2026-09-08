# Testing

What proves a change here is a colocated vitest suite, one `__tests__/`
folder per adapter or factory directory — there is no `specs/` product suite
in this repository today.

```bash
npm test   # vitest --run
```

## What is covered

Six suites, each beside the code it proves:

| Suite                                                         | Proves                                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/adapters/logger/__tests__/pino-logger.adapter.test.ts`   | structured JSON output, level, message, meta                                                            |
| `src/adapters/logger/__tests__/pretty-logger.adapter.test.ts` | the colored development format                                                                          |
| `src/adapters/logger/__tests__/otel-logger.adapter.test.ts`   | dual-emit to the wrapped logger and to OTLP                                                             |
| `src/adapters/tracer/__tests__/otel-tracer.adapter.test.ts`   | span lifecycle, attributes, error capture                                                               |
| `src/adapters/metrics/__tests__/otel-metrics.adapter.test.ts` | counter/histogram/gauge/observableGauge recording                                                       |
| `src/factories/__tests__/factories.test.ts`                   | `createLogger`/`createTracer`/`createMetrics` pick the right adapter from options and `OTEL_*` env vars |

The `NoopLoggerAdapter`, `NoopTracerAdapter` and `NoopMetricsAdapter` carry
no test of their own — each is a fixed no-op return, with nothing to prove
beyond what the type checker already holds.

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
