// Site-wide SEO audit over the rendered output:
// broken internal links + anchors, orphan pages, duplicate titles/descriptions,
// and internal-link suggestions (related articles that don't link to each other).
export function auditSite({ pages, htmlByUrl, files }) {
  const errors = [];
  const warnings = [];
  const suggestions = [];
  const ids = new Map();
  const getIds = url => {
    if (!ids.has(url)) ids.set(url, new Set([...(htmlByUrl.get(url) || '').matchAll(/\sid="([^"]+)"/g)].map(m => m[1])));
    return ids.get(url);
  };
  const exists = path => htmlByUrl.has(path) || files.has(path.replace(/^\//, '')) || htmlByUrl.has(path.endsWith('/') ? path : path + '/');
  const byUrl = new Map(pages.map(p => [p.url, p]));
  const inbound = new Map();
  const linksFrom = new Map();

  for (const [url, html] of htmlByUrl) {
    if (url === '/404/') continue;
    const page = byUrl.get(url);
    const where = page?.rel || url;
    const out = new Set();
    // Ignore <head> (canonical/alternate links) — only count links a visitor can follow.
    const body = html.slice(html.indexOf('<body'));
    for (const [, raw] of body.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
      if (/^(https?:|mailto:|tel:|\/\/|javascript:)/.test(raw)) continue;
      const [pathPart, hash] = raw.split('#');
      const path = decodeURI(pathPart.split('?')[0] || url);
      if (!path.startsWith('/')) continue;
      if (!exists(path)) { errors.push(`${where}: broken link → ${raw}`); continue; }
      const target = htmlByUrl.has(path) ? path : path + '/';
      if (hash && htmlByUrl.has(target) && !getIds(target).has(hash)) errors.push(`${where}: missing anchor → ${raw}`);
      if (target !== url) out.add(target);
    }
    linksFrom.set(url, out);
    for (const t of out) inbound.set(t, (inbound.get(t) || 0) + 1);
  }

  const content = pages.filter(p => p.rel && !p.noindex);
  for (const p of content) if (p.url !== '/' && !inbound.get(p.url)) warnings.push(`${p.rel}: orphan page (no internal links point to it)`);

  for (const field of ['title', 'description']) {
    const seen = new Map();
    for (const p of content) if (p[field]) (seen.get(p[field]) || seen.set(p[field], []).get(p[field])).push(p.rel);
    for (const [v, rels] of seen) if (rels.length > 1) warnings.push(`duplicate ${field} "${v}" in: ${rels.join(', ')}`);
  }

  // Related = shares tags. Tags on more than 50 articles are too generic to suggest from.
  const articles = content.filter(p => p.type === 'article');
  const byTag = new Map();
  for (const a of articles) for (const t of a.tags) (byTag.get(t.url) || byTag.set(t.url, []).get(t.url)).push(a);
  for (const a of articles) {
    const linked = linksFrom.get(a.url) || new Set();
    const score = new Map();
    for (const t of a.tags) {
      const peers = byTag.get(t.url);
      if (peers.length > 50) continue;
      for (const b of peers) if (b !== a && !linked.has(b.url)) score.set(b, (score.get(b) || 0) + 1);
    }
    const related = [...score].sort((x, y) => y[1] - x[1]).slice(0, 3);
    if (related.length) suggestions.push(`${a.rel}: consider linking to ${related.map(([b]) => b.url).join(', ')}`);
  }
  return { errors, warnings, suggestions };
}
