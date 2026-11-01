---
title: Starter templates
description: Three production-ready starters, blog, docs and local business, each scoring Lighthouse 100 in every category out of the box.
---

<div class="prose">
<p class="sub">Start from a template that already passes the audit, the performance budget and Lighthouse CI. Every one is plain Markdown and JavaScript you can change.</p>
</div>

<div class="grid">
<div class="card"><div class="icon" aria-hidden="true">✍️</div><h2 style="font-size:1.08rem;margin:.5rem 0 .35rem">Blog</h2><p>Home, about, posts with tags, RSS and JSON feeds, search and an FAQ example.</p><p><code>--template blog</code></p></div>
<div class="card"><div class="icon" aria-hidden="true">📚</div><h2 style="font-size:1.08rem;margin:.5rem 0 .35rem">Docs</h2><p>Sidebar ordered by frontmatter, previous/next links, on-page contents and search.</p><p><code>--template docs</code></p></div>
<div class="card"><div class="icon" aria-hidden="true">🏪</div><h2 style="font-size:1.08rem;margin:.5rem 0 .35rem">Local business</h2><p>Hero, service cards, pricing and opening hours, with LocalBusiness structured data.</p><p><code>--template business</code></p></div>
</div>

## Create a site

```bash
npx github:6t9xstar/velocita new my-site --template docs --title "Acme Docs"
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

Next, read [Getting started](/docs/) or learn how to [deploy](/docs/deploy/).
