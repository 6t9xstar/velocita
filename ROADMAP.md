# Velocita Roadmap

Goal: the fastest, most search- and AI-discoverable framework for content websites — shipping what other frameworks leave to plugins.

## ✅ v0.1 — Core (shipped)
- Zero-dependency Markdown + frontmatter pipeline, GFM tables, heading anchors, TOC, reading time
- Zero-JS output, inlined CSS, HTML minification, Speculation Rules prerendering
- Auto image dimensions (PNG/JPEG/GIF/WebP), LCP `fetchpriority`, lazy images
- Canonical, Open Graph, Twitter, robots meta, hreflang alternates
- JSON-LD: WebSite, BlogPosting, BreadcrumbList, FAQPage
- sitemap.xml, feed.xml, robots.txt with AI crawler policy, llms.txt, llms-full.txt, `.md` mirrors
- Build-time SEO linter, collections, tag pages, 404, `_headers`, IndexNow key
- Dev server with live reload, `new` scaffolder, programmatic API

## ✅ v0.2 — Speed (shipped)
- Incremental output: content-hash manifest, only changed files written, stale files removed, parallel I/O (4× faster rebuilds)
- Responsive images: WebP `srcset` via optional `sharp` peer, cached across builds; co-located images copied + fingerprinted
- Automatic pagination for collections and tag pages
- CSS minified once per build; cached date formatters

## 🔜 v0.2.x — Speed, continued
- Skip re-parsing unchanged Markdown (persistent render cache) and worker_threads rendering
- AVIF variants, `<picture>` output, image fingerprinting under `/assets/`
- Per-layout critical CSS

## ✅ v0.3 — SEO / GEO depth (shipped)
- Site-wide audit: broken internal links + #anchors, orphan pages, duplicate titles/descriptions, related-article link suggestions; `--strict` CI gate
- Auto-generated 1200×630 OG images (JPEG, cached, redrawn only when a page's title or date changes)
- Schema: HowTo, Product (Offer + AggregateRating), VideoObject, Organization (sameAs), LocalBusiness
- Multilingual routing: `content/<lang>/`, hreflang + x-default, sitemap alternates, language switcher, per-locale nav
- IndexNow: pings only changed URLs after a build (`--indexnow`)

## 🔜 v0.3.x
- External link checker (opt-in, network)
- Per-locale feeds and llms.txt
- Custom OG templates (layouts/og.js)

## ✅ v0.4 — Content platform (shipped)
- Islands: opt-in interactive components, hydrated on visible / idle / interaction / load; zero JS elsewhere
- Built-in search page per locale: ~2 KB island over the prebuilt index, language-aware, `?q=` shareable
- Content sources: `fromContentful`, `fromSanity`, `fromJson`, or any `async () => entries` function
- Redirects: `aliases` frontmatter + `redirects` config → `_redirects` 301s + HTML fallbacks, conflict warnings
- Feeds: RSS + JSON Feed per site, locale, section and tag, advertised per page

## 🔜 v0.4.x
- Notion and Strapi adapters; Git-based CMS config (Decap / Tina)
- Nested frontmatter (YAML objects)
- Per-locale llms.txt

## ✅ v1.0 — Ecosystem (shipped)
- Starter templates: blog, docs (sidebar + prev/next), local business (LocalBusiness schema)
- `velocita deploy init` for Cloudflare Pages, Netlify, Vercel (headers/redirects translated) and GitHub Pages (Actions workflow)
- `velocita deploy <target>`: build, audit, budget check, then publish with the provider's CLI
- Lighthouse CI gate (`lighthouserc.json`, 95+ in every category) wired into the GitHub workflow
- `velocita check`: browser-free performance budget and Core Web Vitals hazard check
- Auto-generated favicon (no `/favicon.ico` 404s)
- Layout helpers (`h.escape`, `h.date`, `h.pager`) and per-section layout/type config

## ✅ v1.1 — Ecosystem, continued (shipped)
- More templates: news/magazine (NewsArticle schema) and agency/portfolio (CreativeWork schema)
- Theme packages shareable on npm (`theme: 'velocita-theme-…'`), with `velocita-theme-paper` as the reference theme
- `velocita new` / `npm create velocita` interactive prompts
- Release pipeline for npm with provenance (`velocita`, `create-velocita`, `velocita-theme-paper`)
- First npm publish: `velocita`, `create-velocita` and `velocita-theme-paper` 1.1.0 are on npm

## 🔜 Next
- Lighthouse CI numbers for the news and portfolio templates
- A theme gallery page on the website
