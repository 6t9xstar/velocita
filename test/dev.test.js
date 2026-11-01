import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { request } from 'node:http';
import { dev } from '../src/index.js';

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
