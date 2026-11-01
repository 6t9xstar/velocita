import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../src/index.js';
import { createSite, templates } from '../src/scaffold.js';
import { checkSite } from '../src/check.js';
import { writeDeployConfig, targets } from '../src/deploy.js';

const tmp = prefix => mkdtempSync(join(tmpdir(), `velocita-${prefix}-`));

for (const template of ['blog', 'docs', 'business']) {
  test(`template "${template}": scaffolds, builds clean, passes audit and budget`, async () => {
    const root = tmp(template);
    try {
      const site = createSite(join(root, 'acme-site'), { template, title: 'Acme Co' });
      assert.equal(site.title, 'Acme Co');
      const pkg = JSON.parse(readFileSync(join(site.dir, 'package.json'), 'utf8'));
      assert.equal(pkg.name, 'acme-site');
      assert.ok(existsSync(join(site.dir, '.gitignore')));
      assert.doesNotMatch(readFileSync(join(site.dir, 'content/index.md'), 'utf8'), /\{\{/);

      const r = await build(site.dir, { ogImages: false });
      assert.deepEqual(r.warnings, []);
      assert.deepEqual(r.audit.errors, []);
      assert.deepEqual(r.audit.warnings, []);
      const c = checkSite(r.out);
      assert.deepEqual(c.failures.map(f => `${f.url}: ${f.issues}`), []);
      const home = readFileSync(join(r.out, 'index.html'), 'utf8');
      assert.match(home, /<link rel="icon" href="\/favicon\.svg">/);
      assert.ok(existsSync(join(r.out, 'favicon.svg')));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

test('templates list and scaffold guards', () => {
  assert.deepEqual(templates().sort(), ['blog', 'business', 'docs']);
  const root = tmp('guard');
  try {
    writeFileSync(join(root, 'existing.txt'), 'x');
    assert.throws(() => createSite(root), /not empty/);
    assert.throws(() => createSite(join(root, 'new'), { template: 'nope' }), /unknown template/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('docs template: sidebar order, current page, prev/next', async () => {
  const root = tmp('docs');
  try {
    const site = createSite(join(root, 'd'), { template: 'docs' });
    const r = await build(site.dir, { ogImages: false });
    const html = readFileSync(join(r.out, 'docs/installation/index.html'), 'utf8');
    const side = /<nav class="side"[\s\S]*?<\/nav>/.exec(html)[0];
    assert.deepEqual([...side.matchAll(/>([^<]+)<\/a>/g)].map(m => m[1]), ['Introduction', 'Installation', 'Configuration']);
    assert.match(side, /href="\/docs\/installation\/" aria-current="page"/);
    assert.match(html, /rel="prev">← Introduction/);
    assert.match(html, /rel="next">Configuration →/);
    assert.ok(!existsSync(join(r.out, 'docs/feed.xml')), 'docs are pages, not a dated feed');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('deploy configs for every target; vercel translates headers + redirects', async () => {
  const root = tmp('deploy');
  try {
    const site = createSite(join(root, 's'), { template: 'blog' });
    writeFileSync(join(site.dir, 'content/blog/hello-world.md'), readFileSync(join(site.dir, 'content/blog/hello-world.md'), 'utf8').replace('tags: [intro]', 'tags: [intro]\naliases: [/old/]'));
    await build(site.dir, { ogImages: false });
    for (const t of targets) assert.ok(writeDeployConfig(site.dir, t).includes('lighthouserc.json'));
    assert.match(readFileSync(join(site.dir, 'netlify.toml'), 'utf8'), /publish = "dist"/);
    assert.match(readFileSync(join(site.dir, 'wrangler.toml'), 'utf8'), /pages_build_output_dir = "\.\/dist"/);
    const wf = readFileSync(join(site.dir, '.github/workflows/deploy.yml'), 'utf8');
    assert.match(wf, /actions\/deploy-pages@v4/);
    assert.match(wf, /lighthouse-ci-action/);
    const vercel = JSON.parse(readFileSync(join(site.dir, 'vercel.json'), 'utf8'));
    assert.ok(vercel.headers.some(h => h.source === '/(.*).html'));
    assert.ok(vercel.headers.every(h => !/(?<!\.)\*/.test(h.source)), 'no bare * wildcards');
    assert.deepEqual(vercel.redirects, [{ source: '/old/', destination: '/blog/hello-world/', permanent: true }]);
    const lh = JSON.parse(readFileSync(join(site.dir, 'lighthouserc.json'), 'utf8'));
    assert.equal(lh.ci.assert.assertMatrix[0].assertions['categories:seo'][1].minScore, 0.95);
    assert.throws(() => writeDeployConfig(site.dir, 'ftp'), /unknown deploy target/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('check: flags heavy pages, render-blocking resources and CWV hazards', () => {
  const out = tmp('check');
  try {
    mkdirSync(join(out, 'bad'));
    writeFileSync(join(out, 'big.js'), 'x'.repeat(10) + Array.from({ length: 30000 }, (_, i) => `v${i}=${i * 7919};`).join(''));
    writeFileSync(join(out, 'bad/index.html'), `<!doctype html><html><head><link rel="stylesheet" href="/a.css"><script src="/big.js"></script></head><body><img src="/a.jpg" loading="lazy"><img src="/b.jpg" width="1" height="1"></body></html>`);
    writeFileSync(join(out, 'index.html'), `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><img src="/a.jpg" width="10" height="10"></body></html>`);
    const c = checkSite(out);
    assert.equal(c.pages.length, 2);
    const bad = c.failures.find(p => p.url === '/bad/');
    for (const issue of ['JS ', 'render-blocking stylesheet', 'render-blocking script', '1 image(s) without width/height', 'first image is lazy-loaded', 'missing <html lang>', 'missing viewport'])
      assert.ok(bad.issues.some(i => i.includes(issue)), issue);
    assert.ok(!c.failures.some(p => p.url === '/'));
    assert.equal(c.summary.zeroJsPages, 1);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
