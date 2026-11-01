#!/usr/bin/env node
import { build } from '../src/build.js';
import { dev } from '../src/dev.js';
import { pingIndexNow } from '../src/indexnow.js';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const has = n => args.includes(n);
const positional = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] === '--port'));
const [cmd = 'help', dir = '.'] = positional;

if (cmd === 'build' || cmd === 'audit') {
  const r = await build(dir, has('--clean') ? { clean: true } : {});
  for (const w of r.warnings) console.warn(`⚠ SEO: ${w}`);
  for (const w of r.audit.warnings) console.warn(`⚠ audit: ${w}`);
  for (const e of r.audit.errors) console.error(`✖ audit: ${e}`);
  if (cmd === 'audit') {
    for (const s of r.audit.suggestions) console.log(`💡 ${s}`);
    console.log(`
${r.audit.errors.length} errors, ${r.audit.warnings.length + r.warnings.length} warnings, ${r.audit.suggestions.length} link suggestions`);
  } else {
    console.log(`⚡ built ${r.pages} pages in ${r.ms}ms (${r.written} written, ${r.unchanged} unchanged, ${r.removed} removed${r.ogImages ? `, ${r.ogImages} OG images` : ''}) → ${r.out}`);
  }
  if (has('--indexnow')) {
    const res = await pingIndexNow(r.site, r.changedUrls);
    console.log(res.skipped ? `IndexNow skipped: ${res.skipped}` : `🔔 IndexNow: submitted ${res.submitted} changed URLs (HTTP ${res.status.join(', ')})`);
  }
  if ((has('--strict') || cmd === 'audit') && r.audit.errors.length) process.exit(1);
} else if (cmd === 'dev') {
  await dev(dir, Number(flag('--port')) || 3000);
} else if (cmd === 'new') {
  if (existsSync(join(dir, 'content'))) { console.error('✖ content/ already exists'); process.exit(1); }
  mkdirSync(join(dir, 'content/blog'), { recursive: true });
  mkdirSync(join(dir, 'public'), { recursive: true });
  writeFileSync(join(dir, 'velocita.config.js'), `export default {\n  title: 'My Site',\n  description: 'A blazing-fast site built with Velocita.',\n  url: 'https://example.com',\n  author: 'Me',\n  nav: [{ title: 'Blog', url: '/blog/' }],\n};\n`);
  writeFileSync(join(dir, 'content/index.md'), `---\ntitle: Welcome\ndescription: A blazing-fast site built with Velocita.\n---\n\nEdit \`content/index.md\` to get started. Read the [blog](/blog/).\n`);
  writeFileSync(join(dir, 'content/blog/hello-world.md'), `---\ntitle: Hello World\ndescription: The first post on my new Velocita site.\ndate: ${new Date().toISOString().slice(0, 10)}\ntags: [intro]\n---\n\n## First section\n\nWrite Markdown here.\n`);
  console.log(`✔ created site in ${dir}. Run: velocita dev ${dir}`);
} else {
  console.log(`velocita — sonic-speed, SEO-first static sites

  velocita new   [dir]            scaffold a new site
  velocita dev   [dir] [--port N] dev server with live reload
  velocita build [dir] [--clean] [--strict] [--indexnow]
                                  production build to dist/ (incremental)
                                  --strict    fail on broken links/anchors (CI gate)
                                  --indexnow  ping IndexNow with changed URLs
  velocita audit [dir]            full SEO audit incl. internal-link suggestions`);
}
