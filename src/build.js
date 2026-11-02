import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { parseFrontmatter } from './frontmatter.js';
import { renderMarkdown, slugify, escapeHtml as e } from './markdown.js';
import { seoHead, lintPage, breadcrumbs, VERSION } from './seo.js';
import { minifyHtml } from './minify.js';
import * as theme from './theme.js';
import { Output } from './output.js';
import { createImagePipeline } from './responsive.js';
import { generateOgImages } from './og.js';
import { auditSite } from './audit.js';
import { writeFeeds } from './feeds.js';
import { writeRedirects } from './redirects.js';
import { collectIslands } from './islands.js';
import { basePath, withBase } from './base.js';
import { BuildCache } from './cache.js';
import { loadThemes } from './themes.js';

const walk = dir => !existsSync(dir) ? [] : readdirSync(dir).flatMap(f => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const toDate = v => (v ? new Date(v) : null);

export async function loadConfig(root) {
  const file = join(root, 'velocita.config.js');
  const user = existsSync(file) ? (await import(pathToFileURL(file).href + `?t=${Date.now()}`)).default : {};
  // Precedence: built-in defaults < theme config < the site's own config. Theme CSS goes before site CSS.
  const themes = await loadThemes(root, user.theme);
  const css = [...themes.map(t => t.css), user.css].filter(Boolean).join('\n');
  return {
    title: 'My Site', description: '', url: 'http://localhost:3000', lang: 'en',
    contentDir: 'content', publicDir: 'public', outDir: 'dist', layoutsDir: 'layouts',
    minify: true, pageSize: 20, prefetch: true, drafts: false, feed: true, llms: true, markdownMirror: true,
    aiCrawlers: 'allow', // 'allow' | 'block' | 'search-only'
    ...Object.assign({}, ...themes.map(t => t.config)),
    ...user,
    ...(css ? { css } : {}),
    themes,
  };
}

async function loadLayouts(root, site) {
  const dir = join(root, site.layoutsDir);
  const custom = {};
  for (const f of walk(dir).filter(f => f.endsWith('.js'))) {
    const name = relative(dir, f).replace(/\.js$/, '').replace(/\\/g, '/');
    custom[name] = (await import(pathToFileURL(f).href + `?t=${Date.now()}`)).default;
  }
  return { ...theme.layouts, ...Object.assign({}, ...(site.themes || []).map(t => t.layouts)), ...custom };
}

const hashText = s => createHash('sha1').update(s).digest('hex').slice(0, 12);
const clip = (s, n = 158) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s\S*$/, '') + '…');

