// Fast, dependency-free Markdown -> HTML with SEO/perf defaults:
// - heading ids + table of contents
// - images get loading="lazy" decoding="async" (first image gets fetchpriority="high" for LCP)
// - external links get rel="noopener" and target="_blank"
export const escapeHtml = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Link/image URLs: script-capable schemes become "#". data: is allowed only for raster images.
// Runs on HTML-escaped text, so entities like &#106; can't smuggle a scheme past the check.
export const safeUrl = u => {
  const s = String(u).replace(/[\u0000-\u0020\u007f]+/g, '').toLowerCase();
  if (/^(javascript|vbscript|file):/.test(s)) return '#';
  if (s.startsWith('data:') && !/^data:image\/(png|gif|jpe?g|webp|avif);/.test(s)) return '#';
  return u;
};

export const slugify = s => String(s).toLowerCase().normalize('NFKD')
  .replace(/[̀-ͯ]/g, '').replace(/<[^>]+>/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');

export function renderMarkdown(md, opts = {}) {
  const toc = [];
  const used = new Map();
  let imgCount = 0;
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const inline = text => {
    const codes = [];
    text = text.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(escapeHtml(c)) - 1}\u0000`);
    text = escapeHtml(text);
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, alt, src, title) => {
      const first = imgCount++ === 0 && opts.eagerFirstImage !== false;
      src = safeUrl(src);
      const img = (src !== '#' && opts.image && opts.image(src)) || { src };
      return `<img src="${img.src}"${img.srcset ? ` srcset="${img.srcset}" sizes="${img.sizes}"` : ''} alt="${alt}"${title ? ` title="${title}"` : ''}${img.width ? ` width="${img.width}" height="${img.height}"` : ''}${first ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
    });
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      href = safeUrl(href);
      const ext = /^https?:\/\//.test(href) && !(opts.siteUrl && href.startsWith(opts.siteUrl));
      return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    });
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>');
    return text.replace(/\u0000(\d+)\u0000/g, (_, n) => `<code>${codes[n]}</code>`);
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = /^```(\w*)/.exec(line);
    if (fence) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code${fence[1] ? ` class="language-${fence[1]}"` : ''}>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }

    const h = /^(#{1,6})\s+(.*?)\s*#*$/.exec(line);
    if (h) {
      const level = h[1].length;
      const html = inline(h[2]);
      let id = slugify(h[2]) || 'section';
      const n = used.get(id) || 0;
      used.set(id, n + 1);
      if (n) id += `-${n}`;
      if (level >= 2 && level <= 3) toc.push({ level, id, text: html.replace(/<[^>]+>/g, '') });
      out.push(`<h${level} id="${id}">${html}</h${level}>`);
      i++;
      continue;
    }

    if (/^(\*\s*){3,}$|^(-\s*){3,}$/.test(line.trim())) { out.push('<hr>'); i++; continue; }

    if (line.startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${renderMarkdown(buf.join('\n'), { ...opts, eagerFirstImage: false }).html}</blockquote>`);
      continue;
    }

    // Tables (GFM)
    if (line.includes('|') && /^\s*\|?\s*:?-+/.test(lines[i + 1] || '')) {
      const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) rows.push(cells(lines[i++]));
      out.push(`<table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }

    const listRe = /^\s*([-*+]|\d+\.)\s+(.*)$/;
    if (listRe.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && listRe.test(lines[i])) items.push(inline(listRe.exec(lines[i++])[2]));
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map(t => `<li>${t}</li>`).join('')}</${tag}>`);
      continue;
    }

    if (opts.html !== false && /^<[a-zA-Z!/]/.test(line)) { // raw HTML block (off for untrusted content: escaped as text)
      const buf = [];
      while (i < lines.length && lines[i].trim()) buf.push(lines[i++]);
      out.push(buf.join('\n'));
      continue;
    }

    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|\s*([-*+]|\d+\.)\s)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }

  const html = out.join('\n');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  return { html, toc, text, words, readingTime: Math.max(1, Math.round(words / 230)) };
}
