# Developing

`@jterrazz/typescript` supplies the whole toolchain — build, lint, format,
type-check, unused-code — from one devDependency, wired through this
package's own config files.

## Setup

```bash
npm install
```

Nothing tool-shaped is installed beside it: `tsdown`, oxlint, oxfmt, knip
and the two compilers all arrive with `@jterrazz/typescript`, so no version
of the toolchain is pinned twice. `tsdown` — configured through that
package's bundle preset — compiles `src/` into `dist/`.

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

`make build` precedes `make lint` on a fresh checkout: `typescript check`'s
Publish (packaging) pass reads `dist/`, absent until the build has run once.

## Configuration

Every tool config names a preset from `@jterrazz/typescript` or
`@jterrazz/test` and stops there — nothing is configured twice.

The profile is `library`: the one a package published to a registry names,
and the one whose tsconfig turns on `isolatedDeclarations` and
`erasableSyntaxOnly`. Every public export therefore states its own type, and
no enum, namespace or parameter property survives into the declarations.

- `tsconfig.json` extends `@jterrazz/typescript/tsconfig/library`, and
  carries nothing else — a local `compilerOption` would settle for this
  package alone what the preset owes every package.
- `oxlint.config.ts` is `defineConfig(compose(library, testing))`, typed as
  `OxlintConfig` because `isolatedDeclarations` refuses an inferred default
  export — `library` is this package's profile, `testing` is
  `@jterrazz/test`'s fragment for the conventions every suite of the estate
  answers to.
- `oxfmt.config.ts` is `defineConfig(base)`, typed the same way.
- `vitest.config.ts` is `defineSpecConfig({ test: { projects: [unit()] } })`
  from `@jterrazz/test/vitest` — the one project this package needs, since
  every suite is a module test beside its module and none reaches a
  service or a browser.
- `tsdown.config.js` spreads the `bundle` preset across two entries: the
  barrel (`src/index.ts`, CJS + ESM) and `src/register.ts` (ESM-only,
  `clean: false` so it does not wipe the barrel's output). It is JavaScript
  because the preset it spreads ships as JavaScript with no declarations,
  which `library`'s compiler settings refuse to import from a `.ts` file.
- `knip.json` carries the two facts knip cannot derive: `src/register.ts` is
  a second published entry point, and `tsdown` is the toolchain's binary
  rather than this package's. Each entry states its reason in the file.

## The lint baseline

`oxlint.baseline.json` records the diagnostics this package carried the day
it adopted the v10 rulebook — 43 across 12 rules. From then on the count may
only fall: a rule going up, a rule nobody recorded, or an entry that has
reached zero all fail `make lint`. Nothing is recorded that a code change
could have settled instead, so what remains is design the rulebook argues
with — the no-op adapters' stateless methods, the console the pretty logger
and the OTel bootstrap write to, the barrel every published package needs.

## The artefact convention

`.gitignore` ignores `.artifacts/` for every tool's build/test/lint output,
plus `dist` (the published product, not an artefact) and `node_modules`.
`typescript check`'s Gitignore pass holds this convention — see
`@jterrazz/typescript`'s own
[Quality checks](https://github.com/jterrazz/package-typescript/blob/main/docs/06-quality-checks.md).

## Where a new file goes

| Adding…                            | Goes in                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| a new port                         | `src/ports/<name>.port.ts`                                                                           |
| a new adapter for an existing port | `src/adapters/<pillar>/<tool>-<pillar>.adapter.ts`, plus a sibling `<tool>-<pillar>.adapter.test.ts` |
| a new factory                      | `src/factories/create-<pillar>.ts`                                                                   |
| a public re-export                 | `src/index.ts` (barrel) — never a new subpath without also declaring it in `package.json#exports`    |

Every export new or changed reaches the root `README.md` and the
`skills/jterrazz-telemetry/` skill in the same change: neither is generated,
so nothing catches a stale one.

## Related

- [Architecture](01-architecture.md) — the layers these files implement.
- [Testing](03-testing.md) — how a change to one of them is proven.
