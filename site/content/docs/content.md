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

## Images

Write `![Alt text](photo.jpg)` with the file next to the Markdown. Velocita copies it, adds width and height, and creates WebP sizes when `sharp` is installed.

Continue with [configuration](/docs/configuration/).
