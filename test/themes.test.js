import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PassThrough } from 'node:stream';
import { build, askSite, createSite, templateInfo, templates } from '../src/index.js';

function site(config) {
  const root = mkdtempSync(join(tmpdir(), 'vel-theme-'));
  mkdirSync(join(root, 'content/blog'), { recursive: true });
  writeFileSync(join(root, 'package.json'), '{"name":"t","type":"module"}');
  writeFileSync(join(root, 'velocita.config.js'), `export default ${config};`);
  writeFileSync(join(root, 'content/index.md'), '---\ntitle: Home\ndescription: Home page used by the theme tests.\n---\n\nHi.\n');
  for (const i of [1, 2]) writeFileSync(join(root, `content/blog/p${i}.md`), `---\ntitle: Post ${i}\ndescription: Post ${i} for the theme tests.\ndate: 2026-01-0${i}\n---\n\nBody ${i}.\n`);
  return root;
}

test('themes: npm package from the site node_modules, layouts + css + config, site overrides win', async () => {
  const root = site(`{ title: 'T', url: 'https://t.example', ogImages: false, theme: 'velocita-theme-test', css: '.mine{color:red}', themeColor: '#111111' }`);
  const pkg = join(root, 'node_modules/velocita-theme-test');
  mkdirSync(pkg, { recursive: true });
  writeFileSync(join(pkg, 'package.json'), '{"name":"velocita-theme-test","type":"module","exports":{".":"./index.js"}}');
  writeFileSync(join(pkg, 'index.js'), `export default {
    name: 'test',
    config: { themeColor: '#abcdef', pageSize: 1 },
    css: '.from-theme{color:blue}',
    layouts: { list: ({ page, h }) => '<h1>' + h.escape(page.title) + '</h1><ol class="themed">' + page.items.map(p => '<li>' + h.escape(p.title) + '</li>').join('') + '</ol>' },
  };`);
  try {
    const r = await build(root, { clean: true });
    const list = readFileSync(join(r.out, 'blog/index.html'), 'utf8');
    assert.match(list, /class="themed"/);                       // theme layout used
    assert.match(list, /\.from-theme\{color:blue\}/);           // theme css inlined
    assert.match(list, /\.mine\{color:red\}/);                  // site css kept
    assert.ok(list.indexOf('.from-theme') < list.indexOf('.mine'), 'theme css comes first');
    assert.match(readFileSync(join(r.out, 'blog/page/2/index.html'), 'utf8'), /themed/); // theme config (pageSize: 1)
    assert.match(list, /#111111/);                              // site config beats theme config
    assert.doesNotMatch(list, /#abcdef/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('themes: local file and inline object stack; site layouts/ still win', async () => {
  const root = site(`{ title: 'T', url: 'https://t.example', ogImages: false, theme: ['./my-theme.js', { name: 'inline', css: '.inline{x:1}' }] }`);
  writeFileSync(join(root, 'my-theme.js'), `export default { layouts: { page: ({ page }) => '<article class="local-theme">' + page.html + '</article>', post: () => '<p>theme post</p>' } };`);
  mkdirSync(join(root, 'layouts'));
  writeFileSync(join(root, 'layouts/post.js'), `export default ({ page }) => '<p class="site-post">' + page.title + '</p>';`);
  try {
    const r = await build(root, { clean: true });
    assert.match(readFileSync(join(r.out, 'index.html'), 'utf8'), /class="local-theme"/);
    assert.match(readFileSync(join(r.out, 'index.html'), 'utf8'), /\.inline\{x:1\}/);
    assert.match(readFileSync(join(r.out, 'blog/p1/index.html'), 'utf8'), /class="site-post"/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('themes: clear errors for missing or malformed themes', async () => {
  const missing = site(`{ title: 'T', theme: 'velocita-theme-nope' }`);
  const bad = site(`{ title: 'T', theme: { layouts: { page: 'not a function' } } }`);
  try {
    await assert.rejects(build(missing), /not installed\. Run: npm install velocita-theme-nope/);
    await assert.rejects(build(bad), /layouts\.page must be a function/);
  } finally { rmSync(missing, { recursive: true, force: true }); rmSync(bad, { recursive: true, force: true }); }
});

test('example theme package velocita-theme-paper is valid', async () => {
  const { default: paper } = await import('../packages/velocita-theme-paper/index.js');
  assert.equal(typeof paper.layouts.list, 'function');
  assert.ok(paper.css.includes('--accent'));
});

test('askSite: prompts only for missing answers, re-asks on bad input', async () => {
  const root = mkdtempSync(join(tmpdir(), 'vel-ask-'));
  mkdirSync(join(root, 'taken'));
  writeFileSync(join(root, 'taken/x'), '');
  const input = new PassThrough();
  let out = '';
  const output = { write: s => { out += s; } };
  input.end([join(root, 'taken'), join(root, 'fresh-site'), 'nope', String(templates().indexOf('news') + 1), ''].join('\n') + '\n');
  try {
    const a = await askSite({}, { input, output });
    assert.equal(a.dir, join(root, 'fresh-site'));
    assert.equal(a.template, 'news');
    assert.equal(a.title, 'Fresh Site');            // default derived from the folder
    assert.match(out, /is not empty/);
    assert.match(out, /"nope" is not a template/);
    for (const t of templates()) assert.ok(templateInfo[t], `description for ${t}`);
    const given = await askSite({ dir: 'a', template: 'blog', title: 'B' }, { input: new PassThrough(), output });
    assert.deepEqual(given, { dir: 'a', template: 'blog', title: 'B' });
    createSite(a.dir, a);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
