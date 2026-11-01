import { escapeHtml as e } from './markdown.js';
import { breadcrumbs } from './seo.js';
import { minifyCss } from './minify.js';

// Default theme. ~3KB of CSS, inlined (no render-blocking request), zero JS,
// system fonts (no font download), dark mode, accessible focus + contrast.
export const css = `
:root{--bg:#fff;--fg:#1a1a1a;--muted:#5c5c5c;--accent:#0b57d0;--line:#e5e5e5;--code:#f5f5f7;color-scheme:light dark}
@media(prefers-color-scheme:dark){:root{--bg:#0f1115;--fg:#e8e8e8;--muted:#a0a0a0;--accent:#8ab4f8;--line:#2a2d33;--code:#1b1e24}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:18px/1.7 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent)}a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.skip{position:absolute;left:-999px}.skip:focus{left:1rem;top:1rem;background:var(--bg);padding:.5rem}
.wrap{max-width:46rem;margin:0 auto;padding:0 1.25rem}
header.site{border-bottom:1px solid var(--line)}header.site .wrap{display:flex;gap:1rem;align-items:center;justify-content:space-between;padding-block:1rem}
header.site nav a{margin-left:1rem;text-decoration:none}.brand{font-weight:700;text-decoration:none;color:var(--fg)}
main{padding-block:2rem 4rem}h1{line-height:1.2;font-size:2.2rem;margin:.5rem 0 1rem}h2,h3{line-height:1.3;margin-top:2.2rem}
img{max-width:100%;height:auto;border-radius:6px}pre{background:var(--code);padding:1rem;overflow:auto;border-radius:6px;font-size:.85em}
code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}:not(pre)>code{background:var(--code);padding:.1em .35em;border-radius:4px;font-size:.9em}
blockquote{margin:1.5rem 0;padding-left:1rem;border-left:3px solid var(--accent);color:var(--muted)}
table{border-collapse:collapse;width:100%}th,td{border:1px solid var(--line);padding:.4rem .6rem;text-align:left}
.meta,.crumbs{color:var(--muted);font-size:.85rem}.crumbs a{color:inherit}
.toc{border:1px solid var(--line);border-radius:6px;padding:.75rem 1rem;font-size:.9rem}.toc ul{margin:0;padding-left:1.1rem}
.list{list-style:none;padding:0}.list li{padding:1rem 0;border-bottom:1px solid var(--line)}.list h2{margin:0 0 .25rem;font-size:1.25rem}
.tags a{display:inline-block;margin:0 .4rem .4rem 0;font-size:.8rem;padding:.1rem .5rem;border:1px solid var(--line);border-radius:99px;text-decoration:none}
.pager{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:2rem}.pager a,.pager span{padding:.2rem .6rem}.pager [aria-current]{font-weight:700}
footer.site{border-top:1px solid var(--line);color:var(--muted);font-size:.85rem;padding-block:2rem}
`;

