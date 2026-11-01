#!/usr/bin/env node
import { build } from '../src/build.js';
import { dev } from '../src/dev.js';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [cmd = 'help', dir = '.', ...rest] = process.argv.slice(2);
const flag = n => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined; };

if (cmd === 'build') {
  const r = await build(dir);
  for (const w of r.warnings) console.warn(`⚠ SEO: ${w}`);
  console.log(`⚡ built ${r.pages} pages in ${r.ms}ms → ${r.out}`);
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
  velocita build [dir]            production build to dist/`);
}