export async function build(root = '.', opts = {}) {
  const t0 = performance.now();
  root = resolve(root);
  const site = { ...(await loadConfig(root)), ...opts };
  site.url = site.url.replace(/\/$/, '');
  site.root = root;
  site.base = site.dev ? '' : basePath(site.url);
  const layouts = await loadLayouts(root, site);
  const shell = layouts.shell || theme.shell;
  const contentDir = join(root, site.contentDir);
  const publicDir = join(root, site.publicDir);
  const out = join(root, site.outDir);
  const warnings = [];
  const output = new Output(out, { clean: site.clean });
  const emit = output.emit.bind(output);
  const images = await createImagePipeline(site, output);
  // Rendered Markdown is cached across builds (`cache: false` disables).
  const useCache = site.cache !== false && !site.dev;
  const mdCache = new BuildCache(root, 'markdown', `${VERSION}|${site.url}`);

  // 1. Load + render content
  const pages = [];
  // Entries come from content/ files and from `sources` (headless CMS / JSON adapters).
  const entries = walk(contentDir).filter(f => /\.(md|markdown|html)$/.test(f)).map(file => ({
    file, rel: relative(contentDir, file).replace(/\\/g, '/'), ...parseFrontmatter(readFileSync(file, 'utf8')),
  }));
  for (const source of site.sources || []) {
    for (const e of await source(site)) entries.push({ rel: e.path.replace(/^\//, ''), data: e.data || {}, body: e.body || '' });
  }
  for (const { file, rel, data, body } of entries) {
    if (data.draft && !site.drafts) continue;
    const path = rel.replace(/\.(md|markdown|html)$/, '').replace(/(^|\/)index$/, '');
    // Permalinks become output paths and href values: keep them inside dist/ and attribute-safe.
    const pl = data.permalink;
    if (pl != null && (typeof pl !== 'string' || !pl.startsWith('/') || /[\s"'<>\\?#]/.test(pl) || /(^|\/)\.\.?(\/|$)/.test(pl))) {
      throw new Error(`${rel}: invalid permalink ${JSON.stringify(data.permalink)}. Use a site path like /about/ (no "..", spaces, quotes or <>)`);
    }
    const url = data.permalink || (path ? `/${path.split('/').map(slugify).join('/')}/` : '/');
    // Multilingual: content/<locale>/... for every locale except the first (default) one.
    const locales = site.locales || [site.lang];
    const first = rel.split('/')[0];
    const lang = locales.slice(1).includes(first) && rel.includes('/') ? first : locales[0];
    const prefix = lang === locales[0] ? '' : lang + '/';
    const local = rel.slice(prefix.length);
    const section = local.includes('/') ? prefix + local.split('/')[0] : null;
    const imagePath = src => (src.startsWith('/') ? join(publicDir, src) : file ? join(dirname(file), src) : '');
    const image = src => images.process(src, imagePath(src));
    let rendered;
    if (rel.endsWith('.html')) rendered = { html: body, toc: [], text: body.replace(/<[^>]+>/g, ' '), words: 0, readingTime: 1 };
    else if (!useCache) rendered = renderMarkdown(body, { siteUrl: site.url, image });
    else {
      // The image pipeline has side effects (it emits variants and reads dimensions), so the
      // key covers each referenced image's size + mtime, and cache hits replay image() calls.
      const stamps = [...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map(([, src]) => {
        try { const st = statSync(imagePath(src)); return `${src}:${st.size}:${st.mtimeMs}`; } catch { return src; }
      });
      const key = BuildCache.key(file ? dirname(rel) : 'source', body, stamps.join('|'));
      let fresh = false;
      rendered = mdCache.get(key, () => {
        fresh = true;
        const used = [];
        return { ...renderMarkdown(body, { siteUrl: site.url, image: src => (used.push(src), image(src)) }), used };
      });
      if (!fresh) for (const src of rendered.used) image(src);
    }
    const date = toDate(data.date) || (section && file ? statSync(file).mtime : null);
    pages.push({
      ...data, ...rendered, file, rel, url, section, markdown: body, lang,
      translationKey: data.translationKey || local.replace(/\.(md|markdown|html)$/, ''),
      date, updated: toDate(data.updated),
      tags: (data.tags || []).map(t => ({ name: String(t), slug: slugify(t), url: `/${prefix}tags/${slugify(t)}/` })),
      type: data.type || site.sections?.[local.split('/')[0]]?.type || (section && date ? 'article' : 'page'),
      layout: data.layout || site.sections?.[local.split('/')[0]]?.layout || (section ? 'post' : 'page'),
      schemaType: data.schemaType || site.sections?.[local.split('/')[0]]?.schemaType,
      excerpt: rendered.text.slice(0, 155).replace(/\s\S*$/, '') + (rendered.text.length > 155 ? '…' : ''),
    });
  }

  // hreflang clusters: pages sharing a translationKey are translations of each other.
  if (site.locales?.length > 1) {
    const groups = {};
    for (const p of pages) (groups[p.translationKey] ||= []).push(p);
    for (const group of Object.values(groups)) {
      if (group.length < 2) continue;
      const def = group.find(p => p.lang === site.locales[0]) || group[0];
      const alternates = [...group.map(p => ({ lang: p.lang, url: p.url })), { lang: 'x-default', url: def.url }];
      for (const p of group) p.alternates = alternates;
    }
  }

  // 2. Collections, tags, section indexes
  const articles = pages.filter(p => p.type === 'article').sort((a, b) => b.date - a.date);
  const sections = {};
  for (const a of articles) (sections[a.section] ||= []).push(a);
  for (const [name, items] of Object.entries(sections)) {
    const url = `/${name.split('/').map(slugify).join('/')}/`;
    const label = name.split('/').pop();
    const lang = items[0].lang;
    const idx = pages.find(p => p.url === url);
    if (idx) Object.assign(idx, { layout: idx.layout === 'page' || idx.layout === 'post' ? 'list' : idx.layout, items, type: 'page' });
    else {
      const cfg = site.sections?.[name] || {};
      pages.push({ title: cfg.title || label[0].toUpperCase() + label.slice(1), url, lang, html: '', toc: [], text: '', layout: 'list', items, type: 'page',
        description: cfg.description || clip(`All ${items.length} ${label} posts from ${site.title}, newest first: ${items.slice(0, 3).map(i => i.title).join('; ')}.`) });
    }
  }
  const tagMap = {};
  for (const a of articles) for (const t of a.tags) (tagMap[t.url] ||= { name: t.name, lang: a.lang, items: [] }).items.push(a);
  for (const [url, t] of Object.entries(tagMap)) pages.push({
    title: `Tagged “${t.name}”`, url, lang: t.lang, html: '', toc: [], text: '', layout: 'list', items: t.items, type: 'page',
    description: clip(`${t.items.length} article${t.items.length > 1 ? 's' : ''} about ${t.name} on ${site.title}: ${t.items.slice(0, 3).map(i => i.title).join('; ')}.`), noindex: t.items.length < 2,
  });

  paginate(pages, site);
  if (site.search !== false) for (const lang of site.locales || [site.lang]) {
    const base = lang === (site.locales || [site.lang])[0] ? '/' : `/${lang}/`;
    if (!pages.some(p => p.url === `${base}search/`)) pages.push({ title: site.searchTitle?.[lang] || 'Search', url: `${base}search/`, lang, layout: 'search', noindex: true, html: '', toc: [], text: '', type: 'page' });
  }
  const ogCount = await generateOgImages(pages, site, output);
  const h = { escape: e, date: theme.date, pager: theme.pager, breadcrumbs, layouts: theme.layouts, css: theme.siteCss };
  const ctx = { site, pages, articles, sections, tags: tagMap, h };

  // 3. Write HTML
  site.themeColor ??= site.og?.accent || '#0b57d0';
  // Favicon: use public/favicon.(svg|ico|png) if present, else generate a lettermark so
  // browsers never hit a 404 on /favicon.ico (a Lighthouse best-practices failure).
  const ownIcon = ['favicon.svg', 'favicon.png', 'favicon.ico'].find(f => existsSync(join(publicDir, f)));
  let iconSvg = ownIcon === 'favicon.svg' ? readFileSync(join(publicDir, ownIcon)) : null;
  if (site.favicon !== false) {
    site.faviconHref = site.favicon || (ownIcon ? `/${ownIcon}` : '/favicon.svg');
    if (!site.favicon && !ownIcon) {
      const { accent = '#0b57d0' } = site.og || {};
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${accent}"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="#fff" text-anchor="middle">${e(String(site.title).trim()[0] || 'V').toUpperCase()}</text></svg>`;
      emit('favicon.svg', iconSvg);
    }
  }
  // PNG app icons (iOS home screen, Android/PWA install) rasterised from the SVG icon when sharp is installed.
  const icons = [{ src: site.faviconHref?.replace(/^\//, '') || 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }];
  if (iconSvg && site.appleTouchIcon === undefined && !existsSync(join(publicDir, 'apple-touch-icon.png'))) {
    const sharp = await import('sharp').then(m => m.default, () => null);
    if (sharp) {
      const key = hashText(String(iconSvg));
      for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
        output.emitLazy(name, key + size, () => sharp(Buffer.from(String(iconSvg)), { density: 72 * size / 64 }).resize(size, size).png().toBuffer());
        if (size > 180) icons.push({ src: name, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' });
      }
      site.appleTouchIcon = '/apple-touch-icon.png';
    }
  }
  if (site.manifest !== false) emit('site.webmanifest', JSON.stringify({
    name: site.title, short_name: String(site.title).slice(0, 12), description: site.description || '', lang: site.lang || 'en',
    start_url: '.', scope: '.', display: 'browser', theme_color: site.themeColor, background_color: site.og?.background || '#ffffff', icons,
  }));
  for (const f of walk(publicDir)) {
    const st = statSync(f);
    output.emitLazy(relative(publicDir, f), `${st.size}-${st.mtimeMs}`, () => readFileSync(f));
  }

  const prefetch = site.prefetch
    ? `<script type="speculationrules">{"prerender":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>`
    : '';
  const minify = site.minify && !site.dev;
  const write = (url, html) => {
    const file = url.endsWith('.html') ? url : url + 'index.html';
    // Keyed on the unminified HTML: if the previous build produced the same page,
    // it is neither minified nor written again.
    if (minify) output.emitLazy(file, BuildCache.key(html, site.base), () => withBase(minifyHtml(html), site.base));
    else emit(file, withBase(html, site.base));
  };
  const islands = collectIslands(site, emit);
  const feedMap = writeFeeds({ site, articles, sections, tags: tagMap, emit });
  const locales = site.locales || [site.lang];
  for (const p of pages) p.feedBase = feedMap[p.url] || (p.lang && p.lang !== locales[0] && feedMap[`/${p.lang}/`]) || '/';
  const htmlByUrl = new Map();
  const render = page => {
    const layout = layouts[page.layout] || layouts.page;
    const content = layout({ page, ...ctx });
    const head = seoHead(page, site) + prefetch + (site.head || '');
    let html = islands.inject(shell({ page, site, head, content, ...ctx }));
    if (site.dev) html = html.replace('</body>', `<script>new EventSource('/__reload').onmessage=()=>location.reload()</script></body>`);
    return html;
  };

  for (const page of pages) {
    for (const w of page.rel ? lintPage(page) : []) warnings.push(`${page.rel}: ${w}`);
    const html = render(page);
    htmlByUrl.set(page.url, html);
    write(page.url, html);
    if (site.markdownMirror && page.markdown) {
      // Clean Markdown copy of every page for AI agents / LLM ingestion.
      const md = `# ${page.title}\n\n${page.description ? `> ${page.description}\n\n` : ''}${page.markdown.trim()}\n`;
      emit(page.url === '/' ? 'index.md' : page.url.replace(/\/$/, '') + '.md', md);
    }
  }
  write('/404.html', render({ title: 'Page not found', url: '/404/', layout: 'notFound', noindex: true, html: '', toc: [] }));

  // 4. SEO / discovery files
  const indexable = pages.filter(p => !p.noindex && !p.draft);
  emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${indexable.map(p => `<url><loc>${site.url}${p.url}</loc>${(p.alternates || []).map(a => `<xhtml:link rel="alternate" hreflang="${a.lang}" href="${site.url}${a.url}"/>`).join('')}${(p.updated || p.date) ? `<lastmod>${(p.updated || p.date).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`);

  // AI crawlers: training bots vs. search/answer bots (blocking the latter removes you from AI answers).
  const trainingBots = ['GPTBot', 'anthropic-ai', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Bytespider', 'Applebot-Extended', 'meta-externalagent', 'cohere-training-data-crawler'];
  const answerBots = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User'];
  const mode = site.aiCrawlers || 'allow';
  const blocked = mode === 'block' ? [...trainingBots, ...answerBots] : mode === 'search-only' ? trainingBots : [];
  // Content-Signal (contentsignals.org) is opt-in: Lighthouse's robots.txt audit reports it as an unknown directive.
  const signal = { allow: 'search=yes, ai-input=yes, ai-train=yes', 'search-only': 'search=yes, ai-input=yes, ai-train=no', block: 'search=yes, ai-input=no, ai-train=no' }[mode];
  emit('robots.txt',
    `User-agent: *\n${site.contentSignal ? `Content-Signal: ${signal}\n` : ''}Allow: /\n${blocked.map(b => `\nUser-agent: ${b}\nDisallow: /`).join('\n')}\n\nSitemap: ${site.url}/sitemap.xml\n${site.llms ? `# LLM-friendly index: ${site.url}/llms.txt\n` : ''}`);

  const redirects = writeRedirects({ site, pages, emit: (f, c) => emit(f, f.endsWith('.html') ? withBase(c, site.base) : c) });
  warnings.push(...redirects.conflicts);

  if (site.llms) {
    const line = p => `- [${p.title}](${site.url}${p.url === '/' ? '/index.md' : p.url.replace(/\/$/, '') + '.md'})${p.description ? `: ${p.description}` : ''}`;
    const groups = Object.entries(sections).map(([n, items]) => `## ${n[0].toUpperCase() + n.slice(1)}\n\n${items.map(line).join('\n')}`);
    const loose = indexable.filter(p => p.rel && !p.section);
    emit('llms.txt', `# ${site.title}\n\n> ${site.description}\n\n${loose.length ? `## Pages\n\n${loose.map(line).join('\n')}\n\n` : ''}${groups.join('\n\n')}\n`);
    emit('llms-full.txt', indexable.filter(p => p.markdown).map(p => `# ${p.title}\nURL: ${site.url}${p.url}\n\n${p.markdown.trim()}`).join('\n\n---\n\n'));
  }

  // Client-side search index (optional to use; costs nothing if unused).
  emit('search-index.json', JSON.stringify(indexable.filter(p => p.rel).map(p => ({ t: p.title, u: p.url, d: p.description || p.excerpt, k: p.tags?.map(t => t.name), l: p.lang }))));

  // Host config: long-lived caching for assets + security headers (Netlify / Cloudflare Pages format).
  emit('_headers', `/*
  X-Powered-By: Velocita ${VERSION}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: browsing-topics=(), camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  Cross-Origin-Opener-Policy: same-origin
/*.html
  Cache-Control: public, max-age=0, must-revalidate
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/_islands/*
  Cache-Control: public, max-age=31536000, immutable
/_img/*
  Cache-Control: public, max-age=31536000, immutable
`);
  if (site.indexNowKey && !/^[A-Za-z0-9-]{8,128}$/.test(site.indexNowKey)) throw new Error('indexNowKey must be 8-128 characters of a-z, A-Z, 0-9 or "-" (IndexNow spec)');
  if (site.indexNowKey) emit(`${site.indexNowKey}.txt`, site.indexNowKey);

  await images.flush();
  const audit = site.audit === false ? { errors: [], warnings: [], suggestions: [] } : auditSite({ pages, htmlByUrl, files: new Set(output.files.keys()) });
  const { writtenFiles, ...stats } = await output.flush();
  if (useCache) mdCache.save();
  const changedUrls = writtenFiles.filter(f => f.endsWith('index.html')).map(f => site.url + '/' + f.replace(/index[.]html$/, ''));
  const ms = Math.round(performance.now() - t0);
  return { pages: pages.length + 1, ms, warnings, out, audit, changedUrls, ogImages: ogCount, site, ...stats };
}

// Split long list pages into /section/page/N/ so no page carries thousands of links.
function paginate(pages, site) {
  const size = site.pageSize;
  if (!size) return;
  for (const p of [...pages]) {
    if (p.layout !== 'list' || !p.items || p.items.length <= size) continue;
    const all = p.items;
    const total = Math.ceil(all.length / size);
    const href = n => (n === 1 ? p.url : `${p.url}page/${n}/`);
    for (let n = 1; n <= total; n++) {
      const pagination = { current: n, total, prev: n > 1 ? href(n - 1) : null, next: n < total ? href(n + 1) : null, href };
      const items = all.slice((n - 1) * size, n * size);
      if (n === 1) Object.assign(p, { items, pagination });
      else pages.push({ ...p, rel: undefined, markdown: undefined, html: '', items, pagination, url: href(n), title: `${p.title} – Page ${n}` });
    }
  }
}
