<p align="center">
  <a href="https://6t9xstar.github.io/velocita/"><img src="https://raw.githubusercontent.com/6t9xstar/velocita/main/.github/assets/logo.svg" alt="Velocita logo" height="140"></a>
</p>
<h1 align="center">Velocita</h1>

<p align="center">
  <a href="https://github.com/6t9xstar/velocita/actions/workflows/ci.yml"><img src="https://github.com/6t9xstar/velocita/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/velocita"><img src="https://img.shields.io/npm/v/velocita" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/velocita"><img src="https://img.shields.io/npm/dm/velocita" alt="npm downloads"></a>
  <img src="https://img.shields.io/github/stars/6t9xstar/velocita" alt="stars">
  <img src="https://img.shields.io/badge/runtime_dependencies-0-success" alt="zero dependencies">
  <img src="https://img.shields.io/badge/JS_shipped-0_KB-success" alt="zero JS by default">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license">
</p>

<div align="center">
  <a href="https://6t9xstar.github.io/velocita/docs/">Documentation</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="https://github.com/6t9xstar/velocita/issues/new/choose">Issues</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="ROADMAP.md">Roadmap</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="bench/PLAN.md">Benchmarks</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="CHANGELOG.md">Changelog</a>
</div>

### [Read the docs →](https://6t9xstar.github.io/velocita/docs/)

## What is Velocita?

Velocita is a static site framework for content websites: blogs, docs, marketing and business sites. It is a single CLI, `velocita`, with **zero runtime dependencies**. By default it ships **zero JavaScript** to visitors.

It builds in SEO, AI-search (GEO) and performance work that other frameworks leave to plugins: JSON-LD, `llms.txt`, Markdown mirrors for AI agents, social cards, a site-wide SEO audit and a performance budget.

```bash
velocita new                  # interactive: folder, template (blog, docs, business, news, portfolio), title
velocita dev my-site          # live-reload dev server on http://localhost:3000
velocita build my-site        # production build to dist/: incremental and cached
velocita audit my-site        # broken links, orphans, duplicate titles, link suggestions
velocita check my-site        # page weight, JS/CSS budget, Core Web Vitals hazards
velocita preview my-site      # serve the built dist/ on http://127.0.0.1:4173, no rebuild
velocita doctor my-site       # Node version, config, folders, themes, sharp
velocita deploy init github   # or: cloudflare, netlify, vercel
```

