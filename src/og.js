import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { escapeHtml as e } from './markdown.js';

// Wrap text into at most `max` lines of roughly `width` characters.
function wrap(text, width, max) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if ((line + ' ' + word).trim().length > width && line) { lines.push(line); line = word; }
    else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  if (lines.length > max) { lines.length = max; lines[max - 1] = lines[max - 1].replace(/\s*\S*$/, '…'); }
  return lines;
}

// 1200×630 social card as SVG. Colors come from site.og = { background, accent, color }.
export function ogSvg(page, site) {
  const { background = '#0b1020', accent = '#4f8cff', color = '#ffffff' } = site.og || {};
  const lines = wrap(page.title || site.title, 26, 3);
  const size = lines.length > 2 ? 64 : 76;
  const top = 315 - ((lines.length - 1) * size * 1.15) / 2;
  const meta = [page.date ? page.date.toISOString().slice(0, 10) : '', page.readingTime && page.type === 'article' ? `${page.readingTime} min read` : ''].filter(Boolean).join('  ·  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${background}"/><stop offset="1" stop-color="${accent}" stop-opacity=".35"/></linearGradient></defs>
<rect width="1200" height="630" fill="${background}"/><rect width="1200" height="630" fill="url(#g)"/>
<rect x="80" y="80" width="80" height="8" rx="4" fill="${accent}"/>
<g font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" fill="${color}">
<text x="80" y="140" font-size="32" font-weight="600" opacity=".85">${e(site.title)}</text>
${lines.map((l, i) => `<text x="80" y="${top + i * size * 1.15}" font-size="${size}" font-weight="800">${e(l)}</text>`).join('\n')}
${meta ? `<text x="80" y="560" font-size="28" opacity=".7">${e(meta)}</text>` : ''}
<text x="1120" y="560" font-size="28" opacity=".7" text-anchor="end">${e(site.url.replace(/^https?:\/\//, ''))}</text>
</g></svg>`;
}

// Generates JPEG cards (social networks don't accept SVG) for pages without an `image`.
// Requires the optional `sharp` peer; silently does nothing without it.
export async function generateOgImages(pages, site, output) {
  if (site.ogImages === false) return 0;
  let sharp;
  try { sharp = (await import('sharp')).default; } catch { return 0; }
  const cacheDir = join(site.root, '.velocita-cache', 'og');
  mkdirSync(cacheDir, { recursive: true });
  const todo = pages.filter(p => !p.image && !p.noindex && p.title && !p.pagination?.prev);
  for (const p of todo) {
    const svg = ogSvg(p, site);
    const hash = createHash('sha1').update(svg).digest('hex').slice(0, 10);
    const cache = join(cacheDir, `${hash}.jpg`);
    const slug = p.url === '/' ? 'index' : p.url.replace(/^\/|\/$/g, '').replace(/\//g, '-');
    p.image = `/og/${slug}.jpg`;
    p.imageWidth = 1200;
    p.imageHeight = 630;
    // Rendered lazily during output flush, only if this card changed since the last build.
    output.emitLazy(p.image, hash, async () => {
      if (existsSync(cache)) return readFileSync(cache);
      const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
      writeFileSync(cache, jpg);
      return jpg;
    });
  }
  return todo.length;
}
