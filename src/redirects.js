import { escapeHtml as e } from './markdown.js';

const norm = u => (/^https?:/.test(u) ? u : ('/' + u.replace(/^\/+/, '')).replace(/([^/])$/, (m, c) => (/\.[a-z0-9]+$/i.test(u) ? c : c + '/')));

// Redirects from `aliases:` frontmatter and `site.redirects` ({ '/old/': '/new/' }).
// Emits `_redirects` (Netlify / Cloudflare Pages: real 301s at the edge) and, for static
// hosts without redirect support, an HTML fallback at the old URL (canonical + meta refresh).
export function writeRedirects({ site, pages, emit }) {
  const rules = [];
  for (const p of pages) for (const a of [].concat(p.aliases || [])) rules.push([norm(String(a)), p.url]);
  for (const [from, to] of Object.entries(site.redirects || {})) rules.push([norm(from), /^https?:/.test(to) ? to : norm(to)]);
  const existing = new Set(pages.map(p => p.url));
  const conflicts = [];
  const seen = new Map();
  for (const [from, to] of rules) {
    if (existing.has(from)) conflicts.push(`redirect source ${from} is also a page`);
    if (seen.has(from) && seen.get(from) !== to) conflicts.push(`redirect ${from} has two targets: ${seen.get(from)}, ${to}`);
    seen.set(from, to);
  }
  if (!seen.size) return { count: 0, conflicts, sources: [] };

  emit('_redirects', [...seen].map(([from, to]) => `${from} ${to} 301`).join('\n') + '\n');
  for (const [from, to] of seen) {
    if (existing.has(from) || /^https?:/.test(from)) continue;
    const abs = /^https?:/.test(to) ? to : site.url + to;
    emit(from.endsWith('/') ? `${from}index.html` : from, `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${e(abs)}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${e(to)}"></head><body><a href="${e(to)}">Moved here</a></body></html>`);
  }
  return { count: seen.size, conflicts, sources: [...seen.keys()] };
}
