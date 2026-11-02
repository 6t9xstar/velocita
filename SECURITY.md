# Security policy

## Supported versions

The latest minor release receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's private reporting: *Security → Report a vulnerability* on https://github.com/6t9xstar/velocita. You'll get an acknowledgement within 3 working days and a fix or mitigation plan within 14 days for confirmed issues.

## Scope notes

- `velocita dev` is a development server. It binds to `127.0.0.1` by default; `--host 0.0.0.0` exposes it to your network. Don't use it to serve production traffic.
- Content and config files are trusted input: `velocita.config.js`, layouts and themes are executed as code at build time, and Markdown may contain raw HTML. For untrusted content (e.g. a CMS with outside editors) set `trusted: false` on source entries or `html: false` in config so raw HTML is escaped. In every mode, Markdown links and images drop `javascript:`/`vbscript:`/`file:`/non-image `data:` URLs, and head URLs (`canonical`, `image`, alternates) must be `http(s)` or site paths. Frontmatter values are still trusted to the extent that layouts you write use them: escape with `h.escape`.
- Even so, a build never writes or deletes outside the output directory: output paths, `permalink` values and the incremental manifest are checked, and an invalid `permalink` or `indexNowKey` fails the build.
- `velocita deploy <target>` runs the provider's own CLI through `npx` (`netlify-cli`, `wrangler`, `vercel`), which may download it from npm.
- `velocita build --indexnow` is the only command that contacts a third party: it POSTs changed URLs and your `indexNowKey` to `api.indexnow.org`, and only when `site.url` isn't a local address.

## Supply chain

- Velocita has zero runtime dependencies (`sharp` is an optional peer). Each package publishes only an allowlist of files (`files` in `package.json`).
- Releases are published from GitHub Actions with [npm provenance](https://docs.npmjs.com/generating-provenance-statements). Check a release with `npm audit signatures` in a project that installs it.
- Workflow actions are pinned to commit SHAs, workflows default to read-only `permissions:`, Dependabot updates npm and GitHub Actions weekly, and CodeQL scans every push and pull request.
