# Develop

How a change to this package is made: the declaration every config follows, the gestures, where a new file goes, and what a change owes. What the package is made of is [Architecture](../concepts/architecture.md).

## The declaration

`@jterrazz/typescript` supplies the whole toolchain (build, type-check, lint, format, unused code, mutation) from one devDependency, and `jterrazz.config.ts` says what this package is: a `library` on `node`, held to `@jterrazz/test`'s preset. Every other config follows from that line:

- `oxlint.config.ts`, `oxfmt.config.ts`, `tsconfig.json` and `vitest.config.ts` are the one-line derivations `typescript fix` writes and `typescript check` refuses to see edited;
- knip, the build and Stryker are configured by the commands that run them, from the declaration and the manifest: no `knip.json`, no `tsdown.config.*`;
- the published entries are read off `package.json#exports`: `.` from `src/index.ts`, `./register` from `src/index.register.ts` ([Architecture](../concepts/architecture.md#the-exports-map)).

The declaration holds no override: the no-op adapters (`noop-<port>.adapter.ts`) are null objects a consumer hands its tests, and the standard's rulebook already lets them answer by doing nothing.

## The gestures

| Gesture         | Runs                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| `make install`  | `npm ci`, once per change of the lockfile                                                                   |
| `make build`    | `typescript build`: the entries the manifest publishes, into `dist/`                                        |
| `make lint`     | `typescript check`: every pass, after a build, since the Publish (packaging) pass reads `dist/`             |
| `make fix`      | `typescript fix`: the derived files, the formatter, the fixable findings                                    |
| `make test`     | the specs, after a build, since they install the tarball `npm pack` writes from `dist/` ([Test](test.md))   |
| `make mutation` | `typescript mutation`: the zero-survivor verdict over the lines a change touches ([Test](test.md#mutation)) |
| `make check`    | `make lint`, `make test`, then `make mutation`: the gate before a commit                                    |

Build, test and lint output lands under `.artifacts/`, which `.gitignore` ignores whole; `dist/` is the published product, not an artefact.

## Where a new file goes

| Adding                             | Goes in                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| a new port                         | `src/ports/<name>.port.ts`                                                                                 |
| a new adapter for an existing port | `src/adapters/<pillar>/<tool>-<pillar>.adapter.ts`                                                         |
| a new factory                      | `src/factories/create-<pillar>.ts`                                                                         |
| a public re-export                 | `src/index.ts`; a new subpath also needs its `package.json#exports` entry and its `src/index.<subpath>.ts` |
| a behaviour a consumer relies on   | a spec under `specs/cli/node/`, driving the packed package from a consumer's project ([Test](test.md))     |
| a module test                      | `<folder>/__tests__/<module>.test.ts`, kept only on the criteria [Test](test.md#what-earns-a-test) names   |

## What a change owes

A new or changed export reaches the root `README.md`, the page of this manual that owns it and the `skills/jterrazz-telemetry/` skill in the same change: none of the three is generated, so nothing catches a stale one. A comment states the kind of thing the code cannot say (`invariant:`, `hazard:`, `outside:`, `value:`) or is not written; a public symbol keeps a one-line hover.

## Related

- [Architecture](../concepts/architecture.md): the layers these files implement.
- [Test](test.md): how a change to one of them is proven.
