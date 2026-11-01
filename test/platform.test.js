import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, fromContentful, fromSanity } from '../src/index.js';

const scriptsIn = html => [...html.matchAll(/<script\b[^>]*>/g)].map(m => m[0]);

test('sources: JSON source becomes a section with pages, feeds and audit coverage', async () => {
  const r = await build('example');
  const html = readFileSync(`${r.out}/news/velocita-0-4/index.html`, 'utf8');
  assert.match(html, /<h1>Velocita 0\.4 Released<\/h1>/);
  assert.match(html, /<strong>JSON source<\/strong>/);
  assert.ok(existsSync(`${r.out}/news/index.html`));
  assert.ok(existsSync(`${r.out}/news/feed.xml`));
  assert.deepEqual(r.audit.errors, []);
});

test('sources: Contentful paginates and maps fields; Sanity runs GROQ', async () => {
  const urls = [];
  const fetchImpl = async (url, opts) => {
    urls.push({ url, auth: opts.headers.Authorization });
    if (url.includes('contentful')) {
      const skip = Number(new URL(url).searchParams.get('skip'));
      return { ok: true, json: async () => ({ total: 1001, items: [{ fields: { slug: `p${skip}`, title: 'T', body: 'x' }, sys: { updatedAt: '2026-01-01' } }].slice(0, skip ? 1 : 1) }) };
    }
    return { ok: true, json: async () => ({ result: [{ slug: 'a', title: 'A', content: 'hi' }] }) };
  };
  const cf = await fromContentful({ space: 's', accessToken: 'tok', contentType: 'post', fetchImpl })();
  assert.equal(urls.length, 2);
  assert.equal(urls[0].auth, 'Bearer tok');
  assert.match(urls[1].url, /skip=1000/);
  assert.deepEqual(cf[0], { path: 'blog/p0.md', data: { title: 'T', updated: '2026-01-01' }, body: 'x' });

  const sanity = await fromSanity({ projectId: 'abc', query: '*[_type=="post"]', section: 'posts', fetchImpl })();
  assert.match(urls[2].url, /^https:\/\/abc\.apicdn\.sanity\.io\/v2025-01-01\/data\/query\/production\?query=/);
  assert.deepEqual(sanity[0], { path: 'posts/a.md', data: { title: 'A' }, body: 'hi' });
});

test('redirects: _redirects, HTML fallback, conflicts', async () => {
  const r = await build('example');
  const rules = readFileSync(`${r.out}/_redirects`, 'utf8');
  assert.match(rules, /^\/old-islands-post\/ \/blog\/interactive-islands\/ 301$/m);
  assert.match(rules, /^\/rss\/ \/feed\.xml 301$/m);
  const fallback = readFileSync(`${r.out}/old-islands-post/index.html`, 'utf8');
  assert.match(fallback, /rel="canonical" href="https:\/\/velocita\.example\.com\/blog\/interactive-islands\/"/);
  assert.match(fallback, /noindex/);

  const dir = mkdtempSync(join(tmpdir(), 'velocita-redirect-'));
  try {
    mkdirSync(join(dir, 'content'));
    writeFileSync(join(dir, 'content/index.md'), '---\ntitle: Home\ndescription: d\naliases: [/about/]\n---\n\nHi');
    writeFileSync(join(dir, 'content/about.md'), '---\ntitle: About\ndescription: d2\n---\n\n[home](/)');
    const c = await build(dir, { ogImages: false });
    assert.ok(c.warnings.some(w => w.includes('redirect source /about/ is also a page')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('feeds: per section, tag and locale, RSS + JSON Feed, advertised in <head>', async () => {
  const r = await build('example');
  for (const f of ['feed.xml', 'feed.json', 'hi/feed.xml', 'blog/feed.json', 'hi/blog/feed.xml', 'tags/performance/feed.json'])
    assert.ok(existsSync(`${r.out}/${f}`), f);
  const tag = JSON.parse(readFileSync(`${r.out}/tags/performance/feed.json`, 'utf8'));
  assert.equal(tag.version, 'https://jsonfeed.org/version/1.1');
  assert.ok(tag.items.length >= 2 && tag.items.every(i => i.tags.includes('performance')));
  const main = JSON.parse(readFileSync(`${r.out}/feed.json`, 'utf8'));
  assert.ok(main.items.every(i => !i.url.includes('/hi/')), 'default feed excludes other locales');
  assert.match(readFileSync(`${r.out}/tags/performance/index.html`, 'utf8'), /href="\/tags\/performance\/feed\.xml"/);
});

test('islands: loader + module only on pages that use them', async () => {
  const r = await build('example');
  const island = readFileSync(`${r.out}/blog/interactive-islands/index.html`, 'utf8');
  const plain = readFileSync(`${r.out}/blog/why-speed-matters/index.html`, 'utf8');
  assert.ok(scriptsIn(island).includes('<script type="module">'));
  assert.match(island, /"counter":"\/_islands\/counter\.[0-9a-f]{8}\.js"/);
  assert.ok(!scriptsIn(plain).includes('<script type="module">'));
  assert.ok(readdirIslands(r.out).some(f => /^counter\.[0-9a-f]{8}\.js$/.test(f)));

  const dir = mkdtempSync(join(tmpdir(), 'velocita-island-'));
  try {
    mkdirSync(join(dir, 'content'));
    writeFileSync(join(dir, 'content/index.md'), '---\ntitle: Home\ndescription: d\n---\n\n<v-island name="nope"></v-island>');
    await assert.rejects(build(dir, { ogImages: false }), /unknown island "nope"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('search: page per locale, noindex, excluded from sitemap, index has languages', async () => {
  const r = await build('example');
  const page = readFileSync(`${r.out}/hi/search/index.html`, 'utf8');
  assert.match(page, /<html lang="hi">/);
  assert.match(page, /noindex/);
  assert.match(page, /"search":"\/_islands\/search\.[0-9a-f]{8}\.js"/);
  assert.doesNotMatch(readFileSync(`${r.out}/sitemap.xml`, 'utf8'), /\.com(\/hi)?\/search\/</);
  const index = JSON.parse(readFileSync(`${r.out}/search-index.json`, 'utf8'));
  assert.ok(index.some(d => d.l === 'hi') && index.some(d => d.l === 'en'));
});

import { readdirSync } from 'node:fs';
function readdirIslands(out) { return readdirSync(join(out, '_islands')); }
