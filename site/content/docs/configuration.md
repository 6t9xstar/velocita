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
