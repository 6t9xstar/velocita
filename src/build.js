import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync, cpSync } from 'node:fs';
import { join, relative, dirname, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseFrontmatter } from './frontmatter.js';
import { renderMarkdown, slugify, escapeHtml as e } from './markdown.js';
import { seoHead, lintPage } from './seo.js';
import { minifyHtml } from './minify.js';
import { imageSize } from './images.js';
import * as theme from './theme.js';

const walk = dir => !existsSync(dir) ? [] : readdirSync(dir).flatMap(f => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const toDate = v => (v ? new Date(v) : null);

export async function loadConfig(root) {
  const file = join(root, 'velocita.config.js');
  const user = existsSync(file) ? (await import(pathToFileURL(file).href + `?t=${Date.now()}`)).default : {};
  return {
    title: 'My Site', description: '', url: 'http://localhost:3000', lang: 'en',
    contentDir: 'content', publicDir: 'public', outDir: 'dist', layoutsDir: 'layouts',
    minify: true, prefetch: true, drafts: false, feed: true, llms: true, markdownMirror: true,
    aiCrawlers: 'allow', // 'allow' | 'block' | 'search-only'
    ...user,
  };
}

async function loadLayouts(root, site) {
  const dir = join(root, site.layoutsDir);
  const custom = {};
  for (const f of walk(dir).filter(f => f.endsWith('.js'))) {
    const name = relative(dir, f).replace(/\.js$/, '').replace(/\\/g, '/');
    custom[name] = (await import(pathToFileURL(f).href + `?t=${Date.now()}`)).default;
  }
  return { ...theme.layouts, ...custom };
}

export async function build(root = '.', opts = {}) {
  const t0 = performance.now();
  root = resolve(root);
  const site = { ...(await loadConfig(root)), ...opts };
  site.url = site.url.replace(/\/$/, '');
  const layouts = await loadLayouts(root, site);
  const shell = layouts.shell || theme.shell;
  const contentDir = join(root, site.contentDir);
  const publicDir = join(root, site.publicDir);
  const out = join(root, site.outDir);
  const warnings = [];

  // 1. Load + render content
  const pages = [];
  for (const file of walk(contentDir).filter(f => /\.(md|markdown|html)$/.test(f))) {
    const src = readFileSync(file, 'utf8');
    const { data, body } = parseFrontmatter(src);
    if (data.draft && !site.drafts) continue;
    const rel = relative(contentDir, file).replace(/\\/g, '/');
    const path = rel.replace(/\.(md|markdown|html)$/, '').replace(/(^|\/)index$/, '');
    const url = data.permalink || (path ? `/${path.split('/').map(slugify).join('/')}/` : '/');
    const section = rel.includes('/') ? rel.split('/')[0] : null;
    const rendered = file.endsWith('.html')
      ? { html: body, toc: [], text: body.replace(/<[^>]+>/g, ' '), words: 0, readingTime: 1 }
      : renderMarkdown(body, {
        siteUrl: site.url,
        imageSize: src => src.startsWith('/') ? imageSize(join(publicDir, src)) : imageSize(join(dirname(file), src)),
      });
    const date = toDate(data.date) || (section ? statSync(file).mtime : null);
    pages.push({
      ...data, ...rendered, file, rel, url, section, markdown: body,
      date, updated: toDate(data.updated),
      tags: (data.tags || []).map(t => ({ name: String(t), slug: slugify(t) })),
      type: data.type || (section && date ? 'article' : 'page'),
      layout: data.layout || (section ? 'post' : 'page'),
      excerpt: rendered.text.slice(0, 155).replace(/\s\S*$/, '') + (rendered.text.length > 155 ? '…' : ''),
    });
  }

  // 2. Collections, tags, section indexes
  const articles = pages.filter(p => p.type === 'article').sort((a, b) => b.date - a.date);
  const sections = {};
  for (const a of articles) (sections[a.section] ||= []).push(a);
  for (const [name, items] of Object.entries(sections)) {
    const idx = pages.find(p => p.url === `/${slugify(name)}/`);
    if (idx) Object.assign(idx, { layout: idx.layout === 'page' || idx.layout === 'post' ? 'list' : idx.layout, items, type: 'page' });
    else pages.push({ title: name[0].toUpperCase() + name.slice(1), url: `/${slugify(name)}/`, html: '', toc: [], text: '', layout: 'list', items, type: 'page', description: `All ${name} from ${site.title}.` });
  }
  const tagMap = {};
  for (const a of articles) for (const t of a.tags) (tagMap[t.slug] ||= { name: t.name, items: [] }).items.push(a);
  for (const [slug, t] of Object.entries(tagMap)) pages.push({
    title: `Tagged “${t.name}”`, url: `/tags/${slug}/`, html: '', toc: [], text: '', layout: 'list', items: t.items, type: 'page',
    description: `${t.items.length} article${t.items.length > 1 ? 's' : ''} about ${t.name} on ${site.title}.`, noindex: t.items.length < 2,
  });

  const ctx = { site, pages, articles, sections, tags: tagMap };

  // 3. Write HTML
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  if (existsSync(publicDir)) cpSync(publicDir, out, { recursive: true });

  const prefetch = site.prefetch
    ? `<script type="speculationrules">{"prerender":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>`
    : '';
  const write = (url, html) => {
    const target = url.endsWith('.html') ? join(out, url) : join(out, url, 'index.html');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, html);
  };
  const render = page => {
    const layout = layouts[page.layout] || layouts.page;
    const content = layout({ page, ...ctx });
    const head = seoHead(page, site) + prefetch + (site.head || '');
    let html = shell({ page, site, head, content, ...ctx });
    if (site.dev) html = html.replace('</body>', `<script>new EventSource('/__reload').onmessage=()=>location.reload()</script></body>`);
    return site.minify && !site.dev ? minifyHtml(html) : html;
  };

  for (const page of pages) {
    for (const w of page.rel ? lintPage(page) : []) warnings.push(`${page.rel}: ${w}`);
    write(page.url, render(page));
    if (site.markdownMirror && page.markdown) {
      // Clean Markdown copy of every page for AI agents / LLM ingestion.
      const md = `# ${page.title}\n\n${page.description ? `> ${page.description}\n\n` : ''}${page.markdown.trim()}\n`;
      const target = page.url === '/' ? join(out, 'index.md') : join(out, page.url.replace(/\/$/, '') + '.md');
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, md);
    }
  }
  write('/404.html', render({ title: 'Page not found', url: '/404/', layout: 'notFound', noindex: true, html: '', toc: [] }));

  // 4. SEO / discovery files
  const indexable = pages.filter(p => !p.noindex && !p.draft);
  writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map(p => `<url><loc>${site.url}${p.url}</loc>${(p.updated || p.date) ? `<lastmod>${(p.updated || p.date).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`);

  const aiBots = ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'CCBot', 'PerplexityBot', 'Bytespider', 'Applebot-Extended'];
  const trainingBots = ['GPTBot', 'anthropic-ai', 'Google-Extended', 'CCBot', 'Bytespider', 'Applebot-Extended'];
  const blocked = site.aiCrawlers === 'block' ? aiBots : site.aiCrawlers === 'search-only' ? trainingBots : [];
  writeFileSync(join(out, 'robots.txt'),
    `User-agent: *\nAllow: /\n${blocked.map(b => `\nUser-agent: ${b}\nDisallow: /`).join('\n')}\n\nSitemap: ${site.url}/sitemap.xml\n`);

  if (site.feed) writeFileSync(join(out, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${e(site.title)}</title><link>${site.url}/</link><description>${e(site.description)}</description><language>${site.lang}</language>
<atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${articles.slice(0, 50).map(a => `<item><title>${e(a.title)}</title><link>${site.url}${a.url}</link><guid>${site.url}${a.url}</guid><pubDate>${a.date.toUTCString()}</pubDate><description>${e(a.description || a.excerpt)}</description></item>`).join('\n')}
</channel></rss>`);

  if (site.llms) {
    const line = p => `- [${p.title}](${site.url}${p.url === '/' ? '/index.md' : p.url.replace(/\/$/, '') + '.md'})${p.description ? `: ${p.description}` : ''}`;
    const groups = Object.entries(sections).map(([n, items]) => `## ${n[0].toUpperCase() + n.slice(1)}\n\n${items.map(line).join('\n')}`);
    const loose = indexable.filter(p => p.rel && !p.section);
    writeFileSync(join(out, 'llms.txt'), `# ${site.title}\n\n> ${site.description}\n\n${loose.length ? `## Pages\n\n${loose.map(line).join('\n')}\n\n` : ''}${groups.join('\n\n')}\n`);
    writeFileSync(join(out, 'llms-full.txt'), indexable.filter(p => p.markdown).map(p => `# ${p.title}\nURL: ${site.url}${p.url}\n\n${p.markdown.trim()}`).join('\n\n---\n\n'));
  }

  // Client-side search index (optional to use; costs nothing if unused).
  writeFileSync(join(out, 'search-index.json'), JSON.stringify(indexable.filter(p => p.rel).map(p => ({ t: p.title, u: p.url, d: p.description || p.excerpt, k: p.tags?.map(t => t.name) }))));

  // Host config: long-lived caching for assets + security headers (Netlify / Cloudflare Pages format).
  writeFileSync(join(out, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: interest-cohort=()
/*.html
  Cache-Control: public, max-age=0, must-revalidate
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`);
  if (site.indexNowKey) writeFileSync(join(out, `${site.indexNowKey}.txt`), site.indexNowKey);

  const ms = Math.round(performance.now() - t0);
  return { pages: pages.length + 1, ms, warnings, out };
}
