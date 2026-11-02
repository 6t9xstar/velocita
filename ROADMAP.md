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
- ✅ Persistent render cache: unchanged Markdown is not re-parsed
- worker_threads rendering for very large sites
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
- ✅ Nested frontmatter (YAML objects)
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

## ✅ v1.2 — Trust and quality (shipped)
- Security hardening: output paths contained to `dist/`, permalink and IndexNow validation, Markdown URL allowlist, opt-in raw-HTML escaping, head URL validation, pinned CI actions
- Collection schemas: typed frontmatter checked at build time, nested YAML, duplicate-route errors
- Dev experience: watches configured folders, shows rebuild errors in the browser, `velocita preview` and `velocita doctor`
- Output profiles (`minimal`, `standard`, `ai`, `full`) with measured output sizes
- SEO / AEO / GEO head: generator, keywords, author, publisher, full Twitter and article tags, web manifest, PNG app icons
- Schema: WebPage and CollectionPage with ItemList, speakable, TechArticle for docs, SoftwareApplication; `seoTitle`
- robots.txt separates AI training bots from AI answer bots (`aiCrawlers: 'search-only'`); Content-Signal opt-in
- Lighthouse CI 100 / 100 / 100 / 100 measured on all five templates (news and portfolio added November 2026)
- Theme gallery on the website

## 🔜 v1.3 — Speed at scale
Target: 50,000 pages, clean build under 10 s, one-file rebuild under 300 ms, measured in `bench/`.
- worker_threads Markdown rendering
- AVIF output and `<picture>` with WebP fallback
- Per-layout critical CSS, so large sites keep inlined CSS under 14 KB
- Dependency-aware rebuilds: editing a post only rewrites the pages that list it
- Publish build-time numbers for every release in CI, not just once

## 🔜 v1.4 — Search and AI discoverability
- Per-locale `llms.txt` and `llms-full.txt`
- Custom OG image templates (`layouts/og.js`)
- Opt-in external link checker
- Auto-suggested internal links from content similarity, surfaced in `velocita audit`
- `velocita audit --ai`: passage-length, answer-first and entity checks for AI-answer citability
- Sitemap index and image / news sitemaps for large and news sites

## 🔜 v1.5 — Content platform
- Notion and Strapi adapters; Git-based CMS config (Decap, Tina)
- Incremental source fetching: refetch only CMS entries changed since the last build
- Content collections from CSV and YAML data files
- Scheduled publishing (`publishAt`) that works with cron-triggered deploys

## 🔜 v1.6 — Ecosystem
- At least five themes in the gallery, each listed with a live demo and its own Lighthouse scores
- `velocita add <theme|island>` to install and wire a package in one command
- Island library: tabs, accordion, image lightbox, video facade, newsletter form
- Plugin hooks (`onPage`, `onBuild`) with a stable, documented API

## 🎯 v2.0 — Goals
- Stable plugin API with semver guarantees
- A public benchmark against Astro, Hugo, Eleventy and Next.js static export on the same hardware, with raw data and scripts so anyone can reproduce it
- An edge adapter (Cloudflare Workers) for hybrid pages, still static by default

Each release ships only what is measured: Lighthouse CI on every template, `velocita audit` and `velocita check` clean, and benchmark numbers in `bench/`.
