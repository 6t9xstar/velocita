import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { renderMarkdown, parseFrontmatter, minifyHtml, build } from '../src/index.js';

test('frontmatter parses scalars, arrays, lists', () => {
  const { data, body } = parseFrontmatter('---\ntitle: "Hi"\nn: 3\ntags: [a, b]\nfaq:\n  - x\n  - y\n---\nbody');
  assert.deepEqual(data, { title: 'Hi', n: 3, tags: ['a', 'b'], faq: ['x', 'y'] });
  assert.equal(body, 'body');
});

test('markdown: heading ids, toc, lazy images, external links', () => {
  const r = renderMarkdown('## Hello World\n\n![a](x.png) ![b](y.png)\n\n[ext](https://x.com) [int](/a/)\n\n## Hello World');
  assert.match(r.html, /<h2 id="hello-world">/);
  assert.match(r.html, /<h2 id="hello-world-1">/);
  assert.match(r.html, /fetchpriority="high"/);
  assert.match(r.html, /loading="lazy"/);
  assert.match(r.html, /target="_blank" rel="noopener">ext/);
  assert.doesNotMatch(r.html, /href="\/a\/" target/);
  assert.equal(r.toc.length, 2);
});

test('markdown escapes html in code', () => {
  assert.match(renderMarkdown('`<b>`').html, /<code>&lt;b&gt;<\/code>/);
});

test('minifier keeps inline spacing and pre blocks', () => {
  const out = minifyHtml('<p>\n  <b>a</b>   <i>b</i>\n</p>\n<pre>  x\n  y</pre>');
  assert.equal(out, '<p><b>a</b> <i>b</i></p><pre>  x\n  y</pre>');
});

test('example site builds with all SEO artifacts', async () => {
  const r = await build('example');
  for (const f of ['index.html', 'blog/index.html', 'blog/why-speed-matters/index.html', 'sitemap.xml', 'robots.txt', 'feed.xml', 'llms.txt', 'llms-full.txt', '404.html', 'blog/why-speed-matters.md', 'tags/seo/index.html', '_headers'])
    assert.ok(existsSync(`${r.out}/${f}`), f);
  const post = readFileSync(`${r.out}/blog/why-speed-matters/index.html`, 'utf8');
  for (const s of ['rel="canonical"', 'og:title', '"BlogPosting"', '"FAQPage"', '"BreadcrumbList"', 'speculationrules', '<table>'])
    assert.ok(post.includes(s), s);
  assert.doesNotMatch(post, /<script(?! type="(application\/ld\+json|speculationrules)")/);
  assert.deepEqual(r.warnings, []);
});

test('responsive images: copied, sized, srcset', async () => {
  const r = await build('example');
  const html = readFileSync(`${r.out}/blog/geo-for-ai-search/index.html`, 'utf8');
  const img = /<img[^>]+>/.exec(html)[0];
  assert.match(img, /src="\/_img\/[0-9a-f]{8}-hero\.jpg"/);
  assert.match(img, /width="2000" height="1000"/);
  assert.match(img, /fetchpriority="high"/);
  assert.match(img, /srcset="[^"]*480w[^"]*960w[^"]*1600w"/);
  for (const [, file] of img.matchAll(/(\/_img\/[0-9a-f]{8}-\d+\.webp)/g)) assert.ok(existsSync(r.out + file), file);
});

test('incremental: second build writes nothing', async () => {
  await build('example', { clean: true });
  const again = await build('example');
  assert.equal(again.written, 0);
  assert.equal(again.removed, 0);
});

test('pagination splits long lists', async () => {
  const r = await build('example', { pageSize: 1, outDir: 'dist-paged', clean: true });
  assert.ok(existsSync(`${r.out}/blog/page/2/index.html`));
  const first = readFileSync(`${r.out}/blog/index.html`, 'utf8');
  assert.match(first, /rel="next"/);
  rmSync(r.out, { recursive: true, force: true });
});
