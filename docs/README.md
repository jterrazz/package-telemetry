# @jterrazz/telemetry — the corpus

The manual of this repository: what the package is, and how it is changed.
The vitrine is the root `README.md`.

| Chapter                                  | Holds                                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [01-architecture.md](01-architecture.md) | The layers — ports, adapters, factories — the OTel bootstrap, the exports map, the typed metric catalogue              |
| [02-developing.md](02-developing.md)     | The toolchain, the build, the gates, where a new adapter goes                                                          |
| [03-testing.md](03-testing.md)           | What proves a change: the colocated vitest suites, what the noop adapters buy                                          |
| [04-operating.md](04-operating.md)       | How this package is released — the workflows, the gesture that publishes                                               |
| [05-adapters.md](05-adapters.md)         | The three pillars' concrete adapters, the environment variables that drive them, the migration from `@jterrazz/logger` |

The decisions this repository took alone stand in [decisions/](decisions/),
numbered and chronological, the mold `_template.md` beside them.
