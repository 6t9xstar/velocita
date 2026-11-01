# ⚡ Velocita

**Sonic-speed, SEO-first static site framework for content websites.**
Zero dependencies. Zero JavaScript shipped by default. Every SEO, GEO (AI search) and performance best practice built in — not bolted on as plugins.

```bash
npx github:6t9xstar/velocita new my-site
npx github:6t9xstar/velocita dev my-site     # live reload at http://localhost:3000
npx github:6t9xstar/velocita build my-site   # production build → my-site/dist
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

Benchmark (Windows laptop, Node 24): **3,000 posts built in ~4.4 s**.

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
