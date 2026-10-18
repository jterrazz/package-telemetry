# The @jterrazz/telemetry manual

Logs, traces and metrics for a Node.js service, over OpenTelemetry and behind ports. What the package is and how a service starts using it is the repository's README; this page lists every page of the manual, by what the reader came to do.

## Guides

| Page                                                           | Answers                                                                                      |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [Develop](guides/develop.md)                                   | Changing the package: the declaration, the gestures, where a new file goes, what it owes     |
| [Test](guides/test.md)                                         | Proving a change: the specs that install the tarball, the collector they read, the mutations |
| [Release](guides/release.md)                                   | How the package is published, and who cuts a release                                         |
| [Migrate from @jterrazz/logger](guides/migrate-from-logger.md) | Moving a service off the absorbed logger package                                             |

## Concepts

| Page                                     | Answers                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Architecture](concepts/architecture.md) | The layers (ports, adapters, factories, the register entry), the exports, the typed catalogue |

## Reference

| Page                              | Answers                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| [Adapters](reference/adapters.md) | Every adapter behind each port, the naming conventions, the environment variables it reads |

## Decisions

The records of decisions this package alone took are in [`decisions/`](decisions/), numbered in the order they were taken, the mold `_template.md` beside them. A decision spanning several repositories is recorded by the corpus that spans them.
