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
