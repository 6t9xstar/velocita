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
| `collections` | `{}` | Per-folder frontmatter schemas, see [content](/docs/content/#collection-schemas) |
| `budget` | 30/20/20 KB | Page, JS and CSS limits for `velocita check` |
| `indexNowKey` | none | Enables `--indexnow` pings. 8–128 characters of `a-z A-Z 0-9 -` |
| `contentSignal` | `false` | Adds a Content-Signal line to robots.txt (Lighthouse reports it as unknown) |
| `html` | `true` | Render raw HTML in Markdown and `.html` content. `false` escapes it on every page |
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

### Trusted and untrusted HTML

Content is trusted by default: raw HTML in Markdown (and `.html` pages) is copied into the page as written, which is what you want for your own files. If editors you don't fully trust can write CMS content, mark those entries `trusted: false` and their raw HTML is escaped as text, while Markdown still renders:

```js
fromJson({ url: 'https://api.example.com/posts.json', map: item => ({ path: `blog/${item.slug}.md`, data: item, body: item.body, trusted: false }) })
```

Set `html: false` in config to do the same for every page. In all modes, Markdown links and images with `javascript:`, `vbscript:`, `file:` or non-image `data:` URLs become `#`, and `canonical`, `image` and other head URLs must be `http(s)` or site paths, or the build fails.

Next: write your own [layouts](/docs/layouts/).
