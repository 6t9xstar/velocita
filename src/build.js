import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseFrontmatter } from './frontmatter.js';
import { renderMarkdown, slugify, escapeHtml as e } from './markdown.js';
import { seoHead, lintPage } from './seo.js';
import { minifyHtml } from './minify.js';
import * as theme from './theme.js';
import { Output } from './output.js';
import { createImagePipeline } from './responsive.js';

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
    minify: true, pageSize: 20, prefetch: true, drafts: false, feed: true, llms: true, markdownMirror: true,
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
  site.root = root;
  const layouts = await loadLayouts(root, site);
  const shell = layouts.shell || theme.shell;
  const contentDir = join(root, site.contentDir);
  const publicDir = join(root, site.publicDir);
  const out = join(root, site.outDir);
  const warnings = [];
  const output = new Output(out, { clean: site.clean });
  const emit = output.emit.bind(output);
  const images = await createImagePipeline(site, emit);

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
        image: src => images.process(src, src.startsWith('/') ? join(publicDir, src) : join(dirname(file), src)),
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

  paginate(pages, site);
  const ctx = { site, pages, articles, sections, tags: tagMap };

  // 3. Write HTML
  for (const f of walk(publicDir)) emit(relative(publicDir, f), readFileSync(f));

  const prefetch = site.prefetch
    ? `<script type="speculationrules">{"prerender":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>`
    : '';
  const write = (url, html) => {
    emit(url.endsWith('.html') ? url : url + 'index.html', html);
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
      emit(page.url === '/' ? 'index.md' : page.url.replace(/\/$/, '') + '.md', md);
    }
  }
  write('/404.html', render({ title: 'Page not found', url: '/404/', layout: 'notFound', noindex: true, html: '', toc: [] }));

  // 4. SEO / discovery files
  const indexable = pages.filter(p => !p.noindex && !p.draft);
  emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map(p => `<url><loc>${site.url}${p.url}</loc>${(p.updated || p.date) ? `<lastmod>${(p.updated || p.date).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`);

  const aiBots = ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended', 'CCBot', 'PerplexityBot', 'Bytespider', 'Applebot-Extended'];
  const trainingBots = ['GPTBot', 'anthropic-ai', 'Google-Extended', 'CCBot', 'Bytespider', 'Applebot-Extended'];
  const blocked = site.aiCrawlers === 'block' ? aiBots : site.aiCrawlers === 'search-only' ? trainingBots : [];
  emit('robots.txt',
    `User-agent: *\nAllow: /\n${blocked.map(b => `\nUser-agent: ${b}\nDisallow: /`).join('\n')}\n\nSitemap: ${site.url}/sitemap.xml\n`);

  if (site.feed) emit('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${e(site.title)}</title><link>${site.url}/</link><description>${e(site.description)}</description><language>${site.lang}</language>
<atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${articles.slice(0, 50).map(a => `<item><title>${e(a.title)}</title><link>${site.url}${a.url}</link><guid>${site.url}${a.url}</guid><pubDate>${a.date.toUTCString()}</pubDate><description>${e(a.description || a.excerpt)}</description></item>`).join('\n')}
</channel></rss>`);

  if (site.llms) {
    const line = p => `- [${p.title}](${site.url}${p.url === '/' ? '/index.md' : p.url.replace(/\/$/, '') + '.md'})${p.description ? `: ${p.description}` : ''}`;
    const groups = Object.entries(sections).map(([n, items]) => `## ${n[0].toUpperCase() + n.slice(1)}\n\n${items.map(line).join('\n')}`);
    const loose = indexable.filter(p => p.rel && !p.section);
    emit('llms.txt', `# ${site.title}\n\n> ${site.description}\n\n${loose.length ? `## Pages\n\n${loose.map(line).join('\n')}\n\n` : ''}${groups.join('\n\n')}\n`);
    emit('llms-full.txt', indexable.filter(p => p.markdown).map(p => `# ${p.title}\nURL: ${site.url}${p.url}\n\n${p.markdown.trim()}`).join('\n\n---\n\n'));
  }

  // Client-side search index (optional to use; costs nothing if unused).
  emit('search-index.json', JSON.stringify(indexable.filter(p => p.rel).map(p => ({ t: p.title, u: p.url, d: p.description || p.excerpt, k: p.tags?.map(t => t.name) }))));

  // Host config: long-lived caching for assets + security headers (Netlify / Cloudflare Pages format).
  emit('_headers', `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: interest-cohort=()
/*.html
  Cache-Control: public, max-age=0, must-revalidate
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`);
  if (site.indexNowKey) emit(`${site.indexNowKey}.txt`, site.indexNowKey);

  await images.flush();
  const stats = await output.flush();
  const ms = Math.round(performance.now() - t0);
  return { pages: pages.length + 1, ms, warnings, out, ...stats };
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
