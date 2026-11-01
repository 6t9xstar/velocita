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
    `<meta property="og:locale" content="${e((page.lang || site.lang || 'en').replace('-', '_'))}">`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
  ];
  if (site.twitter) tags.push(`<meta name="twitter:site" content="${e(site.twitter)}">`);
  if (image) {
    tags.push(`<meta property="og:image" content="${abs(site, image)}">`, `<meta name="twitter:image" content="${abs(site, image)}">`);
    if (page.imageWidth) tags.push(`<meta property="og:image:width" content="${page.imageWidth}">`, `<meta property="og:image:height" content="${page.imageHeight}">`);
    tags.push(`<meta property="og:image:alt" content="${e(page.imageAlt || page.title || site.title)}">`);
  }
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
  const lang = page.lang || site.lang || 'en';
  const o = typeof site.organization === 'object' ? site.organization : {};
  const org = { '@type': site.organization ? 'Organization' : 'Person', '@id': site.url + '#publisher', name: o.name || site.author || site.title, url: site.url };
  if (o.logo || site.logo) org.logo = abs(site, o.logo || site.logo);
  if (o.sameAs || site.sameAs) org.sameAs = o.sameAs || site.sameAs;
  const graph = [{ '@type': 'WebSite', '@id': site.url + '#website', url: site.url, name: site.title, description: site.description, inLanguage: lang, publisher: org }];
  if (page.url === '/' && site.localBusiness) graph.push(localBusiness(site));
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
    wordCount: page.words, image: image ? abs(site, image) : undefined, inLanguage: lang,
  });
  const schema = page.schema;
  if (schema === 'HowTo' && page.steps) graph.push({
    '@type': 'HowTo', name: page.title, description: desc, totalTime: page.totalTime, image: image ? abs(site, image) : undefined,
    step: page.steps.map((s, i) => { const [name, text] = String(s).split('::'); return { '@type': 'HowToStep', position: i + 1, name: name.trim(), text: (text || name).trim() }; }),
  });
  if (schema === 'Product') graph.push(clean({
    '@type': 'Product', name: page.title, description: desc, image: image ? abs(site, image) : undefined, brand: page.brand && { '@type': 'Brand', name: page.brand }, sku: page.sku,
    offers: page.price != null ? { '@type': 'Offer', price: page.price, priceCurrency: page.currency || 'USD', availability: 'https://schema.org/' + (page.availability || 'InStock'), url: canonical } : undefined,
    aggregateRating: page.rating ? { '@type': 'AggregateRating', ratingValue: page.rating, reviewCount: page.reviewCount || 1 } : undefined,
  }));
  if (page.video) graph.push(clean({
    '@type': 'VideoObject', name: page.videoTitle || page.title, description: desc, contentUrl: /.(mp4|webm)$/.test(page.video) ? page.video : undefined,
    embedUrl: /.(mp4|webm)$/.test(page.video) ? undefined : page.video, thumbnailUrl: abs(site, page.videoThumbnail || image || ''),
    uploadDate: (page.date || new Date()).toISOString(), duration: page.videoDuration,
  }));
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

const clean = o => JSON.parse(JSON.stringify(o));

// LocalBusiness from config: { type: 'Restaurant', name, telephone, priceRange, address: { street, city, region, postalCode, country }, geo: { lat, lng }, openingHours: ['Mo-Fr 09:00-18:00'] }
function localBusiness(site) {
  const b = site.localBusiness;
  return clean({
    '@type': b.type || 'LocalBusiness', '@id': site.url + '#business', name: b.name || site.title, url: site.url,
    image: b.image ? abs(site, b.image) : site.image ? abs(site, site.image) : undefined, telephone: b.telephone, priceRange: b.priceRange, email: b.email,
    address: b.address && { '@type': 'PostalAddress', streetAddress: b.address.street, addressLocality: b.address.city, addressRegion: b.address.region, postalCode: b.address.postalCode, addressCountry: b.address.country },
    geo: b.geo && { '@type': 'GeoCoordinates', latitude: b.geo.lat, longitude: b.geo.lng },
    openingHours: b.openingHours, sameAs: b.sameAs,
  });
}
