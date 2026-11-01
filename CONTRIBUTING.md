# Contributing to Velocita

Thanks for helping! Velocita has **zero runtime dependencies** and intends to keep it that way. Optional capabilities (like images with `sharp`) are optional peer dependencies.

## Setup

```bash
git clone https://github.com/6t9xstar/velocita && cd velocita
npm install
npm test               # node:test, ~20 s
npm run typecheck      # checks src/index.d.ts
npm run dev:example    # live-reload the example site
```

## Pull requests

- One change per PR, with a test in `test/` that fails without it.
- User-facing changes: update `README.md` and the `Unreleased` section of `CHANGELOG.md`.
- Performance claims need numbers: run `node compare/bench.mjs 1000,5000 3` before and after, and paste both.
- CI must be green on Linux, Windows and macOS.

## Releasing (maintainers)

1. Move `Unreleased` entries in `CHANGELOG.md` under the new version.
2. `npm version <patch|minor|major>` and `git push --follow-tags`.
3. The `Release` workflow tests, checks the tag matches `package.json`, publishes to npm with provenance, and creates the GitHub release. It needs an `NPM_TOKEN` secret in the `npm` environment.
