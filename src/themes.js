import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Themes are shareable packages (or local files, or inline objects) shaped like:
//   export default { name, config?, css?, layouts?: { page, post, list, … }, shell? }
// `theme` in velocita.config.js may be one theme or an array; later themes win.
export async function loadThemes(root, spec) {
  const list = spec == null || spec === false ? [] : Array.isArray(spec) ? spec : [spec];
  const themes = [];
  for (const item of list) {
    if (typeof item === 'object') { themes.push(normalize(item, item.name || 'inline theme')); continue; }
    const mod = await import(locate(root, String(item)));
    themes.push(normalize(mod.default ?? mod, String(item)));
  }
  return themes;
}

function locate(root, id) {
  if (id.startsWith('.') || isAbsolute(id)) {
    const file = resolve(root, id);
    if (!existsSync(file)) throw new Error(`theme "${id}" not found at ${file}`);
    return pathToFileURL(file).href;
  }
  try {
    // Resolve from the site's own node_modules, not Velocita's.
    return pathToFileURL(createRequire(join(root, 'package.json')).resolve(id)).href;
  } catch {
    throw new Error(`theme "${id}" is not installed. Run: npm install ${id}`);
  }
}

function normalize(t, label) {
  if (!t || typeof t !== 'object') throw new Error(`theme "${label}" must export an object`);
  for (const [k, fn] of Object.entries(t.layouts || {})) {
    if (typeof fn !== 'function') throw new Error(`theme "${label}": layouts.${k} must be a function`);
  }
  if (t.shell && typeof t.shell !== 'function') throw new Error(`theme "${label}": shell must be a function`);
  return { name: t.name || label, config: t.config || {}, css: t.css || '', layouts: { ...t.layouts, ...(t.shell ? { shell: t.shell } : {}) } };
}
