---
title: Why Speed Matters for SEO
description: Core Web Vitals are a ranking signal. Here is how Velocita hits 100 by default.
date: 2026-10-20
tags: [performance, seo]
faq:
  - What is LCP? :: Largest Contentful Paint, the time until the main content is visible.
  - Does Velocita ship JS? :: No. Zero JavaScript unless you add it.
---

## The three vitals

| Metric | Target | Velocita strategy |
|---|---|---|
| LCP | < 2.5s | Inlined CSS, `fetchpriority` on hero image |
| CLS | < 0.1 | Auto width/height on images |
| INP | < 200ms | Zero JS by default |

## Instant navigation

Speculation Rules prerender the next page on hover, so clicks feel *instant*.

## Summary

Fast pages rank better and convert better.
