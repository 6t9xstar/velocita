---
title: How to Deploy Velocita to Cloudflare Pages
description: Step-by-step guide to deploying a Velocita site to Cloudflare Pages in under five minutes.
date: 2026-10-30
tags: [performance, deploy]
schema: HowTo
totalTime: PT5M
steps:
  - Build :: Run velocita build to produce the dist folder.
  - Create project :: Create a new Cloudflare Pages project connected to your repository.
  - Configure :: Set the build command to npx velocita build and the output directory to dist.
  - Deploy :: Push to main; Cloudflare builds and serves your site from its edge network.
---

## Steps

1. Run `velocita build`.
2. Create a Cloudflare Pages project.
3. Set output directory to `dist`.
4. Push to deploy.

The generated `_headers` file gives you long-lived asset caching automatically. Read [why speed matters](/blog/why-speed-matters/).
