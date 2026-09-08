# Operating

This repository ships one thing: the npm package `@jterrazz/telemetry`,
published to the public registry. There is no service, no image and no
infrastructure of its own — what "operating" means here is the release, and
who is allowed to cut one.

## What a merge to `main` does

Nothing that reaches a consumer. `.github/workflows/validate.yaml` runs on
every push and pull request to `main` and calls the shared `jterrazz-actions`
validation workflow — install, lint, test. A green `main` is a publishable
tree, not a published one.

## What publishes

`.github/workflows/release.yaml` fires on `release: created` and calls the
shared `release-npm.yaml` workflow with npm provenance (`id-token: write`).
Exactly one gesture publishes, and a human makes it: cutting a GitHub
Release.

The sequence, in order:

1. the change merges to `main` and validates green;
2. `version` in `package.json` (and the lockfile) is bumped on `main`;
3. the owner tags `vX.Y.Z` and creates the GitHub Release;
4. the workflow publishes to npm, with provenance.

Steps 2 to 4 are the owner's. A contributor never bumps the version inside a
feature branch: two branches in flight would both claim the same number, and
the tag is what the registry answers to.

## Related

- [Testing](03-testing.md) — what `validate.yaml` runs.
- [Developing](02-developing.md) — the gates a merge must pass.
