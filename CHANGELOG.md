# Changelog

All notable changes are listed here. Velocita follows [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- **Persistent render cache**: rendered Markdown is stored in `.velocita-cache/markdown.bin` and reused when a file's content (and any images it references) are unchanged. Disable with `cache: false`.
- **Lazy, keyed HTML output**: a page that renders to the same HTML as last build is neither minified nor written.
- TypeScript declarations for the public API and config (`src/index.d.ts`), and a `defineConfig()` helper.
- `velocita dev --host <addr>`; `dev()` now resolves to the server so it can be closed.
- CI on every PR: Node 20/22/24 × Linux/Windows/macOS, strict builds of the example, the official site and all templates, typecheck, and an `npm pack` install smoke test. Tag-triggered npm release with provenance.
- `compare/`: reproducible Astro vs Velocita build benchmark.

### Changed
- Minimum Node.js is now **20** (Node 18 is end-of-life).
- The dev server binds to `127.0.0.1` by default instead of all interfaces.

### Fixed
- Dev server crashed on malformed percent-encoded URLs; it now answers 400.
- Dev server path check allowed reading sibling directories that share the output folder's name prefix (e.g. `dist-old/`); it now answers 403.

### Performance (5,000-post corpus, see `compare/PLAN.md`)
- No-op rebuild 4.6 s → 1.3 s; rebuild after editing one post 4.7 s → 1.5 s.

## [1.0.0] - 2026-10
- First tagged version: core pipeline, SEO/GEO output, islands, search, CMS sources, templates, deploy targets, audit, budget check.
