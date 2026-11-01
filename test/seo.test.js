import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../src/index.js';
import { pingIndexNow } from '../src/indexnow.js';

test('audit finds broken links, missing anchors, orphans, duplicates', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'velocita-audit-'));
  try {
    mkdirSync(join(dir, 'content'));
    const page = (name, title, body) => writeFileSync(join(dir, 'content', name), `---\ntitle: ${title}\ndescription: Same description everywhere.\n---\n\n${body}\n`);
    page('index.md', 'Home', '[a](/a/) [gone](/missing/) [bad anchor](/a/#nope) [ok anchor](/a/#real)');
    page('a.md', 'Dup', '## Real');
    page('b.md', 'Dup', 'Nobody links here.');
    const r = await build(dir, { ogImages: false });
    assert.ok(r.audit.errors.some(e => e.includes('broken link → /missing/')));
    assert.ok(r.audit.errors.some(e => e.includes('missing anchor → /a/#nope')));
    assert.ok(!r.audit.errors.some(e => e.includes('#real')));
    assert.ok(r.audit.warnings.some(w => w.includes('b.md: orphan')));
    assert.ok(r.audit.warnings.some(w => w.startsWith('duplicate title "Dup"')));
    assert.ok(r.audit.warnings.some(w => w.startsWith('duplicate description')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('example site passes audit with no errors or warnings', async () => {
  const r = await build('example');
  assert.deepEqual(r.audit.errors, []);
  assert.deepEqual(r.audit.warnings, []);
});

test('multilingual: lang attr, hreflang cluster, switcher, sitemap alternates', async () => {
  const r = await build('example');
  const hi = readFileSync(`${r.out}/hi/blog/speed/index.html`, 'utf8');
  assert.match(hi, /<html lang="hi">/);
  assert.match(hi, /hreflang="en" href="https:\/\/velocita\.example\.com\/blog\/why-speed-matters\/"/);
  assert.match(hi, /hreflang="x-default"/);
  assert.match(hi, /<a href="\/blog\/why-speed-matters\/" hreflang="en" lang="en">English<\/a>/);
  assert.match(hi, /href="\/hi\/tags\/performance\/"/);
  assert.ok(existsSync(`${r.out}/hi/blog/index.html`));
  const sitemap = readFileSync(`${r.out}/sitemap.xml`, 'utf8');
  assert.match(sitemap, /<xhtml:link rel="alternate" hreflang="hi" href="https:\/\/velocita\.example\.com\/hi\/blog\/speed\/"\/>/);
});

test('schema: HowTo steps, OG image generated with dimensions', async () => {
  const r = await build('example');
  const html = readFileSync(`${r.out}/blog/deploy-to-cloudflare/index.html`, 'utf8');
  const ld = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/.exec(html)[1]);
  const howto = ld['@graph'].find(n => n['@type'] === 'HowTo');
  assert.equal(howto.step.length, 4);
  assert.equal(howto.step[0].name, 'Build');
  assert.match(html, /og:image" content="https:\/\/velocita\.example\.com\/og\/blog-deploy-to-cloudflare.jpg"/);
  assert.match(html, /og:image:width" content="1200"/);
  assert.ok(existsSync(`${r.out}/og/blog-deploy-to-cloudflare.jpg`));
});

test('IndexNow posts changed URLs, skips without key or on localhost', async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => { calls.push({ url, body: JSON.parse(opts.body) }); return { status: 200 }; };
  const site = { url: 'https://example.com', indexNowKey: 'abc123' };
  const res = await pingIndexNow(site, ['https://example.com/a/'], { fetchImpl });
  assert.deepEqual(res, { submitted: 1, status: [200] });
  assert.equal(calls[0].body.host, 'example.com');
  assert.equal(calls[0].body.keyLocation, 'https://example.com/abc123.txt');
  assert.ok((await pingIndexNow({ url: 'https://example.com' }, ['x'], { fetchImpl })).skipped);
  assert.ok((await pingIndexNow({ url: 'http://localhost:3000', indexNowKey: 'k' }, ['x'], { fetchImpl })).skipped);
  assert.equal(calls.length, 1);
});

test('head: generator, keywords, author, publisher, twitter, manifest', async () => {
  const { seoHead } = await import('../src/seo.js');
  const site = { title: 'S', url: 'https://x.dev', author: 'Ann', organization: { name: 'Acme', sameAs: ['https://github.com/acme'] }, themeColor: '#123456' };
  const page = { title: 'P', description: 'D', url: '/blog/p/', type: 'article', section: 'blog', date: new Date('2026-01-01'), tags: [{ name: 'seo' }, { name: 'speed' }] };
  const h = seoHead(page, site);
  for (const s of ['name="generator" content="Velocita', 'name="keywords" content="seo, speed"', 'name="author" content="Ann"', 'name="publisher" content="Acme"',
    'name="twitter:title"', 'article:section" content="Blog"', 'article:tag" content="seo"', 'rel="manifest"', 'rel="me" href="https://github.com/acme"', 'theme-color'])
    assert.ok(h.includes(s), s);
  assert.ok(!h.includes('[object Object]'));
});

test('schema: WebPage, CollectionPage list, TechArticle, SoftwareApplication; seoTitle', async () => {
  const { seoHead } = await import('../src/seo.js');
  const site = { title: 'S', url: 'https://x.dev', software: { version: '1.0.0' } };
  assert.match(seoHead({ title: 'Home', url: '/' }, site), /"SoftwareApplication".*"softwareVersion":"1.0.0"/);
  const list = seoHead({ title: 'Blog', url: '/blog/', items: [{ title: 'A', url: '/blog/a/' }] }, site);
  assert.match(list, /"CollectionPage".*"ItemList".*"name":"A"/);
  const doc = seoHead({ title: 'Deploy', seoTitle: 'Deploy guide for S', url: '/docs/deploy/', schemaType: 'TechArticle' }, site);
  assert.match(doc, /<title>Deploy guide for S<\/title>/);
  assert.match(doc, /"TechArticle"/);
  assert.match(doc, /"WebPage".*"speakable"/);
});
