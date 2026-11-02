import { existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { loadConfig } from './build.js';

const MIN_NODE = 20;

// Diagnoses a site without building it. Each check is { name, status: 'ok' | 'warn' | 'error', message }.
// `ok` is false when any check is an error.
export async function doctor(root = '.', { nodeVersion = process.versions.node } = {}) {
  root = resolve(root);
  const checks = [];
  const add = (name, status, message) => checks.push({ name, status, message });

  const major = Number(nodeVersion.split('.')[0]);
  add('node', major >= MIN_NODE ? 'ok' : 'error', major >= MIN_NODE ? `Node.js ${nodeVersion}` : `Node.js ${nodeVersion} is too old: Velocita needs ${MIN_NODE} or newer`);

  // loadConfig also resolves themes, so a missing or malformed theme surfaces here.
  let site = null;
  const file = join(root, 'velocita.config.js');
  try {
    site = await loadConfig(root);
    add('config', 'ok', existsSync(file) ? 'velocita.config.js loaded' : 'no velocita.config.js: using defaults');
  } catch (err) {
    add('config', 'error', `${/theme "/.test(err.message) ? 'theme' : 'velocita.config.js'}: ${err.message}`);
  }

  if (site) {
    const names = (site.themes || []).map(t => t.name);
    add('theme', 'ok', names.length ? `resolved ${names.join(', ')}` : 'built-in theme');
    for (const [key, required] of [['contentDir', true], ['layoutsDir', false], ['publicDir', false]]) {
      const dir = resolve(root, site[key]);
      const isDir = existsSync(dir) && statSync(dir).isDirectory();
      add(key, isDir ? 'ok' : required ? 'error' : 'warn', isDir ? `${site[key]}/` : `${key} "${site[key]}" not found at ${dir}`);
    }
    if (resolve(root, site.outDir) === root) add('outDir', 'error', 'outDir must not be the site root');
  }

  let sharp = null;
  try { sharp = createRequire(join(root, 'package.json')).resolve('sharp'); } catch {
    try { sharp = createRequire(import.meta.url).resolve('sharp'); } catch { /* not installed */ }
  }
  add('sharp', sharp ? 'ok' : 'warn', sharp ? 'installed: responsive images and OG cards enabled' : 'not installed: no responsive images or generated OG cards (npm install sharp)');

  return { ok: !checks.some(c => c.status === 'error'), checks };
}
