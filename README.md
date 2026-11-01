# ⚡ Velocita

**Sonic-speed, SEO-first static site framework for content websites.**

**Live site: https://6t9xstar.github.io/velocita/**: the official Velocita website, built with Velocita (source in [`site/`](site/)). Run it locally with `npm install && npm run dev:site`.

Zero dependencies. Zero JavaScript shipped by default. Every SEO, GEO (AI search) and performance best practice built in — not bolted on as plugins.

```bash
npx github:6t9xstar/velocita new my-site --template blog   # or: docs, business
cd my-site
npm install
npm run dev                                                # live reload at http://localhost:3000
npx velocita deploy init github                            # or: netlify, cloudflare, vercel
```

## Starter templates

| Template | What you get |
|---|---|
| `blog` | Home, about, blog with tags, feeds, search, FAQ schema example |
| `docs` | Sidebar ordered by `order`, prev/next, on-page TOC, search; `sections: { docs: { layout: 'docs', type: 'page' } }` |
| `business` | Hero, service cards, pricing, contact/hours; `LocalBusiness` + `Organization` JSON-LD |

Every template passes `velocita audit` and `velocita check` out of the box, and all three measured **Lighthouse 100 performance, 100 accessibility, 100 best practices, 100 SEO on every content page** (`@lhci/cli` 0.14, Lighthouse's default mobile emulation with simulated throttling, Chrome on Windows; LCP ≈ 0.75 s, CLS 0). The 404 page scores 66 for SEO by design: it is `noindex`.

## Deploy

```bash
velocita deploy init cloudflare   # wrangler.toml          (reads _headers/_redirects natively)
velocita deploy init netlify      # netlify.toml           (reads _headers/_redirects natively)
velocita deploy init vercel       # vercel.json            (headers + redirects translated from the build)
velocita deploy init github       # GitHub Actions → Pages, with a Lighthouse CI gate
velocita deploy cloudflare        # build → audit → budget check → publish with the provider's CLI
```

Every `init` also writes `lighthouserc.json`: CI fails if performance, accessibility, best practices or SEO drop below 95 on any page.

## Performance budget

```bash
velocita check                    # or: velocita build --check
```

Checks every built page in milliseconds, without a browser: gzipped HTML / JS / CSS weight against a budget (`budget: { htmlKB: 30, jsKB: 20, cssKB: 20 }`), render-blocking stylesheets and scripts, images without dimensions (CLS), a lazy-loaded first image (LCP), and missing `lang` / viewport.

## Why Velocita

| | Velocita | Typical SSG |
|---|---|---|
| Runtime dependencies | **0** | hundreds |
| JS shipped to visitors | **0 KB** | 40–200 KB |
| CSS | **inlined, ~3 KB** (no render-blocking request) | external file |
| Instant navigation | **Speculation Rules prerender**, no JS | SPA router |
| Image CLS | **auto width/height** from file headers | manual / plugin |
| LCP image | **auto `fetchpriority="high"`**, rest lazy | manual |
| JSON-LD | **WebSite, BlogPosting, BreadcrumbList, FAQPage** | plugin |
| `llms.txt` + `llms-full.txt` | **built in** | rare |
| Markdown mirror of every page (for AI agents) | **built in** | none |
| AI crawler policy (allow / search-only / block) | **one config line** | hand-edit robots |
| SEO linter at build time | **built in** | none |
| Sitemap, RSS, robots, 404, `_headers`, IndexNow key | **built in** | plugins |
| Incremental builds | **only changed files are written**; stale files removed | full rewrite |
| Responsive images | **WebP `srcset` (480/960/1600w)** with optional `sharp`, cached | plugin |
| Pagination | **automatic** for collections & tags (`pageSize`) | manual |
| Site-wide SEO audit | **broken links & #anchors, orphans, duplicate titles/descriptions, link suggestions** | external crawler |
| Social cards | **auto-generated 1200×630 OG image per page** (with `sharp`) | design tool |
| Multilingual | **`content/<lang>/`, hreflang clusters, x-default, sitemap alternates, language switcher** | plugin |
| More schema | **HowTo, Product, VideoObject, Organization, LocalBusiness** | plugin |
| IndexNow | **pings only changed URLs** after each build | manual |
| Interactivity | **islands**: JS only on pages that use them, loaded when visible/idle/on interaction | whole-page hydration |
| Search | **built-in `/search/`** per language, ~2 KB island over a prebuilt index | third-party service |
| Headless CMS | **Contentful, Sanity, any JSON** via `sources` | plugin per CMS |
| Redirects | **`aliases:` + `redirects`** → `_redirects` 301s + HTML fallback | manual |
| Feeds | **RSS + JSON Feed** for the site, every section, tag and language | one RSS feed |

Benchmark (3,000 posts + 50 tags, Windows laptop, Node 24):

| Build | Time |
|---|---|
| Clean (`--clean`) | **2.3 s** |
| Rebuild, nothing changed | **0.8 s** |
| Rebuild after editing one post | **0.7 s** (3 files written) |
| First build with OG images (`sharp`, 3,052 cards) | ~46 s once; cached afterwards (rebuild 0.75 s) |

Optional responsive images: `npm i sharp` in your site and Velocita generates WebP variants automatically. Images placed next to Markdown files (`![alt](photo.jpg)`) are copied and fingerprinted to `/_img/`.

## SEO audit & CI

```bash
velocita audit my-site                    # errors, warnings + internal-link suggestions
velocita build my-site --strict           # fail the build on broken links/anchors (CI gate)
velocita build my-site --indexnow         # notify Bing/Yandex/Seznam/Naver of changed URLs
```

## Multilingual

```js
// velocita.config.js
export default { lang: 'en', locales: ['en', 'hi'], nav: { en: [...], hi: [...] } };
```

`content/about.md` → `/about/`, `content/hi/about.md` → `/hi/about/`. Files with the same path (or the same `translationKey` frontmatter) are linked as translations: hreflang + x-default tags, sitemap `xhtml:link` alternates, and a language switcher.

## Islands (opt-in interactivity)

```js
// islands/counter.js
export default function counter(el, { start = 0 }) { /* make el interactive */ }
```

```html
<v-island name="counter" load="visible" props='{"start":3}'>Static fallback HTML</v-island>
```

`load`: `visible` (default), `idle`, `interaction` or `load`. Pages without islands still ship zero JavaScript. Island files are content-hashed under `/_islands/` and cached forever.

## Headless CMS / external content

```js
import { fromContentful, fromSanity, fromJson } from 'velocita';

export default {
  sources: [
    fromContentful({ space: '…', accessToken: process.env.CONTENTFUL_TOKEN, contentType: 'post', section: 'blog' }),
    fromSanity({ projectId: '…', query: '*[_type=="post"]{title,"slug":slug.current,description,date,body}' }),
    fromJson({ url: 'https://api.example.com/posts.json', section: 'news' }),
  ],
};
```

A source is just `async (site) => [{ path: 'blog/x.md', data: { title, … }, body: 'markdown' }]`, so any API can be one. Each adapter takes `map(item)` to fit your content model. Source pages get everything file pages get: SEO tags, feeds, OG images, audit.

## Redirects

```yaml
aliases: [/old-url/, /2019/old-post/]   # frontmatter
```
```js
redirects: { '/rss/': '/feed.xml' }      // config
```

Generates `_redirects` (real 301s on Netlify / Cloudflare Pages) plus an HTML fallback page with a canonical link for other static hosts.

## Content

```
my-site/
  velocita.config.js
  content/
    index.md            → /
    about.md            → /about/
    blog/hello.md       → /blog/hello/   (folder = collection, auto index at /blog/)
  layouts/              (optional overrides: page.js, post.js, list.js, shell.js …)
  public/               (copied as-is)
```

Frontmatter:

```yaml
---
title: Why Speed Matters
description: 150-char summary used for meta + OG + feeds
date: 2026-10-20
updated: 2026-10-25
tags: [seo, performance]
image: /og/speed.png
faq:
  - Question? :: Answer.
schema: HowTo           # or Product
steps:                  # HowTo
  - Step name :: What to do.
totalTime: PT5M
price: 49               # Product: price, currency, brand, sku, rating, reviewCount, availability
video: https://youtube.com/embed/ID   # VideoObject: videoThumbnail, videoDuration
translationKey: blog/my-post
noindex: false
draft: false
permalink: /custom/url/
seoTitle: Longer <title> only   # nav and h1 keep `title`
keywords: [a, b]
layout: post
---
```

## Config

```js
// velocita.config.js
export default {
  title: 'My Site',
  description: 'What the site is about',
  url: 'https://example.com',
  author: 'Jane Doe',
  lang: 'en',
  nav: [{ title: 'Blog', url: '/blog/' }],
  image: '/og-default.png',    // default social image
  twitter: '@handle',
  aiCrawlers: 'allow',         // 'allow' | 'search-only' (blocks training bots) | 'block' (also answer bots)
  contentSignal: false,        // add a Content-Signal line to robots.txt (Lighthouse flags it as unknown)
  keywords: ['…'],             // fallback <meta name=keywords> (pages use frontmatter keywords, then tags)
  themeColor: '#5b3df5',       // theme-color + web manifest
  software: { version, license, repository }, // SoftwareApplication JSON-LD on the home page
  sections: { docs: { schemaType: 'TechArticle' }, blog: { title, description } },
  indexNowKey: '',             // emits /<key>.txt for Bing/Yandex IndexNow
  pageSize: 20,                // items per collection/tag page (0 = no pagination)
  imageWidths: [480, 960, 1600], imageQuality: 78, // with sharp installed
  locales: ['en'],             // first is default; others live in content/<lang>/
  organization: { name: 'Acme', logo: '/logo.png', sameAs: ['https://x.com/acme'] },
  localBusiness: { type: 'Restaurant', telephone: '+91…', address: { street, city, region, postalCode, country }, geo: { lat, lng }, openingHours: ['Mo-Su 10:00-22:00'] },
  og: { background: '#0b1020', accent: '#4f8cff', color: '#fff' }, // generated social cards
  ogImages: true, audit: true,
  prefetch: true, minify: true, feed: true, llms: true, markdownMirror: true,
  css: '',                     // extra CSS appended to the inlined theme
  head: '',                    // extra tags injected into <head>
};
```

## Custom layouts

A layout is just a function returning HTML — no template language to learn:

```js
// layouts/post.js
export default ({ page, site, articles }) => `<article><h1>${page.title}</h1>${page.html}</article>`;
```

## Programmatic API

```js
import { build, renderMarkdown, seoHead } from 'velocita';
const { pages, ms, warnings } = await build('./my-site');
```

See [ROADMAP.md](ROADMAP.md) for the full plan. MIT licensed.
