import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { request } from 'node:http';
import { dev, preview, doctor, watchTargets, build } from '../src/index.js';

// Raw request so the path reaches the server exactly as written (fetch would normalise ../).
const get = (port, path) => new Promise((ok, fail) => {
  request({ host: '127.0.0.1', port, path }, res => {
    let body = '';
    res.on('data', d => (body += d)).on('end', () => ok({ status: res.statusCode, body }));
  }).on('error', fail).end();
});

test('dev server: binds localhost, survives bad URLs, blocks traversal to sibling folders', async () => {
  const root = mkdtempSync(join(tmpdir(), 'vel-dev-'));
  mkdirSync(join(root, 'content'), { recursive: true });
  writeFileSync(join(root, 'velocita.config.js'), "export default { title: 'T', ogImages: false };");
  writeFileSync(join(root, 'content/index.md'), '---\ntitle: Home\ndescription: Home page for the dev server test.\n---\n\nHello dev.\n');
  mkdirSync(join(root, 'dist-secret'), { recursive: true });
  writeFileSync(join(root, 'dist-secret/key.txt'), 'SECRET');

  const server = await dev(root, 0);
  const { port, address } = server.address();
  try {
    assert.equal(address, '127.0.0.1');
    assert.equal((await get(port, '/')).status, 200);
    assert.match((await get(port, '/')).body, /Hello dev/);
    assert.equal((await get(port, '/%E0%A4%A')).status, 400);          // malformed escape: no crash
    assert.equal((await get(port, '/')).status, 200);                  // still alive
    const sneaky = await get(port, '/../dist-secret/key.txt');
    assert.notEqual(sneaky.status, 200);
    assert.doesNotMatch(sneaky.body, /SECRET/);
    const encoded = await get(port, '/%2e%2e/dist-secret/key.txt');
    assert.equal(encoded.status, 403);
    assert.equal((await get(port, '/nope/')).status, 404);
  } finally {
    await new Promise(r => server.close(r));
    rmSync(root, { recursive: true, force: true });
  }
});

const makeSite = (files, config = "export default { title: 'T', ogImages: false };") => {
  const root = mkdtempSync(join(tmpdir(), 'vel-dev-'));
  writeFileSync(join(root, 'velocita.config.js'), config);
  for (const [f, body] of Object.entries(files)) {
    mkdirSync(join(root, f, '..'), { recursive: true });
    writeFileSync(join(root, f), body);
  }
  return root;
};
const page = (title, body) => `---\ntitle: ${title}\ndescription: A page used by the dev server tests here.\n---\n\n${body}\n`;
const until = async (fn, ms = 5000) => {
  for (const end = Date.now() + ms; Date.now() < end; await new Promise(r => setTimeout(r, 50))) if (await fn()) return true;
  return false;
};

test('watchTargets follows contentDir/layoutsDir/publicDir from the config', async () => {
  const root = makeSite({ 'pages/index.md': page('Home', 'hi'), 'tpl/x.txt': '', 'static/a.txt': '', 'content/old.md': '' },
    "export default { title: 'T', contentDir: 'pages', layoutsDir: 'tpl', publicDir: 'static' };");
  try {
    const t = (await watchTargets(root)).map(p => basename(p)).sort();
    assert.deepEqual(t, ['pages', 'static', 'tpl', 'velocita.config.js']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('dev server: rebuilds from a custom contentDir and shows build errors without crashing', async () => {
  const root = makeSite({ 'pages/index.md': page('Home', 'First version') },
    "export default { title: 'T', ogImages: false, contentDir: 'pages' };");
  const server = await dev(root, 0);
  const { port } = server.address();
  try {
    assert.match((await get(port, '/')).body, /First version/);
    writeFileSync(join(root, 'pages/index.md'), page('Home', 'Second version'));
    assert.ok(await until(async () => /Second version/.test((await get(port, '/')).body)), 'rebuilt after edit');

    writeFileSync(join(root, 'pages/index.md'), '---\ntitle: H\npermalink: ../bad/\n---\n\nh\n');
    assert.ok(await until(async () => (await get(port, '/')).status === 503), 'error page shown');
    const err = await get(port, '/');
    assert.match(err.body, /Build failed/);
    assert.match(err.body, /permalink/);
    assert.match(err.body, /EventSource/);

    writeFileSync(join(root, 'pages/index.md'), page('Home', 'Fixed version'));
    assert.ok(await until(async () => /Fixed version/.test((await get(port, '/')).body)), 'recovers after fix');
  } finally {
    await new Promise(r => server.close(r));
    rmSync(root, { recursive: true, force: true });
  }
});

test('preview serves the built output without rebuilding, and refuses an unbuilt site', async () => {
  const root = makeSite({ 'content/index.md': page('Home', 'Built once') });
  try {
    await assert.rejects(preview(root, 0), /velocita build/);
    await build(root);
    writeFileSync(join(root, 'content/index.md'), page('Home', 'Changed later'));
    const server = await preview(root, 0);
    const { port, address } = server.address();
    try {
      assert.equal(address, '127.0.0.1');
      const home = await get(port, '/');
      assert.equal(home.status, 200);
      assert.match(home.body, /Built once/);
      assert.doesNotMatch(home.body, /__reload/);
      assert.equal((await get(port, '/%2e%2e/velocita.config.js')).status, 403);
      assert.equal((await get(port, '/missing/')).status, 404);
    } finally { await new Promise(r => server.close(r)); }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('doctor reports Node, config, dirs, themes and sharp', async () => {
  const good = makeSite({ 'content/index.md': page('Home', 'x') });
  const bad = makeSite({}, "export default { theme: 'velocita-theme-nope' };");
  const broken = makeSite({}, 'export default {');
  try {
    const r = await doctor(good);
    assert.equal(r.ok, true);
    const by = Object.fromEntries(r.checks.map(c => [c.name, c]));
    for (const n of ['node', 'config', 'theme', 'contentDir', 'layoutsDir', 'publicDir', 'sharp']) assert.ok(by[n], n);
    assert.equal(by.contentDir.status, 'ok');
    assert.equal(by.layoutsDir.status, 'warn');
    assert.ok(['ok', 'warn'].includes(by.sharp.status));

    assert.equal((await doctor(good, { nodeVersion: '18.19.0' })).checks[0].status, 'error');

    const t = await doctor(bad);
    assert.equal(t.ok, false);
    assert.match(t.checks.find(c => c.name === 'config').message, /theme.*not installed/);

    assert.equal((await doctor(broken)).ok, false);
    const empty = makeSite({});
    try { assert.equal((await doctor(empty)).checks.find(c => c.name === 'contentDir').status, 'error'); }
    finally { rmSync(empty, { recursive: true, force: true }); }
  } finally { for (const d of [good, bad, broken]) rmSync(d, { recursive: true, force: true }); }
});
