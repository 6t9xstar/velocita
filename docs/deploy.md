# Deploy

> Publish to Cloudflare Pages, Netlify, Vercel or GitHub Pages, with a Lighthouse CI gate and a performance budget.

## Generate host config

```bash
velocita deploy init cloudflare   # wrangler.toml
velocita deploy init netlify      # netlify.toml
velocita deploy init vercel       # vercel.json with headers and redirects
velocita deploy init github       # GitHub Actions workflow
```

Each also writes `lighthouserc.json`, which fails CI if any Lighthouse category drops below 95.

## Publish

```bash
velocita deploy cloudflare
```

This builds, stops on broken links or a blown performance budget, and then publishes with the host's own CLI.

## Subfolders

If `url` has a path, such as `https://user.github.io/repo`, every internal link is prefixed for you. This site is deployed that way.

Back to [Getting started](/docs/).
