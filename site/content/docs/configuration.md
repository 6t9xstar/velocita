---
title: Configuration
description: Every option in velocita.config.js, from site metadata and navigation to images, feeds and AI-crawler policy.
group: Start
order: 3
---

## Site

```js
export default {
  title: 'My Site',
  description: 'What the site is about',
  url: 'https://example.com',   // a path here (/repo) is handled for you
  lang: 'en',
  nav: [{ title: 'Blog', url: '/blog/' }],
};
```

## Output profiles

`profile` picks which optional files a build writes. The default, `full`, builds the same files as earlier versions.

| Profile | What is emitted |
|---|---|
| `minimal` | HTML with meta tags and JSON-LD, sitemap.xml, robots.txt, `_headers`, search index |
| `standard` | `minimal` plus RSS and JSON feeds (site, sections, tags), OG images, responsive images |
| `ai` | `standard` plus a Markdown mirror of every page, `llms.txt`, `llms-full.txt` |
| `full` (default) | Everything. Today this is the same as `ai`; future optional output goes here |

```js
export default { profile: 'minimal', feed: true }; // explicit options override the profile
```

Measured with `node bench/bench.mjs 1000,5000 3 minimal,standard,ai,full`. The corpus is the bench's generated Markdown posts with `ogImages: false` and no `sharp`, so the image settings change nothing here. Times are medians of 3 runs on Node 24, i7-12800H, Windows 11. Other work was running on the machine, so treat the times as relative to each other. Astro 7.4 writes 28.5 MB for the same 5,000 posts.

| 5,000 posts | Output | Files | Clean build | No-op rebuild | Edit one post |
|---|---:|---:|---:|---:|---:|
| `minimal` | 63.5 MB | 5,740 | 9.1 s | 2.8 s | 3.0 s |
| `standard` | 69.2 MB | 5,784 | 9.2 s | 3.0 s | 3.1 s |
| `ai` / `full` | 101.9 MB | 10,787 | 8.7–9.7 s | 2.7–2.9 s | 3.0–3.7 s |

| 1,000 posts | Output | Files | Clean build |
|---|---:|---:|---:|
| `minimal` | 12.7 MB | 1,160 | 1.3 s |
| `standard` | 17.4 MB | 1,204 | 1.4 s |
| `ai` / `full` | 23.9 MB | 2,207 | 1.5–1.6 s |

Markdown mirrors and `llms-full.txt` account for about a third of the `full` output. Build time barely changes between profiles: rendering the HTML dominates.

## Behaviour

| Option | Default | What it does |
|---|---|---|
| `pageSize` | `20` | Items per list page |
| `aiCrawlers` | `'allow'` | `'search-only'` or `'block'` AI bots in robots.txt |
| `locales` | `[lang]` | Extra languages live in `content/<lang>/` |
| `sections` | `{}` | Per-folder layout and type, e.g. docs |
| `budget` | 30/20/20 KB | Page, JS and CSS limits for `velocita check` |
| `indexNowKey` | none | Enables `--indexnow` pings. 8–128 characters of `a-z A-Z 0-9 -` |
| `contentSignal` | `false` | Adds a Content-Signal line to robots.txt (Lighthouse reports it as unknown) |
| `cache` | `true` | Persistent Markdown render cache in `.velocita-cache/` |
| `markdownMirror` / `llms` / `feed` | `true` | Markdown copy of each page, llms.txt files, RSS + JSON Feed |
| `ogImages` | `true` | Generated 1200×630 social cards (needs `sharp`) |
| `redirects` | `{}` | `{ '/old/': '/new/' }` → `_redirects` 301s + HTML fallbacks |

## Content sources

Pages can come from a headless CMS or any API as well as from `content/`:

```js
import { defineConfig, fromContentful, fromSanity, fromJson } from 'velocita';

export default defineConfig({
  sources: [
    fromContentful({ space: '…', accessToken: process.env.CONTENTFUL_TOKEN, contentType: 'post', section: 'blog' }),
    fromSanity({ projectId: '…', query: '*[_type=="post"]{title,"slug":slug.current,description,date,body}' }),
    fromJson({ url: 'https://api.example.com/posts.json', section: 'news' }),
  ],
});
```

A source is just `async (site) => [{ path: 'blog/x.md', data: { title, … }, body: 'markdown' }]`, so any API can become one. Each adapter accepts `map(item)` to fit your content model. Source pages get everything file pages get: SEO tags, feeds, OG images and the audit.

Next: write your own [layouts](/docs/layouts/).
