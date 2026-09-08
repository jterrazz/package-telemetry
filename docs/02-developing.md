# Developing

`@jterrazz/typescript` supplies the whole toolchain — build, lint, format,
type-check, unused-code — from one devDependency, wired through this
package's own config files.

## Setup

```bash
npm install
```

No native build tool beyond that: `tsdown` (pulled in as a direct
devDependency, configured through `@jterrazz/typescript`'s bundle preset)
compiles `src/` into `dist/`.

## Commands

| Task                                               | Command        | Runs                                  |
| -------------------------------------------------- | -------------- | ------------------------------------- |
| Install                                            | `make install` | `npm ci`                              |
| Build                                              | `make build`   | `npm run build` → `tsdown`            |
| Lint, format, type-check, unused-code, docs layout | `make lint`    | `npm run lint` → `typescript check`   |
| Auto-fix                                           | —              | `npm run lint:fix` → `typescript fix` |
| Test                                               | `make test`    | `npm test` → `vitest --run`           |

The `Makefile` targets all depend on a `node_modules/.install` marker keyed
on `package-lock.json`, so `make build`, `make lint` and `make test` each
run `npm ci` once if the lockfile changed since the last install.

## Configuration

Every tool config is a thin `extends`/`compose` over `@jterrazz/typescript`'s
presets — nothing is configured twice:

- `tsconfig.json` extends `@jterrazz/typescript/tsconfig/node`.
- `oxlint.config.ts` extends `oxlint.node`.
- `oxfmt.config.ts` uses the shared `oxfmt` preset directly.
- `tsdown.config.ts` spreads the `bundle` preset across two entries: the
  barrel (`src/index.ts`, CJS + ESM) and `src/register.ts` (ESM-only,
  `clean: false` so it does not wipe the barrel's output).

## The artefact convention

`.gitignore` ignores `.artifacts/` for every tool's build/test/lint output,
plus `dist` (the published product, not an artefact) and `node_modules`.
`typescript check`'s Gitignore pass holds this convention — see
`@jterrazz/typescript`'s own
[Quality checks](https://github.com/jterrazz/package-typescript/blob/main/docs/06-quality-checks.md).

## Where a new file goes

| Adding…                            | Goes in                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| a new port                         | `src/ports/<name>.port.ts`                                                                        |
| a new adapter for an existing port | `src/adapters/<pillar>/<tool>-<pillar>.adapter.ts`, plus a colocated `__tests__/`                 |
| a new factory                      | `src/factories/create-<pillar>.ts`                                                                |
| a public re-export                 | `src/index.ts` (barrel) — never a new subpath without also declaring it in `package.json#exports` |

Every export new or changed reaches the root `README.md` and the
`skills/jterrazz-telemetry/` skill in the same change: neither is generated,
so nothing catches a stale one.

## Related

- [Architecture](01-architecture.md) — the layers these files implement.
- [Testing](03-testing.md) — how a change to one of them is proven.
