// Docs layout: sidebar ordered by `order` frontmatter, table of contents, prev/next links.
export default ({ page, pages, h }) => {
  const e = h.escape;
  const docs = pages.filter(p => p.layout === 'docs' && p.lang === page.lang).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const i = docs.indexOf(page);
  const prev = docs[i - 1];
  const next = docs[i + 1];
  const toc = page.toc.length >= 2
    ? `<nav class="toc" aria-label="On this page"><strong>On this page</strong><ul>${page.toc.map(t => `<li><a href="#${t.id}">${e(t.text)}</a></li>`).join('')}</ul></nav>`
    : '';
  return `<div class="docs">
<nav class="side" aria-label="Documentation"><ol>${docs.map(d => `<li><a href="${d.url}"${d === page ? ' aria-current="page"' : ''}>${e(d.title)}</a></li>`).join('')}</ol></nav>
<article>
<h1>${e(page.title)}</h1>
${toc}
${page.html}
<nav class="prevnext" aria-label="Previous and next">${prev ? `<a href="${prev.url}" rel="prev">← ${e(prev.title)}</a>` : '<span></span>'}${next ? `<a href="${next.url}" rel="next">${e(next.title)} →</a>` : ''}</nav>
</article>
</div>`;
};
