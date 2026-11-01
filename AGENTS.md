# Guide for AI coding agents

Read this before changing Velocita.

## Ground rules

- **Zero runtime dependencies.** `src/` imports only `node:` built-ins. Optional features (`sharp`) are optional peer dependencies loaded with dynamic `import()` and must degrade gracefully when absent.
- **Zero JS by default.** Built pages must not gain `<script>` tags except JSON-LD, Speculation Rules, and islands the user opted into. `test/core.test.js` asserts this.
- **Performance claims need numbers.** Measure with `node bench/bench.mjs 1000,5000 3` before and after. Never state a speed-up you did not measure.

## Commands

```sh
npm test                                          # node:test suite (~20 s)
npm run typecheck                                 # validates src/index.d.ts
node bin/velocita.js build site --strict --check  # the official site must stay green
```

## Map

- `bin/velocita.js`: CLI. Keep `completions/` in sync when adding commands or flags.
- `src/build.js`: the pipeline (load → collections → render → SEO files → audit → incremental flush).
- `src/output.js`: incremental writer (manifest of content hashes). `src/cache.js`: persistent render cache.
- `src/index.d.ts`: public types. Update it with every API change.
- `site/content/docs/`: user documentation (published at https://6t9xstar.github.io/velocita/docs/).
- `packages/create-velocita`: `npm create velocita`.

## Done means

Tests pass, typecheck passes, the site builds with `--strict --check`, docs and `CHANGELOG.md` (Unreleased) are updated, and there is a test for new behaviour.
