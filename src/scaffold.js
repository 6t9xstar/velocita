import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const templatesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
export const templates = () => readdirSync(templatesDir).filter(t => !t.startsWith('_'));

const TEXT = /\.(md|js|json|html|css|txt|toml|yml|yaml)$|^gitignore$/;

function copy(src, dest, vars) {
  for (const f of readdirSync(src)) {
    const from = join(src, f);
    const to = join(dest, f === 'gitignore' ? '.gitignore' : f);
    if (statSync(from).isDirectory()) { mkdirSync(to, { recursive: true }); copy(from, to, vars); continue; }
    const data = readFileSync(from);
    writeFileSync(to, TEXT.test(f) ? data.toString('utf8').replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] ?? m) : data);
  }
}

// Create a new site from a starter template. Refuses to write into a non-empty folder.
export function createSite(dir, { template = 'blog', title } = {}) {
  dir = resolve(dir);
  if (!templates().includes(template)) throw new Error(`unknown template "${template}". Available: ${templates().join(', ')}`);
  if (existsSync(dir) && readdirSync(dir).length) throw new Error(`${dir} is not empty`);
  mkdirSync(dir, { recursive: true });
  const name = basename(dir).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'my-site';
  const vars = {
    name,
    title: title || name.split('-').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' '),
    date: new Date().toISOString().slice(0, 10),
  };
  copy(join(templatesDir, '_shared'), dir, vars);
  copy(join(templatesDir, template), dir, vars);
  return { dir, ...vars, template };
}

export const templateInfo = {
  blog: 'Personal or company blog: tags, feeds, search',
  docs: 'Documentation: sidebar, prev/next, on-page TOC',
  business: 'Local business: services, contact, LocalBusiness schema',
  news: 'News / magazine: sections, featured story, NewsArticle schema',
  portfolio: 'Agency / portfolio: case studies, services, contact',
};

const titleFrom = dir => basename(resolve(dir)).split(/[-_\s]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || 'My Site';

// Ask only for what wasn't given on the command line. Pass `input`/`output`
// streams to drive it from tests; with a non-TTY stdin it asks nothing.
export async function askSite(given = {}, { input = process.stdin, output = process.stdout } = {}) {
  const answers = { ...given };
  if (input === process.stdin && !process.stdin.isTTY) return answers;
  const { createInterface } = await import('node:readline/promises');
  const rl = createInterface({ input, output, terminal: false });
  const lines = rl[Symbol.asyncIterator]();
  const ask = async q => { output.write(q); const { value, done } = await lines.next(); return done ? '' : String(value).trim(); };
  try {
    while (!answers.dir) {
      const dir = (await ask('Project folder (my-site): ')) || 'my-site';
      if (existsSync(dir) && readdirSync(dir).length) output.write(`  ${dir} is not empty, pick another folder.\n`);
      else answers.dir = dir;
    }
    const list = templates();
    while (!answers.template) {
      output.write('Template:\n' + list.map((t, i) => `  ${i + 1}) ${t.padEnd(10)} ${templateInfo[t] || ''}`).join('\n') + '\n');
      const pick = (await ask('Choose 1-' + list.length + ' or a name (1): ')) || '1';
      const t = /^\d+$/.test(pick) ? list[Number(pick) - 1] : pick;
      if (list.includes(t)) answers.template = t;
      else output.write(`  "${pick}" is not a template.\n`);
    }
    if (!answers.title) answers.title = (await ask(`Site title (${titleFrom(answers.dir)}): `)) || titleFrom(answers.dir);
  } finally {
    rl.close();
  }
  return answers;
}
