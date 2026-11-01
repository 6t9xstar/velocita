---
title: A practical guide to llms.txt and AI search
description: What llms.txt is, what it is not, and the other signals that help AI answer engines read and cite your content.
date: 2026-10-28
tags: [seo, ai]
---

## What llms.txt is

`llms.txt` is a proposed Markdown file at the root of a site that lists its most useful pages with short descriptions, so language models can find clean content quickly. Velocita writes it, plus `llms-full.txt` with the full text, on every build.

## What it is not

It is not a ranking factor for Google, and AI crawlers are not required to read it. Treat it as a cheap, helpful extra, not a strategy.

## Signals that matter more

- **Clean, crawlable HTML** with real headings, which every page already has
- **Markdown copies** of each page, such as [this one](/blog/llms-txt-guide.md), for agents that prefer text
- **Structured data** that states facts explicitly
- **A clear crawler policy** with `aiCrawlers: 'allow' | 'search-only' | 'block'`

See the full list in [SEO and AI search](/docs/seo/), or read [why zero JavaScript is a feature](/blog/zero-js-is-a-feature/).
