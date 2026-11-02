---
title: Starter templates
description: Five production-ready starters (blog, docs, local business, news and portfolio) that pass the SEO audit and performance budget out of the box.
---

<div class="prose">
<p class="sub">Start from a template that already passes the audit, the performance budget and Lighthouse CI. Every one is plain Markdown and JavaScript you can change.</p>
</div>

<div class="grid">
<div class="card"><div class="icon" aria-hidden="true">✍️</div><h2 style="font-size:1.08rem;margin:.5rem 0 .35rem">Blog</h2><p>Home, about, posts with tags, RSS and JSON feeds, search and an FAQ example.</p><p><code>--template blog</code></p></div>
<div class="card"><div class="icon" aria-hidden="true">📚</div><h2 style="font-size:1.08rem;margin:.5rem 0 .35rem">Docs</h2><p>Sidebar ordered by frontmatter, previous/next links, on-page contents and search.</p><p><code>--template docs</code></p></div>
<div class="card"><div class="icon" aria-hidden="true">🏪</div><h2 style="font-size:1.08rem;margin:.5rem 0 .35rem">Local business</h2><p>Hero, service cards, pricing and opening hours, with LocalBusiness structured data.</p><p><code>--template business</code></p></div>
<div class="card"><div class="icon" aria-hidden="true">📰</div><h2 style="font-size:1.08rem;margin:.5rem 0 .35rem">News / magazine</h2><p>A front page with a lead story and section blocks, news and opinion sections, and NewsArticle structured data.</p><p><code>--template news</code></p></div>
<div class="card"><div class="icon" aria-hidden="true">🎨</div><h2 style="font-size:1.08rem;margin:.5rem 0 .35rem">Agency / portfolio</h2><p>A hero, stats, case studies with results tables, services and contact, with CreativeWork structured data.</p><p><code>--template portfolio</code></p></div>
</div>

## Create a site

```bash
npm create velocita@latest                # asks for folder, template and title
npm create velocita@latest my-site -- --template docs --title "Acme Docs"
cd my-site
npm install
npm run dev
```

## Measured, not promised

Each template was built and run through Lighthouse CI on every page:

| Template | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Blog | 100 | 100 | 100 | 100 |
| Docs | 100 | 100 | 100 | 100 |
| Local business | 100 | 100 | 100 | 100 |
| News / magazine | 100 | 100 | 100 | 100 |
| Agency / portfolio | 100 | 100 | 100 | 100 |

News and portfolio were measured on November 1, 2026 across all 16 pages of each starter (`@lhci/cli` 0.14, Lighthouse's default mobile emulation with simulated throttling). Largest Contentful Paint stayed under 1.3 s and layout shift under 0.005 on every page. Pages marked `noindex` (404, search, and tag pages with a single post) score 66 for SEO by design, because Lighthouse counts `noindex` against them.

Next, read [Getting started](/docs/) or learn how to [deploy](/docs/deploy/).
