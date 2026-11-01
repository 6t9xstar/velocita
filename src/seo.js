import { escapeHtml as e } from './markdown.js';

const abs = (site, p) => (/^https?:/.test(p) ? p : site.url.replace(/\/$/, '') + (p.startsWith('/') ? p : '/' + p));

// Everything a search engine, social network or AI answer engine wants in <head>.
export function seoHead(page, site) {
  const title = page.url === '/' ? (page.title || site.title) : `${page.title} ${site.titleSeparator || '|'} ${site.title}`;
  const desc = page.description || page.excerpt || site.description || '';
  const canonical = abs(site, page.canonical || page.url);
  const image = page.image || site.image;
  const robots = page.noindex || page.draft ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const isArticle = page.type === 'article';

  const tags = [
    `<title>${e(title)}</title>`,
    `<meta name="description" content="${e(desc)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta name="robots" content="${robots}">`,
    `<meta property="og:type" content="${isArticle ? 'article' : 'website'}">`,
    `<meta property="og:site_name" content="${e(site.title)}">`,
    `<meta property="og:title" content="${e(page.title || site.title)}">`,
    `<meta property="og:description" content="${e(desc)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:locale" content="${e((site.lang || 'en').replace('-', '_'))}">`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
  ];
  if (site.twitter) tags.push(`<meta name="twitter:site" content="${e(site.twitter)}">`);
  if (image) tags.push(`<meta property="og:image" content="${abs(site, image)}">`, `<meta name="twitter:image" content="${abs(site, image)}">`);
  if (isArticle && page.date) {
    tags.push(`<meta property="article:published_time" content="${page.date.toISOString()}">`);
    if (page.updated) tags.push(`<meta property="article:modified_time" content="${page.updated.toISOString()}">`);
    for (const t of page.tags || []) tags.push(`<meta property="article:tag" content="${e(t)}">`);
  }
  for (const alt of page.alternates || []) tags.push(`<link rel="alternate" hreflang="${e(alt.lang)}" href="${abs(site, alt.url)}">`);
  if (site.feed !== false) tags.push(`<link rel="alternate" type="application/rss+xml" title="${e(site.title)}" href="/feed.xml">`);
  tags.push(`<script type="application/ld+json">${JSON.stringify(jsonLd(page, site, canonical, desc, image)).replace(/</g, '\\u003c')}</script>`);
  return tags.join('\n');
}

export function jsonLd(page, site, canonical, desc, image) {
  const org = { '@type': site.organization ? 'Organization' : 'Person', name: site.author || site.title, url: site.url };
  if (site.logo) org.logo = abs(site, site.logo);
  const graph = [{ '@type': 'WebSite', '@id': site.url + '#website', url: site.url, name: site.title, description: site.description, inLanguage: site.lang || 'en', publisher: org }];
  const crumbs = breadcrumbs(page);
  if (crumbs.length > 1) graph.push({
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(site, c.url) })),
  });
  if (page.type === 'article') graph.push({
    '@type': page.schemaType || 'BlogPosting',
    headline: page.title, description: desc, mainEntityOfPage: canonical,
    datePublished: page.date?.toISOString(), dateModified: (page.updated || page.date)?.toISOString(),
    author: { '@type': 'Person', name: page.author || site.author || site.title },
    publisher: org, keywords: (page.tags || []).join(', ') || undefined,
    wordCount: page.words, image: image ? abs(site, image) : undefined, inLanguage: site.lang || 'en',
  });
  if (page.faq) graph.push({
    '@type': 'FAQPage',
    mainEntity: page.faq.map(f => { const [q, a] = String(f).split('::'); return { '@type': 'Question', name: q.trim(), acceptedAnswer: { '@type': 'Answer', text: (a || '').trim() } }; }),
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function breadcrumbs(page) {
  const parts = page.url.split('/').filter(Boolean);
  const out = [{ name: 'Home', url: '/' }];
  let acc = '';
  parts.forEach((p, i) => {
    acc += '/' + p;
    out.push({ name: i === parts.length - 1 ? page.title : p.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()), url: acc + '/' });
  });
  return out;
}

// Lightweight SEO linter: reports problems at build time so nothing ships broken.
export function lintPage(page) {
  const w = [];
  if (!page.title) w.push('missing title');
  else if (page.title.length > 60) w.push(`title is ${page.title.length} chars (>60)`);
  if (!page.description) w.push('missing description');
  else if (page.description.length > 160) w.push(`description is ${page.description.length} chars (>160)`);
  if (/<img(?![^>]*\balt=)[^>]*>|<img[^>]*alt=""/.test(page.html || '')) w.push('image without alt text');
  if ((page.html || '').match(/<h1[\s>]/g)?.length) w.push('h1 inside content (layout already renders h1 from title)');
  return w;
}
