---
title: Content and routing
description: How Markdown files map to URLs, what frontmatter fields do, and how collections, tags and pagination work.
group: Start
order: 2
---

## Files become URLs

```
content/index.md          → /
content/about.md          → /about/
content/blog/hello.md     → /blog/hello/
content/hi/about.md       → /hi/about/   (second locale)
```

A folder is a collection. Dated files inside it become articles with an automatic index page, tag pages, feeds and pagination.

## Frontmatter

```yaml
---
title: Why speed matters        # under 60 characters
description: One-line summary   # under 160 characters
date: 2026-10-20
tags: [seo, performance]
image: /og/custom.png           # otherwise a card is generated
aliases: [/old-url/]            # 301 redirects
draft: true                     # excluded from production
---
```

All supported fields:

| Field | What it does |
|---|---|
| `updated` | Last-modified date for `dateModified`, the sitemap and feeds |
| `seoTitle` | A longer `<title>`; nav and `<h1>` keep `title` |
| `keywords` | `<meta name="keywords">` (falls back to tags) |
| `permalink` | Custom URL, e.g. `/custom/url/`. Must start with `/`; `..`, spaces, quotes, `<>`, `?` and `#` fail the build |
| `layout` | Layout name from `layouts/` |
| `noindex` | `robots: noindex`, and excluded from the sitemap and llms.txt |
| `translationKey` | Links translations whose paths differ |
| `faq` | `- Question? :: Answer.` list → FAQPage JSON-LD |
| `schema: HowTo` | With `steps` (`- Name :: What to do.`) and `totalTime` (e.g. `PT5M`) |
| `schema: Product` | With `price`, `currency`, `brand`, `sku`, `rating`, `reviewCount`, `availability` |
| `video` | VideoObject JSON-LD, with `videoThumbnail` and `videoDuration` |

## Images

Write `![Alt text](photo.jpg)` with the file next to the Markdown. Velocita copies it, adds width and height, and creates WebP sizes when `sharp` is installed.

Continue with [configuration](/docs/configuration/).
