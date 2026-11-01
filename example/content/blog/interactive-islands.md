---
title: Interactive Islands Without the JS Tax
description: Add interactivity to one component while the rest of the page stays zero-JS.
date: 2026-10-31
tags: [performance, islands]
aliases: [/old-islands-post/]
---

## How it works

Drop a `<v-island>` into any page. Only that page gets a tiny loader, and the component's
code downloads when it scrolls into view. Pages without islands still ship zero JavaScript.

<v-island name="counter" load="visible" props='{"start":3}'><button type="button" disabled>Clicked 3 times</button></v-island>

## Load strategies

- `visible`: when scrolled into view (default)
- `idle`: when the browser is idle
- `interaction`: on first hover, focus or touch
- `load`: immediately

Pair this with [speed best practices](/blog/why-speed-matters/).
