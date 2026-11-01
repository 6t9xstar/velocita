---
title: SEO and AI search
description: Meta tags, structured data, sitemaps, llms.txt, Markdown mirrors, the site audit and IndexNow, all automatic.
group: Guides
order: 5
---

## On every page

- Title, description, canonical and robots meta
- Open Graph and Twitter cards with a generated 1200×630 image
- JSON-LD: WebSite, BreadcrumbList, BlogPosting, plus FAQPage, HowTo, Product, VideoObject and LocalBusiness when you use them

## Site-wide files

`sitemap.xml` with hreflang alternates, `robots.txt`, RSS and JSON feeds, `llms.txt`, `llms-full.txt`, and a `.md` copy of every page for AI agents.

## The audit

```bash
velocita audit
```

Reports broken internal links and `#anchors`, orphan pages, duplicate titles and descriptions, and suggests related posts to link. `velocita build --strict` fails on errors.

## IndexNow

Set `indexNowKey`, then `velocita build --indexnow` notifies Bing, Yandex and others about only the URLs that changed.

Next: add interactivity with [islands](/docs/islands/).
