// Docs: grouped sidebar (ordered by `order`), breadcrumbs, on-page TOC, prev/next.
export default ({ page, pages, h }) => {
  const e = h.escape;
  const docs = pages.filter(p => p.layout === 'docs').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const groups = [];
  for (const d of docs) {
    const g = d.group || 'Docs';
    (groups.find(x => x.name === g) || groups[groups.push({ name: g, items: [] }) - 1]).items.push(d);
  }
  const i = docs.indexOf(page);
  const prev = docs[i - 1];
  const next = docs[i + 1];
  const toc = page.toc.length >= 2
    ? `<nav class="toc" aria-label="On this page"><strong>On this page</strong><ul>${page.toc.filter(t => t.level === 2).map(t => `<li><a href="#${t.id}">${e(t.text)}</a></li>`).join('')}</ul></nav>`
    : '';
  return `<div class="docs">
<nav class="side" aria-label="Documentation">${groups.map(g => `<p>${e(g.name)}</p><ol>${g.items.map(d => `<li><a href="${d.url}"${d === page ? ' aria-current="page"' : ''}>${e(d.title)}</a></li>`).join('')}</ol>`).join('<br>')}</nav>
<article>
<p class="eyebrow">${e(page.group || 'Docs')}</p>
<h1>${e(page.title)}</h1>
<p class="sub">${e(page.description)}</p>
${toc}
${page.html}
<nav class="prevnext" aria-label="Previous and next">${prev ? `<a href="${prev.url}" rel="prev">← ${e(prev.title)}</a>` : '<span></span>'}${next ? `<a href="${next.url}" rel="next">${e(next.title)} →</a>` : ''}</nav>
</article>
</div>`;
};
