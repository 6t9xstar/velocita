#!/usr/bin/env node
// npm create velocita@latest [dir] [--template blog|docs|business] [--title "My Site"]
// In a terminal, asks for whatever was not given (folder, template, title). --yes skips questions.
import { relative } from 'node:path';
import { createSite, templates, askSite } from 'velocita';

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const positional = args.filter((a, i) => !a.startsWith('--') && !['--template', '--title'].includes(args[i - 1]));
const available = templates();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: npm create velocita@latest [dir] -- [--template ${available.join('|')}] [--title "My Site"] [--yes]`);
  process.exit(0);
}

const given = { dir: positional[0], template: flag('--template'), title: flag('--title') };
const answers = args.includes('--yes') ? given : await askSite(given);

try {
  const site = createSite(answers.dir || 'my-site', { template: answers.template || 'blog', title: answers.title });
  const cd = relative(process.cwd(), site.dir) || '.';
  console.log(`\n✔ Created ${site.template} site "${site.title}" in ${site.dir}\n\nNext steps:\n  cd ${cd}\n  npm install\n  npm run dev\n`);
} catch (err) {
  console.error(`✖ ${err.message}`);
  process.exit(1);
}
