#!/usr/bin/env node
// npm create velocita@latest [dir] [--template blog|docs|business] [--title "My Site"]
// With no arguments in an interactive terminal, asks for the folder and template.
import { createInterface } from 'node:readline/promises';
import { relative } from 'node:path';
import { createSite, templates } from 'velocita';

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const positional = args.filter((a, i) => !a.startsWith('--') && !['--template', '--title'].includes(args[i - 1]));
const available = templates();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: npm create velocita@latest [dir] -- [--template ${available.join('|')}] [--title "My Site"]`);
  process.exit(0);
}

let dir = positional[0];
let template = flag('--template');
if ((!dir || !template) && process.stdin.isTTY) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  dir ||= (await rl.question('Where should the site go? (my-site) ')).trim() || 'my-site';
  template ||= (await rl.question(`Template: ${available.join(', ')}? (blog) `)).trim() || 'blog';
  rl.close();
}

try {
  const site = createSite(dir || 'my-site', { template: template || 'blog', title: flag('--title') });
  const cd = relative(process.cwd(), site.dir) || '.';
  console.log(`\n✔ Created ${site.template} site "${site.title}" in ${site.dir}\n\nNext steps:\n  cd ${cd}\n  npm install\n  npm run dev\n`);
} catch (err) {
  console.error(`✖ ${err.message}`);
  process.exit(1);
}
