# Agent brief — `@jterrazz/telemetry`

Unified observability for Node.js — logs, traces and metrics over
OpenTelemetry, behind ports & adapters. This file **routes**; it does not
restate what the corpus already says.

## Where knowledge lives (route here first)

The corpus is `docs/` + `README.md`, mapped by `docs/README.md`. Decisions
this package alone took are in `docs/decisions/`. Do not duplicate it — link
to it.

| Working on…                                                      | Read                                 |
| ---------------------------------------------------------------- | ------------------------------------ |
| the layers, the exports, the OTel bootstrap, the typed catalogue | `docs/concepts/architecture.md`      |
| the declaration, the gestures, where a new file goes             | `docs/guides/develop.md`             |
| the specs, the collector, the mutation verdict                   | `docs/guides/test.md`                |
| the release, and who is allowed to cut one                       | `docs/guides/release.md`             |
| the adapters, the naming conventions, the env vars               | `docs/reference/adapters.md`         |
| a service still on `@jterrazz/logger`                            | `docs/guides/migrate-from-logger.md` |

The manual is cut by its reader's need — `guides/`, `concepts/`, `reference/` —
the shape every repository of the ecosystem keeps, and `typescript check`
refuses a tree that breaks it (the Docs (layout) pass).

## Setup and commands

The gestures — `make install` (`npm ci`, never a plain `npm install`, which can
rewrite the lockfile), `make build`, `make lint`, `make fix`, `make test`,
`make mutation`, `make check` — and what each runs are
[Develop § The gestures](docs/guides/develop.md#the-gestures)'s.

## Standing rule

A new or changed export reaches `README.md`, the relevant `docs/` chapter
and the `skills/jterrazz-telemetry/` skill in the same change — none of the
three is generated, so nothing else catches a stale one
([Develop § What a change owes](docs/guides/develop.md#what-a-change-owes)).

`CLAUDE.md` at the root is a symlink to this file: one brief, two names, no
second copy.
