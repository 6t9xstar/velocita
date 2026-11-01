---
title: Getting started
description: Create your first Velocita site, run it locally and publish a production build in under five minutes.
group: Start
order: 1
---

## Requirements

- Node.js 18 or newer
- Optional: `sharp` for responsive images and generated social cards

## Create a site

```bash
npx github:6t9xstar/velocita new my-site --template blog
cd my-site
npm install
npm run dev
```

Open `http://localhost:3000`. Edit any file in `content/` and the page reloads.

## Build for production

```bash
npm run build      # velocita build --strict
npx velocita check # performance budget
```

The output in `dist/` is plain static files. Rebuilds are incremental: only files whose content changed are written.

## Next steps

Learn how [content is organised](/docs/content/), then see every [configuration option](/docs/configuration/).
