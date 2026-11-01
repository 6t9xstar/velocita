# ⚡ Velocita

**Sonic-speed, SEO-first static site framework for content websites.**
Zero dependencies. Zero JavaScript shipped by default. Every SEO, GEO (AI search) and performance best practice built in — not bolted on as plugins.

```bash
npx github:6t9xstar/velocita new my-site
npx github:6t9xstar/velocita dev my-site     # live reload at http://localhost:3000
npx github:6t9xstar/velocita build my-site   # incremental production build → my-site/dist (add --clean for a full rebuild)
```

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

Benchmark (3,000 posts + 50 tags, Windows laptop, Node 24):

| Build | Time |
|---|---|
| Clean (`--clean`) | **2.3 s** |
| Rebuild, nothing changed | **0.7 s** |
| Rebuild after editing one post | **0.7 s** (3 files written) |

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
  aiCrawlers: 'allow',         // 'allow' | 'search-only' | 'block'
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
