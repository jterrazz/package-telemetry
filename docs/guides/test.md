# Test

What proves a change here is a specification of what a consumer meets: the package installed from the tarball `npm pack` writes, driven from a consumer's project by `node`. There is no module test today.

```bash
make test       # builds, then runs every spec
make mutation   # the zero-survivor verdict over the change
```

## The specs

`specs/cli/` holds one runner, `cli.specification.ts`, which runs `node` with a production environment, a service name and none of the developer's `OTEL_*` variables. Its specs sit in `specs/cli/node/`, and each lays the consumer project of `__fixtures__/consumer/` in a fresh working directory, then installs the packed package beside the packages its `dependencies` name (`__setup__/packed.ts`) — never the checkout's whole install, so a file `files` leaves out or an import the manifest does not declare fails here as it would for a consumer.

| Spec                   | Proves                                                                                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subpaths.spec.ts`     | the ESM and CommonJS builds name the same API; the register entry loads, and starts once however often it is called                                                                                                                                         |
| `declarations.spec.ts` | a consumer typed by a metric catalogue compiles against the shipped `.d.ts`, and an undeclared metric or attribute is refused                                                                                                                               |
| `logs.spec.ts`         | JSON lines in production, colored lines outside it, every value written by its type, errors on stderr; a logger built at `warn` drops what lies below, one built `silent` writes nothing; `LoggerLevelSchema` accepts the five levels and refuses any other |
| `register.spec.ts`     | export off with no endpoint and under the kill switch; with a collector, every signal arriving as a dashboard reads it, and `otlp: false` keeping a logger off it                                                                                           |
| `defaults.spec.ts`     | with no service or deployment named, which defaults each signal carries — the package's on logs and metrics, OpenTelemetry's on traces                                                                                                                      |
| `noop.spec.ts`         | the null objects record nothing, and a span still answers its function                                                                                                                                                                                      |

The specs pack `dist/`, never `src/`: `make test` builds first, but `npx vitest`, or one spec run on its own, straight after an edit tests the previous build — run `make build` before it.

## The collector

`register.spec.ts` and `defaults.spec.ts` start an OTLP/HTTP collector (`__setup__/collector.ts`) on a free local port inside the test, hand its URL to the consumer as `OTEL_EXPORTER_OTLP_ENDPOINT`, and compare what it received, reduced to what a dashboard reads: the log records with their severity and flattened attributes, the namespaced metrics and their points under their meter, the spans with their status and events under their tracer, the headers, and each signal's resource — its service name and deployment, and whether the host and process detectors ran. The run waits for the consumer's `flushed` with `waitFor`, which spawns it asynchronously: a one-shot `exec` blocks the test's event loop, and the collector could not answer. The consumer flushes the providers itself before it prints `flushed`: the register entry sets no exit hook, so a process ending sooner keeps what its batches still hold.

Both specs set two variables that are OpenTelemetry's, not the package's: `OTEL_EXPORTER_OTLP_PROTOCOL=http/json`, since the collector reads JSON and the trace exporter defaults to protobuf, and `OTEL_NODE_ENABLED_INSTRUMENTATIONS=http`, which keeps the runtime metrics out of the payload.

## Re-recording a golden

A golden — a value in place or a file under `__expected__/` — is rewritten from the actual output by `TEST_UPDATE=1 npx vitest run <spec>` (after `make build`). Update mode writes every value literally, so a re-record leaves volatile values pinned: put the tokens back by hand before committing — pino's `time` and `pid` as `{{int}}` and its `hostname` as `{{string}}`, the collector's port as `{{port}}`, the pretty logger's clock as `[{{time}}]`. Read the diff: the re-record is the new claim, and every changed line in it is a behaviour that changed.

## What earns a test

A behaviour a consumer relies on is specified through the packed package. A module test is kept only for a pure algorithm whose edges are cheaper at its own level, or for a failure no consumer's run can provoke honestly; none of the modules here is either, so the nine module tests the package once had were promoted to the specs above or deleted.

## Mutation

`make mutation` runs `typescript mutation`: Stryker mutates the lines a change touched that no module test runs, rebuilds, and runs every spec against each mutant — the packed tarball carries the mutant, and every `node` a spec spawns reports which mutants it ran. A mutant that a test runs and none detects fails the gate. Measure a whole branch with `npx typescript mutation --since <commit>`, or every line of the sources with `--mutate`, its ranges comma-separated:

```bash
npx typescript mutation --mutate "$(ls src/*.ts src/*/*.ts src/*/*/*.ts | sed 's/$/:1-400/' | paste -sd, -)"
```

That command covers every source, the ports' runtime `LoggerLevelSchema` and the entry points included, and every mutant it makes is detected; the few no consumer can tell apart from the code — the log batch's timing, the exporter defaults register sets before auto-instrumentation loads — are declared where they stand, with their reason.

## Related

- [Develop](develop.md) — the gestures, and where a new file goes.
- [Architecture](../concepts/architecture.md) — the no-op-until-registered design the specs rely on.
