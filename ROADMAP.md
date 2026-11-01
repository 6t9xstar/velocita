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

## 🔜 v0.4 — Content platform
- Zero-JS search (prebuilt index + tiny optional island)
- Islands: opt-in interactive components hydrated on visible/idle
- Headless CMS adapters (Git-based, Notion, Sanity, Contentful)
- Redirect manager (`_redirects`), Atom/JSON Feed per tag

## 🔜 v1.0 — Ecosystem
- Starter templates: blog, docs, news, agency, local business
- One-command deploy: Cloudflare Pages, Netlify, Vercel, GitHub Pages
- Lighthouse CI gate: build fails below a configurable score
