import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { request } from 'node:http';
import { build, dev } from '../src/index.js';
import { Output } from '../src/output.js';
import { pingIndexNow } from '../src/indexnow.js';
import { writeDeployConfig } from '../src/deploy.js';

const site = (files, config = "export default { title: 'T', ogImages: false };") => {
  const root = mkdtempSync(join(tmpdir(), 'vel-sec-'));
  writeFileSync(join(root, 'velocita.config.js'), config);
  for (const [f, body] of Object.entries(files)) {
    mkdirSync(join(root, f, '..'), { recursive: true });
    writeFileSync(join(root, f), body);
  }
  return root;
};

test('output writer refuses paths outside the output directory', () => {
  const root = mkdtempSync(join(tmpdir(), 'vel-out-'));
  const out = new Output(join(root, 'dist'));
  for (const bad of ['../x.txt', 'a/../../x.txt', '..\\x.txt']) assert.throws(() => out.emit(bad, 'x'), /escapes the output directory/);
  assert.throws(() => out.emitLazy('../x', 'k', () => 'x'), /escapes/);
  out.emit('/ok/index.html', 'ok'); // a leading slash is relative to dist/
});

test('output writer ignores manifest entries pointing outside dist/', async () => {
  const root = mkdtempSync(join(tmpdir(), 'vel-out-'));
  writeFileSync(join(root, 'victim.txt'), 'keep me');
  mkdirSync(join(root, 'dist'));
  writeFileSync(join(root, 'dist/.velocita-manifest.json'), JSON.stringify({ '../victim.txt': 'h' }));
  const r = await new Output(join(root, 'dist')).flush();
  assert.equal(r.removed, 0);
  assert.equal(readFileSync(join(root, 'victim.txt'), 'utf8'), 'keep me');
});

test('build rejects permalinks that escape dist/ or break attributes', async () => {
  for (const p of ['../../evil/', '/a/../../b/', 'no-slash/', '/x" onmouseover="alert(1)/', '/a b/']) {
    const root = site({ 'content/x.md': `---\ntitle: X\npermalink: ${JSON.stringify(p)}\n---\n\nx\n` });
    await assert.rejects(build(root), /invalid permalink/, p);
    assert.equal(existsSync(join(root, 'evil')), false);
  }
  const ok = site({ 'content/x.md': '---\ntitle: X\npermalink: /custom/url/\n---\n\nx\n' });
  await build(ok);
  assert.ok(existsSync(join(ok, 'dist/custom/url/index.html')));
});

test('build validates indexNowKey (it becomes a file name)', async () => {
  const root = site({ 'content/index.md': '---\ntitle: H\n---\n\nh\n' }, "export default { title: 'T', ogImages: false, indexNowKey: '../../pwn' };");
  await assert.rejects(build(root), /indexNowKey must be/);
});

test('IndexNow treats only real local hosts as local', async () => {
  const fetchImpl = async () => ({ status: 200 });
  const key = 'abcdef12';
  assert.ok((await pingIndexNow({ url: 'http://127.0.0.1:3000', indexNowKey: key }, ['x'], { fetchImpl })).skipped);
  assert.ok((await pingIndexNow({ url: 'http://app.localhost', indexNowKey: key }, ['x'], { fetchImpl })).skipped);
  assert.equal((await pingIndexNow({ url: 'https://notlocalhost.com', indexNowKey: key }, ['x'], { fetchImpl })).submitted, 1);
});

