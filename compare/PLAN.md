# Velocita + Strada vs Astro: measured comparison and plan

Goal: be able to say "faster than Astro" with numbers anyone can reproduce, and close the developer-experience gaps that make people choose Astro anyway.

## 1. Measured today (2026-11-01)

Harness: [`compare/bench.mjs`](bench.mjs). Both sites build the same deterministic corpus ([`gen-corpus.mjs`](gen-corpus.mjs)): roughly 450-word posts with headings, lists, a code block, a table and links.

Each site builds the same pages: the post pages, a blog index paginated at 20 per page, 20 tag pages, a sitemap and RSS. Astro 7.4.4 (with `@astrojs/sitemap` and `@astrojs/rss`) is compared with Velocita at HEAD with `ogImages: false`.

Setup: Node 24.18, i7-12800H, Windows 11. Each time is the median of 3 runs. Raw data is in `results.json`.

| Posts | | Astro 7.4 | Velocita | Velocita vs Astro |
|---:|---|---:|---:|---|
| 1,000 | Clean build | 11.24 s | **1.14 s** | 9.9× faster |
| 1,000 | Rebuild, nothing changed | 8.94 s | **0.76 s** | 11.7× faster |
| 1,000 | Rebuild after editing 1 post | 9.91 s | **0.76 s** | 13.0× faster |
| 5,000 | Clean build | 14.00 s | **6.15 s** | 2.3× faster |
| 5,000 | Rebuild, nothing changed | 11.21 s | **4.62 s** | 2.4× faster |
| 5,000 | Rebuild after editing 1 post | 11.40 s | **4.73 s** | 2.4× faster |
| 5,000 | Output files | **5,274** | 10,787 | 2.0× more |
| 5,000 | Output size | **28.5 MB** | 101.9 MB | 3.6× larger |
| any | Post HTML (gzipped) | **1.7 KB** | 3.4 KB | 2.0× larger |
| any | JS on a post page | 0 | 0 | tie |

What the numbers show:

- **Build speed is a real win today, but it is shrinking.** Astro's cost is mostly a fixed ~9 s startup (Vite plus the content layer). Velocita's cost grows linearly with post count:
  - 1,000 → 5,000 posts takes Velocita from 1.1 s to 6.1 s.
  - At this rate Velocita would be slower than Astro somewhere past ~12,000 posts.
  - Velocita re-renders every page even when nothing changed: the no-op rebuild takes 4.6 s.
- **Velocita's output is heavier.** The extra weight is mostly by design: Markdown mirrors, `llms-full.txt`, feeds per tag and section, JSON-LD and the inlined CSS. It is still a cost in deploy size, upload time and per-page bytes. Astro's smaller HTML is partly because this Astro site has fewer features: no JSON-LD, Markdown mirrors or llms.txt.
- **Profile of the 5,000-post Velocita build:**
  - It uses only 2.7 s of CPU, on a single thread.
  - About 3.4 s is file I/O: 10,787 writes.
  - CPU hotspots: `renderMarkdown` 11%, `minifyHtml` and its regexes about 20%, file reads 8%, hashing 5%.
- **Not yet measured:**
  - Lighthouse on both sites (both will probably score 100, since neither ships JS).
  - Dev-server cold start and HMR latency.
  - Serving throughput: Strada vs `astro preview` / `@astrojs/node`.

### Update: Phase 1 steps 1 and 3 landed (render cache + keyed lazy minify/write)

Measured on the same 5,000-post corpus, back-to-back runs, after the change:

| 5,000 posts | Before | After | Astro 7.4 (above) |
|---|---:|---:|---:|
| Clean build (cache wiped) | 6.15 s | ~5.0–5.5 s | 14.0 s |
| Rebuild, nothing changed | 4.62 s | **1.3 s** | 11.2 s |
| Rebuild after editing 1 post (3 files written) | 4.73 s | **1.5 s** | 11.4 s |

The clean build is now I/O-bound. In a 5.0 s clean build, `Output.flush` takes 3.3 s writing 10,786 files on Windows, and raising `UV_THREADPOOL_SIZE` made no difference. Further gains therefore have to come from writing fewer files (step 4, "output diet"), not from worker threads.

I started a second full-suite run (1k/5k/20k) but stopped it partway. The machine was under other load, and its numbers are inconsistent with the first run: Astro at 5,000 posts measured 30 s instead of 14 s. Those numbers are not reported here. Rerun `node compare/bench.mjs 1000,5000,20000 3` on an idle machine before publishing any 20k claim.

## 2. Feature gap (where Astro still wins)

