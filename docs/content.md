# Content and routing

> How Markdown files map to URLs, what frontmatter fields do, and how collections, tags and pagination work.

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

Frontmatter is a YAML subset: strings, numbers, booleans, `[a, b]` arrays, `- item` lists, and nested maps and lists by indentation:

```yaml
author:
  name: Ada
  links:
    - https://ada.example
sponsors:
  - name: Acme
    tier: gold
```

## Collection schemas

Give a folder a schema in `velocita.config.js` and every file in it is checked at build time:

```js
export default {
  collections: {
    blog: {
      schema: {
        title: 'string',              // required
        date: 'date',
        tags: 'string[]?',            // ? = optional
        draft: 'boolean?',
        rating: { type: 'number', required: false, validate: v => (v >= 1 && v <= 5) || 'must be 1–5' },
      },
    },
  },
};
```

Types are `string`, `number`, `boolean`, `date` (a parseable date) and `string[]`. `validate(value, data)` runs when the value is present; return `false` or a message to reject it. Fields not in the schema are allowed. All mismatches are reported together and fail the build:

```
Frontmatter does not match the collection schema:
  blog/hello.md: field "date" is required (date) by collections.blog.schema
  blog/old.md: field "rating": must be 1–5
```

Two pages with the same URL (for example `blog/Hello.md` and `blog/hello.md`, or a clashing `permalink`) also fail the build, naming both files.

## Images

Write `![Alt text](photo.jpg)` with the file next to the Markdown. Velocita copies it, adds width and height, and creates WebP sizes when `sharp` is installed.

Continue with [configuration](/docs/configuration/).
