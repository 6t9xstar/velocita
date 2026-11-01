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
