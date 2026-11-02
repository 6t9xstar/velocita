# Changelog

All notable changes are listed here. Velocita follows [Semantic Versioning](https://semver.org).

## [Unreleased]

### Security
- The output writer refuses paths that escape the output directory, and no longer deletes files outside it when `.velocita-manifest.json` lists them.
- Invalid `permalink` values (`../`, no leading `/`, spaces, quotes, `<>`, `?`, `#`) fail the build with a clear error instead of writing outside `dist/` or breaking `href` attributes.
- `indexNowKey` must match the IndexNow format (8–128 of `a-z A-Z 0-9 -`); it is used as a file name.
- `velocita dev` answers 503 instead of crashing when the first build fails, and sends `X-Content-Type-Options: nosniff`.
- IndexNow's "local site" check now looks at the URL's hostname, so domains like `notlocalhost.com` are no longer skipped.
- `velocita deploy init cloudflare` quotes the package name in `wrangler.toml`.
- CI: actions pinned to commit SHAs, `persist-credentials: false`, per-job least-privilege `permissions:`, new CodeQL workflow. `SECURITY.md` documents scope, network calls and provenance.

### Changed
- `velocita`, `create-velocita` and `velocita-theme-paper` 1.1.0 are published on npm. Install docs now use `npm create velocita@latest` and `npm install velocita` instead of `npx github:6t9xstar/velocita`.

## [1.1.0] - 2026-11-01

### Added
- **Themes**: `theme: 'velocita-theme-x' | './file.js' | { … } | [ … ]` in config. A theme provides `config` defaults, `css` and `layouts`/`shell`; the site's own config, CSS and `layouts/` still win. Example package: `packages/velocita-theme-paper`. Docs: /docs/themes/.
- **Templates**: `news` (front page with lead story and section blocks, NewsArticle / OpinionNewsArticle schema) and `portfolio` (case studies with results, services, contact, CreativeWork schema).
- **Interactive `velocita new`** (and `npm create velocita`): asks for folder, template (with descriptions) and title when they're missing in a terminal; `--yes` skips questions. Exported as `askSite()` and `templateInfo`.
- npm release workflow publishes `velocita`, `create-velocita` and `velocita-theme-paper` together, and points scaffolded sites at the npm version.
- **Persistent render cache**: rendered Markdown is stored in `.velocita-cache/markdown.bin` and reused when a file's content (and any images it references) are unchanged. Disable with `cache: false`.
- **Lazy, keyed HTML output**: a page that renders to the same HTML as last build is neither minified nor written.
- TypeScript declarations for the public API and config (`src/index.d.ts`), and a `defineConfig()` helper.
- `velocita dev --host <addr>`; `dev()` now resolves to the server so it can be closed.
- CI on every PR: Node 20/22/24 × Linux/Windows/macOS, strict builds of the example, the official site and all templates, typecheck, and an `npm pack` install smoke test. Tag-triggered npm release with provenance.
- `bench/` (formerly `compare/`): reproducible Astro vs Velocita build benchmark.
- `packages/create-velocita`: `npm create velocita@latest`, interactive when run without arguments. Published by the release workflow with the same version.
- `createSite()` and `templates()` are exported from the package.
- Shell completions for bash, zsh, fish and PowerShell in `completions/`.
- Repo: a README in the style of Bun's (logo, badges, install, benchmarks, guides), CODE_OF_CONDUCT, CODEOWNERS, `.editorconfig`, `.gitattributes` (LF line endings), and AGENTS.md / CLAUDE.md for AI contributors.
- Docs: full frontmatter reference, CMS sources guide, and more config options (moved from the README).

### Changed
- Minimum Node.js is now **20** (Node 18 is end-of-life).
- The dev server binds to `127.0.0.1` by default instead of all interfaces.

### Fixed
- Dev server crashed on malformed percent-encoded URLs; it now answers 400.
- Dev server path check allowed reading sibling directories that share the output folder's name prefix (e.g. `dist-old/`); it now answers 403.

### Performance (5,000-post corpus, see `bench/PLAN.md`)
- No-op rebuild 4.6 s → 1.3 s; rebuild after editing one post 4.7 s → 1.5 s.

## [1.0.0] - 2026-10
- First tagged version: core pipeline, SEO/GEO output, islands, search, CMS sources, templates, deploy targets, audit, budget check.