| Area | Astro | Velocita (+ Strada) | Gap |
|---|---|---|---|
| Components | `.astro` + JSX, props, slots | JS layout functions returning strings | **Large** |
| TypeScript | First-class | None | **Large** (cheap to close: Node 24 strips types natively) |
| Content schema | Zod schemas, generated types, build errors | Frontmatter unchecked | **Large** |
| MDX / components in Markdown | `@astrojs/mdx` | `<v-island>` HTML only | Medium |
| UI-framework islands | React, Preact, Vue, Svelte, Solid | Vanilla JS islands | **Large** |
| Dev experience | Vite HMR, error overlay | Full-page live reload | Medium |
| SSR / API endpoints / middleware | `output: 'server'`, adapters, actions, sessions | Static only; Strada separate | **Large** |
| View transitions | `<ClientRouter />` | Speculation Rules prerender | Small (cross-document view transitions are CSS-only) |
| Integrations / plugin API | Hooks, 500+ integrations | None | **Large**; ecosystem can't be matched quickly |
| Distribution | `npm create astro` | Not on npm | **Blocking** for adoption |
| SEO/GEO out of the box | Plugins | JSON-LD, llms.txt, MD mirrors, audit, IndexNow, OG, budgets | **Velocita wins** |
| Build speed ≤ ~5k pages | ~11–14 s | 1–6 s | **Velocita wins** |
| Runtime dependencies | ~200 packages | 0 | **Velocita wins** |

## 3. Positioning

Velocita can't out-ecosystem Astro. It can be the framework that is measurably faster to build, measurably lighter to serve and the most search- and AI-ready by default, while closing the developer-experience gaps that block adoption.

Strada is the serving and API layer. A single static binary will:

- serve the built site with precompressed assets and correct caching;
- host Rust API handlers when you need a backend;
- be benchmarked against Astro's Node server.

## 4. Phases

Every phase ends with a measured result in this file, not a claim.

### Phase 1: Scale (protect the speed lead)
1. **Persistent render cache:** key it on a hash of the file contents, config and layouts, and skip Markdown → HTML for unchanged files. Target: no-op rebuild at 5,000 posts **< 1 s**.
2. **Worker-thread rendering:** a pool of `os.availableParallelism() - 1` workers, each with its own chunk of pages. Target: clean build at 5,000 posts **< 2.5 s**, and still faster than Astro at 20,000 posts.
3. **Single-pass minifier:** replace the regex chain with one tokenizing pass, and skip minifying pages whose output is already cached.
4. **Output diet:**
   - `llms-full.txt` gets a size cap and splits into chunks.
   - Markdown mirrors become opt-out per section.
   - Per-tag feeds become opt-in.
   - A `lean` preset.
   - Report output MB in the build summary.
5. Add 10k and 20k post sizes to `bench.mjs`; publish results in the README.

### Phase 2: Developer-experience parity core
1. **TypeScript everywhere:** `velocita.config.ts`, `layouts/*.ts`, `islands/*.ts`. Node ≥ 22.6 type stripping, no build step; esbuild as an optional peer for older Node.
2. **Content collections with schemas:** `defineCollection({ schema })`, using a zero-dependency validator with an optional Zod/Standard Schema adapter. Build errors carry file:line. Generate `velocita-env.d.ts` with typed `getCollection()`.
3. **Components:**
   - `html` tagged templates with auto-escaping, props, named slots and component composition.
   - `{{> Component prop=1}}` directives inside Markdown, which covers the MDX use case without MDX.
4. **Cross-document view transitions** (`@view-transition { navigation: auto }`) on by default, plus per-element `view-transition-name`. Zero JS.
5. **Dev server:**
   - CSS hot swap without reload.
   - DOM morph on HTML change, preserving scroll.
   - Error overlay.
   - Measure cold start and update latency against Astro.

### Phase 3: Islands for real UI frameworks
1. Preact, React, Svelte, Vue and Solid islands, bundled through esbuild (an optional peer) and hydrated with the existing `visible | idle | interaction | load` strategies.
2. Server-render the island's initial HTML at build time, so there is no layout shift.
3. Per-island JS budget enforced by `velocita check`.

### Phase 4: Strada 0.2 as the server
1. Static file serving with precompressed `.br`/`.gz` chosen by `Accept-Encoding`, ETag/304, `immutable` for hashed assets, `_headers`/`_redirects` support and a correct 404 page.
2. `velocita serve` runs the Strada binary on `dist/`, falling back to the Node server when the binary is absent.
3. Benchmark Strada against `astro preview` and the `@astrojs/node` standalone server on the same `dist/`, at 64/256/512 connections, reporting p50/p95/p99.
4. Strada also gets Tower middleware, `tracing` and graceful shutdown (its own 0.2 roadmap).

### Phase 5: On-demand rendering and APIs
1. `pages/api/*.ts` endpoints and `export const prerender = false` pages compile to adapters for Cloudflare Workers, Netlify Functions, Vercel Functions and a Node server.
2. Strada hybrid mode: Rust handlers for APIs, the static `dist/` for everything else, in one binary.
3. Middleware (auth, redirects, headers) shared between the dev server and the adapters.

### Phase 6: Ecosystem and adoption
1. Plugin API with `config`, `content`, `page`, `build:done` and `dev` hooks. Port the existing CMS sources to it.
2. Publish `velocita` and `create-velocita` to npm; publish `strada` to crates.io.
3. A docs site, migration guide from Astro (content collections map 1:1), and a public benchmark page that CI reruns.

## 5. Order and why

Phase 1 comes first: the speed lead is the only claim that beats Astro today, and the 5,000-post numbers show it eroding. Phase 2 removes the main reasons people pick Astro. Phases 3–5 are larger, and Phase 4 is where Strada earns its place. Phase 6 runs alongside from Phase 2 onward.
