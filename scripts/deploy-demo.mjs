// Builds the official site (site/) for https://6t9xstar.github.io/velocita and force-pushes it to
// the gh-pages branch (GitHub Pages serves that branch). Used instead of the Actions
// workflow while GitHub Actions is unavailable on the account.
import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { build } from '../src/build.js';

const url = process.env.SITE_URL || 'https://6t9xstar.github.io/velocita';
const remote = process.env.DEMO_REMOTE || 'https://github.com/6t9xstar/velocita.git';

const r = await build('site', { url, outDir: 'dist-pages', clean: true });
if (r.audit.errors.length) { console.error(r.audit.errors.join('\n')); process.exit(1); }
rmSync(join(r.out, '.velocita-manifest.json'), { force: true });
writeFileSync(join(r.out, '.nojekyll'), '');

const git = (...args) => execFileSync('git', args, { cwd: r.out, stdio: 'inherit' });
git('init', '-q', '-b', 'gh-pages');
git('add', '-A');
git('commit', '-qm', `Deploy Velocita demo (${new Date().toISOString()})`);
git('push', '-q', '--force', remote, 'gh-pages');
console.log(`✔ deployed ${r.pages} pages → ${url}/`);