// Intl formatters are expensive to create; build one per language and reuse it.
const formatters = new Map();
const fmt = lang => formatters.get(lang) || formatters.set(lang, new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' })).get(lang);
export const date = (d, lang) => d ? `<time datetime="${d.toISOString().slice(0, 10)}">${fmt(lang).format(d)}</time>` : '';

// Minify the theme + site CSS once per build, not once per page.
let cssCache = [null, ''];
export const siteCss = extra => cssCache[0] === extra ? cssCache[1] : (cssCache = [extra, minifyCss(css + (extra || ''))])[1];

export const pager = p => !p ? '' : `<nav class="pager" aria-label="Pagination">${p.prev ? `<a href="${p.prev}" rel="prev">← Newer</a>` : ''}${Array.from({ length: p.total }, (_, i) => i + 1).filter(n => n === 1 || n === p.total || Math.abs(n - p.current) <= 2).map((n, i, a) => (i && n - a[i - 1] > 1 ? '<span>…</span>' : '') + (n === p.current ? `<span aria-current="page">${n}</span>` : `<a href="${p.href(n)}">${n}</a>`)).join('')}${p.next ? `<a href="${p.next}" rel="next">Older →</a>` : ''}</nav>`;

// Links to the other translations of this page, labelled in their own language.
const langSwitch = page => (page.alternates || []).filter(a => a.lang !== 'x-default' && a.lang !== page.lang)
  .map(a => `<a href="${a.url}" hreflang="${a.lang}" lang="${a.lang}">${e(new Intl.DisplayNames([a.lang], { type: 'language' }).of(a.lang))}</a>`).join('');

export function shell({ page, site, head, content }) {
  // nav may be a list, or { en: [...], hi: [...] } per locale.
  const items = Array.isArray(site.nav) ? site.nav : (site.nav || {})[page.lang || site.lang] || [];
  const nav = items.map(n => `<a href="${n.url}"${page.url === n.url ? ' aria-current="page"' : ''}>${e(n.title)}</a>`).join('');
  return `<!doctype html>
<html lang="${e(page.lang || site.lang || 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${site.faviconHref ? `<link rel="icon" href="${site.faviconHref}">` : ''}
${head}
<style>${siteCss(site.css)}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap"><a class="brand" href="/">${e(site.title)}</a><nav aria-label="Main">${nav}${langSwitch(page)}</nav></div></header>
<main id="main" class="wrap">${content}</main>
<footer class="site"><div class="wrap">© ${new Date().getFullYear()} ${e(site.author || site.title)} ·${site.feed ? ` <a href="${page.feedBase || '/'}feed.xml">RSS</a> ·` : ''} <a href="/sitemap.xml">Sitemap</a></div></footer>
</body>
</html>`;
}

export const layouts = {
  page: ({ page }) => `<article><h1>${e(page.title)}</h1>${page.html}</article>`,

  post: ({ page, site }) => {
    const crumbs = breadcrumbs(page).map((c, i, a) => i === a.length - 1 ? `<span aria-current="page">${e(c.name)}</span>` : `<a href="${c.url}">${e(c.name)}</a>`).join(' › ');
    const toc = page.toc.length >= 3 ? `<nav class="toc" aria-label="Table of contents"><strong>On this page</strong><ul>${page.toc.map(t => `<li style="margin-left:${(t.level - 2)}rem"><a href="#${t.id}">${e(t.text)}</a></li>`).join('')}</ul></nav>` : '';
    const tags = (page.tags || []).map(t => `<a href="${t.url}">#${e(t.name)}</a>`).join('');
    return `<nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>
<article>
<h1>${e(page.title)}</h1>
<p class="meta">${date(page.date, page.lang || site.lang)}${page.updated ? ` · Updated ${date(page.updated, site.lang)}` : ''} · ${page.readingTime} min read${page.author ? ` · ${e(page.author)}` : ''}</p>
${toc}
${page.html}
${tags ? `<p class="tags">${tags}</p>` : ''}
</article>`;
  },

  list: ({ page, site }) => `<h1>${e(page.title)}</h1>${page.html}
<ul class="list">${page.items.map(p => `<li><h2><a href="${p.url}">${e(p.title)}</a></h2><p class="meta">${date(p.date, site.lang)} · ${p.readingTime} min read</p><p>${e(p.description || p.excerpt)}</p></li>`).join('')}</ul>
${pager(page.pagination)}`,

  search: ({ page }) => `<h1>${e(page.title)}</h1>
<form role="search" action="${page.url}"><input type="search" name="q" aria-label="${e(page.title)}" style="width:100%;font:inherit;padding:.6rem .8rem;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:inherit"></form>
<v-island name="search" load="load"></v-island>
<noscript><p>Search needs JavaScript. Browse the <a href="/sitemap.xml">sitemap</a> instead.</p></noscript>`,

  notFound: () => `<h1>Page not found</h1><p>Sorry, that page doesn’t exist. <a href="/">Go home</a>.</p>`,
};
