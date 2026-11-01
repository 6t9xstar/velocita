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
| `indexNowKey` | none | Enables `--indexnow` pings |

## Content sources

```js
import { fromSanity } from 'velocita';
export default { sources: [fromSanity({ projectId: 'abc', query: '*[_type=="post"]' })] };
```

Next: write your own [layouts](/docs/layouts/).
