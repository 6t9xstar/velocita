import { escapeHtml as e } from './markdown.js';

// RSS 2.0 + JSON Feed 1.1 for: the whole site (per locale), every section and every tag.
// Returns { [listUrl]: feedBase } so list pages can advertise their own feed.
export function writeFeeds({ site, articles, sections, tags, emit }) {
  if (!site.feed) return {};
  const locales = site.locales || [site.lang];
  const feeds = [];
  for (const lang of locales) {
    const base = lang === locales[0] ? '/' : `/${lang}/`;
    const items = articles.filter(a => a.lang === lang);
    if (items.length || lang === locales[0]) feeds.push({ base, title: site.title, description: site.description, lang, items, home: base });
  }
  for (const [name, items] of Object.entries(sections)) {
    const url = `/${name}/`;
    feeds.push({ base: url, title: `${site.title} – ${name.split('/').pop()}`, description: `Latest ${name.split('/').pop()} from ${site.title}`, lang: items[0].lang, items, home: url });
  }
  for (const [url, t] of Object.entries(tags)) {
    feeds.push({ base: url, title: `${site.title} – #${t.name}`, description: `Articles tagged ${t.name}`, lang: t.lang, items: t.items, home: url });
  }

  const map = {};
  for (const f of feeds) {
    const items = f.items.slice(0, site.feedSize || 50);
    const self = `${site.url}${f.base}feed.xml`;
    emit(`${f.base}feed.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${e(f.title)}</title><link>${site.url}${f.home}</link><description>${e(f.description)}</description><language>${f.lang}</language>
<atom:link href="${self}" rel="self" type="application/rss+xml"/>
${items.map(a => `<item><title>${e(a.title)}</title><link>${site.url}${a.url}</link><guid>${site.url}${a.url}</guid><pubDate>${a.date.toUTCString()}</pubDate><description>${e(a.description || a.excerpt)}</description>${a.tags.map(t => `<category>${e(t.name)}</category>`).join('')}</item>`).join('\n')}
</channel></rss>`);
    emit(`${f.base}feed.json`, JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1', title: f.title, description: f.description, language: f.lang,
      home_page_url: site.url + f.home, feed_url: `${site.url}${f.base}feed.json`,
      authors: site.author ? [{ name: site.author }] : undefined,
      items: items.map(a => ({
        id: site.url + a.url, url: site.url + a.url, title: a.title, summary: a.description || a.excerpt, content_html: a.html,
        date_published: a.date.toISOString(), date_modified: (a.updated || a.date).toISOString(),
        tags: a.tags.map(t => t.name), image: a.image ? new URL(a.image, site.url).href : undefined,
      })),
    }));
    map[f.home] = f.base;
  }
  return map;
}
