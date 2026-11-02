import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { build, parseFrontmatter } from '../src/index.js';

function site(files, config = '') {
  const root = mkdtempSync(join(tmpdir(), 'vel-schema-'));
  writeFileSync(join(root, 'velocita.config.js'), `export default { title: 'T', url: 'https://t.example', ogImages: false, cache: false, ${config} };`);
  for (const [f, c] of Object.entries(files)) {
    mkdirSync(dirname(join(root, f)), { recursive: true });
    writeFileSync(join(root, f), c);
  }
  return root;
}

const schema = `collections: { blog: { schema: {
  title: 'string', date: 'date', tags: 'string[]?', featured: 'boolean?',
  rating: { type: 'number', required: false, validate: v => (v >= 1 && v <= 5) || 'must be 1-5' },
} } }`;

test('frontmatter: nested maps, lists of maps, lists of lists', () => {
  const { data } = parseFrontmatter('---\ntitle: T\nauthor:\n  name: Ada\n  links:\n    - https://a.example\n    - b\nsponsors:\n  - name: Acme\n    tier: gold\n  - plain\nsame:\n- x\n- y\nempty:\nn: 2\n---\nbody');
  assert.deepEqual(data, {
    title: 'T', author: { name: 'Ada', links: ['https://a.example', 'b'] },
    sponsors: [{ name: 'Acme', tier: 'gold' }, 'plain'], same: ['x', 'y'], empty: [], n: 2,
  });
});

test('schema: valid content builds', async () => {
  const root = site({ 'content/blog/a.md': '---\ntitle: A\ndate: 2026-01-01\ntags: [x]\nrating: 4\nextra: ok\n---\n\na\n' }, schema);
  await build(root);
});

test('schema: errors name the file and field', async () => {
  const root = site({
    'content/blog/a.md': '---\ntitle: A\n---\n\na\n',
    'content/blog/b.md': '---\ntitle: 3\ndate: soon\ntags: [1]\nfeatured: yes\nrating: 9\n---\n\nb\n',
    'content/about.md': '---\ntitle: About\n---\n\nnot in a collection\n',
  }, schema);
  await assert.rejects(build(root), err => {
    for (const re of [
      /blog\/a\.md: field "date" is required/, /blog\/b\.md: field "title" must be a string/,
      /blog\/b\.md: field "date" must be a date/, /blog\/b\.md: field "tags" must be a list of strings/,
      /blog\/b\.md: field "featured" must be a boolean/, /blog\/b\.md: field "rating": must be 1-5/,
    ]) assert.match(err.message, re);
    assert.doesNotMatch(err.message, /about\.md/);
    return true;
  });
});

test('schema: unknown types are config errors', async () => {
  const root = site({ 'content/blog/a.md': '---\ntitle: A\n---\n\na\n' }, `collections: { blog: { schema: { title: 'text' } } }`);
  await assert.rejects(build(root), /collections\.blog\.schema\.title: unknown type "text"/);
});

test('duplicate routes fail the build with both files', async () => {
  const root = site({
    'content/blog/Hello.md': '---\ntitle: A\n---\n\na\n',
    'content/blog/hello.md': '---\ntitle: B\n---\n\nb\n',
  });
  // Case-insensitive file systems can't hold both names; use a permalink clash there too.
  writeFileSync(join(root, 'content/x.md'), '---\ntitle: X\npermalink: /about/\n---\n\nx\n');
  writeFileSync(join(root, 'content/about.md'), '---\ntitle: About\n---\n\ny\n');
  await assert.rejects(build(root), /Duplicate route \/(about|blog\/hello)\/: \S+\.md and \S+\.md/);
});
