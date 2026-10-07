# @jterrazz/telemetry — the corpus

The manual of this repository: what the package is, and how it is changed.
The vitrine is the root `README.md`.

| Page                                     | Holds                                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Architecture](concepts/architecture.md) | The layers — ports, adapters, factories — the OTel bootstrap, the exports map, the typed metric catalogue              |
| [Develop](guides/develop.md)             | The toolchain, the build, the gates, where a new adapter goes                                                          |
| [Test](guides/test.md)                   | What proves a change: the vitest suites, what the noop adapters buy                                                    |
| [Release](guides/release.md)             | How this package is released — the workflows, the gesture that publishes                                               |
| [Adapters](reference/adapters.md)        | The three pillars' concrete adapters, the environment variables that drive them, the migration from `@jterrazz/logger` |

The decisions this repository took alone stand in [decisions/](decisions/),
numbered and chronological, the mold `_template.md` beside them.