test('deploy init: package names are TOML-quoted', () => {
  const root = mkdtempSync(join(tmpdir(), 'vel-dep-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'a"\nevil = "1' }));
  writeDeployConfig(root, 'cloudflare');
  const toml = readFileSync(join(root, 'wrangler.toml'), 'utf8');
  assert.match(toml, /^name = "a\\"\\nevil = \\"1"$/m);
  assert.doesNotMatch(toml, /^evil/m);
});

test('dev server answers 503 instead of crashing when the first build fails', async () => {
  const root = site({ 'content/index.md': '---\ntitle: H\npermalink: ../bad/\n---\n\nh\n' });
  const server = await dev(root, 0);
  try {
    const status = await new Promise((ok, fail) => request({ host: '127.0.0.1', port: server.address().port, path: '/' }, res => { res.resume(); ok(res.statusCode); }).on('error', fail).end());
    assert.equal(status, 503);
  } finally { server.close(); }
});

test('markdown: script-capable URL schemes are neutralised in links and images', async () => {
  const { renderMarkdown } = await import('../src/index.js');
  const evil = ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'vbscript:msgbox', 'data:text/html;base64,PHNjcmlwdD4=', 'file:///etc/passwd'];
  for (const u of evil) {
    const { html } = renderMarkdown(`[x](${u}) ![y](${u})`);
    assert.doesNotMatch(html, /(href|src)="(?!#")/i, u);
  }
  // Entities are escaped first, so &#106;avascript: stays inert text.
  assert.match(renderMarkdown('[x](&#106;avascript:alert(1))').html, /href="&amp;#106;/);
  const ok = renderMarkdown('[a](https://e.com) [b](/p/) [c](#h) [d](mailto:a@b.c) ![i](data:image/png;base64,AA)').html;
  for (const u of ['https://e.com', '/p/', '#h', 'mailto:a@b.c', 'data:image/png;base64,AA']) assert.ok(ok.includes(`"${u}"`), u);
});

test('markdown: attribute and tag injection is escaped', async () => {
  const { renderMarkdown } = await import('../src/index.js');
  const { html } = renderMarkdown('[x" onclick="alert(1)](/a) ![a" onerror="alert(1)](/i.png) **<img src=x onerror=alert(1)>** `</code><script>`');
  assert.doesNotMatch(html, /<script|<img src=x| on\w+="/);
});

test('untrusted content: html: false and trusted: false escape raw HTML', async () => {
  const { renderMarkdown } = await import('../src/index.js');
  assert.match(renderMarkdown('<div>ok</div>').html, /^<div>ok<\/div>$/); // trusted default unchanged
  assert.equal(renderMarkdown('<script>alert(1)</script>', { html: false }).html, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');

  const config = `export default { title: 'T', ogImages: false, cache: false, sources: [async () => [
    { path: 'blog/cms.md', trusted: false, data: { title: 'CMS' }, body: '<script>alert(1)</script>' },
    { path: 'raw.html', trusted: false, data: { title: 'Raw' }, body: '<iframe src="https://evil"></iframe>' },
  ]] };`;
  const root = site({ 'content/local.md': '---\ntitle: L\n---\n\n<aside>local</aside>\n' }, config);
  await build(root);
  const read = f => readFileSync(join(root, 'dist', f), 'utf8');
  assert.doesNotMatch(read('blog/cms/index.html'), /<script>alert/);
  assert.doesNotMatch(read('raw/index.html'), /<iframe/);
  assert.match(read('local/index.html'), /<aside>local<\/aside>/);

  const strict = site({ 'content/x.md': '---\ntitle: X\n---\n\n<script>alert(1)</script>\n' }, "export default { title: 'T', ogImages: false, html: false };");
  await build(strict);
  assert.doesNotMatch(readFileSync(join(strict, 'dist/x/index.html'), 'utf8'), /<script>alert/);
});

test('head URLs (canonical, og:image) must be http(s) or site paths', async () => {
  for (const [k, v] of [['canonical', 'javascript:alert(1)'], ['image', 'data:text/html,x'], ['canonical', '/a" onload="x']]) {
    const root = site({ 'content/x.md': `---\ntitle: X\n${k}: ${JSON.stringify(v)}\n---\n\nx\n` });
    await assert.rejects(build(root), /invalid URL/, `${k}: ${v}`);
  }
  const ok = site({ 'content/x.md': '---\ntitle: X\ncanonical: https://other.example/x/\nimage: /og.png\n---\n\nx\n' });
  await build(ok);
  assert.match(readFileSync(join(ok, 'dist/x/index.html'), 'utf8'), /<link rel="canonical" href="https:\/\/other\.example\/x\/">/);
});

test('dev server watches the configured contentDir', async () => {
  const root = site({ 'pages/index.md': '---\ntitle: H\n---\n\nfirst\n' }, "export default { title: 'T', ogImages: false, contentDir: 'pages' };");
  const server = await dev(root, 0);
  const get = () => new Promise((ok, fail) => request({ host: '127.0.0.1', port: server.address().port, path: '/' }, res => {
    let b = ''; res.on('data', d => (b += d)).on('end', () => ok(b));
  }).on('error', fail).end());
  try {
    writeFileSync(join(root, 'pages/index.md'), '---\ntitle: H\n---\n\nsecond\n');
    let body = '';
    for (let i = 0; i < 50 && !/second/.test(body); i++) { await new Promise(r => setTimeout(r, 100)); body = await get(); }
    assert.match(body, /second/);
  } finally { server.close(); }
});
