# Getting started

> Create your first Velocita site, run it locally and publish a production build in under five minutes.

## Requirements

- Node.js 20 or newer
- Optional: `sharp` for responsive images and generated social cards

## Create a site

```bash
npm create velocita@latest my-site -- --template blog
cd my-site
npm install
npm run dev
```

Open `http://localhost:3000`. Edit any file in `content/`, `layouts/`, `public/` (or the folders `contentDir`, `layoutsDir` and `publicDir` point to), `velocita.config.js` or a local theme, and the page reloads. If a rebuild fails, the server keeps running: the error is printed in the terminal and shown in the browser, and the page reloads once you fix it.

Something not working? `npx velocita doctor` checks your Node.js version, that the config and themes load, that the configured folders exist, and whether `sharp` is installed. It exits with code 1 if anything is broken.

## Build for production

```bash
npm run build      # velocita build --strict
npx velocita check # performance budget
```

The output in `dist/` is plain static files. Rebuilds are incremental: only files whose content changed are written.

To look at the production build before deploying, run `npx velocita preview`. It serves `dist/` exactly as built on `http://127.0.0.1:4173` (change with `--port` and `--host`), without rebuilding or live reload.

## Next steps

Learn how [content is organised](/docs/content/), then see every [configuration option](/docs/configuration/).