The official website, [6t9xstar.github.io/velocita](https://6t9xstar.github.io/velocita/), is built with Velocita. Its source is in [`site/`](site/).

## Install

Requires **Node.js 20 or later** on Linux, macOS or Windows.

```sh
# scaffold a new site
npm create velocita@latest my-site      # or: pnpm create velocita / bun create velocita

# add to an existing project
npm install --save-dev velocita
```

Optional: `npm install sharp` enables responsive WebP images, auto-generated OG cards and PNG app icons.

## Quick start

```sh
npm create velocita@latest my-site -- --template blog
cd my-site
npm install
npm run dev
```

```
my-site/
  velocita.config.js     site title, url, nav, SEO/AI options
  content/
    index.md             → /
    about.md             → /about/
    blog/hello.md        → /blog/hello/   (a folder becomes a collection with an index, tags, feeds)
  layouts/               optional overrides: page.js, post.js, list.js, shell.js …
  public/                copied as-is
```

```js
// velocita.config.js
import { defineConfig } from 'velocita';

export default defineConfig({
  title: 'My Site',
  url: 'https://example.com',
  nav: [{ title: 'Blog', url: '/blog/' }],
  aiCrawlers: 'search-only', // allow AI search/answer bots, block training crawlers
});
```

## Highlights

| | |
|---|---|
| **Speed** | Inlined ~3 KB CSS, Speculation Rules prerendering, auto image dimensions (no CLS), automatic LCP `fetchpriority`, incremental builds with a persistent render cache |
| **SEO** | Canonical, Open Graph and Twitter tags; JSON-LD for WebSite, BlogPosting, BreadcrumbList, FAQPage, HowTo, Product, VideoObject, Organization and LocalBusiness; sitemap; RSS and JSON Feed; IndexNow |
| **AI search (GEO)** | `llms.txt`, `llms-full.txt`, a Markdown mirror of every page, and AI-crawler policy in one config line |
| **Quality gates** | Build-time SEO lint, a site-wide audit (`--strict` fails CI on broken links/anchors), a performance budget (`--check`) and a Lighthouse CI config |
| **Content** | Markdown with frontmatter, collections, tags, pagination, multilingual routing with hreflang, redirects, and Contentful, Sanity or any JSON as content sources |
| **Interactivity** | Islands: JS only where you opt in, hydrated when visible, idle, on interaction or on load. Built-in search page (~2 KB) |
| **Themes** | Install a theme from npm (`theme: 'velocita-theme-paper'`) or write one: CSS, layouts and config defaults your site can still override |
| **Deploy** | `velocita deploy init` for GitHub Pages, Cloudflare Pages, Netlify and Vercel, with headers and redirects translated per host |

## Benchmarks

Velocita and Astro 7.4 built the same 5,000-post Markdown corpus, rendering the same pages. Times are medians of 3 runs on Node 24, i7-12800H, Windows 11.

| 5,000 posts | Velocita | Astro 7.4 |
|---|---:|---:|
| Clean build | ~5.0–5.5 s | 14.0 s |
| Rebuild, nothing changed | **1.3 s** | 11.2 s |
| Rebuild after editing one post | **1.5 s** | 11.4 s |
| Post page HTML (gzipped) | 3.4 KB | **1.7 KB** |
| Total output | 101.9 MB | **28.5 MB** |

Velocita's pages and output are larger because they carry JSON-LD, Markdown mirrors, `llms-full.txt` and per-tag feeds; the Astro site has none of these. With `profile: 'minimal'` the same 5,000 posts produce 63.5 MB (see [output profiles](https://6t9xstar.github.io/velocita/docs/configuration/#output-profiles)). Methodology, raw data and caveats are in [`bench/PLAN.md`](bench/PLAN.md). Reproduce with:

```sh
node bench/bench.mjs 1000,5000 3
```

## Guides

| Topic | |
|---|---|
| [Configuration](https://6t9xstar.github.io/velocita/docs/configuration/) | Every `velocita.config.js` option |
| [Content](https://6t9xstar.github.io/velocita/docs/content/) | Frontmatter, collections, tags, pagination, schema types |
| [Layouts](https://6t9xstar.github.io/velocita/docs/layouts/) | Overriding the theme with your own layout functions |
| [Islands](https://6t9xstar.github.io/velocita/docs/islands/) | Opt-in interactivity and load strategies |
| [Internationalization](https://6t9xstar.github.io/velocita/docs/i18n/) | `content/<lang>/`, hreflang, language switcher |
| [SEO & GEO](https://6t9xstar.github.io/velocita/docs/seo/) | What is generated and how to tune it |
| [Deploy](https://6t9xstar.github.io/velocita/docs/deploy/) | Hosts, headers, redirects, Lighthouse CI |
| [Themes](https://6t9xstar.github.io/velocita/docs/themes/) | Using and publishing theme packages |
| [Templates](https://6t9xstar.github.io/velocita/templates/) | `blog`, `docs`, `business`, `news` and `portfolio` starters |

Programmatic use, with types in [`src/index.d.ts`](src/index.d.ts):

```js
import { build } from 'velocita';
const { pages, ms, warnings, audit } = await build('./my-site');
```

Shell completions for bash, zsh, fish and PowerShell are in [`completions/`](completions/).

## Repository layout

```
bin/          the velocita CLI
src/          framework source (zero dependencies) + index.d.ts
templates/    starter sites used by `velocita new`
packages/     create-velocita (npm create velocita), velocita-theme-paper (example theme)
site/         the official website and docs, built with Velocita
example/      a kitchen-sink example site
bench/        reproducible Astro vs Velocita benchmark and plans
completions/  shell completions
test/         node:test suite
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, tests and the release process. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
