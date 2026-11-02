import { readFileSync } from 'node:fs';
import { escapeHtml as e } from './markdown.js';

export const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

// Absolute http(s) URL for canonical, og:image, hreflang and JSON-LD. Other schemes and
// attribute-breaking characters fail the build rather than ship into <head>.
const abs = (site, p) => {
  const s = String(p);
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:\/\//i.test(s) || /[\s"'<>\\]/.test(s)) throw new Error(`invalid URL ${JSON.stringify(s)} (canonical/image/alternate URLs must be http(s) or site paths)`);
  return /^https?:/i.test(s) ? s : site.url.replace(/\/$/, '') + (s.startsWith('/') ? s : '/' + s);
};
const imageTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif' };
const list = v => (Array.isArray(v) ? v : String(v ?? '').split(',')).map(s => String(s).trim()).filter(Boolean);

// Keywords: explicit frontmatter `keywords`, else the page's tags, else site.keywords.
export const keywordsFor = (page, site) => {
  const own = list(page.keywords);
  if (own.length) return own;
  const tags = (page.tags || []).map(t => t.name ?? t);
  return tags.length ? tags : list(site.keywords);
};

// Everything a search engine, social network or AI answer engine wants in <head>.
export function seoHead(page, site) {
  // `seoTitle` frontmatter overrides the <title> only (nav, headings and breadcrumbs keep `title`).
  const title = page.seoTitle || (page.url === "/" ? (page.title || site.title) : `${page.title} ${site.titleSeparator || "|"} ${site.title}`);
  const desc = page.description || page.excerpt || site.description || '';
  const canonical = abs(site, page.canonical || page.url);
  const image = page.image || site.image;
  const robots = page.noindex || page.draft ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const isArticle = page.type === 'article';
  const author = page.author || site.author;
  const o = typeof site.organization === 'object' ? site.organization : {};
  const publisher = site.publisher || o.name || site.author || site.title;
  const keywords = keywordsFor(page, site);

  const tags = [
    `<title>${e(title)}</title>`,
    `<meta name="description" content="${e(desc)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta name="robots" content="${robots}">`,
    `<meta name="generator" content="Velocita ${VERSION}">`,
    `<meta name="application-name" content="${e(site.title)}">`,
    `<meta name="referrer" content="strict-origin-when-cross-origin">`,
  ];
  if (keywords.length) tags.push(`<meta name="keywords" content="${e(keywords.join(', '))}">`);
  if (author) tags.push(`<meta name="author" content="${e(author)}">`);
  if (publisher) tags.push(`<meta name="publisher" content="${e(publisher)}">`);
  if (site.themeColor) tags.push(`<meta name="theme-color" content="${e(site.themeColor)}">`);
  if (site.manifest !== false) tags.push(`<link rel="manifest" href="/site.webmanifest">`);
  if (site.appleTouchIcon) tags.push(`<link rel="apple-touch-icon" href="${site.appleTouchIcon}">`);
  tags.push(`<link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml">`);
  for (const url of o.sameAs || site.sameAs || []) tags.push(`<link rel="me" href="${e(url)}">`);
  tags.push(
    `<meta property="og:type" content="${isArticle ? 'article' : 'website'}">`,
    `<meta property="og:site_name" content="${e(site.title)}">`,
    `<meta property="og:title" content="${e(page.title || site.title)}">`,
    `<meta property="og:description" content="${e(desc)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:locale" content="${e((page.lang || site.lang || 'en').replace('-', '_'))}">`,
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${e(page.title || site.title)}">`,
    `<meta name="twitter:description" content="${e(desc)}">`,
  );
  if (site.twitter) tags.push(`<meta name="twitter:site" content="${e(site.twitter)}">`);
  if (page.twitter || site.twitter) tags.push(`<meta name="twitter:creator" content="${e(page.twitter || site.twitter)}">`);
  if (image) {
    const src = abs(site, image);
    tags.push(`<meta property="og:image" content="${src}">`, `<meta property="og:image:secure_url" content="${src.replace(/^http:\/\/(?!localhost)/, 'https://')}">`, `<meta name="twitter:image" content="${src}">`);
    const type = imageTypes[(src.split('?')[0].split('.').pop() || '').toLowerCase()];
    if (type) tags.push(`<meta property="og:image:type" content="${type}">`);
    if (page.imageWidth) tags.push(`<meta property="og:image:width" content="${page.imageWidth}">`, `<meta property="og:image:height" content="${page.imageHeight}">`);
    tags.push(`<meta property="og:image:alt" content="${e(page.imageAlt || page.title || site.title)}">`, `<meta name="twitter:image:alt" content="${e(page.imageAlt || page.title || site.title)}">`);
  }
  if (isArticle && page.date) {
    tags.push(`<meta property="article:published_time" content="${page.date.toISOString()}">`);
    const modified = (page.updated || page.date).toISOString();
    tags.push(`<meta property="article:modified_time" content="${modified}">`, `<meta property="og:updated_time" content="${modified}">`);
    if (author) tags.push(`<meta property="article:author" content="${e(page.authorUrl || site.authorUrl || author)}">`);
    if (o.facebook) tags.push(`<meta property="article:publisher" content="${e(o.facebook)}">`);
    if (page.section) tags.push(`<meta property="article:section" content="${e(page.section.split('/').pop().replace(/^\w/, c => c.toUpperCase()))}">`);
    for (const t of page.tags || []) tags.push(`<meta property="article:tag" content="${e(t.name ?? t)}">`);
  }
  // Local business: classic geo meta used by some regional search engines and directories.
  const lb = page.url === '/' && site.localBusiness;
  if (lb?.geo) tags.push(`<meta name="geo.position" content="${lb.geo.lat};${lb.geo.lng}">`, `<meta name="ICBM" content="${lb.geo.lat}, ${lb.geo.lng}">`);
  if (lb?.address?.country) tags.push(`<meta name="geo.region" content="${e(lb.address.country + (lb.address.region ? '-' + lb.address.region : ''))}">`);
  if (lb?.address?.city) tags.push(`<meta name="geo.placename" content="${e(lb.address.city)}">`);
  for (const alt of page.alternates || []) tags.push(`<link rel="alternate" hreflang="${e(alt.lang)}" href="${abs(site, alt.url)}">`);
  if (site.feed !== false) tags.push(`<link rel="alternate" type="application/rss+xml" title="${e(site.title)}" href="${page.feedBase || '/'}feed.xml">`, `<link rel="alternate" type="application/feed+json" title="${e(site.title)}" href="${page.feedBase || '/'}feed.json">`);
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
  // WebPage (or CollectionPage + ItemList for listings): ties the page to the site, breadcrumb and
  // main image, and marks the headline + summary as speakable for voice/answer engines.
  const isList = Array.isArray(page.items) && page.items.length > 0;
  graph.push(clean({
    '@type': isList ? 'CollectionPage' : 'WebPage',
    '@id': canonical + '#webpage', url: canonical, name: page.title || site.title, description: desc, inLanguage: lang,
    isPartOf: { '@id': site.url + '#website' }, primaryImageOfPage: image ? { '@type': 'ImageObject', url: abs(site, image) } : undefined,
    datePublished: page.date?.toISOString(), dateModified: (page.updated || page.date)?.toISOString(),
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', 'main p:first-of-type'] },
    mainEntity: isList ? { '@type': 'ItemList', numberOfItems: page.items.length, itemListElement: page.items.slice(0, 50).map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(site, it.url), name: it.title })) } : undefined,
  }));
  if (page.url === '/' && site.software) graph.push(clean({
    '@type': 'SoftwareApplication', '@id': site.url + '#software', name: site.software.name || site.title, description: site.description, url: site.url,
    applicationCategory: site.software.category || 'DeveloperApplication', operatingSystem: site.software.os || 'Windows, macOS, Linux',
    softwareVersion: site.software.version, license: site.software.license, downloadUrl: site.software.downloadUrl, codeRepository: site.software.repository,
    offers: { '@type': 'Offer', price: site.software.price ?? 0, priceCurrency: site.software.currency || 'USD' }, publisher: { '@id': site.url + '#publisher' },
  }));
  if (page.type !== 'article' && page.schemaType && !isList) graph.push(clean({
    '@type': page.schemaType, headline: page.title, description: desc, mainEntityOfPage: canonical, inLanguage: lang,
    author: { '@id': site.url + '#publisher' }, publisher: { '@id': site.url + '#publisher' }, keywords: keywordsFor(page, site).join(', ') || undefined,
    image: image ? abs(site, image) : undefined, dateModified: (page.updated || page.date)?.toISOString(), wordCount: page.words,
  }));
  if (page.type === 'article') graph.push({
    '@type': page.schemaType || 'BlogPosting',
    headline: page.title, description: desc, mainEntityOfPage: canonical,
    datePublished: page.date?.toISOString(), dateModified: (page.updated || page.date)?.toISOString(),
    author: { '@type': 'Person', name: page.author || site.author || site.title },
    publisher: org, keywords: keywordsFor(page, site).join(', ') || undefined,
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
    '@type': 'VideoObject', name: page.videoTitle || page.title, description: desc, contentUrl: /[.](mp4|webm)$/.test(page.video) ? page.video : undefined,
    embedUrl: /[.](mp4|webm)$/.test(page.video) ? undefined : page.video, thumbnailUrl: abs(site, page.videoThumbnail || image || ''),
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
