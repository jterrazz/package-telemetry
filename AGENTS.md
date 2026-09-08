# Agent brief — `@jterrazz/telemetry`

Unified observability for Node.js — logs, traces and metrics over
OpenTelemetry, behind ports & adapters. This file **routes**; it does not
restate what the corpus already says.

## Where knowledge lives (route here first)

The corpus is `docs/` + `README.md`, mapped by `docs/README.md`. Decisions
this package alone took are in `docs/decisions/`. Do not duplicate it — link
to it.

| Working on…                                                           | Read                      |
| --------------------------------------------------------------------- | ------------------------- |
| the layers, the OTel bootstrap, the typed metric catalogue            | `docs/01-architecture.md` |
| setup, the toolchain, where a new file goes                           | `docs/02-developing.md`   |
| the suites, and what the no-op design buys for them                   | `docs/03-testing.md`      |
| the release, and who is allowed to cut one                            | `docs/04-operating.md`    |
| the concrete adapters, the env vars, the `@jterrazz/logger` migration | `docs/05-adapters.md`     |

The first four chapters are the spine every repository of the ecosystem
carries — architecture, developing, testing, operating.

## Setup

```bash
npm install
```

## Commands

| Task                                     | Command            |
| ---------------------------------------- | ------------------ |
| Build                                    | `npm run build`    |
| Lint + format + type-check + docs layout | `npm run lint`     |
| Auto-fix lint issues                     | `npm run lint:fix` |
| Run tests                                | `npm test`         |

## Standing rule

A new or changed export reaches `README.md`, the relevant `docs/` chapter
and the `skills/jterrazz-telemetry/` skill in the same change — none of the
three is generated, so nothing else catches a stale one
(`docs/02-developing.md`).

`CLAUDE.md` at the root is a symlink to this file: one brief, two names, no
second copy.
